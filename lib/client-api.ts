export type ApiResult = {
  answer?: string;
  error?: string;
};

export async function postJson(endpoint: string, payload: unknown): Promise<ApiResult> {
  const url = new URL(endpoint, window.location.origin);

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "неизвестная сетевая ошибка";
    throw new Error(
      `Не удалось отправить запрос на ${url.toString()}. Проверьте, что сайт открыт по IP компьютера с сервером и запущен с --hostname 0.0.0.0. Детали: ${reason}`
    );
  }

  const text = await response.text();
  let data: ApiResult = {};

  try {
    data = text ? (JSON.parse(text) as ApiResult) : {};
  } catch {
    data = { error: text || "Сервер вернул пустой ответ." };
  }

  if (!response.ok) {
    throw new Error(data.error || `Сервер вернул ошибку ${response.status}.`);
  }

  return data;
}
