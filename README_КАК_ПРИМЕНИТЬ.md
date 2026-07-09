# Исправление конфликта в ApartmentPlan.tsx

Ошибка была из-за строк конфликта Git:

<<<<<<< HEAD
=======
>>>>>>>

Нужно заменить файл целиком:

components/ApartmentPlan.tsx

Также лучше заменить:

types/furniture-placement.ts

Потом открыть app/globals.css и вставить в самый конец содержимое:

ADD_TO_END_OF_app_globals.css

После замены:

cmd /c npm run build

Если сборка прошла:

git add .
git commit -m "исправить конфликт дверей"
git push -u origin main
