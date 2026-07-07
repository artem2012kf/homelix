# Исправление главной и карточек квартир

Что изменено:

- В правом блоке главной больше нет карты/скрина. Там стоит маскот, статистика и короткое описание.
- Маскот берется из `public/images/mascot.png`.
- В каждой карточке квартиры добавлена строка `ЖК: ...`.
- Иконка сайта в браузере тоже указывает на маскота.
- Старый `visual-fixes.css` больше не нужен.

## Как применить

1. Скопируй файлы из архива в проект с заменой:

- `app/page.tsx`
- `app/layout.tsx`
- `components/MascotLogo.tsx`
- `components/ApartmentCard.tsx`
- `public/images/mascot.png`

2. Удали из `app/layout.tsx`, если она осталась:

```ts
import "./visual-fixes.css";
```

3. Если ты раньше вставлял большой CSS-блок в конец `app/globals.css`, который начинается с `.district-preview`, `.clean-district-preview` или комментария про маскота/районы, удали этот старый блок. Новый вариант содержит стили прямо в `app/page.tsx`.

4. Проверь сборку:

```powershell
cmd /c npm run build
```

5. Отправь на GitHub:

```powershell
git add .
git commit -m "исправить маскота и ЖК в карточках"
git push
```

6. На Vercel нажми Redeploy.
