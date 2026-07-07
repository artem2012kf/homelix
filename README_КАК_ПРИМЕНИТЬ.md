# Что заменить в проекте Homelix

1. Скопируй файлы из этого архива в проект с заменой:
   - `app/page.tsx`
   - `app/layout.tsx`
   - `app/api/auth/register/route.ts`
   - `app/map/page.tsx`
   - `app/yandex-map/page.tsx`
   - `components/MascotLogo.tsx`
   - `public/images/mascot.png`

2. Открой `app/globals.css` и в самый конец вставь содержимое файла:
   - `ADD_TO_END_OF_app_globals.css`

3. Для ИИ открой:
   - `app/api/ai/route.ts`
   - `app/api/chat/route.ts`

   И сделай замену из файла:
   - `AI_REPLACE_IN_app_api_ai_and_chat_route.md`

4. Проверь сборку:

```powershell
cmd /c npm run build
```

5. Отправь на GitHub:

```powershell
git add .
git commit -m "исправления перед предзащитой"
git push
```
