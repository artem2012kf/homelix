export type StoredChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const MAX_STORED_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 4000;

const OLD_LIMIT_ERROR_MARKERS = [
  "Запрос получился слишком объемным",
  "бесплатная модель OpenRouter ограничила объем запроса или ответа",
  "Я могу продолжить консультацию, но лучше разделить вопрос на несколько коротких частей"
];

export function apartmentChatHistoryKey(apartmentId: string) {
  return `sq-ai-chat-apartment-${apartmentId}`;
}

export const generalChatHistoryKey = "sq-ai-chat-general";

function isStoredMessage(value: unknown): value is StoredChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Partial<StoredChatMessage>;
  return (message.role === "user" || message.role === "assistant") && typeof message.content === "string";
}

function isOldLimitErrorMessage(message: StoredChatMessage) {
  if (message.role !== "assistant") return false;

  return OLD_LIMIT_ERROR_MARKERS.some((marker) => message.content.includes(marker));
}

function normalizeMessages(messages: StoredChatMessage[]) {
  return messages
    .filter(isStoredMessage)
    .filter((message) => !isOldLimitErrorMessage(message))
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_LENGTH)
    }))
    .slice(-MAX_STORED_MESSAGES);
}

export function loadChatHistory(key: string, fallback: StoredChatMessage[]) {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!Array.isArray(parsed)) return fallback;

    const messages = normalizeMessages(parsed);

    if (messages.length > 0) {
      window.localStorage.setItem(key, JSON.stringify(messages));
    } else {
      window.localStorage.removeItem(key);
    }

    return messages.length > 0 ? messages : fallback;
  } catch {
    return fallback;
  }
}

export function saveChatHistory(key: string, messages: StoredChatMessage[]) {
  if (typeof window === "undefined") return;

  try {
    const safeMessages = normalizeMessages(messages);

    window.localStorage.setItem(key, JSON.stringify(safeMessages));
  } catch {
    // Если браузер запретил localStorage, чат продолжит работать без сохранения истории.
  }
}

export function clearChatHistory(key: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Игнорируем ошибку очистки localStorage.
  }
}
