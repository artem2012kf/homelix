# Что исправлено

1. В правом блоке главной страницы теперь стоит только маскот.
   Никаких скринов, карт, районов или старых картинок там нет.

2. В шапку возвращено название:
   ЖК Солнечный квартал

3. В каждой карточке квартиры добавлена строка:
   ЖК: Солнечный квартал

4. В описании каждой квартиры также указано:
   ЖК, корпус, секция, вид из окна.

5. public/images/mascot.png теперь НЕ скриншот страницы, а чистый маскот, нарисованный заново.

# Как применить

Скопируй эти файлы в проект с заменой:

app/page.tsx
app/layout.tsx
app/map/page.tsx
app/yandex-map/page.tsx
components/Header.tsx
components/MascotLogo.tsx
components/ApartmentCard.tsx
public/images/mascot.png
public/favicon.svg

Потом открой app/globals.css и в самый конец вставь содержимое файла:

ADD_TO_END_OF_app_globals.css

Важно: если у тебя есть файл app/visual-fixes.css, его лучше удалить.
Также проверь app/layout.tsx — там НЕ должно быть строки:

import "./visual-fixes.css";

# Проверка

В терминале VS Code:

cmd /c npm run build

Если ошибок нет:

git add .
git commit -m "поставить маскота и добавить ЖК в квартиры"
git push

Потом на Vercel нажми Redeploy, лучше без кэша.
