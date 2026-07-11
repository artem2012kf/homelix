import { resolveMx } from "dns/promises";
import { createEmailVerificationChallenge, sendEmailVerificationCode } from "@/lib/email-verification";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/server-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function smtpErrorMessage(reason: string) {
  switch (reason) {
    case "provider-not-configured":
      return "Gmail SMTP не настроен. Добавьте GMAIL_SMTP_USER и GMAIL_SMTP_APP_PASSWORD в Vercel для Production и сделайте Redeploy.";
    case "authentication-failed":
      return "Google отклонил вход в SMTP. Проверьте адрес Gmail и создайте новый пароль приложения Google, затем обновите его в Vercel.";
    case "connection-failed":
      return "Сервер не смог подключиться к Gmail SMTP. Проверьте SMTP_HOST=smtp.gmail.com и SMTP_PORT=465, затем повторите попытку.";
    case "sender-rejected":
      return "Gmail отклонил адрес отправителя. EMAIL_FROM должен содержать тот же Gmail-адрес, что и GMAIL_SMTP_USER.";
    case "recipient-rejected":
      return "Почтовый сервер отклонил адрес получателя. Проверьте написание почты или попробуйте другой адрес.";
    default:
      return "Gmail не принял письмо. Проверьте пароль приложения и журналы Functions в Vercel.";
  }
}

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
        {
          error: smtpErrorMessage(result.reason),
          errorCode: result.reason
        },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

    return Response.json(
      {
        ok: true,
        verificationToken: challenge.token,
        expiresAt: new Date(challenge.expiresAt).toISOString(),
        previewCode: allowPreview ? challenge.code : undefined,
        message: result.sent ? "Код отправлен на указанную почту." : "Демо-код создан."
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return Response.json({ error: "Проверка почты временно недоступна." }, { status: 500 });
  }
}
