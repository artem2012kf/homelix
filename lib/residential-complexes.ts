export type ResidentialComplex = {
  id: string;
  name: string;
  district: string;
  microdistrict?: string;
  status: string;
  priceLevel: string;
  developer?: string;
  score?: number;
  rating?: number;
  mapRating?: number;
  reviews?: number;
  tags: string[];
};

export const residentialComplexes: ResidentialComplex[] = [
  {
    id: "novo-patrushevo",
    name: "ЖК Ново-Патрушево",
    district: "Восточный район",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "ТДСК",
    score: 16184.2,
    rating: 4.9,
    mapRating: 4.6,
    reviews: 3325,
    tags: ["Восточный район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: ТДСК"]
  },
  {
    id: "zvezdny",
    name: "ЖК Звёздный",
    district: "Ленинский район",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "Страна Девелопмент",
    score: 11746.9,
    rating: 5,
    mapRating: 4.7,
    reviews: 2360,
    tags: ["Ленинский район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: Страна Девелопмент"]
  },
  {
    id: "plekhanovo",
    name: "ЖК Плеханово",
    district: "Калининский район",
    microdistrict: "выезд по Московскому тракту",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "ТДСК",
    score: 10240.2,
    rating: 4.7,
    mapRating: 4.5,
    reviews: 2194,
    tags: ["Калининский район", "выезд по Московскому тракту", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: ТДСК"]
  },
  {
    id: "europeisky",
    name: "ЖК Европейский",
    district: "Центральный район",
    microdistrict: "мкр. Заречный",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "Брусника",
    score: 9895.5,
    rating: 5,
    mapRating: 4.5,
    reviews: 1990,
    tags: ["Центральный район", "мкр. Заречный", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "недалеко от центра города", "застройщик: Брусника"]
  },
  {
    id: "aprel",
    name: "ЖК Апрель",
    district: "Восточный район",
    microdistrict: "выезд по Червишевскому тракту",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "Партнер",
    score: 9069.8,
    rating: 4.9,
    mapRating: 4.6,
    reviews: 1865,
    tags: ["Восточный район", "выезд по Червишевскому тракту", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: Партнер"]
  },
  {
    id: "aivazovsky-city",
    name: "ЖК Айвазовский City",
    district: "Центральный район",
    microdistrict: "мкр. Заречный",
    status: "Сданные дома",
    priceLevel: "Элитные / премиум, цены выше средних",
    developer: "ЭНКО",
    score: 8127.4,
    rating: 5,
    mapRating: 4.8,
    reviews: 1631,
    tags: ["Центральный район", "мкр. Заречный", "сданные дома", "есть квартиры с отделкой / ремонтом", "элитные / премиум", "застройщик: ЭНКО"]
  },
  {
    id: "preo",
    name: "ЖК Прео",
    district: "Калининский район",
    microdistrict: "мкр. Тюменская Слобода",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "ЭНКО",
    score: 7350,
    rating: 4.9,
    reviews: 1500,
    tags: ["Калининский район", "мкр. Тюменская Слобода", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: ЭНКО"]
  },
  {
    id: "yamalsky-2",
    name: "ЖК Ямальский-2",
    district: "Калининский район",
    microdistrict: "мкр. Тюменская Слобода",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    score: 6899.3,
    rating: 4.7,
    mapRating: 4.2,
    reviews: 1514,
    tags: ["Калининский район", "мкр. Тюменская Слобода", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку"]
  },
  {
    id: "vidny",
    name: "ЖК Видный",
    district: "Восточный район",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "Брусника",
    score: 6597.5,
    rating: 5,
    mapRating: 4.5,
    reviews: 1323,
    tags: ["Восточный район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: Брусника"]
  },
  {
    id: "novoantipinsky",
    name: "ЖК Новоантипинский",
    district: "Ленинский район",
    status: "Сданные дома",
    priceLevel: "Цены ниже средних",
    developer: "ЖБИ-3",
    score: 6306.6,
    rating: 4.4,
    mapRating: 4.2,
    reviews: 1443,
    tags: ["Ленинский район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены ниже средних", "застройщик: ЖБИ-3"]
  },
  {
    id: "novin",
    name: "ЖК Новин",
    district: "Ленинский район",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "Брусника",
    score: 6275,
    rating: 4.8,
    mapRating: 4.3,
    reviews: 1310,
    tags: ["Ленинский район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "недалеко от центра города", "застройщик: Брусника"]
  },
  {
    id: "europeisky-bereg",
    name: "ЖК Европейский берег",
    district: "Центральный район",
    microdistrict: "мкр. Заречный",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "Страна Девелопмент",
    score: 6083.2,
    rating: 5,
    mapRating: 4.4,
    reviews: 1229,
    tags: ["Центральный район", "мкр. Заречный", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "недалеко от центра города", "застройщик: Страна Девелопмент"]
  },
  {
    id: "pravoberezhny",
    name: "ЖК Правобережный",
    district: "Центральный район",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "ПСК Дом девелопмент",
    score: 6017.5,
    rating: 4.9,
    mapRating: 5,
    reviews: 1228,
    tags: ["Центральный район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "недалеко от центра города", "застройщик: ПСК Дом девелопмент"]
  },
  {
    id: "andersen-park",
    name: "ЖК Андерсен Парк",
    district: "д. Дударева",
    microdistrict: "выезд по Московскому тракту",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "4D",
    score: 5990.9,
    rating: 4.9,
    mapRating: 4.5,
    reviews: 1225,
    tags: ["выезд по Московскому тракту", "д. Дударева", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: 4D"]
  },
  {
    id: "gorizont",
    name: "ЖК Горизонт",
    district: "Центральный район",
    microdistrict: "мкр. Заречный",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    score: 5970,
    rating: 4.5,
    mapRating: 4.2,
    reviews: 1334,
    tags: ["Центральный район", "мкр. Заречный", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку"]
  },
  {
    id: "olimpiya",
    name: "ЖК Олимпия",
    district: "Калининский район",
    microdistrict: "р-н Дом Обороны",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    score: 5880.6,
    rating: 4.6,
    mapRating: 4.5,
    reviews: 1283,
    tags: ["Калининский район", "р-н Дом Обороны", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "недалеко от центра города"]
  },
  {
    id: "malahovo",
    name: "ЖК Малахово",
    district: "Восточный район",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "ТДСК",
    score: 5565.7,
    rating: 4.7,
    mapRating: 5,
    reviews: 1184,
    tags: ["Восточный район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: ТДСК"]
  },
  {
    id: "domashny",
    name: "ЖК Домашний",
    district: "Калининский район",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "Страна Девелопмент",
    score: 5330,
    rating: 5,
    mapRating: 5,
    reviews: 1066,
    tags: ["Калининский район", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: Страна Девелопмент"]
  },
  {
    id: "komarovo",
    name: "ЖК Комарово",
    district: "д. Дударева",
    status: "Сданные дома",
    priceLevel: "Цены средние по рынку",
    developer: "ТДСК",
    score: 5188.6,
    rating: 4.9,
    mapRating: 4.4,
    reviews: 1074,
    tags: ["д. Дударева", "сданные дома", "есть квартиры с отделкой / ремонтом", "цены средние по рынку", "застройщик: ТДСК"]
  },
  {
    id: "serdtse-sibiri",
    name: "ЖК Сердце Сибири",
    district: "Тюмень",
    status: "Данные уточняются",
    priceLevel: "Цены уточняются",
    tags: ["Тюмень", "жилой комплекс", "данные уточняются"]
  }
];

export function normalizeResidentialComplexName(name: string) {
  return name
    .replace(/^\s*ЖК\s*:\s*/i, "")
    .replace(/^\s*жк\s+жк\s+/i, "ЖК ")
    .trim();
}

export function getResidentialComplexByApartmentId(apartmentId: string, fallbackName = "ЖК Солнечный квартал") {
  const numberMatch = apartmentId.match(/\d+/);
  const number = numberMatch ? Number(numberMatch[0]) : 0;
  const index = Number.isFinite(number) ? number % residentialComplexes.length : 0;
  const complex = residentialComplexes[index] ?? residentialComplexes[0];

  return {
    ...complex,
    name: normalizeResidentialComplexName(complex?.name ?? fallbackName)
  };
}
