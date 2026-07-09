# Фикс TypeScript после финальных планировок

Vercel дошёл до TypeScript и упал на проверке типов.

Что исправлено:

- из lib/apartment-plan-visuals.ts убраны старые неиспользуемые legacy-функции;
- параметр apartmentId в qualityLayout переименован в _apartmentId, чтобы TypeScript не ругался на неиспользуемый параметр;
- логика планировок не менялась;
- все квартиры всё ещё используют нормальные схемы;
- старые двери, мебель, перетаскивание и поворот сохранены.

Замени файл:

lib/apartment-plan-visuals.ts

Если хочешь перестраховаться, можешь заменить все файлы из архива, но обычно достаточно только lib/apartment-plan-visuals.ts.

Потом:

cmd /c npm run build
git add .
git commit -m "исправить TypeScript в планировках"
git push -u origin main
