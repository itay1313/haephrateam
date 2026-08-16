# משפחת האפרתי

ארכיון משפחתי פרטי.

```bash
npm install
npm run db:setup
npm run dev
```

הכניסה: הסיסמה `13`

כדי לבחור תמונות מגוגל תמונות, הוסיפו ל־`.env`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://127.0.0.1:3000/api/google/callback
```

ב־Google Cloud צריך להפעיל את Photos Picker API ולהגדיר OAuth redirect.
