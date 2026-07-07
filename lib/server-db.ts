import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { randomBytes, createHash } from "crypto";
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
};

export type AppDatabase = {
  users: DbUser[];
  favorites: DbFavorite[];
  reservations: DbReservation[];
  sessions: DbSession[];
};

const SOURCE_DB_PATH = join(process.cwd(), "data", "database.json");
const DB_PATH = process.env.VERCEL ? join("/tmp", "sq-demo-database.json") : SOURCE_DB_PATH;

const EMPTY_DB: AppDatabase = {
  users: [],
  favorites: [],
  reservations: [],
  sessions: []
};

declare global {
  // eslint-disable-next-line no-var
  var __sqDemoDatabase: AppDatabase | undefined;
}

function cloneDatabase(database: AppDatabase): AppDatabase {
  return {
    users: [...database.users],
    favorites: [...database.favorites],
    reservations: [...database.reservations],
    sessions: [...database.sessions]
  };
}

function safeParseDatabase(raw: string): AppDatabase {
  try {
    const parsed = JSON.parse(raw) as Partial<AppDatabase>;

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch {
    return cloneDatabase(EMPTY_DB);
  }
}

function getMemoryDatabase() {
  if (!globalThis.__sqDemoDatabase) {
    globalThis.__sqDemoDatabase = cloneDatabase(EMPTY_DB);
  }

  return globalThis.__sqDemoDatabase;
}

function setMemoryDatabase(database: AppDatabase) {
  globalThis.__sqDemoDatabase = cloneDatabase(database);
}

function getInitialDatabase() {
  try {
    if (existsSync(SOURCE_DB_PATH)) {
      return safeParseDatabase(readFileSync(SOURCE_DB_PATH, "utf8"));
    }
  } catch {
    // В serverless-среде исходная JSON-база может быть недоступна.
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
    // На Vercel запись в файл может быть недоступна. Используем in-memory demo-хранилище.
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
    writeFileSync(DB_PATH, JSON.stringify(database, null, 2), "utf8");
  } catch {
    // Не бросаем ошибку наружу, чтобы регистрация/бронь не падали 500 на Vercel.
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

export function hashPassword(password: string) {
  return createHash("sha256").update(`sq-demo:${password}`).digest("hex");
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? "";
}

export function getUserByToken(token: string) {
  if (!token) return null;

  const database = readDatabase();
  const session = database.sessions.find((item) => item.token === token);
  const user = session ? database.users.find((item) => item.id === session.userId) : undefined;

  if (!session || !user) return null;

  return { database, session, user };
}

export function getPublicUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt
  };
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
    if (apartment.status === "reserved") {
      ids.add(apartment.id);
    }
  }

  for (const reservation of database.reservations) {
    if (reservation.status === "active") {
      ids.add(reservation.apartmentId);
    }
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
