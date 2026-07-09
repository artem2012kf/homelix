# Исправить ошибку clamp

Ошибка:

Cannot find name 'clamp'

Что сделать:

Замени файл:

lib/apartment-plan-visuals.ts

Потом:

cmd /c npm run build
git add .
git commit -m "вернуть clamp в планировки"
git push -u origin main
