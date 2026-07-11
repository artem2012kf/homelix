import { randomBytes } from "crypto";
import { connect as connectTls, type TLSSocket } from "tls";

const SMTP_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_SIZE = 64 * 1024;

type SmtpResponse = {
  code: number;
  message: string;
};

type SendSmtpMailInput = {
  to: string;
  subject: string;
  html: string;
};

function readResponse(socket: TLSSocket): Promise<SmtpResponse> {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      clearTimeout(timer);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      if (buffer.length > MAX_RESPONSE_SIZE) {
        cleanup();
        reject(new Error("SMTP response is too large"));
        return;
      }

      const completeLines = buffer.split("\r\n").slice(0, -1);
      const finalLine = completeLines.findLast((line) => /^\d{3} /.test(line));
      if (!finalLine) return;

      cleanup();
      resolve({ code: Number(finalLine.slice(0, 3)), message: buffer.trim() });
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("SMTP response timeout"));
    }, SMTP_TIMEOUT_MS);

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function sendCommand(socket: TLSSocket, command: string) {
  const responsePromise = readResponse(socket);
  socket.write(`${command}\r\n`, "utf8");
  return responsePromise;
}

function expectCode(response: SmtpResponse, allowed: number[], step: string) {
  if (!allowed.includes(response.code)) {
    throw new Error(`SMTP ${step} failed (${response.code}): ${response.message}`);
  }
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function encodeBody(value: string) {
  const encoded = Buffer.from(value, "utf8").toString("base64");
  return encoded.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

function cleanHeaderValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function normalizeAddress(value: string) {
  const cleaned = cleanHeaderValue(value);
  if (!/^\S+@\S+\.\S+$/.test(cleaned)) throw new Error("Invalid email address");
  return cleaned;
}

function fromHeader(user: string) {
  const configured = cleanHeaderValue(process.env.EMAIL_FROM || "");
  const match = configured.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim();
    const address = normalizeAddress(match[2]);
    return name ? `${encodeHeader(name)} <${address}>` : address;
  }

  if (/^\S+@\S+\.\S+$/.test(configured)) return configured;
  return `${encodeHeader("ХОЛЛ")} <${user}>`;
}

function buildMessage(input: SendSmtpMailInput, user: string) {
  const to = normalizeAddress(input.to);
  const host = user.split("@")[1] || "gmail.com";
  const messageId = `<${randomBytes(16).toString("hex")}@${host}>`;

  return [
    `From: ${fromHeader(user)}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(cleanHeaderValue(input.subject))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeBody(input.html)
  ].join("\r\n");
}

function waitForSecureConnection(socket: TLSSocket) {
  return new Promise<void>((resolve, reject) => {
    const onSecure = () => {
      socket.off("error", onError);
      resolve();
    };
    const onError = (error: Error) => {
      socket.off("secureConnect", onSecure);
      reject(error);
    };
    socket.once("secureConnect", onSecure);
    socket.once("error", onError);
  });
}

export function isGmailSmtpConfigured() {
  return Boolean(process.env.GMAIL_SMTP_USER && process.env.GMAIL_SMTP_APP_PASSWORD);
}

export async function sendSmtpMail(input: SendSmtpMailInput) {
  const user = normalizeAddress(String(process.env.GMAIL_SMTP_USER || ""));
  const appPassword = String(process.env.GMAIL_SMTP_APP_PASSWORD || "").replace(/\s+/g, "");
  if (!appPassword) throw new Error("GMAIL_SMTP_APP_PASSWORD is not configured");

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  if (!Number.isInteger(port) || port <= 0) throw new Error("Invalid SMTP_PORT");

  const socket = connectTls({
    host,
    port,
    servername: host,
    rejectUnauthorized: true,
    minVersion: "TLSv1.2"
  });
  socket.setTimeout(SMTP_TIMEOUT_MS, () => socket.destroy(new Error("SMTP socket timeout")));

  try {
    const [greeting] = await Promise.all([readResponse(socket), waitForSecureConnection(socket)]);
    expectCode(greeting, [220], "greeting");
    expectCode(await sendCommand(socket, `EHLO ${process.env.SMTP_EHLO_NAME || "hall-app"}`), [250], "EHLO");
    expectCode(await sendCommand(socket, "AUTH LOGIN"), [334], "AUTH LOGIN");
    expectCode(await sendCommand(socket, Buffer.from(user).toString("base64")), [334], "username");
    expectCode(await sendCommand(socket, Buffer.from(appPassword).toString("base64")), [235], "password");
    expectCode(await sendCommand(socket, `MAIL FROM:<${user}>`), [250], "MAIL FROM");
    expectCode(await sendCommand(socket, `RCPT TO:<${normalizeAddress(input.to)}>`), [250, 251], "RCPT TO");
    expectCode(await sendCommand(socket, "DATA"), [354], "DATA");

    const deliveryPromise = readResponse(socket);
    socket.write(`${buildMessage(input, user)}\r\n.\r\n`, "utf8");
    expectCode(await deliveryPromise, [250], "message delivery");

    try {
      await sendCommand(socket, "QUIT");
    } catch {
      // Письмо уже принято сервером, поэтому ошибка QUIT не влияет на результат.
    }
  } finally {
    socket.end();
  }
}
