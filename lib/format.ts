export function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatArea(value: number) {
  return `${value.toLocaleString("ru-RU")} м²`;
}

export function statusLabel(status: string) {
  switch (status) {
    case "available":
      return "Свободна";
    case "reserved":
      return "Бронь";
    case "sold":
      return "Продана";
    default:
      return status;
  }
}
