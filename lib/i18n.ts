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
    brand: "Homelix Россия",
    brandSubtitle: "Квартиры в новостройках по стране",
    nav: {
      apartments: "Квартиры",
      complexes: "Города и ЖК",
      ai: "ИИ-консультант",
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
      eyebrow: "Федеральный каталог новостроек",
      title: "Выбор и бронирование квартир по всей России",
      intro: "Сравнивайте квартиры в крупных городах, изучайте интерактивные планировки, задавайте вопросы ИИ-консультанту и отправляйте заявку на бронирование онлайн.",
      apartmentsButton: "Смотреть квартиры",
      complexesButton: "Выбрать город",
      statsLabel: "Ключевые показатели каталога",
      apartmentsInDatabase: "квартир в каталоге",
      availableNow: "свободны сейчас",
      startingPrice: "минимальная цена",
      from: "от",
      mascotAlt: "Маскот Homelix",
      mascotTitle: "Новостройки России в одном каталоге",
      mascotBody: "Квартиры из Москвы, Санкт-Петербурга, Казани, Сочи, Екатеринбурга и других городов с единым сценарием выбора и бронирования.",
      catalogEyebrow: "Федеральный каталог",
      catalogTitle: "Квартиры в новостройках России",
      catalogBody: "30 демонстрационных предложений из 15 городов. Наличие, стоимость и условия покупки необходимо подтвердить у менеджера.",
      complexesEyebrow: "городов и жилых комплексов",
      complexesTitle: "Проекты в разных регионах страны",
      complexesBody: "Выберите город, сравните класс проекта, район, планировки и стоимость квартир.",
      score: "Рейтинг",
      reviews: "Отзывов",
      workflowEyebrow: "Как работает",
      workflowTitle: "Единый путь от выбора города до бронирования",
      workflowBody: "Фильтр по городу, сравнение квартир, интерактивный план, консультация, избранное и заявка на бронь.",
      workflow: [
        ["Город", "Пользователь выбирает регион и видит предложения только в нужном городе."],
        ["Квартира", "Каталог сортируется по цене, площади, этажу, комнатности и ипотечному платежу."],
        ["Планировка", "Комнаты отображаются на интерактивном плане, а мебель можно примерить прямо в квартире."],
        ["Бронирование", "После регистрации пользователь сохраняет варианты и отправляет заявку менеджеру."]
      ],
      contactsEyebrow: "Федеральный отдел продаж",
      contactsTitle: "Консультации по квартирам в разных городах",
      contactsBody: "Оставьте заявку, укажите интересующий город и квартиру — менеджер подтвердит актуальность предложения и условия покупки.",
      phone: "Телефон",
      phoneHours: "Ежедневно с 9:00 до 21:00 по Москве",
      address: "Формат работы",
      city: "Онлайн по всей России",
      addressBody: "Консультации, подбор и передача заявки региональному менеджеру",
      emailBody: "Заявки, документы и консультации"
    },
    catalog: {
      apartmentWord: "квартир",
      sorting: "Сортировка",
      sortControl: "Сортировать",
      cityFilter: "Город",
      allCities: "Все города",
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
      reserved: "Заявка на бронирование отправлена.",
      reserveError: "Не удалось забронировать квартиру."
    }
  },
  en: {
    brand: "Homelix Russia",
    brandSubtitle: "New-build apartments across the country",
    nav: {
      apartments: "Apartments",
      complexes: "Cities & projects",
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
      eyebrow: "Nationwide new-build catalog",
      title: "Choose and reserve apartments across Russia",
      intro: "Compare homes in major cities, explore interactive floor plans, ask the AI assistant questions and submit a reservation request online.",
      apartmentsButton: "View apartments",
      complexesButton: "Choose a city",
      statsLabel: "Catalog highlights",
      apartmentsInDatabase: "apartments in the catalog",
      availableNow: "available now",
      startingPrice: "lowest price",
      from: "from",
      mascotAlt: "Homelix mascot",
      mascotTitle: "Russian new builds in one catalog",
      mascotBody: "Apartments in Moscow, Saint Petersburg, Kazan, Sochi, Yekaterinburg and other cities with one selection and reservation flow.",
      catalogEyebrow: "Nationwide catalog",
      catalogTitle: "New-build apartments across Russia",
      catalogBody: "30 demonstration listings in 15 cities. Availability, price and purchase terms must be confirmed by a manager.",
      complexesEyebrow: "cities and residential projects",
      complexesTitle: "Projects in different Russian regions",
      complexesBody: "Choose a city and compare project class, district, floor plans and prices.",
      score: "Rating",
      reviews: "Reviews",
      workflowEyebrow: "How it works",
      workflowTitle: "One journey from city selection to reservation",
      workflowBody: "City filtering, apartment comparison, interactive plans, consultation, favorites and reservation request.",
      workflow: [
        ["City", "Choose a region and display listings only in the required city."],
        ["Apartment", "Sort by price, area, floor, number of rooms and estimated mortgage payment."],
        ["Floor plan", "Explore rooms on an interactive plan and preview furniture placement."],
        ["Reservation", "Save favorites and submit a request to a regional sales manager."]
      ],
      contactsEyebrow: "Nationwide sales desk",
      contactsTitle: "Apartment consultations across Russia",
      contactsBody: "Send a request with your preferred city and apartment. A manager will confirm availability and purchase terms.",
      phone: "Phone",
      phoneHours: "Daily, 9:00 AM–9:00 PM Moscow time",
      address: "Service area",
      city: "Online across Russia",
      addressBody: "Consultation, selection and referral to a regional manager",
      emailBody: "Requests, documents and consultations"
    },
    catalog: {
      apartmentWord: "apartments",
      sorting: "Sorting",
      sortControl: "Sort by",
      cityFilter: "City",
      allCities: "All cities",
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
      cancelled: "Reservation cancelled.",
      cancelError: "Could not cancel the reservation.",
      occupied: "This apartment is already reserved.",
      alreadySold: "This apartment has already been sold.",
      reserving: "Creating reservation...",
      reserved: "Reservation request submitted.",
      reserveError: "Could not reserve the apartment."
    }
  },
  zh: {
    brand: "Homelix俄罗斯",
    brandSubtitle: "俄罗斯全国新房平台",
    nav: {
      apartments: "房源",
      complexes: "城市与楼盘",
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
      eyebrow: "俄罗斯全国新房目录",
      title: "在俄罗斯各城市选择并预订新房",
      intro: "比较主要城市的房源，查看交互式户型图，向AI顾问提问，并在线提交预订申请。",
      apartmentsButton: "查看房源",
      complexesButton: "选择城市",
      statsLabel: "房源目录关键数据",
      apartmentsInDatabase: "套房源",
      availableNow: "套当前可售",
      startingPrice: "最低价格",
      from: "起",
      mascotAlt: "Homelix吉祥物",
      mascotTitle: "俄罗斯新房一站式目录",
      mascotBody: "覆盖莫斯科、圣彼得堡、喀山、索契、叶卡捷琳堡等城市，统一完成选房和预订。",
      catalogEyebrow: "全国房源目录",
      catalogTitle: "俄罗斯各城市的新房",
      catalogBody: "15个城市共30套演示房源。实际库存、价格和购买条件需由销售经理确认。",
      complexesEyebrow: "个城市与住宅项目",
      complexesTitle: "俄罗斯不同地区的住宅项目",
      complexesBody: "选择城市并比较项目等级、区域、户型和价格。",
      score: "评分",
      reviews: "评价数",
      workflowEyebrow: "使用流程",
      workflowTitle: "从选择城市到提交预订的一体化流程",
      workflowBody: "城市筛选、房源比较、交互式户型、咨询、收藏和预订申请。",
      workflow: [
        ["城市", "选择地区，只查看目标城市的房源。"],
        ["房源", "按价格、面积、楼层、房间数和预计月供排序。"],
        ["户型", "查看交互式房间布局并预览家具摆放。"],
        ["预订", "收藏房源并向当地销售经理提交申请。"]
      ],
      contactsEyebrow: "全国销售服务",
      contactsTitle: "俄罗斯各城市房源咨询",
      contactsBody: "提交意向城市和房源，销售经理将确认库存、价格和购买条件。",
      phone: "电话",
      phoneHours: "每日 9:00–21:00（莫斯科时间）",
      address: "服务范围",
      city: "俄罗斯全国在线服务",
      addressBody: "咨询、选房并转接当地销售经理",
      emailBody: "咨询、文件与客户服务"
    },
    catalog: {
      apartmentWord: "套房源",
      sorting: "排序",
      sortControl: "排序方式",
      cityFilter: "城市",
      allCities: "全部城市",
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
      cancelled: "预订已取消。",
      cancelError: "无法取消预订。",
      occupied: "该房源已被预订。",
      alreadySold: "该房源已售出。",
      reserving: "正在创建预订...",
      reserved: "预订申请已提交。",
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
  const area = title.match(/([\d.,]+)\s*м²/i)?.[1]?.replace(",", ".") ?? "";
  const unit = locale === "zh" ? "㎡" : "m²";
  if (/студия/i.test(title)) return locale === "zh" ? `开间，${area} ${unit}` : `Studio, ${area} ${unit}`;
  const euro = title.match(/евро-(\d+)/i)?.[1];
  if (euro) return locale === "zh" ? `欧式${euro}居，${area} ${unit}` : `Euro ${euro}-room, ${area} ${unit}`;
  const rooms = title.match(/(\d+)-комнат/i)?.[1];
  if (rooms) return locale === "zh" ? `${rooms}居室，${area} ${unit}` : `${rooms}-room apartment, ${area} ${unit}`;
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
  "Москва": { en: "Moscow", zh: "莫斯科" },
  "Санкт-Петербург": { en: "Saint Petersburg", zh: "圣彼得堡" },
  "Казань": { en: "Kazan", zh: "喀山" },
  "Екатеринбург": { en: "Yekaterinburg", zh: "叶卡捷琳堡" },
  "Новосибирск": { en: "Novosibirsk", zh: "新西伯利亚" },
  "Краснодар": { en: "Krasnodar", zh: "克拉斯诺达尔" },
  "Сочи": { en: "Sochi", zh: "索契" },
  "Тюмень": { en: "Tyumen", zh: "秋明" },
  "Самара": { en: "Samara", zh: "萨马拉" },
  "Нижний Новгород": { en: "Nizhny Novgorod", zh: "下诺夫哥罗德" },
  "Уфа": { en: "Ufa", zh: "乌法" },
  "Владивосток": { en: "Vladivostok", zh: "符拉迪沃斯托克" },
  "Ростов-на-Дону": { en: "Rostov-on-Don", zh: "顿河畔罗斯托夫" },
  "Калининград": { en: "Kaliningrad", zh: "加里宁格勒" },
  "Красноярск": { en: "Krasnoyarsk", zh: "克拉斯诺亚尔斯克" },
  "Пресненский район": { en: "Presnensky District", zh: "普列斯尼亚区" },
  "Василеостровский район": { en: "Vasileostrovsky District", zh: "瓦西里岛区" },
  "Советский район": { en: "Sovetsky District", zh: "苏维埃区" },
  "Академический район": { en: "Akademichesky District", zh: "学术区" },
  "Октябрьский район": { en: "Oktyabrsky District", zh: "十月区" },
  "Прикубанский округ": { en: "Prikubansky District", zh: "普里库班区" },
  "Хостинский район": { en: "Khostinsky District", zh: "霍斯塔区" },
  "Калининский округ": { en: "Kalininsky District", zh: "加里宁区" },
  "Нижегородский район": { en: "Nizhegorodsky District", zh: "下诺夫哥罗德区" },
  "Кировский район": { en: "Kirovsky District", zh: "基洛夫区" },
  "Первомайский район": { en: "Pervomaysky District", zh: "五一区" },
  "Пролетарский район": { en: "Proletarsky District", zh: "无产阶级区" },
  "Ленинградский район": { en: "Leningradsky District", zh: "列宁格勒区" },
  "Центральный район": { en: "Central District", zh: "中心区" }
};

export function translatePlace(value: string, locale: Locale) {
  if (locale === "ru") return value;
  return placeTranslations[value]?.[locale] ?? value;
}

const genericTranslations: Record<string, { en: string; zh: string }> = {
  "Демонстрационное предложение": { en: "Demonstration listing", zh: "演示房源" },
  "Премиум": { en: "Premium", zh: "高端" },
  "Бизнес-класс": { en: "Business class", zh: "商务级" },
  "Комфорт-класс": { en: "Comfort class", zh: "舒适级" },
  "премиум": { en: "premium", zh: "高端" },
  "бизнес-класс": { en: "business class", zh: "商务级" },
  "комфорт-класс": { en: "comfort class", zh: "舒适级" },
  "онлайн-бронирование": { en: "online reservation", zh: "在线预订" },
  "рядом с центром": { en: "near the city center", zh: "靠近市中心" },
  "набережная": { en: "waterfront", zh: "滨水区" },
  "семейные планировки": { en: "family floor plans", zh: "家庭户型" },
  "новый район": { en: "new district", zh: "新城区" },
  "панорамные виды": { en: "panoramic views", zh: "全景视野" },
  "озелененный двор": { en: "landscaped courtyard", zh: "绿化庭院" },
  "морской климат": { en: "coastal climate", zh: "海滨气候" },
  "семейный район": { en: "family district", zh: "家庭社区" },
  "рядом с Волгой": { en: "near the Volga", zh: "靠近伏尔加河" },
  "видовые квартиры": { en: "view apartments", zh: "景观房" },
  "вид на город": { en: "city views", zh: "城市景观" },
  "террасы": { en: "terraces", zh: "露台" },
  "малоэтажная среда": { en: "low-rise environment", zh: "低层社区" },
  "рядом с Енисеем": { en: "near the Yenisei", zh: "靠近叶尼塞河" }
};

export function translateTag(value: string, locale: Locale) {
  if (locale === "ru") return value;
  const place = placeTranslations[value]?.[locale];
  if (place) return place;
  const generic = genericTranslations[value]?.[locale];
  if (generic) return generic;
  if (/^застройщик:/i.test(value)) {
    const developer = value.replace(/^застройщик:\s*/i, "");
    return locale === "zh" ? `开发商：${developer}` : `Developer: ${developer}`;
  }
  return value;
}

const viewTranslations: Record<string, { en: string; zh: string }> = {
  "Во двор": { en: "Courtyard", zh: "庭院景观" },
  "На город": { en: "City", zh: "城市景观" },
  "На реку": { en: "River", zh: "河景" },
  "На парк": { en: "Park", zh: "公园景观" },
  "На набережную": { en: "Waterfront", zh: "滨水景观" },
  "На зеленый бульвар": { en: "Green boulevard", zh: "绿色大道景观" }
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
    city: translatePlace(apartment.city, locale),
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