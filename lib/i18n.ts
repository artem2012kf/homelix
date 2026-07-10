import type { Apartment, RoomType } from "@/types/apartment";

export type Locale = "ru" | "en";

export const localeNames: Record<Locale, string> = {
  ru: "RU",
  en: "EN"
};

export function getLocaleFromPathname(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ru";
}

export function getHomeHref(locale: Locale, hash = "") {
  return `${locale === "ru" ? "/" : "/en"}${hash}`;
}

export function getIntlLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "ru-RU";
}

export const siteText = {
  ru: {
    brand: "ХОЛЛ",
    brandSubtitle: "Квартиры по всей России",
    nav: {
      apartments: "Квартиры",
      complexes: "Жилые комплексы",
      ai: "ИИ-консультант",
      furniture: "Мебель",
      contacts: "Контакты"
    },
    auth: {
      account: "Кабинет",
      login: "Войти",
      logout: "Выйти",
      favorites: "избранных",
      reservations: "броней"
    },
    home: {
      eyebrow: "Федеральный каталог новостроек",
      title: "Квартиры по всей России — в одном ХОЛЛе",
      intro: "Выберите город и жилой комплекс, сравните квартиры по этажу, площади и цене, изучите ломаные интерактивные планировки и закажите мебель с доставкой прямо в квартиру.",
      apartmentsButton: "Выбрать квартиру",
      complexesButton: "Выбрать ЖК",
      statsLabel: "Показатели каталога",
      apartmentsInDatabase: "квартир в каталоге",
      availableNow: "свободны сейчас",
      startingPrice: "минимальная цена",
      from: "от",
      mascotAlt: "Маскот ХОЛЛ",
      mascotTitle: "Ваш проводник по новостройкам",
      mascotBody: "ХОЛЛ объединяет выбор квартиры, планировку, мебель, доставку и заявку на покупку в одном интерфейсе.",
      catalogEyebrow: "Каталог квартир",
      catalogTitle: "Предложения в выбранном городе",
      catalogBody: "Используйте фильтры как на схеме этажей: выбирайте комнатность, этаж, площадь, цену, статус и жилой комплекс.",
      complexesEyebrow: "жилых комплексов",
      complexesTitle: "ЖК выбранного города",
      complexesBody: "Рекомендации перестраиваются после выбора города в шапке.",
      score: "Рейтинг",
      reviews: "Отзывов",
      workflowEyebrow: "Как работает ХОЛЛ",
      workflowTitle: "От города до покупки и доставки",
      workflowBody: "Один понятный путь без лишних экранов.",
      workflow: [
        ["Город и ЖК", "При первом входе выберите город и жилой комплекс. Каталог, карта и офис продаж обновятся автоматически."],
        ["Квартира", "Отфильтруйте предложения по комнатам, этажу, площади, цене и статусу."],
        ["Планировка", "Изучите ломаные контуры комнат, ниши, выступы, окна, двери и примерку мебели."],
        ["Покупка", "Отправьте заявку на квартиру или соберите корзину мебели с ценой и сроком доставки."]
      ],
      contactsEyebrow: "Офис продаж",
      contactsTitle: "Контакты в выбранном городе",
      contactsBody: "Адрес и телефон автоматически отображаются в подвале сайта.",
      phone: "Телефон",
      phoneHours: "Ежедневно с 9:00 до 21:00",
      address: "Офис",
      city: "Выбранный город",
      addressBody: "Адрес офиса продаж выбранного города",
      emailBody: "Заявки на квартиры и мебель"
    },
    catalog: {
      apartmentWord: "квартир",
      sorting: "Сортировка",
      sortControl: "Сортировать",
      cityFilter: "Город",
      allCities: "Все города",
      quickSortAria: "Быстрые фильтры квартир",
      cheaper: "Дешевле",
      larger: "Больше площадь",
      higher: "Выше этаж",
      lowerMortgage: "Ниже ипотека",
      upTo: "до",
      floorUpTo: "этажа",
      byPayment: "по платежу",
      sortLabels: {
        recommended: "Сначала подходящие",
        "price-asc": "Цена: сначала дешевле",
        "price-desc": "Цена: сначала дороже",
        "area-asc": "Площадь: сначала меньше",
        "area-desc": "Площадь: сначала больше",
        "floor-asc": "Этаж: сначала ниже",
        "floor-desc": "Этаж: сначала выше",
        "rooms-asc": "Комнатность: сначала меньше",
        "rooms-desc": "Комнатность: сначала больше",
        "mortgage-asc": "Ипотека: сначала ниже"
      }
    },
    card: {
      floor: "этаж",
      openPlanAria: "Открыть планировку",
      view: "Вид",
      area: "Площадь",
      price: "Цена",
      plan: "Планировка",
      favorite: "В избранное",
      inFavorites: "В избранном",
      reserve: "Забронировать",
      buy: "Купить",
      buying: "Отправляем заявку...",
      purchaseSent: "Заявка на покупку отправлена.",
      cancelReservation: "Отменить бронь",
      alreadyReserved: "Уже в брони",
      sold: "Продана",
      yourReservation: "Ваша бронь",
      authRequired: "Сначала войдите или зарегистрируйтесь.",
      updatingFavorites: "Обновляем избранное...",
      removedFavorite: "Удалено из избранного.",
      addedFavorite: "Добавлено в избранное.",
      favoriteError: "Не удалось обновить избранное.",
      cancelling: "Отменяем бронь...",
      cancelled: "Бронь отменена.",
      cancelError: "Не удалось отменить бронь.",
      occupied: "Эта квартира уже находится в брони.",
      alreadySold: "Эта квартира уже продана.",
      reserving: "Создаём бронь...",
      reserved: "Заявка на бронирование отправлена.",
      reserveError: "Не удалось забронировать квартиру."
    }
  },
  en: {
    brand: "HALL",
    brandSubtitle: "Apartments across Russia",
    nav: {
      apartments: "Apartments",
      complexes: "Residential projects",
      ai: "AI assistant",
      furniture: "Furniture",
      contacts: "Contacts"
    },
    auth: {
      account: "Account",
      login: "Sign in",
      logout: "Sign out",
      favorites: "favorites",
      reservations: "reservations"
    },
    home: {
      eyebrow: "Nationwide new-build marketplace",
      title: "Apartments across Russia in one HALL",
      intro: "Choose a city and project, compare apartments by floor, area and price, explore irregular interactive floor plans and order furniture delivered to your apartment.",
      apartmentsButton: "Choose an apartment",
      complexesButton: "Choose a project",
      statsLabel: "Catalog highlights",
      apartmentsInDatabase: "apartments in the catalog",
      availableNow: "available now",
      startingPrice: "lowest price",
      from: "from",
      mascotAlt: "HALL mascot",
      mascotTitle: "Your new-build guide",
      mascotBody: "HALL combines apartment selection, floor plans, furniture, delivery and purchase requests in one interface.",
      catalogEyebrow: "Apartment catalog",
      catalogTitle: "Listings in the selected city",
      catalogBody: "Filter apartments like a floor selector: rooms, floor, area, price, status and residential project.",
      complexesEyebrow: "residential projects",
      complexesTitle: "Projects in the selected city",
      complexesBody: "Recommendations update when you change the city in the header.",
      score: "Rating",
      reviews: "Reviews",
      workflowEyebrow: "How HALL works",
      workflowTitle: "From city selection to purchase and delivery",
      workflowBody: "One clear journey with no unnecessary screens.",
      workflow: [
        ["City and project", "Choose a city and residential project. The catalog, map and sales office update automatically."],
        ["Apartment", "Filter listings by rooms, floor, area, price and availability."],
        ["Floor plan", "Explore irregular room contours, niches, windows, doors and furniture placement."],
        ["Purchase", "Submit an apartment request or order a furniture cart with delivery price and timing."]
      ],
      contactsEyebrow: "Sales office",
      contactsTitle: "Contacts in the selected city",
      contactsBody: "The relevant address and phone number are displayed in the footer.",
      phone: "Phone",
      phoneHours: "Daily, 9:00 AM–9:00 PM",
      address: "Office",
      city: "Selected city",
      addressBody: "Local sales office address",
      emailBody: "Apartment and furniture requests"
    },
    catalog: {
      apartmentWord: "apartments",
      sorting: "Sorting",
      sortControl: "Sort by",
      cityFilter: "City",
      allCities: "All cities",
      quickSortAria: "Quick apartment filters",
      cheaper: "Lowest price",
      larger: "Largest area",
      higher: "Highest floor",
      lowerMortgage: "Lowest mortgage",
      upTo: "up to",
      floorUpTo: "floor",
      byPayment: "by payment",
      sortLabels: {
        recommended: "Best match first",
        "price-asc": "Price: low to high",
        "price-desc": "Price: high to low",
        "area-asc": "Area: small to large",
        "area-desc": "Area: large to small",
        "floor-asc": "Floor: low to high",
        "floor-desc": "Floor: high to low",
        "rooms-asc": "Rooms: few to many",
        "rooms-desc": "Rooms: many to few",
        "mortgage-asc": "Mortgage: low to high"
      }
    },
    card: {
      floor: "floor",
      openPlanAria: "Open floor plan",
      view: "View",
      area: "Area",
      price: "Price",
      plan: "Floor plan",
      favorite: "Add to favorites",
      inFavorites: "In favorites",
      reserve: "Reserve",
      buy: "Buy",
      buying: "Submitting request...",
      purchaseSent: "Purchase request submitted.",
      cancelReservation: "Cancel reservation",
      alreadyReserved: "Already reserved",
      sold: "Sold",
      yourReservation: "Your reservation",
      authRequired: "Please sign in or register first.",
      updatingFavorites: "Updating favorites...",
      removedFavorite: "Removed from favorites.",
      addedFavorite: "Added to favorites.",
      favoriteError: "Could not update favorites.",
      cancelling: "Cancelling reservation...",
      cancelled: "Reservation cancelled.",
      cancelError: "Could not cancel the reservation.",
      occupied: "This apartment is already reserved.",
      alreadySold: "This apartment has already been sold.",
      reserving: "Creating reservation...",
      reserved: "Reservation request submitted.",
      reserveError: "Could not reserve the apartment."
    }
  }
} as const;

