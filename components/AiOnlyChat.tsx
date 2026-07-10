"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MarkdownText } from "@/components/MarkdownText";
import { MascotImage } from "@/components/MascotImage";
import { postJson } from "@/lib/client-api";
import {
  clearChatHistory,
  generalChatHistoryKey,
  hasOldLimitErrorText,
  loadChatHistory,
  sanitizeAssistantContent,
  saveChatHistory,
  type StoredChatMessage
} from "@/lib/chat-history";

type Message = StoredChatMessage;

const starterPrompts = [
  "Подберите квартиру для семьи из 3 человек",
  "Какая квартира лучше для сдачи в аренду?",
  "Сравните доступные варианты",
  "Какие квартиры сейчас доступны?"
];

const initialMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Здравствуйте. Я ИИ-консультант жилого комплекса. Помогу подобрать квартиру, сравнить варианты и обязательно покажу цену подходящего варианта."
  }
];

export function AiOnlyChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesRef = useRef<Message[]>(initialMessages);

  useEffect(() => {
    const next = loadChatHistory(generalChatHistoryKey, initialMessages);
    setMessages(next);
    messagesRef.current = next;
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    if (!historyLoaded) return;
    saveChatHistory(generalChatHistoryKey, messages);
  }, [historyLoaded, messages]);

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;

    const userMessage: Message = { role: "user", content: cleaned };
    const historySnapshot = messagesRef.current.slice(-6);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPendingCount((count) => count + 1);

    try {
      const data = await postJson("/api/ai", {
        message: cleaned,
        history: historySnapshot
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: sanitizeAssistantContent(
            data.answer ?? data.error,
            "**Краткая консультация:** напишите вопрос еще раз коротко: например, **лучшая квартира для семьи**, **до 12 млн**, **для аренды** или **какие квартиры доступны**."
          )
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `**Сообщение не отправлено.**\n\n${error.message}`
              : "**Сообщение не отправлено.** Произошла неизвестная сетевая ошибка."
        }
      ]);
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  }

  function clearCurrentChat() {
    clearChatHistory(generalChatHistoryKey);
    setMessages(initialMessages);
    messagesRef.current = initialMessages;
    setInput("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  const visibleMessages = messages.filter((message) => !hasOldLimitErrorText(message.content));

  return (
    <section className="chat-card ai-only-chat" id="ai-only-chat">
      <div className="ai-only-header">
        <div
          aria-hidden="true"
          style={{
            display: "grid",
            width: 82,
            minHeight: 104,
            placeItems: "center",
            filter: "drop-shadow(0 16px 24px rgba(249, 62, 62, 0.22))"
          }}
        >
          <MascotImage width={76} style={{ width: 76, height: "auto" }} />
        </div>
        <div>
          <span className="eyebrow">ИИ-консультант</span>
          <h2>Консультация без выбора комнат</h2>
          <p>Можно отправлять несколько запросов подряд: ответы будут приходить независимо.</p>
        </div>
      </div>

      <div className="chat-context">
        <span>Контекст вопроса:</span>
        <strong>общая консультация по квартирам</strong>
      </div>

      <div className="chat-history-actions">
        <span>{pendingCount > 0 ? `Обрабатывается запросов: ${pendingCount}` : "История сохраняется в этом браузере."}</span>
        <button type="button" onClick={clearCurrentChat}>
          Очистить историю
        </button>
      </div>

      <div className="chat-messages ai-only-messages" aria-live="polite">
        {visibleMessages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message chat-${message.role}`}>
            <MarkdownText content={message.content} />
          </div>
        ))}
        {pendingCount > 0 && (
          <div className="chat-message chat-assistant">
            <MarkdownText content={`*Подготавливаю ответ... (${pendingCount})*`} />
          </div>
        )}
      </div>

      <div className="prompt-row">
        {starterPrompts.map((prompt) => (
          <button key={prompt} type="button" className="prompt-chip" onClick={() => void sendMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Например: лучшая квартира для семьи до 15 млн ₽..."
          rows={2}
        />
        <button className="button button-primary" type="submit">
          Отправить
        </button>
      </form>
    </section>
  );
}
