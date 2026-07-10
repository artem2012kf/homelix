import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { apartments } from "@/lib/apartments";
import type { ApartmentStatus } from "@/types/apartment";

export type DbUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type DbFavorite = {
  userId: string;
  apartmentId: string;
  createdAt: string;
};

export type DbReservation = {
  id: string;
  userId: string;
  apartmentId: string;
  status: "active" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type DbSession = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type AppDatabase = {
  users: DbUser[];
  favorites: DbFavorite[];
  reservations: DbReservation[];
  sessions: DbSession[];
};

export const SESSION_COOKIE_NAME = "homelix_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const SOURCE_DB_PATH = join(process.cwd(), "data", "database.json");
const DB_PATH = process.env.HOMELIX_DATABASE_PATH || (process.env.VERCEL ? join("/tmp", "homelix-database.json") : SOURCE_DB_PATH);
const SCRYPT_KEY_LENGTH = 64;

const EMPTY_DB: AppDatabase = {
  users: [],
  favorites: [],
  reservations: [],
  sessions: []
};

declare global {
  // eslint-disable-next-line no-var
  var __homelixDatabase: AppDatabase | undefined;
  // eslint-disable-next-line no-var
  var __homelixDatabaseWriteQueue: Promise<void> | undefined;
}

function cloneDatabase(database: AppDatabase): AppDatabase {
  return {
    users: database.users.map((item) => ({ ...item })),
    favorites: database.favorites.map((item) => ({ ...item })),
    reservations: database.reservations.map((item) => ({ ...item })),
    sessions: database.sessions.map((item) => ({ ...item }))
  };
}

function fallbackSessionExpiry(createdAt: string) {
  const created = Date.parse(createdAt);
  const base = Number.isFinite(created) ? created : Date.now();
  return new Date(base + SESSION_TTL_SECONDS * 1000).toISOString();
}

function safeParseDatabase(raw: string): AppDatabase {
  try {
    const parsed = JSON.parse(raw) as Partial<AppDatabase>;
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions
          .filter((item): item is DbSession => Boolean(item && typeof item.token === "string" && typeof item.userId === "string"))
          .map((item) => ({
            ...item,
            createdAt: item.createdAt || new Date().toISOString(),
            expiresAt: item.expiresAt || fallbackSessionExpiry(item.createdAt)
          }))
      : [];

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
      sessions
    };
  } catch {
    return cloneDatabase(EMPTY_DB);
  }
}

function getMemoryDatabase() {
  if (!globalThis.__homelixDatabase) {
    globalThis.__homelixDatabase = cloneDatabase(EMPTY_DB);
  }
  return globalThis.__homelixDatabase;
}

function setMemoryDatabase(database: AppDatabase) {
  globalThis.__homelixDatabase = cloneDatabase(database);
}

function getInitialDatabase() {
  try {
    if (existsSync(SOURCE_DB_PATH)) {
      return safeParseDatabase(readFileSync(SOURCE_DB_PATH, "utf8"));
    }
  } catch {
    // Для локальной демонстрации используем пустое in-memory хранилище.
  }
  return cloneDatabase(EMPTY_DB);
}

function ensureDatabaseFile() {
  if (existsSync(DB_PATH)) return;
  const initialDatabase = getInitialDatabase();
  setMemoryDatabase(initialDatabase);

  try {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    writeFileSync(DB_PATH, JSON.stringify(initialDatabase, null, 2), "utf8");
  } catch {
    // В serverless без внешней БД данные остаются только в памяти текущего инстанса.
  }
}

export function readDatabase(): AppDatabase {
  ensureDatabaseFile();

  try {
    const database = safeParseDatabase(readFileSync(DB_PATH, "utf8"));
    setMemoryDatabase(database);
    return database;
  } catch {
    return cloneDatabase(getMemoryDatabase());
  }
}

