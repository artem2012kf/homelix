# Как применить исправление внешнего вида

1. Скопируйте файлы из архива в проект с заменой:

- `app/page.tsx`
- `app/layout.tsx`
- `components/MascotLogo.tsx`
- `public/favicon.svg`
- `public/images/mascot.png`
- `app/api/auth/register/route.ts`
- `app/map/page.tsx`
- `app/yandex-map/page.tsx`

2. Если в `app/layout.tsx` у вас есть строка:

```ts
import "./visual-fixes.css";
```

удалите её. В новом исправлении она не нужна.

3. Если в конец `app/globals.css` уже был вставлен старый большой блок с `.district-preview`, можно оставить — новая страница больше не использует эти классы. Но лучше удалить старый блок, который начинался с:

```css
/* Маскот в шапке и карточке районов */
```

4. Проверьте сборку:

```powershell
cmd /c npm run build
```

5. Отправьте на GitHub:

```powershell
git add .
git commit -m "исправить внешний вид главной"
git push
```
