import { resolveMx } from "dns/promises";
import { createEmailVerificationChallenge, sendEmailVerificationCode } from "@/lib/email-verification";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "email-verification", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit);

  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(String(body?.email ?? ""));
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return Response.json({ error: "Укажите корректную почту." }, { status: 400 });
    }

    const domain = email.split("@")[1];
    try {
      const records = await resolveMx(domain);
      if (!records.length) throw new Error("no mx");
    } catch {
      return Response.json({ error: "Домен этой почты не принимает письма. Проверьте адрес." }, { status: 400 });
    }

    const challenge = createEmailVerificationChallenge(email);
    const result = await sendEmailVerificationCode(email, challenge.code);
    const allowPreview = process.env.HOMELIX_ALLOW_EMAIL_VERIFICATION_PREVIEW === "true";

    if (!result.sent && !allowPreview) {
      return Response.json(
        { error: "Не удалось отправить письмо. Для регистрации требуется настроить почтовый сервис." },
        { status: 503 }
      );
    }

    return Response.json({
      ok: true,
      verificationToken: challenge.token,
      expiresAt: new Date(challenge.expiresAt).toISOString(),
      previewCode: allowPreview ? challenge.code : undefined,
      message: result.sent ? "Код отправлен на указанную почту." : "Демо-код создан."
    });
  } catch {
    return Response.json({ error: "Проверка почты временно недоступна." }, { status: 500 });
  }
}