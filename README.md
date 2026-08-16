# משפחת האפרתי

ארכיון משפחתי פרטי: עץ המשפחה, תמונות, מכתבים, סיפורים וציר זמן.

```bash
npm install
npm run db:setup
npm run dev
```

## כניסה

בכניסה כותבים שם וסיסמת משפחה. הסיסמה נקבעת ב־`.env` דרך `FAMILY_PASSWORD`
(ברירת המחדל `13`). השם נשמר על הסשן, וכל תמונה, סיפור או זיכרון שמוסיפים
נרשמים על שמו — כך רואים מי תרם מה. אם השם זהה לשם של בן משפחה בעץ, הסשן
מקושר אליו אוטומטית.

> אחרי שינוי ב־`.env` או ב־`prisma/schema.prisma` צריך להפעיל מחדש את
> `npm run dev` — שרת שרץ מזמן מחזיק ערכי סביבה ולקוח Prisma ישנים.

## גוגל תמונות

כדי לבחור תמונות מגוגל תמונות, הוסיפו ל־`.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://127.0.0.1:3000/api/google/callback
```

ב־Google Cloud צריך להפעיל את Photos Picker API ולהגדיר OAuth redirect.

## פרודקשן

האתר רץ ב־Vercel. המסד הוא Neon Postgres שמחובר לפרויקט (משתני `NEON_*`),
והקבצים נשמרים ב־Vercel Blob פרטי (`BLOB_READ_WRITE_TOKEN`). בלי הטוקן
הקבצים נשמרים מקומית ב־`uploads/`. סכימה חדשה נדחפת עם:

```bash
npx prisma db push
```

## מבנה

- `src/app` — הדפים והממשקי ה־API.
- `src/lib` — גישה למסד, גנאלוגיה, חיפוש, אימות.
- `src/proxy.ts` — כל האתר מאחורי הסיסמה, חוץ מדף הכניסה.
- `src/lib/storage.ts` — קבצים: Vercel Blob בפרודקשן, `uploads/` מקומית.
  בשני המקרים מוגשים רק דרך `/api/media/file/[key]` למחוברים.
