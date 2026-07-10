import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

export type PurchaseRequest = {
  id: string;
  userId: string;
  email: string;
  type: "apartment" | "furniture";
  apartmentId?: string;
  city: string;
  project?: string;
  furniture?: Array<{ itemId: string; title: string; quantity: number; price: number }>;
  subtotal?: number;
  deliveryPrice?: number;
  deliveryWindow?: string;
  status: "new" | "contacted" | "completed";
  createdAt: string;
};

const STORE_PATH = process.env.VERCEL ? join("/tmp", "hall-purchases.json") : join(process.cwd(), "data", "purchase-requests.json");

declare global {
  // eslint-disable-next-line no-var
  var __hallPurchaseRequests: PurchaseRequest[] | undefined;
}

function readFileStore() {
  try {
    if (!existsSync(STORE_PATH)) return [];
    const parsed = JSON.parse(readFileSync(STORE_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed as PurchaseRequest[] : [];
  } catch {
    return [];
  }
}

function store() {
  if (!globalThis.__hallPurchaseRequests) globalThis.__hallPurchaseRequests = readFileStore();
  return globalThis.__hallPurchaseRequests;
}

export function createPurchaseRequest(input: Omit<PurchaseRequest, "id" | "status" | "createdAt">) {
  const request: PurchaseRequest = {
    ...input,
    id: `buy_${randomBytes(10).toString("hex")}`,
    status: "new",
    createdAt: new Date().toISOString()
  };
  const requests = store();
  requests.push(request);
  try {
    writeFileSync(STORE_PATH, JSON.stringify(requests, null, 2), "utf8");
  } catch {
    // На serverless-инстансе сохраняем заявку в памяти до подключения внешней CRM/БД.
  }
  return request;
}