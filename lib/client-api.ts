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
      credentials: "same-origin",
      cache: "no-store"
    });
  } catch (error) {
    console.error("Homelix API request failed", { endpoint, error });
    throw new Error("Не удалось отправить сообщение. Проверьте подключение и попробуйте ещё раз.");
  }

  const text = await response.text();
  let data: ApiResult = {};

  try {
    data = text ? (JSON.parse(text) as ApiResult) : {};
  } catch {
    console.error("Homelix API returned a non-JSON response", { endpoint, status: response.status });
    data = { error: "Сервис временно недоступен. Попробуйте ещё раз." };
  }

  if (!response.ok) {
    throw new Error(data.error || "Не удалось выполнить запрос. Попробуйте ещё раз.");
  }

  return data;
}
