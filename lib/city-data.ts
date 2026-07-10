export type CityInfo = {
  name: string;
  lat: number;
  lon: number;
  zoom: number;
  officeAddress: string;
  phone: string;
};

export const CITY_INFO: Record<string, CityInfo> = {
  "Москва": { name: "Москва", lat: 55.7558, lon: 37.6176, zoom: 11, officeAddress: "Пресненская набережная, 8", phone: "+7 (495) 120-00-40" },
  "Санкт-Петербург": { name: "Санкт-Петербург", lat: 59.9343, lon: 30.3351, zoom: 11, officeAddress: "Невский проспект, 55", phone: "+7 (812) 409-00-40" },
  "Казань": { name: "Казань", lat: 55.7961, lon: 49.1064, zoom: 12, officeAddress: "улица Баумана, 44/8", phone: "+7 (843) 500-00-40" },
  "Екатеринбург": { name: "Екатеринбург", lat: 56.8389, lon: 60.6057, zoom: 12, officeAddress: "улица Бориса Ельцина, 3", phone: "+7 (343) 300-00-40" },
  "Новосибирск": { name: "Новосибирск", lat: 55.0084, lon: 82.9357, zoom: 11, officeAddress: "Красный проспект, 25", phone: "+7 (383) 200-00-40" },
  "Краснодар": { name: "Краснодар", lat: 45.0355, lon: 38.9753, zoom: 12, officeAddress: "Красная улица, 176", phone: "+7 (861) 200-00-40" },
  "Сочи": { name: "Сочи", lat: 43.5855, lon: 39.7231, zoom: 11, officeAddress: "Курортный проспект, 50", phone: "+7 (862) 200-00-40" },
  "Тюмень": { name: "Тюмень", lat: 57.1522, lon: 65.5272, zoom: 12, officeAddress: "улица Республики, 61", phone: "+7 (3452) 50-00-40" },
  "Самара": { name: "Самара", lat: 53.1959, lon: 50.1008, zoom: 11, officeAddress: "Московское шоссе, 17", phone: "+7 (846) 200-00-40" },
  "Нижний Новгород": { name: "Нижний Новгород", lat: 56.2965, lon: 43.9361, zoom: 11, officeAddress: "Большая Покровская улица, 20", phone: "+7 (831) 200-00-40" },
  "Уфа": { name: "Уфа", lat: 54.7388, lon: 55.9721, zoom: 11, officeAddress: "проспект Октября, 4/1", phone: "+7 (347) 200-00-40" },
  "Владивосток": { name: "Владивосток", lat: 43.1155, lon: 131.8855, zoom: 11, officeAddress: "Океанский проспект, 17", phone: "+7 (423) 200-00-40" },
  "Ростов-на-Дону": { name: "Ростов-на-Дону", lat: 47.2357, lon: 39.7015, zoom: 11, officeAddress: "Большая Садовая улица, 65", phone: "+7 (863) 200-00-40" },
  "Калининград": { name: "Калининград", lat: 54.7104, lon: 20.4522, zoom: 12, officeAddress: "Ленинский проспект, 30", phone: "+7 (4012) 50-00-40" },
  "Красноярск": { name: "Красноярск", lat: 56.0153, lon: 92.8932, zoom: 11, officeAddress: "улица Карла Маркса, 95", phone: "+7 (391) 200-00-40" }
};

export const DEFAULT_CITY = "Москва";

export function getCityInfo(city: string) {
  return CITY_INFO[city] ?? CITY_INFO[DEFAULT_CITY];
}

export function getOpenStreetMapEmbedUrl(city: string) {
  const info = getCityInfo(city);
  const delta = info.zoom >= 12 ? 0.09 : 0.18;
  const bbox = [info.lon - delta, info.lat - delta, info.lon + delta, info.lat + delta].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${info.lat}%2C${info.lon}`;
}