const roomNames: Record<Locale, Record<RoomType, string>> = {
  ru: {
    kitchen: "Кухня-гостиная",
    living: "Гостиная",
    bedroom: "Спальня",
    children: "Детская",
    bathroom: "Санузел",
    hall: "Прихожая",
    balcony: "Лоджия",
    wardrobe: "Гардеробная"
  },
  en: {
    kitchen: "Kitchen-living room",
    living: "Living room",
    bedroom: "Bedroom",
    children: "Children's room",
    bathroom: "Bathroom",
    hall: "Entrance hall",
    balcony: "Balcony",
    wardrobe: "Walk-in closet"
  }
};

export function translateApartmentTitle(title: string, locale: Locale) {
  if (locale === "ru") return title;
  const area = title.match(/([\d.,]+)\s*м²/i)?.[1]?.replace(",", ".") ?? "";
  if (/студия/i.test(title)) return `Studio, ${area} m²`;
  const euro = title.match(/евро-(\d+)/i)?.[1];
  if (euro) return `Euro ${euro}-room, ${area} m²`;
  const rooms = title.match(/(\d+)-комнат/i)?.[1];
  if (rooms) return `${rooms}-room apartment, ${area} m²`;
  return title;
}

export function translateBuilding(value: string, locale: Locale) {
  if (locale === "ru") return value;
  return `Building ${value.match(/\d+/)?.[0] ?? value}`;
}

