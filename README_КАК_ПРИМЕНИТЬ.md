# Фикс поворота мебели и цены

Что исправлено:

- убран черный кружок рядом с мебелью на планировке;
- поворот остался только под планировкой через кнопку "Повернуть";
- текст мебели больше не поворачивается вместе с диваном/кроватью;
- верхняя карточка стоимости теперь тоже считает мебель:
  квартира + мебель;
- под планировкой также остаётся разбивка:
  стоимость квартиры, стоимость мебели, итог.

Замени файлы:

components/ApartmentPlan.tsx
components/ApartmentExperience.tsx
components/ApartmentPriceBox.tsx
types/furniture-placement.ts
app/apartment/[id]/page.tsx

Потом открой:

app/globals.css

и вставь в самый конец содержимое:

ADD_TO_END_OF_app_globals.css

Проверь:

cmd /c npm run build

Потом:

git add .
git commit -m "исправить поворот мебели и стоимость"
git push -u origin main
