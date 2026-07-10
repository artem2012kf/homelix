import type { Apartment, RoomType } from "@/types/apartment";

export type Locale = "ru" | "en" | "zh";

export const localeNames: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  zh: "中文"
};

export function getLocaleFromPathname(pathname: string): Locale {
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/zh" || pathname.startsWith("/zh/")) return "zh";
  return "ru";
}

export function getHomeHref(locale: Locale, hash = "") {
  const base = locale === "ru" ? "/" : `/${locale}`;
  return `${base}${hash}`;
}

export function getIntlLocale(locale: Locale) {
  if (locale === "en") return "en-US";
  if (locale === "zh") return "zh-CN";
  return "ru-RU";
}

export const siteText = {
  ru: {
    brand: "ЖК Солнечный квартал",
    brandSubtitle: "Интерактивный выбор квартир",
    nav: {
      apartments: "Квартиры",
      complexes: "ЖК Тюмени",
      ai: "ИИ без комнат",
      furniture: "Магазин мебели",
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
      eyebrow: "Готовый сайт застройщика",
      title: "Интерактивный выбор квартиры с ИИ-консультантом и личным кабинетом",
      intro: "Клиент выбирает квартиру, открывает мини-план, смотрит комнаты, задает вопросы ИИ, сохраняет варианты в избранное и бронирует свободные квартиры через аккаунт.",
      apartmentsButton: "Смотреть квартиры",
      complexesButton: "ЖК Тюмени",
      statsLabel: "Ключевые показатели каталога",
      apartmentsInDatabase: "квартир в базе",
      availableNow: "свободны сейчас",
      startingPrice: "стартовая цена",
      from: "от",
      mascotAlt: "Маскот Homelix",
      mascotTitle: "ЖК Тюмени в одном каталоге",
      mascotBody: "Маскот помогает выбрать квартиру, сравнить жилые комплексы и задать вопрос ИИ-консультанту.",
      catalogEyebrow: "Каталог",
      catalogTitle: "Квартиры в продаже",
      catalogBody: "В карточках указано, в каком ЖК находится квартира: название комплекса, район, корпус, секция, этаж, площадь и цена.",
      complexesEyebrow: "ЖК Тюмени",
      complexesTitle: "Жилые комплексы, которые можно показывать в каталоге",
      complexesBody: "Список содержит район, рейтинг, количество отзывов, уровень цен и застройщика.",
      score: "Общий балл",
      reviews: "Оценок",
      workflowEyebrow: "Как работает",
      workflowTitle: "Полный сценарий выбора и бронирования квартиры",
      workflowBody: "От просмотра каталога до консультации с ИИ, регистрации, избранного и бронирования квартиры.",
      workflow: [
        ["Каталог", "Пользователь видит квартиры и сортирует их по цене, площади, этажу, комнатности и ипотечному платежу."],
        ["ЖК", "У каждой квартиры видно название жилого комплекса, район и основные характеристики объекта."],
        ["ИИ-помощник", "На странице квартиры консультант учитывает выбранную комнату и конкретную планировку."],
        ["Личный кабинет", "После регистрации клиент сохраняет избранное и бронирует свободные квартиры."]
      ],
      contactsEyebrow: "Контакты",
      contactsTitle: "Офис продаж в Тюмени",
      contactsBody: "Оставьте заявку на сайте, сохраните квартиру в личном кабинете или забронируйте свободный вариант для дальнейшего звонка менеджера.",
      phone: "Телефон",
      phoneHours: "Ежедневно с 9:00 до 21:00",
      address: "Адрес",
      city: "г. Тюмень",
      addressBody: "Шоурум, консультации и подбор квартиры",
      emailBody: "Заявки, документы и консультации"
    },
    catalog: {
      apartmentWord: "квартир",
      sorting: "Сортировка",
      sortControl: "Сортировать",
      quickSortAria: "Быстрая сортировка квартир",
      cheaper: "Дешевле",
      larger: "Больше площадь",
      higher: "Выше этаж",
      lowerMortgage: "Ниже ипотека",
      upTo: "до",
      floorUpTo: "этажа",
      byPayment: "по платежу",
      sortLabels: {
        recommended: "Свободные → бронь → проданные",
        "price-asc": "Цена: сначала дешевле",
        "price-desc": "Цена: сначала дороже",
        "area-asc": "Площадь: сначала меньше",
        "area-desc": "Площадь: сначала больше",
        "floor-asc": "Этаж: сначала ниже",
        "floor-desc": "Этаж: сначала выше",
        "rooms-asc": "Комнатность: сначала меньше",
        "rooms-desc": "Комнатность: сначала больше",
        "mortgage-asc": "Платеж по ипотеке: сначала ниже"
      }
    },
    card: {
      floor: "этаж",
      openPlanAria: "Открыть планировку",
      view: "Вид",
      area: "Площадь",
      price: "Цена",
      plan: "Смотреть планировку",
      favorite: "В избранное",
      inFavorites: "В избранном",
      reserve: "Забронировать",
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
      cancelled: "Бронь отменена. Статус квартиры обновлен.",
      cancelError: "Не удалось отменить бронь.",
      occupied: "Эта квартира уже находится в брони.",
      alreadySold: "Эта квартира уже продана.",
      reserving: "Создаем бронь...",
      reserved: "Квартира забронирована. Статус изменен на «Бронь».",
      reserveError: "Не удалось забронировать квартиру."
    }
  },
  en: {
    brand: "Sunny Quarter",
    brandSubtitle: "Interactive apartment selection",
    nav: {
      apartments: "Apartments",
      complexes: "Residential complexes",
      ai: "AI assistant",
      furniture: "Furniture store",
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
      eyebrow: "A ready-to-use developer website",
      title: "Interactive apartment selection with an AI assistant and personal account",
      intro: "Customers compare apartments, open an interactive floor plan, explore rooms, ask the AI assistant questions, save favorites and reserve available units.",
      apartmentsButton: "View apartments",
      complexesButton: "Tyumen complexes",
      statsLabel: "Catalog highlights",
      apartmentsInDatabase: "apartments in the catalog",
      availableNow: "available now",
      startingPrice: "starting price",
      from: "from",
      mascotAlt: "Homelix mascot",
      mascotTitle: "Tyumen residential complexes in one catalog",
      mascotBody: "The mascot helps customers choose an apartment, compare residential complexes and talk to the AI assistant.",
      catalogEyebrow: "Catalog",
      catalogTitle: "Apartments for sale",
      catalogBody: "Each card shows the residential complex, district, building, section, floor, area and price.",
      complexesEyebrow: "Tyumen residential complexes",
      complexesTitle: "Residential complexes available in the catalog",
      complexesBody: "The list includes district, rating, review count, price level and developer.",
      score: "Overall score",
      reviews: "Reviews",
      workflowEyebrow: "How it works",
      workflowTitle: "A complete apartment selection and reservation journey",
      workflowBody: "From browsing the catalog and consulting the AI assistant to registration, favorites and reservation.",
      workflow: [
        ["Catalog", "Customers sort apartments by price, area, floor, number of rooms and estimated mortgage payment."],
        ["Residential complex", "Each apartment shows its complex, district and key property details."],
        ["AI assistant", "On the apartment page, the assistant uses the selected room and floor-plan context."],
        ["Personal account", "Registered customers save favorites and reserve available apartments."]
      ],
      contactsEyebrow: "Contacts",
      contactsTitle: "Sales office in Tyumen",
      contactsBody: "Submit a request, save an apartment to your account or reserve an available unit for a follow-up call from a manager.",
      phone: "Phone",
      phoneHours: "Daily, 9:00 AM–9:00 PM",
      address: "Address",
      city: "Tyumen, Russia",
      addressBody: "Showroom, consultations and apartment selection",
      emailBody: "Requests, documents and consultations"
    },
    catalog: {
      apartmentWord: "apartments",
      sorting: "Sorting",
      sortControl: "Sort by",
      quickSortAria: "Quick apartment sorting",
      cheaper: "Lowest price",
      larger: "Largest area",
      higher: "Highest floor",
      lowerMortgage: "Lowest mortgage",
      upTo: "up to",
      floorUpTo: "floor",
      byPayment: "by payment",
      sortLabels: {
        recommended: "Available → reserved → sold",
        "price-asc": "Price: low to high",
        "price-desc": "Price: high to low",
        "area-asc": "Area: small to large",
        "area-desc": "Area: large to small",
        "floor-asc": "Floor: low to high",
        "floor-desc": "Floor: high to low",
        "rooms-asc": "Rooms: few to many",
        "rooms-desc": "Rooms: many to few",
        "mortgage-asc": "Mortgage payment: low to high"
      }
    },
    card: {
      floor: "floor",
      openPlanAria: "Open floor plan",
      view: "View",
      area: "Area",
      price: "Price",
      plan: "View floor plan",
      favorite: "Add to favorites",
      inFavorites: "In favorites",
      reserve: "Reserve",
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
      cancelled: "Reservation cancelled. The apartment status has been updated.",
      cancelError: "Could not cancel the reservation.",
      occupied: "This apartment is already reserved.",
      alreadySold: "This apartment has already been sold.",
      reserving: "Creating reservation...",
      reserved: "Apartment reserved successfully.",
      reserveError: "Could not reserve the apartment."
    }
  },
  zh: {
    brand: "阳光街区",
    brandSubtitle: "交互式选房平台",
    nav: {
      apartments: "房源",
      complexes: "住宅区",
      ai: "AI顾问",
      furniture: "家具商城",
      contacts: "联系我们"
    },
    auth: {
      account: "个人中心",
      login: "登录",
      logout: "退出",
      favorites: "收藏",
      reservations: "预订"
    },
    home: {
      eyebrow: "面向开发商的完整网站",
      title: "通过AI顾问与个人中心进行交互式选房",
      intro: "客户可以比较房源、查看交互式户型图、了解各个房间、向AI顾问提问、收藏房源并预订可售住宅。",
      apartmentsButton: "查看房源",
      complexesButton: "秋明住宅区",
      statsLabel: "房源目录关键数据",
      apartmentsInDatabase: "套房源",
      availableNow: "套当前可售",
      startingPrice: "起售价",
      from: "起",
      mascotAlt: "Homelix吉祥物",
      mascotTitle: "秋明住宅区一站式目录",
      mascotBody: "吉祥物帮助客户选择房源、比较住宅区并向AI顾问提问。",
      catalogEyebrow: "房源目录",
      catalogTitle: "在售房源",
      catalogBody: "每张房源卡片都显示住宅区、区域、楼栋、单元、楼层、面积和价格。",
      complexesEyebrow: "秋明住宅区",
      complexesTitle: "目录中的住宅区",
      complexesBody: "列表包含区域、评分、评价数量、价格水平和开发商。",
      score: "综合评分",
      reviews: "评价数",
      workflowEyebrow: "使用流程",
      workflowTitle: "从选房到预订的完整流程",
      workflowBody: "从浏览目录、咨询AI顾问，到注册、收藏和预订房源。",
      workflow: [
        ["房源目录", "客户可按价格、面积、楼层、房间数量和预计按揭月供进行排序。"],
        ["住宅区", "每套房源都显示所在住宅区、区域及主要参数。"],
        ["AI顾问", "在房源页面中，AI顾问会结合所选房间和具体户型回答问题。"],
        ["个人中心", "注册后，客户可以收藏并预订可售房源。"]
      ],
      contactsEyebrow: "联系我们",
      contactsTitle: "秋明销售中心",
      contactsBody: "您可以提交咨询、将房源加入收藏，或预订可售住宅，等待销售经理进一步联系。",
      phone: "电话",
      phoneHours: "每日 9:00–21:00",
      address: "地址",
      city: "俄罗斯秋明市",
      addressBody: "展厅、咨询与选房服务",
      emailBody: "咨询、文件与客户服务"
    },
    catalog: {
      apartmentWord: "套房源",
      sorting: "排序",
      sortControl: "排序方式",
      quickSortAria: "快速房源排序",
      cheaper: "价格最低",
      larger: "面积最大",
      higher: "楼层最高",
      lowerMortgage: "月供最低",
      upTo: "最高",
      floorUpTo: "层",
      byPayment: "按月供",
      sortLabels: {
        recommended: "可售 → 已预订 → 已售",
        "price-asc": "价格：从低到高",
        "price-desc": "价格：从高到低",
        "area-asc": "面积：从小到大",
        "area-desc": "面积：从大到小",
        "floor-asc": "楼层：从低到高",
        "floor-desc": "楼层：从高到低",
        "rooms-asc": "房间数：从少到多",
        "rooms-desc": "房间数：从多到少",
        "mortgage-asc": "按揭月供：从低到高"
      }
    },
    card: {
      floor: "层",
      openPlanAria: "打开户型图",
      view: "景观",
      area: "面积",
      price: "价格",
      plan: "查看户型图",
      favorite: "加入收藏",
      inFavorites: "已收藏",
      reserve: "立即预订",
      cancelReservation: "取消预订",
      alreadyReserved: "已被预订",
      sold: "已售",
      yourReservation: "您的预订",
      authRequired: "请先登录或注册。",
      updatingFavorites: "正在更新收藏...",
      removedFavorite: "已取消收藏。",
      addedFavorite: "已加入收藏。",
      favoriteError: "无法更新收藏。",
      cancelling: "正在取消预订...",
      cancelled: "预订已取消，房源状态已更新。",
      cancelError: "无法取消预订。",
      occupied: "该房源已被预订。",
      alreadySold: "该房源已售出。",
      reserving: "正在创建预订...",
      reserved: "房源预订成功。",
      reserveError: "无法预订该房源。"
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
  },
  zh: {
    kitchen: "厨房客厅",
    living: "客厅",
    bedroom: "卧室",
    children: "儿童房",
    bathroom: "卫生间",
    hall: "玄关",
    balcony: "阳台",
    wardrobe: "衣帽间"
  }
};

export function translateApartmentTitle(title: string, locale: Locale) {
  if (locale === "ru") return title;

  const areaMatch = title.match(/([\d.,]+)\s*м²/i);
  const area = areaMatch?.[1]?.replace(",", ".") ?? "";
  const unit = locale === "zh" ? "㎡" : "m²";

  if (/студия/i.test(title)) return locale === "zh" ? `开间，${area} ${unit}` : `Studio, ${area} ${unit}`;

  const euroMatch = title.match(/евро-(\d+)/i);
  if (euroMatch) {
    return locale === "zh"
      ? `欧式${euroMatch[1]}居，${area} ${unit}`
      : `Euro ${euroMatch[1]}-room, ${area} ${unit}`;
  }

  const roomsMatch = title.match(/(\d+)-комнат/i);
  if (roomsMatch) {
    return locale === "zh"
      ? `${roomsMatch[1]}居室，${area} ${unit}`
      : `${roomsMatch[1]}-room apartment, ${area} ${unit}`;
  }

  return title;
}

export function translateBuilding(value: string, locale: Locale) {
  if (locale === "ru") return value;
  const number = value.match(/\d+/)?.[0] ?? value;
  return locale === "zh" ? `${number}号楼` : `Building ${number}`;
}

export function translateSection(value: string, locale: Locale) {
  if (locale === "ru") return value;
  const section = value.replace(/секция\s*/i, "").trim();
  return locale === "zh" ? `${section}单元` : `Section ${section}`;
}

export function translateComplexName(value: string, locale: Locale) {
  if (locale === "ru") return value;
  const name = value.replace(/^ЖК\s+/i, "");
  return locale === "zh" ? `${name}住宅区` : `${name} Residential Complex`;
}

const placeTranslations: Record<string, { en: string; zh: string }> = {
  "Восточный район": { en: "Eastern District", zh: "东区" },
  "Ленинский район": { en: "Leninsky District", zh: "列宁区" },
  "Калининский район": { en: "Kalininsky District", zh: "加里宁区" },
  "Центральный район": { en: "Central District", zh: "中心区" },
  "Тюмень": { en: "Tyumen", zh: "秋明" },
  "д. Дударева": { en: "Dudareva village", zh: "杜达列瓦村" },
  "мкр. Заречный": { en: "Zarechny neighborhood", zh: "扎列奇内小区" },
  "мкр. Тюменская Слобода": { en: "Tyumenskaya Sloboda neighborhood", zh: "秋明斯洛博达小区" },
  "р-н Дом Обороны": { en: "House of Defense district", zh: "国防之家片区" },
  "выезд по Московскому тракту": { en: "Moscow Highway access", zh: "莫斯科公路方向" },
  "выезд по Червишевскому тракту": { en: "Chervishevsky Highway access", zh: "切尔维舍沃公路方向" }
};

export function translatePlace(value: string, locale: Locale) {
  if (locale === "ru") return value;
  return placeTranslations[value]?.[locale] ?? value;
}

const genericTranslations: Record<string, { en: string; zh: string }> = {
  "Сданные дома": { en: "Completed", zh: "已交付" },
  "Данные уточняются": { en: "Details pending", zh: "信息待确认" },
  "Цены уточняются": { en: "Price pending", zh: "价格待确认" },
  "Цены средние по рынку": { en: "Market-average prices", zh: "市场平均价格" },
  "Цены ниже средних": { en: "Below-average prices", zh: "低于市场均价" },
  "Элитные / премиум, цены выше средних": { en: "Premium, above-average prices", zh: "高端住宅，价格高于平均水平" },
  "сданные дома": { en: "completed buildings", zh: "已交付楼盘" },
  "есть квартиры с отделкой / ремонтом": { en: "finished apartments available", zh: "提供精装房源" },
  "цены средние по рынку": { en: "market-average prices", zh: "市场平均价格" },
  "цены ниже средних": { en: "below-average prices", zh: "低于市场均价" },
  "элитные / премиум": { en: "premium", zh: "高端住宅" },
  "недалеко от центра города": { en: "close to the city center", zh: "靠近市中心" },
  "жилой комплекс": { en: "residential complex", zh: "住宅区" },
  "данные уточняются": { en: "details pending", zh: "信息待确认" }
};

export function translateTag(value: string, locale: Locale) {
  if (locale === "ru") return value;
  const place = placeTranslations[value]?.[locale];
  if (place) return place;
  if (genericTranslations[value]) return genericTranslations[value][locale];
  if (/^застройщик:/i.test(value)) {
    const developer = value.replace(/^застройщик:\s*/i, "");
    return locale === "zh" ? `开发商：${developer}` : `Developer: ${developer}`;
  }
  return value;
}

const viewTranslations: Record<string, { en: string; zh: string }> = {
  "Во двор и на парк": { en: "Courtyard and park", zh: "庭院与公园景观" },
  "На город и парк": { en: "City and park", zh: "城市与公园景观" },
  "Во двор": { en: "Courtyard", zh: "庭院景观" },
  "На город": { en: "City", zh: "城市景观" },
  "На реку": { en: "River", zh: "河景" },
  "На парк": { en: "Park", zh: "公园景观" }
};

export function translateView(value: string, locale: Locale) {
  if (locale === "ru") return value;
  return viewTranslations[value]?.[locale] ?? value;
}

export function localizeApartment(apartment: Apartment, locale: Locale): Apartment {
  if (locale === "ru") return apartment;
  return {
    ...apartment,
    title: translateApartmentTitle(apartment.title, locale),
    project: translateComplexName(apartment.project, locale),
    building: translateBuilding(apartment.building, locale),
    section: translateSection(apartment.section, locale),
    windowView: translateView(apartment.windowView, locale),
    rooms: apartment.rooms.map((room) => ({
      ...room,
      name: roomNames[locale][room.type]
    }))
  };
}