export function translateSection(value: string, locale: Locale) {
  if (locale === "ru") return value;
  return `Section ${value.replace(/секция\s*/i, "").trim()}`;
}

export function translateComplexName(value: string, locale: Locale) {
  if (locale === "ru") return value;
  return `${value.replace(/^ЖК\s+/i, "")} Residential Complex`;
}

const placeTranslations: Record<string, string> = {
  "Москва": "Moscow",
  "Санкт-Петербург": "Saint Petersburg",
  "Казань": "Kazan",
  "Екатеринбург": "Yekaterinburg",
  "Новосибирск": "Novosibirsk",
  "Краснодар": "Krasnodar",
  "Сочи": "Sochi",
  "Тюмень": "Tyumen",
  "Самара": "Samara",
  "Нижний Новгород": "Nizhny Novgorod",
  "Уфа": "Ufa",
  "Владивосток": "Vladivostok",
  "Ростов-на-Дону": "Rostov-on-Don",
  "Калининград": "Kaliningrad",
  "Красноярск": "Krasnoyarsk",
  "Пресненский район": "Presnensky District",
  "Василеостровский район": "Vasileostrovsky District",
  "Советский район": "Sovetsky District",
  "Академический район": "Akademichesky District",
  "Октябрьский район": "Oktyabrsky District",
  "Прикубанский округ": "Prikubansky District",
  "Хостинский район": "Khostinsky District",
  "Калининский округ": "Kalininsky District",
  "Нижегородский район": "Nizhegorodsky District",
  "Кировский район": "Kirovsky District",
  "Первомайский район": "Pervomaysky District",
  "Пролетарский район": "Proletarsky District",
  "Ленинградский район": "Leningradsky District",
  "Центральный район": "Central District"
};

