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
    id: "moscow-capital",
    name: "ЖК Столичный парк",
    district: "Москва",
    microdistrict: "Пресненский район",
    status: "Демонстрационное предложение",
    priceLevel: "Премиум",
    developer: "Город Девелопмент",
    rating: 4.9,
    reviews: 1280,
    tags: ["Москва", "премиум", "рядом с центром", "онлайн-бронирование", "застройщик: Город Девелопмент"]
  },
  {
    id: "spb-neva",
    name: "ЖК Невская гавань",
    district: "Санкт-Петербург",
    microdistrict: "Василеостровский район",
    status: "Демонстрационное предложение",
    priceLevel: "Бизнес-класс",
    developer: "Север Строй",
    rating: 4.8,
    reviews: 965,
    tags: ["Санкт-Петербург", "бизнес-класс", "набережная", "онлайн-бронирование", "застройщик: Север Строй"]
  },
  {
    id: "kazan-gardens",
    name: "ЖК Казанские сады",
    district: "Казань",
    microdistrict: "Советский район",
    status: "Демонстрационное предложение",
    priceLevel: "Комфорт-класс",
    developer: "Волга Дом",
    rating: 4.7,
    reviews: 740,
    tags: ["Казань", "комфорт-класс", "семейные планировки", "онлайн-бронирование", "застройщик: Волга Дом"]
  },
  {
    id: "ekb-ural",
    name: "ЖК Уральский квартал",
    district: "Екатеринбург",
    microdistrict: "Академический район",
    status: "Демонстрационное предложение",
    priceLevel: "Комфорт-класс",
    developer: "Урал Девелопмент",
    rating: 4.8,
    reviews: 860,
    tags: ["Екатеринбург", "комфорт-класс", "новый район", "онлайн-бронирование", "застройщик: Урал Девелопмент"]
  },
  {
    id: "nsk-siberia",
    name: "ЖК Сибирская панорама",
    district: "Новосибирск",
    microdistrict: "Октябрьский район",
    status: "Демонстрационное предложение",
    priceLevel: "Бизнес-класс",
    developer: "Сибирь Инвест",
    rating: 4.7,
    reviews: 690,
    tags: ["Новосибирск", "бизнес-класс", "панорамные виды", "онлайн-бронирование", "застройщик: Сибирь Инвест"]
  },
  {
    id: "krasnodar-south",
    name: "ЖК Южный берег",
    district: "Краснодар",
    microdistrict: "Прикубанский округ",
    status: "Демонстрационное предложение",
    priceLevel: "Комфорт-класс",
    developer: "ЮгСтрой",
    rating: 4.8,
    reviews: 1120,
    tags: ["Краснодар", "комфорт-класс", "озелененный двор", "онлайн-бронирование", "застройщик: ЮгСтрой"]
  },
  {
    id: "sochi-sea",
    name: "ЖК Морской горизонт",
    district: "Сочи",
    microdistrict: "Хостинский район",
    status: "Демонстрационное предложение",
    priceLevel: "Премиум",
    developer: "Черномор Девелопмент",
    rating: 4.9,
    reviews: 830,
    tags: ["Сочи", "премиум", "морской климат", "онлайн-бронирование", "застройщик: Черномор Девелопмент"]
  },
  {
    id: "tyumen-sloboda",
    name: "ЖК Тюменская слобода",
    district: "Тюмень",
    microdistrict: "Калининский округ",
    status: "Демонстрационное предложение",
    priceLevel: "Комфорт-класс",
    developer: "Регион Дом",
    rating: 4.7,
    reviews: 910,
    tags: ["Тюмень", "комфорт-класс", "семейный район", "онлайн-бронирование", "застройщик: Регион Дом"]
  },
  {
    id: "samara-volga",
    name: "ЖК Волга Парк",
    district: "Самара",
    microdistrict: "Октябрьский район",
    status: "Демонстрационное предложение",
    priceLevel: "Бизнес-класс",
    developer: "Волга Групп",
    rating: 4.8,
    reviews: 650,
    tags: ["Самара", "бизнес-класс", "рядом с Волгой", "онлайн-бронирование", "застройщик: Волга Групп"]
  },
  {
    id: "nn-heights",
    name: "ЖК Нижегородские высоты",
    district: "Нижний Новгород",
    microdistrict: "Нижегородский район",
    status: "Демонстрационное предложение",
    priceLevel: "Бизнес-класс",
    developer: "Столица Поволжья",
    rating: 4.7,
    reviews: 590,
    tags: ["Нижний Новгород", "бизнес-класс", "видовые квартиры", "онлайн-бронирование", "застройщик: Столица Поволжья"]
  },
  {
    id: "ufa-river",
    name: "ЖК Белая река",
    district: "Уфа",
    microdistrict: "Кировский район",
    status: "Демонстрационное предложение",
    priceLevel: "Комфорт-класс",
    developer: "БашДом",
    rating: 4.8,
    reviews: 720,
    tags: ["Уфа", "комфорт-класс", "набережная", "онлайн-бронирование", "застройщик: БашДом"]
  },
  {
    id: "vladivostok-horn",
    name: "ЖК Золотой Рог",
    district: "Владивосток",
    microdistrict: "Первомайский район",
    status: "Демонстрационное предложение",
    priceLevel: "Бизнес-класс",
    developer: "Восток Девелопмент",
    rating: 4.8,
    reviews: 610,
    tags: ["Владивосток", "бизнес-класс", "вид на город", "онлайн-бронирование", "застройщик: Восток Девелопмент"]
  },
  {
    id: "rostov-don",
    name: "ЖК Донские террасы",
    district: "Ростов-на-Дону",
    microdistrict: "Пролетарский район",
    status: "Демонстрационное предложение",
    priceLevel: "Комфорт-класс",
    developer: "Дон Строй",
    rating: 4.7,
    reviews: 780,
    tags: ["Ростов-на-Дону", "комфорт-класс", "террасы", "онлайн-бронирование", "застройщик: Дон Строй"]
  },
  {
    id: "kaliningrad-baltic",
    name: "ЖК Балтийский сад",
    district: "Калининград",
    microdistrict: "Ленинградский район",
    status: "Демонстрационное предложение",
    priceLevel: "Комфорт-класс",
    developer: "Балтика Дом",
    rating: 4.8,
    reviews: 540,
    tags: ["Калининград", "комфорт-класс", "малоэтажная среда", "онлайн-бронирование", "застройщик: Балтика Дом"]
  },
  {
    id: "krasnoyarsk-yenisei",
    name: "ЖК Енисейский берег",
    district: "Красноярск",
    microdistrict: "Центральный район",
    status: "Демонстрационное предложение",
    priceLevel: "Бизнес-класс",
    developer: "Енисей Девелопмент",
    rating: 4.7,
    reviews: 500,
    tags: ["Красноярск", "бизнес-класс", "рядом с Енисеем", "онлайн-бронирование", "застройщик: Енисей Девелопмент"]
  }
];

export function normalizeResidentialComplexName(name: string) {
  return name.replace(/^\s*ЖК\s*:\s*/i, "").replace(/^\s*жк\s+жк\s+/i, "ЖК ").trim();
}

export function getResidentialComplexByApartmentId(_apartmentId: string, fallbackName = "ЖК Столичный парк") {
  const normalizedFallback = normalizeResidentialComplexName(fallbackName).toLowerCase();
  const complex = residentialComplexes.find(
    (item) => normalizeResidentialComplexName(item.name).toLowerCase() === normalizedFallback
  );
  return complex ?? residentialComplexes[0];
}