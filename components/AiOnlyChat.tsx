"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { MarkdownText } from "@/components/MarkdownText";
import { MascotImage } from "@/components/MascotImage";
import { useCity } from "@/components/CityProvider";
import { postJson } from "@/lib/client-api";
import { translateComplexName, translatePlace, type Locale } from "@/lib/i18n";
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

function getInitialMessages(locale: Locale): Message[] {
  return [
    {
      role: "assistant",
      content: locale === "en"
        ? "Hello. I am the HALL AI assistant. I use the city and residential project selected in the header. When “Any project” is selected, I compare listings across the whole city."
        : "Здравствуйте. Я ИИ-консультант ХОЛЛ. Учитываю город и жилой комплекс, выбранные в шапке. При выборе «Любой ЖК» сравню предложения по всему городу."
    }
  ];
}

export function AiOnlyChat({ locale = "ru" }: { locale?: Locale }) {
  const { selectedCity, selectedProject, isReady } = useCity();
  const isEnglish = locale === "en";
  const initialMessages = useMemo(() => getInitialMessages(locale), [locale]);
  const historyKey = isEnglish ? `${generalChatHistoryKey}-en` : generalChatHistoryKey;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesRef = useRef<Message[]>(initialMessages);
  const cityLabel = translatePlace(selectedCity, locale);
  const projectLabel = selectedProject
    ? translateComplexName(selectedProject, locale)
    : isEnglish ? "Any project" : "Любой ЖК";

  const starterPrompts = isEnglish
    ? [
        selectedProject ? `What is available in ${projectLabel}?` : `What is available across all projects in ${cityLabel}?`,
        `Find an apartment for a family in ${cityLabel}`,
        "Which apartment is best for rental income?",
        "Compare the best options"
      ]
    : [
        selectedProject ? `Что доступно в ${selectedProject}?` : `Что доступно во всех ЖК города ${selectedCity}?`,
        `Подберите квартиру для семьи в ${selectedCity}`,
        "Какая квартира лучше для сдачи в аренду?",
        "Сравните подходящие варианты"
      ];

  useEffect(() => {
    const next = loadChatHistory(historyKey, initialMessages);
    setMessages(next);
    messagesRef.current = next;
    setHistoryLoaded(true);
  }, [historyKey, initialMessages]);

  useEffect(() => {
    messagesRef.current = messages;
    if (!historyLoaded) return;
    saveChatHistory(historyKey, messages);
  }, [historyKey, historyLoaded, messages]);

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || !isReady) return;

    const userMessage: Message = { role: "user", content: cleaned };
    const historySnapshot = messagesRef.current.slice(-6);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setPendingCount((count) => count + 1);

    try {
      const data = await postJson(isEnglish ? "/api/ai-en" : "/api/ai", {
        message: cleaned,
        history: historySnapshot,
        city: selectedCity,
        project: selectedProject
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: sanitizeAssistantContent(
            data.answer ?? data.error,
            isEnglish
              ? "**Quick consultation:** tell me your budget, preferred room count, floor or purchase goal — the city and project scope are already selected."
              : "**Краткая консультация:** уточните бюджет, комнатность, этаж или цель покупки — город и охват ЖК уже выбраны в шапке."
          )
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error
            ? isEnglish ? `**Message was not sent.**\n\n${error.message}` : `**Сообщение не отправлено.**\n\n${error.message}`
            : isEnglish ? "**Message was not sent.** An unknown network error occurred." : "**Сообщение не отправлено.** Произошла неизвестная сетевая ошибка."
        }
      ]);
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  }

  function clearCurrentChat() {
    clearChatHistory(historyKey);
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
          <span className="eyebrow">{isEnglish ? "AI assistant" : "ИИ-консультант"}</span>
          <h2>{isEnglish ? "Recommendations without opening a specific apartment" : "Подбор без открытия конкретной квартиры"}</h2>
          <p>{isEnglish ? "With “Any project” selected, the assistant compares every project in the chosen city." : "При выборе «Любой ЖК» консультант сравнивает все проекты выбранного города."}</p>
        </div>
      </div>

      <div className="chat-context">
        <span>{isEnglish ? "Recommendation context:" : "Контекст рекомендаций:"}</span>
        <strong>{cityLabel} · {projectLabel}</strong>
      </div>

      <div className="chat-history-actions">
        <span>{pendingCount > 0
          ? isEnglish ? `Requests in progress: ${pendingCount}` : `Обрабатывается запросов: ${pendingCount}`
          : isEnglish ? "History is saved in this browser." : "История сохраняется в этом браузере."}</span>
        <button type="button" onClick={clearCurrentChat}>
          {isEnglish ? "Clear history" : "Очистить историю"}
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
            <MarkdownText content={isEnglish ? `*Preparing an answer... (${pendingCount})*` : `*Подготавливаю ответ... (${pendingCount})*`} />
          </div>
        )}
      </div>

      <div className="prompt-row">
        {starterPrompts.map((prompt) => (
          <button key={prompt} type="button" className="prompt-chip" onClick={() => void sendMessage(prompt)} disabled={!isReady}>
            {prompt}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isEnglish ? "For example: a two-bedroom apartment under $170,000 for a family..." : "Например: двухкомнатная до 15 млн ₽ для семьи..."}
          rows={2}
        />
        <button className="button button-primary" type="submit" disabled={!isReady || !input.trim()}>
          {isEnglish ? "Send" : "Отправить"}
        </button>
      </form>
    </section>
  );
}
