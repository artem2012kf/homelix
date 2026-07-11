"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Apartment, Room } from "@/types/apartment";
import { MarkdownText } from "@/components/MarkdownText";
import { AiMascot } from "@/components/AiMascot";

type Message = { role: "user" | "assistant"; content: string };

function historyKey(apartmentId: string) {
  return `hall-apartment-chat-en-${apartmentId}`;
}

function initialMessages(apartment: Apartment): Message[] {
  return [
    {
      role: "assistant",
      content: `Hello. I am the HALL AI assistant for **${apartment.title}**. Ask about the floor plan, rooms, furniture, storage, price or family suitability.`
    }
  ];
}

export function AiChatEn({ apartment, selectedRoom }: { apartment: Apartment; selectedRoom?: Room }) {
  const initial = initialMessages(apartment);
  const [messages, setMessages] = useState<Message[]>(initial);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(historyKey(apartment.id));
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
    } catch {
      setMessages(initialMessages(apartment));
    } finally {
      loaded.current = true;
    }
  }, [apartment]);

  useEffect(() => {
    if (!loaded.current) return;
    window.localStorage.setItem(historyKey(apartment.id), JSON.stringify(messages.slice(-30)));
  }, [apartment.id, messages]);

  async function send(text: string) {
    const cleaned = text.trim();
    if (!cleaned || pending) return;

    setMessages((current) => [...current, { role: "user", content: cleaned }]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat-en", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentId: apartment.id,
          roomId: selectedRoom?.id,
          message: cleaned
        })
      });
      const data = (await response.json().catch(() => ({}))) as { answer?: string; error?: string };
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.ok ? data.answer || "Please clarify your question." : `**Request failed.**\n\n${data.error || "Please try again."}`
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `**Message not sent.**\n\n${error instanceof Error ? error.message : "Unknown network error."}`
        }
      ]);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  const prompts = selectedRoom?.type === "wardrobe"
    ? ["How should I store seasonal items?", "Shelves or hanging rails?", "How should I organise this walk-in closet?"]
    : ["Is this apartment suitable for a family?", "What are its main advantages?", "How should I place furniture?", "Compare it with alternatives"];

  return (
    <section className="chat-card">
      <div className="chat-title-row">
        <AiMascot />
        <div>
          <span className="eyebrow">HALL AI assistant</span>
          <h2>{selectedRoom ? `Questions about ${selectedRoom.name}` : "Questions about the apartment"}</h2>
        </div>
      </div>

      <div className="chat-history-actions">
        <span>{pending ? "Preparing an answer..." : "History is saved in this browser."}</span>
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem(historyKey(apartment.id));
            setMessages(initialMessages(apartment));
            setInput("");
          }}
        >
          Clear history
        </button>
      </div>

      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`chat-message chat-${message.role}`}>
            <MarkdownText content={message.content} />
          </div>
        ))}
        {pending ? <div className="chat-message chat-assistant"><em>Preparing an answer...</em></div> : null}
      </div>

      <div className="prompt-row">
        {prompts.map((prompt) => (
          <button className="prompt-chip" type="button" key={prompt} onClick={() => void send(prompt)} disabled={pending}>
            {prompt}
          </button>
        ))}
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="For example: how should I organise storage in this room?"
          rows={2}
          maxLength={2000}
        />
        <button className="button button-primary" type="submit" disabled={pending || !input.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
