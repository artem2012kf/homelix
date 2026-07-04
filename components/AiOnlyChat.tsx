"use client";

import { FormEvent, useEffect, useState } from "react";
import { MarkdownText } from "@/components/MarkdownText";
import { postJson } from "@/lib/client-api";
import {
  clearChatHistory,
  generalChatHistoryKey,
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
      "Здравствуйте. Я ИИ-консультант жилого комплекса. История диалога теперь сохраняется, поэтому можно продолжать подбор квартиры с прошлого места."
  }
];

export function AiOnlyChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    setMessages(loadChatHistory(generalChatHistoryKey, initialMessages));
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    saveChatHistory(generalChatHistoryKey, messages);
  }, [historyLoaded, messages]);

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || isLoading) return;

    const userMessage: Message = { role: "user", content: cleaned };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await postJson("/api/ai", {
        message: cleaned,
        history: messages.slice(-6)
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: sanitizeAssistantContent(
            data.answer ?? data.error,
            "**Краткая консультация:** старый ответ про лимит OpenRouter скрыт. Напишите вопрос еще раз коротко: например, **какие квартиры доступны?**, **до 12 млн**, **для аренды** или **для семьи**."
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
      setIsLoading(false);
    }
  }

  function clearCurrentChat() {
    clearChatHistory(generalChatHistoryKey);
    setMessages(initialMessages);
    setInput("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <section className="chat-card ai-only-chat" id="ai-only-chat">
      <div className="ai-only-header">
        <div className="mascot small-mascot" aria-hidden="true">
          <div className="mascot-face">
            <span className="eye" />
            <span className="eye" />
          </div>
        </div>
        <div>
          <span className="eyebrow">ИИ-консультант</span>
          <h2>Консультация без выбора комнат</h2>
          <p>Задайте общий вопрос по жилому комплексу, подбору квартиры или сравнению доступных вариантов.</p>
        </div>
      </div>

      <div className="chat-context">
        <span>Контекст вопроса:</span>
        <strong>общая консультация по квартирам</strong>
      </div>

      <div className="chat-history-actions">
        <span>История сохраняется в этом браузере.</span>
        <button type="button" onClick={clearCurrentChat}>
          Очистить историю
        </button>
      </div>

      <div className="chat-messages ai-only-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message chat-${message.role}`}>
            <MarkdownText content={message.content} />
          </div>
        ))}
        {isLoading && (
          <div className="chat-message chat-assistant">
            <MarkdownText content="*Подготавливаю ответ...*" />
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
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Например: подберите квартиру до 15 млн ₽..."
        />
        <button className="button button-primary" type="submit" disabled={isLoading}>
          Отправить
        </button>
      </form>
    </section>
  );
}