export function translatePlace(value: string, locale: Locale) {
  return locale === "en" ? placeTranslations[value] ?? value : value;
}

const genericTranslations: Record<string, string> = {
  "Демонстрационное предложение": "Demonstration listing",
  "Премиум": "Premium",
  "Бизнес-класс": "Business class",
  "Комфорт-класс": "Comfort class",
  "премиум": "premium",
  "бизнес-класс": "business class",
  "комфорт-класс": "comfort class",
  "онлайн-бронирование": "online reservation",
  "рядом с центром": "near the city center",
  "набережная": "waterfront",
  "семейные планировки": "family floor plans",
  "новый район": "new district",
  "панорамные виды": "panoramic views",
  "озелененный двор": "landscaped courtyard",
  "морской климат": "coastal climate",
  "семейный район": "family district",
  "рядом с Волгой": "near the Volga",
  "видовые квартиры": "view apartments",
  "вид на город": "city views",
  "террасы": "terraces",
  "малоэтажная среда": "low-rise environment",
  "рядом с Енисеем": "near the Yenisei"
};

export function translateTag(value: string, locale: Locale) {
  if (locale === "ru") return value;
  if (placeTranslations[value]) return placeTranslations[value];
  if (genericTranslations[value]) return genericTranslations[value];
  if (/^застройщик:/i.test(value)) return `Developer: ${value.replace(/^застройщик:\s*/i, "")}`;
  return value;
}

const viewTranslations: Record<string, string> = {
  "Во двор": "Courtyard",
  "На город": "City",
  "На реку": "River",
  "На парк": "Park",
  "На набережную": "Waterfront",
  "На зеленый бульвар": "Green boulevard"
};

export function translateView(value: string, locale: Locale) {
  return locale === "en" ? viewTranslations[value] ?? value : value;
}

export function localizeApartment(apartment: Apartment, locale: Locale): Apartment {
  if (locale === "ru") return apartment;
  return {
    ...apartment,
    title: translateApartmentTitle(apartment.title, locale),
    city: translatePlace(apartment.city, locale),
    project: translateComplexName(apartment.project, locale),
    building: translateBuilding(apartment.building, locale),
    section: translateSection(apartment.section, locale),
    windowView: translateView(apartment.windowView, locale),
    rooms: apartment.rooms.map((room) => ({ ...room, name: roomNames[locale][room.type] }))
  };
}