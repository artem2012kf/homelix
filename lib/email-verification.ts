import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { isGmailSmtpConfigured, sendSmtpMail } from "@/lib/smtp-mailer";

const TTL_MS = 15 * 60 * 1000;

function secret() {
  return process.env.HOMELIX_AUTH_SECRET || process.env.AUTH_SECRET || "hall-local-development-secret-change-me";
}

function encode(value: object) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function codeHash(email: string, code: string, nonce: string) {
  return createHash("sha256").update(`${email}:${code}:${nonce}:${secret()}`).digest("hex");
}

export function createEmailVerificationChallenge(email: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const nonce = randomBytes(12).toString("hex");
  const expiresAt = Date.now() + TTL_MS;
  const payload = encode({ email, nonce, expiresAt, codeHash: codeHash(email, code, nonce) });
  return { code, token: `${payload}.${sign(payload)}`, expiresAt };
}

export function verifyEmailChallenge(email: string, code: string, token: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expectedSignature = Buffer.from(sign(payload));
  const actualSignature = Buffer.from(signature);
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      email?: string;
      nonce?: string;
      expiresAt?: number;
      codeHash?: string;
    };
    if (data.email !== email || !data.nonce || !data.expiresAt || data.expiresAt < Date.now() || !data.codeHash) return false;
    const expectedCodeHash = Buffer.from(data.codeHash, "hex");
    const actualCodeHash = Buffer.from(codeHash(email, code, data.nonce), "hex");
    return expectedCodeHash.length === actualCodeHash.length && timingSafeEqual(expectedCodeHash, actualCodeHash);
  } catch {
    return false;
  }
}

export async function sendEmailVerificationCode(email: string, code: string) {
  if (!isGmailSmtpConfigured()) {
    return { sent: false, reason: "provider-not-configured" as const };
  }

  try {
    await sendSmtpMail({
      to: email,
      subject: "Код подтверждения ХОЛЛ",
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px"><h1 style="letter-spacing:.12em">ХОЛЛ</h1><p>Введите этот код, чтобы подтвердить адрес электронной почты:</p><p style="font-size:34px;font-weight:800;letter-spacing:.18em">${code}</p><p>Код действует 15 минут. Если вы не регистрировались, просто проигнорируйте письмо.</p></div>`
    });
    return { sent: true as const };
  } catch (error) {
    console.error("Gmail SMTP verification email failed", error instanceof Error ? error.message : "unknown error");
    return { sent: false as const, reason: "provider-error" as const };
  }
}
