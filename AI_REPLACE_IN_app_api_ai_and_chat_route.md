# Замена для app/api/ai/route.ts и app/api/chat/route.ts

В ОБОИХ файлах замени функцию `stripOpenRouterReasoning` на этот код:

```ts
function stripOpenRouterReasoning(rawAnswer: string) {
  let answer = rawAnswer
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:thinking|analysis|reasoning)?[\s\S]*?```/gi, "")
    .replace(/^(analysis|reasoning|thinking|мысли|рассуждение|ход рассуждений)\s*[:：][\s\S]*?(?=(ответ|итог|рекомендация)\s*[:：]|$)/gim, "")
    .trim();

  const answerMarker = answer.match(/(?:ответ|итог|рекомендация)\s*[:：]\s*([\s\S]+)/i);
  if (answerMarker?.[1]) {
    answer = answerMarker[1].trim();
  }

  const lines = answer
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      const lower = line.toLowerCase();

      return (
        line &&
        !lower.startsWith("analysis") &&
        !lower.startsWith("reasoning") &&
        !lower.startsWith("thinking") &&
        !lower.startsWith("мысли") &&
        !lower.startsWith("рассуждение") &&
        !lower.startsWith("я думаю шаг за шагом")
      );
    });

  return lines.join("\n").trim();
}
```

В системный prompt в ОБОИХ файлах добавь фразу:

```txt
Не показывай ход рассуждений, внутренний анализ, thinking, reasoning или chain-of-thought. Отправляй клиенту только готовый ответ.
```
