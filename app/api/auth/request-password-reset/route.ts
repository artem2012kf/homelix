import { createHash } from "crypto";
import {
  makeToken,
  normalizeEmail,
  readDatabase,
  withDatabaseWriteLock,
  writeDatabase,
  type DbUser
} from "@/lib/server-db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESET_TTL_MS = 20 * 60 * 1000;

type ResettableUser = DbUser & {
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: string;
};

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM || process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Восстановление пароля ХОЛЛ",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px"><h1 style="letter-spacing:.12em">ХОЛЛ</h1><p>Чтобы задать новый пароль, откройте ссылку:</p><p><a href="${resetUrl}">Восстановить пароль</a></p><p>Ссылка действует 20 минут. Если вы не запрашивали восстановление, проигнорируйте письмо.</p></div>`
    })
  });

  return response.ok;
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "auth-password-reset-request", { limit: 4, windowMs: 30 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  const { email } = await request.json().catch(() => ({ email: "" }));
  const cleanEmail = normalizeEmail(String(email ?? ""));
  const genericMessage = "Если такой аккаунт существует, инструкция отправлена на указанную почту.";

  if (!cleanEmail || cleanEmail.length > 254) {
    return Response.json({ message: genericMessage }, { headers: { "Cache-Control": "no-store" } });
  }

  const result = await withDatabaseWriteLock(() => {
    const database = readDatabase();
    const user = database.users.find((item) => item.email === cleanEmail) as ResettableUser | undefined;
    if (!user) return null;

    const token = makeToken();
    user.passwordResetTokenHash = tokenHash(token);
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
    writeDatabase(database);
    return { token, email: user.email };
  });

  let previewResetUrl: string | undefined;
  if (result) {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const requestOrigin = new URL(request.url).origin;
    const origin = configuredOrigin || requestOrigin;
    const resetUrl = `${origin}/account?reset=${encodeURIComponent(result.token)}`;

    try {
      const sent = await sendResetEmail(result.email, resetUrl);
      if (!sent && process.env.HOMELIX_ALLOW_RESET_PREVIEW === "true") previewResetUrl = resetUrl;
    } catch {
      if (process.env.HOMELIX_ALLOW_RESET_PREVIEW === "true") previewResetUrl = resetUrl;
    }
  }

  return Response.json(
    { message: genericMessage, ...(previewResetUrl ? { previewResetUrl } : {}) },
    { headers: { "Cache-Control": "no-store" } }
  );
}