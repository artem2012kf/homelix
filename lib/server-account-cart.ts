import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { randomBytes } from "crypto";

export type StoredAccountCartLine = {
  itemId: string;
  quantity: number;
};

export type StoredAccountCart = {
  userId: string;
  lines: StoredAccountCartLine[];
  selectedApartmentId: string;
  updatedAt: string;
};

type AccountCartDatabase = {
  carts: StoredAccountCart[];
};

const SOURCE_PATH = join(process.cwd(), "data", "account-carts.json");
const DATABASE_PATH =
  process.env.HOMELIX_CART_DATABASE_PATH ||
  (process.env.VERCEL ? join("/tmp", "hall-account-carts.json") : SOURCE_PATH);

const EMPTY_DATABASE: AccountCartDatabase = { carts: [] };

declare global {
  // eslint-disable-next-line no-var
  var __hallAccountCartDatabase: AccountCartDatabase | undefined;
  // eslint-disable-next-line no-var
  var __hallAccountCartWriteQueue: Promise<void> | undefined;
}

function cloneDatabase(database: AccountCartDatabase): AccountCartDatabase {
  return {
    carts: database.carts.map((cart) => ({
      ...cart,
      lines: cart.lines.map((line) => ({ ...line }))
    }))
  };
}

function safeParse(raw: string): AccountCartDatabase {
  try {
    const parsed = JSON.parse(raw) as Partial<AccountCartDatabase>;
    if (!Array.isArray(parsed.carts)) return cloneDatabase(EMPTY_DATABASE);

    return {
      carts: parsed.carts
        .filter((cart): cart is StoredAccountCart => Boolean(cart && typeof cart.userId === "string"))
        .map((cart) => ({
          userId: cart.userId,
          selectedApartmentId: typeof cart.selectedApartmentId === "string" ? cart.selectedApartmentId : "",
          updatedAt: typeof cart.updatedAt === "string" ? cart.updatedAt : new Date(0).toISOString(),
          lines: Array.isArray(cart.lines)
            ? cart.lines
                .filter(
                  (line): line is StoredAccountCartLine =>
                    Boolean(line && typeof line.itemId === "string" && Number.isFinite(line.quantity) && line.quantity > 0)
                )
                .map((line) => ({ itemId: line.itemId, quantity: Math.min(20, Math.max(1, Math.round(line.quantity))) }))
            : []
        }))
    };
  } catch {
    return cloneDatabase(EMPTY_DATABASE);
  }
}

function initialDatabase() {
  try {
    if (existsSync(SOURCE_PATH)) return safeParse(readFileSync(SOURCE_PATH, "utf8"));
  } catch {
    // В локальной демонстрации используем память процесса.
  }
  return cloneDatabase(EMPTY_DATABASE);
}

function ensureDatabase() {
  if (globalThis.__hallAccountCartDatabase) return;
  globalThis.__hallAccountCartDatabase = initialDatabase();

  try {
    if (!existsSync(DATABASE_PATH)) {
      mkdirSync(dirname(DATABASE_PATH), { recursive: true });
      writeFileSync(DATABASE_PATH, JSON.stringify(globalThis.__hallAccountCartDatabase, null, 2), "utf8");
    }
  } catch {
    // В serverless окружении остаётся in-memory копия текущего инстанса.
  }
}

function readDatabase() {
  ensureDatabase();
  try {
    const database = safeParse(readFileSync(DATABASE_PATH, "utf8"));
    globalThis.__hallAccountCartDatabase = cloneDatabase(database);
    return database;
  } catch {
    return cloneDatabase(globalThis.__hallAccountCartDatabase ?? EMPTY_DATABASE);
  }
}

function writeDatabase(database: AccountCartDatabase) {
  globalThis.__hallAccountCartDatabase = cloneDatabase(database);
  try {
    mkdirSync(dirname(DATABASE_PATH), { recursive: true });
    const temporaryPath = `${DATABASE_PATH}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify(database, null, 2), "utf8");
    renameSync(temporaryPath, DATABASE_PATH);
  } catch {
    // Не раскрываем детали файловой системы пользователю.
  }
}

async function withWriteLock<T>(operation: () => Promise<T> | T): Promise<T> {
  const previous = globalThis.__hallAccountCartWriteQueue ?? Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  globalThis.__hallAccountCartWriteQueue = previous.then(() => current, () => current);
  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    release();
  }
}

export function getAccountCart(userId: string): StoredAccountCart {
  const database = readDatabase();
  return (
    database.carts.find((cart) => cart.userId === userId) ?? {
      userId,
      lines: [],
      selectedApartmentId: "",
      updatedAt: new Date(0).toISOString()
    }
  );
}

export async function saveAccountCart(
  userId: string,
  lines: StoredAccountCartLine[],
  selectedApartmentId: string
): Promise<StoredAccountCart> {
  return withWriteLock(() => {
    const database = readDatabase();
    const cart: StoredAccountCart = {
      userId,
      lines: lines.map((line) => ({ ...line })),
      selectedApartmentId,
      updatedAt: new Date().toISOString()
    };

    database.carts = [...database.carts.filter((item) => item.userId !== userId), cart];
    writeDatabase(database);
    return cart;
  });
}