export function writeDatabase(database: AppDatabase) {
  setMemoryDatabase(database);

  try {
    ensureDatabaseFile();
    const temporaryPath = `${DB_PATH}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify(database, null, 2), "utf8");
    renameSync(temporaryPath, DB_PATH);
  } catch {
    // Не раскрываем детали файловой системы пользователю; in-memory копия уже обновлена.
  }
}

export async function withDatabaseWriteLock<T>(operation: () => Promise<T> | T): Promise<T> {
  const previous = globalThis.__homelixDatabaseWriteQueue ?? Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  globalThis.__homelixDatabaseWriteQueue = previous.then(() => current, () => current);
  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    release();
  }
}

export function makeId(prefix: string) {
  return `${prefix}_${randomBytes(10).toString("hex")}`;
}

export function makeToken() {
  return randomBytes(32).toString("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function legacyPasswordHash(password: string) {
  return createHash("sha256").update(`sq-demo:${password}`).digest("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (storedHash.startsWith("scrypt$")) {
    const [, salt, digestHex] = storedHash.split("$");
    if (!salt || !digestHex) return false;

    const expected = Buffer.from(digestHex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  const expected = Buffer.from(storedHash, "hex");
  const actual = Buffer.from(legacyPasswordHash(password), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function needsPasswordRehash(storedHash: string) {
  return !storedHash.startsWith("scrypt$");
}

export function createSession(database: AppDatabase, userId: string) {
  const createdAt = new Date();
  const session: DbSession = {
    token: makeToken(),
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SESSION_TTL_SECONDS * 1000).toISOString()
  };

  database.sessions = database.sessions.filter((item) => item.userId !== userId || Date.parse(item.expiresAt) > Date.now());
  database.sessions.push(session);
  return session;
}

export function revokeSession(token: string) {
  if (!token) return;
  const database = readDatabase();
  database.sessions = database.sessions.filter((item) => item.token !== token);
  writeDatabase(database);
}

function parseCookieHeader(header: string) {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator === -1 ? [part, ""] : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      })
  );
}

export function getSessionToken(request: Request) {
  const cookies = parseCookieHeader(request.headers.get("cookie") ?? "");
  if (cookies[SESSION_COOKIE_NAME]) return cookies[SESSION_COOKIE_NAME];

  const authorization = request.headers.get("authorization") ?? "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function expiredSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function getUserByToken(token: string) {
  if (!token) return null;

  const database = readDatabase();
  const now = Date.now();
  const session = database.sessions.find((item) => item.token === token);

  if (!session || Date.parse(session.expiresAt) <= now) {
    if (session) {
      database.sessions = database.sessions.filter((item) => item.token !== token);
      writeDatabase(database);
    }
    return null;
  }

  const user = database.users.find((item) => item.id === session.userId);
  if (!user) return null;
  return { database, session, user };
}

export function getPublicUser(user: DbUser) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function getUserFavorites(database: AppDatabase, userId: string) {
  return database.favorites.filter((item) => item.userId === userId).map((item) => item.apartmentId);
}

export function getUserReservations(database: AppDatabase, userId: string) {
  return database.reservations
    .filter((item) => item.userId === userId && item.status === "active")
    .map((item) => item.apartmentId);
}

export function getActiveReservation(database: AppDatabase, apartmentId: string) {
  return database.reservations.find((item) => item.apartmentId === apartmentId && item.status === "active");
}

export function getReservedApartmentIds(database = readDatabase()) {
  const ids = new Set<string>();
  for (const apartment of apartments) {
    if (apartment.status === "reserved") ids.add(apartment.id);
  }
  for (const reservation of database.reservations) {
    if (reservation.status === "active") ids.add(reservation.apartmentId);
  }
  return Array.from(ids);
}

export function getEffectiveApartmentStatus(apartmentId: string, database = readDatabase()): ApartmentStatus {
  const apartment = apartments.find((item) => item.id === apartmentId);
  if (!apartment) return "available";
  if (apartment.status === "sold") return "sold";
  if (apartment.status === "reserved") return "reserved";
  if (getActiveReservation(database, apartmentId)) return "reserved";
  return "available";
}
