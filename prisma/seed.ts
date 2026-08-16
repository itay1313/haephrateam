import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function d(year: number, month = 1, day = 1) {
  return new Date(Date.UTC(year, month - 1, day));
}

async function main() {
  await prisma.comment.deleteMany();
  await prisma.memoryMedia.deleteMany();
  await prisma.personMemory.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.storyTag.deleteMany();
  await prisma.storyMedia.deleteMany();
  await prisma.personStory.deleteMany();
  await prisma.story.deleteMany();
  await prisma.personEvent.deleteMany();
  await prisma.event.deleteMany();
  await prisma.mediaTag.deleteMany();
  await prisma.personMedia.deleteMany();
  await prisma.person.updateMany({ data: { portraitId: null } });
  await prisma.media.deleteMany();
  await prisma.album.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.location.deleteMany();
  await prisma.parentChild.deleteMany();
  await prisma.partnership.deleteMany();
  await prisma.personFamily.deleteMany();
  await prisma.session.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.person.deleteMany();
  await prisma.family.deleteMany();

  const haephrati = await prisma.family.create({
    data: {
      slug: "haephrati",
      name: "משפחת האפרתי",
      surname: "האפרתי",
      description: "ענף האפרתי — מיוסף ורותי, דרך עפר, אל איתי, יוסי ואיילת.",
    },
  });

  const berg = await prisma.family.create({
    data: {
      slug: "berg",
      name: "משפחת ברג",
      surname: "ברג",
      description: "ענף ברג — יעקב ועשירה, בתם טלילה, וילדיה.",
    },
  });

  const shaudinishky = await prisma.family.create({
    data: {
      slug: "shaudinishky",
      name: "משפחת שאודינישקי",
      surname: "שאודינישקי",
      description: "ענף שאודינישקי — ליאו ואווה, הוריה של רותי.",
    },
  });

  const tzuberi = await prisma.family.create({
    data: {
      slug: "tzuberi",
      name: "משפחת צוברי",
      surname: "צוברי",
      description: "ענף צוברי — בתיה ויוסף, הוריה של עשירה ברג.",
    },
  });

  const media = async (
    key: string,
    data: {
      title: string;
      caption?: string;
      narrative?: string;
      year?: number;
      isHistorical?: boolean;
      albumId?: string;
      type?: string;
    },
  ) =>
    prisma.media.create({
      data: {
        type: data.type ?? "PHOTO",
        title: data.title,
        filename: key.split("/").pop()!,
        mimeType: "image/jpeg",
        storageKey: key,
        year: data.year,
        caption: data.caption,
        narrative: data.narrative,
        isHistorical: data.isHistorical ?? false,
        albumId: data.albumId,
      },
    });

  const albumOld = await prisma.album.create({
    data: {
      slug: "old-photographs",
      title: "תמונות ישנות",
      category: "תמונות ישנות",
      description: "התמונות שנשמרו במגירות, באלבומים ובמעטפות.",
      coverKey: "family/archive-1964.jpg",
      year: 1964,
    },
  });
  const albumToday = await prisma.album.create({
    data: {
      slug: "family-today",
      title: "המשפחה היום",
      category: "המשפחה היום",
      description: "הרגעים שנאספים עכשיו, לדורות הבאים.",
      coverKey: "family/family-today.jpg",
      year: 2026,
    },
  });
  const albumWeddings = await prisma.album.create({
    data: {
      slug: "weddings",
      title: "חתונות",
      category: "חתונות",
      coverKey: "family/wedding-still.jpg",
    },
  });
  const albumChildhood = await prisma.album.create({
    data: {
      slug: "childhood",
      title: "ילדות",
      category: "ילדות",
      coverKey: "family/childhood-light.jpg",
    },
  });
  const albumArmy = await prisma.album.create({
    data: {
      slug: "army",
      title: "צבא",
      category: "צבא",
      coverKey: "family/army-memory.jpg",
    },
  });
  const albumTrips = await prisma.album.create({
    data: {
      slug: "trips",
      title: "טיולים",
      category: "טיולים",
      coverKey: "family/trip-coast.jpg",
    },
  });
  const albumHolidays = await prisma.album.create({
    data: {
      slug: "holidays",
      title: "חגים",
      category: "חגים",
      coverKey: "family/holiday-table.jpg",
    },
  });
  const albumBirthdays = await prisma.album.create({
    data: {
      slug: "birthdays",
      title: "ימי הולדת",
      category: "ימי הולדת",
      coverKey: "family/birthday-cake.jpg",
    },
  });
  const albumGens = await prisma.album.create({
    data: {
      slug: "generations-together",
      title: "כמה דורות יחד",
      category: "כמה דורות יחד",
      coverKey: "family/generations-chairs.jpg",
    },
  });

  const photos = {
    hero: await media("family/hero-table.jpg", {
      title: "שולחן השבת",
      caption: "השולחן מחכה למשפחה.",
      year: 2024,
      albumId: albumHolidays.id,
    }),
    old: await media("family/archive-1964.jpg", {
      title: "חצר, 1964",
      caption: "עפר עם הוריו, רותי ויוסף.",
      narrative:
        "התמונה הזאת נשמרה באלבום חום על מדף הסלון. האור של אחר הצהריים, העץ, והשקט של חצר שהמשפחה עוד תזכור שנים אחר כך.",
      year: 1964,
      isHistorical: true,
      albumId: albumOld.id,
    }),
    album: await media("family/archive-album.jpg", {
      title: "האלבום המשפחתי",
      caption: "דפים שהצהיבו, ותמונות שעוד מחכות לשמות.",
      year: 1972,
      isHistorical: true,
      albumId: albumOld.id,
    }),
    today: await media("family/family-today.jpg", {
      title: "שעת זהב",
      caption: "המשפחה היום, מדור לדור.",
      year: 2025,
      albumId: albumToday.id,
    }),
    hills: await media("family/hills-memory.jpg", {
      title: "הגבעות שמאחורי הבית",
      year: 1981,
      isHistorical: true,
      albumId: albumOld.id,
    }),
    wedding: await media("family/wedding-still.jpg", {
      title: "טבעת ופרח",
      caption: "עפר וטלילה.",
      year: 1978,
      isHistorical: true,
      albumId: albumWeddings.id,
    }),
    childhood: await media("family/childhood-light.jpg", {
      title: "חדר ילדות",
      year: 1986,
      albumId: albumChildhood.id,
    }),
    gens: await media("family/generations-chairs.jpg", {
      title: "ארבעה כסאות",
      caption: "מקום לכולם.",
      year: 2023,
      albumId: albumGens.id,
    }),
    linen: await media("family/portrait-linen.jpg", {
      title: "אור בחלון",
      year: 1958,
      isHistorical: true,
      albumId: albumOld.id,
    }),
    pearls: await media("family/portrait-pearls.jpg", {
      title: "על השידה",
      year: 1961,
      isHistorical: true,
      albumId: albumOld.id,
    }),
    army: await media("family/army-memory.jpg", {
      title: "התיק הירוק",
      year: 1970,
      albumId: albumArmy.id,
    }),
    holiday: await media("family/holiday-table.jpg", {
      title: "ראש השנה בבית",
      year: 1995,
      albumId: albumHolidays.id,
    }),
    coast: await media("family/trip-coast.jpg", {
      title: "הכביש לים",
      year: 1988,
      albumId: albumTrips.id,
    }),
    cake: await media("family/birthday-cake.jpg", {
      title: "עוגת יום הולדת",
      year: 1992,
      albumId: albumBirthdays.id,
    }),
    wall: await media("family/photo-wall.jpg", {
      title: "קיר התמונות",
      year: 2018,
      albumId: albumToday.id,
    }),
  };

  const leo = await prisma.person.create({
    data: {
      id: "person_leo",
      slug: "leo-shaudinishky",
      firstName: "ליאו",
      lastName: "שאודינישקי",
      gender: "MALE",
      birthDate: d(1905),
      birthPlace: "אייטקונן, גרמניה",
      occupation: "מוזיקאי, ממציא, נגן סקסופון",
      biography: `פרופ' ליאו שאודינישקי נולד בשנת 1905 בגרמניה, בעיירה אייטקונן — היום צ'רנישבסקויה. הוא התפרסם כמי שהמציא את הסטריאו, היה מוזיקאי ונגן סקסופון, והופיע והקליט.

הוא נשא לאישה את אווה, גרמנייה נוצרייה שהתגיירה לפני החתונה. אביו היה מקס אהרון, משורר שכתב שירים בעברית.

לאחר עליית הנאצים לשלטון התנכלו לו בשל היותו יהודי. כשנולדה בתם הבכורה רותי, בריונים שברו את חנותו להשכרת מכשירי הסרטה והקלטה. בשנת 1933 ברח באופניים ללקנינברג, משם באופנוע לברלין, ואחר כך באונייה לפלשתינה — יחד עם אחותו רוזה מרים, שכונתה תותה. הוא עבר לחיפה, והיא לתל אביב.

בחיפה פיתח מכשירי הגברה לבריטים: בבוקר עבד בחנות לכלי נגינה, בצהריים השכיר מכשירי הגברה, ובערב נדד עם הציוד לקונצרטים. מאוחר יותר עברה המשפחה למושב בית הלוי.

הדברים האלה סופרו על ידי בתו, רותי האפרתי, ונרשמו באתר שכתב נכדו מיכאל האפרתי.`,
      portraitId: photos.linen.id,
    },
  });
  const eva = await prisma.person.create({
    data: {
      id: "person_eva",
      slug: "eva-shaudinishky",
      firstName: "אווה",
      lastName: "שאודינישקי",
      gender: "FEMALE",
      birthPlace: "גרמניה",
      biography: `אווה שאודינישקי, ילידת גרמניה, הייתה נוצרייה שהתגיירה לפני נישואיה לליאו שאודינישקי. היא אמה של רותי.

כשנולדה רותי נשארו אווה והתינוקת באייטקונן, בבית סבה מקס אהרון, בעוד ליאו בורח לארץ ישראל. אשרת הכניסה לפלשתינה התעכבה — גם אחרי שהתגיירה. לבסוף קיבלה אשרה, ליאו חזר לגרמניה לקחת אותן, והן עלו על האונייה מרתה וושינגטון והגיעו לחיפה.

קציני האס אס המקומיים הכירו אותה מילדות וכיבדו אותה. הסיפור על בריחת המשפחה נמסר מפיה של רותי.`,
      portraitId: photos.pearls.id,
    },
  });
  const yosefTzuberi = await prisma.person.create({
    data: {
      id: "person_yosef_tzuberi",
      slug: "yosef-tzuberi",
      firstName: "יוסף",
      lastName: "צוברי",
      gender: "MALE",
      biography: `יוסף צוברי, אביה של עשירה ברג. יחד עם בתיה הוא שורש ענף צוברי במשפחה — הצד שממנו באה עשירה אל בית ברג, ומשם אל טלילה ואל ילדיה.`,
    },
  });
  const batya = await prisma.person.create({
    data: {
      id: "person_batya",
      slug: "batya-tzuberi",
      firstName: "בתיה",
      lastName: "צוברי",
      gender: "FEMALE",
      biography: `בתיה צוברי, אמה של עשירה ברג. יחד עם יוסף צוברי היא הורה של עשירה, סבתה של טלילה, ודור קדום בענף שמגיע עד איתי, יוסי ואיילת.`,
    },
  });
  const ruti = await prisma.person.create({
    data: {
      id: "person_ruti",
      slug: "ruti-haephrati",
      firstName: "רותי",
      lastName: "האפרתי",
      maidenName: "שאודינישקי",
      gender: "FEMALE",
      birthPlace: "אייטקונן, גרמניה",
      occupation: "פסיכולוגית",
      biography: `רותי האפרתי, לבית שאודינישקי, בתם של ליאו ואווה. נולדה באייטקונן שבגרמניה, ועוד בהיותה תינוקת עלתה עם אמה לארץ ישראל באונייה מרתה וושינגטון, לחיפה.

היא נישאה ליוסף האפרתי בקיבוץ משאבי שדה. הייתה פסיכולוגית במקצועה. ילדיהם: עפר, מיכאל (1964), שפרה (1968) וגיא (1971).

רותי שמרה את סיפור הבריחה מגרמניה ומסרה אותו הלאה. אחרי לכתה הוקם אתר לזכרה — אמא רותי, סבתא רותי — ובו גם טקס פיזור האפר בעין מור.`,
      portraitId: photos.pearls.id,
    },
  });
  const yosef = await prisma.person.create({
    data: {
      id: "person_yosef",
      slug: "yosef-haephrati",
      firstName: "יוסף",
      lastName: "האפרתי",
      maidenName: "גורפינקל",
      gender: "MALE",
      birthDate: d(1931, 3, 15),
      deathDate: d(1974, 4, 17),
      birthPlace: "תל אביב",
      deathPlace: "תל ענתר, רמת הגולן",
      occupation: "חוקר ספרות עברית, פרופסור",
      biography: `יוסף האפרתי (גורפינקל) נולד ב־15 במרץ 1931 בתל אביב, בן שפרה ושמחה. גדל בגבעתיים, למד בבית הספר בורוכוב ואחר כך בתיכון חדש. במלחמת השחרור הפסיק את לימודיו, הצטרף להכשרת הנוער העובד — תחילה בטנטורה ואחר כך בגינוסר — וב־1949 עלה עם הגרעין להקמת קיבוץ משאבי שדה בנגב.

בקיבוץ עבד ברפת, התכונן לבגרות במכתבים, נשא את רות שאודינישקי, ונולד בנם הבכור עפר. ב־1960 עזב את הקיבוץ — צעד שהיה קשה לו — כדי ללמוד ספרות באוניברסיטה העברית בירושלים. בשנות השישים לימד ספרות בגימנסיה העברית רחביה.

במלחמת ששת הימים לחם בחטיבת ירושלים על הגנת העיר ועל כיבוש ארמון הנציב. בנובמבר 1967 הצטרף לחוג לספרות באוניברסיטת תל אביב, אף שטרם סיים תואר שני. נשלח לאוניברסיטת קליפורניה בלוס אנג׳לס, סיים דוקטורט, וחזר לעמוד בראש החוג לתורת הספרות ובראש מכון כ״ץ לחקר הספרות העברית. עבודת הדוקטורט יצאה לאור כ״האידיליה של טשרניחובסקי״ וזכתה בפרס לאה גולדברג. ספרו ״המראות והלשון״ נמסר להגהה יום לפני צאתו למילואים שבהם נחרצו חייו.

ב־17 באפריל 1974 נשלח להרצות לפני חיילים במוצב תל ענתר שבמובלעת הסורית. על סף פתח הבונקר נפגע ונהרג. הוא בן 43. נקבר בבית הקברות הצבאי בקריית שאול. הותיר אחריו את רותי וארבעה ילדים.`,
      portraitId: photos.linen.id,
    },
  });
  const yaakov = await prisma.person.create({
    data: {
      id: "person_yaakov",
      slug: "yaakov-berg",
      firstName: "יעקב",
      lastName: "ברג",
      gender: "MALE",
      occupation: "מורה לזמרה, אקורדיוניסט",
      birthPlace: "תל מונד",
      biography: `יעקב ברג היה מורה לזמרה. בתל מונד זכרו אותו מתנהל בחצר בית הספר עם אקורדיון, ילקוט מלא בגליונות תווים, ועל כל גיליון שיר ארץ־ישראלי: שירי מולדת, פרחים וחי, שירים שקשרו את התלמידים לארץ.

הוא לימד לנגן בחלילית את כל ילדי הכיתה, פיתח שיטה משלו ללימוד תווים, והחזיק מקהלה שזכתה בפרסים ארציים. התלמידים שהתגלו ככישרוניים קיבלו במה במסיבות ובטקסים. תלמידים חלשים בלימודים הוזמנו לביתו — מניקיון ועד האכלה וציוד.

בבית ישב ליד הפסנתר והבית כולו היה עטוף במוזיקה. הוא הקליט שירים מהרדיו, ופעם השמיע לתלמידה את ״ירושלים של זהב״ כשהשיר עוד נשמע מעולם אחר.

יעקב ועשירה הופיעו בערבי שירה וברדיו. הוא רכב על וספה, עשירה מאחוריו, ובסירה האקורדיון — כך נסעו ברחבי הארץ. לקראת הפרישה לימד גם בבית הספר באבן יהודה.

הדברים האלה נכתבו לזכרו בידי יעל צור, מרץ 2006.`,
      portraitId: photos.hills.id,
    },
  });
  const ashira = await prisma.person.create({
    data: {
      id: "person_ashira",
      slug: "ashira-berg",
      firstName: "עשירה",
      lastName: "ברג",
      maidenName: "צוברי",
      gender: "FEMALE",
      occupation: "זמרת",
      biography: `עשירה ברג, בתם של בתיה ויוסף צוברי, אשתו של יעקב ברג ואמה של טלילה.

היה לה קול שתלמידיו של יעקב כינו ״קול פעמונים״. היא הרבתה לשיר אריות מאופרות ושירים איטלקיים סנטימנטליים, והעשירה את שירת המקהלה בתל מונד. יעקב ועשירה נראו כזוג שמחבר מערב ומזרח: הוא הדייקן והמנווט, היא הקול והנכונות ללמוד.

בזמרשת נשמר ביצועה לשיר ״שם רחוק בהרים״ — ״שם רחוק רחוק בהרים״. הם הופיעו יחד בערבי שירה וברדיו, ונסעו על וספה ברחבי ישראל, האקורדיון בצד.`,
      portraitId: photos.pearls.id,
    },
  });
  const ofer = await prisma.person.create({
    data: {
      id: "person_ofer",
      slug: "ofer-haephrati",
      firstName: "עפר",
      lastName: "האפרתי",
      gender: "MALE",
      birthPlace: "משאבי שדה",
      biography: `עפר האפרתי הוא בנם הבכור של יוסף ורותי. הוא נולד בקיבוץ משאבי שדה, כשיוסף עוד עבד ברפת ולמד לבגרות במכתבים.

הוא נישא לטלילה ברג, בתם של יעקב ועשירה, ואביהם של איתי, יוסי ואיילת. דרכו נפגשים שני הענפים — האפרתי וברג — לבית אחד.

אחיו: מיכאל, שפרה וגיא.`,
      portraitId: photos.linen.id,
    },
  });
  const michael = await prisma.person.create({
    data: {
      id: "person_michael",
      slug: "michael-haephrati",
      firstName: "מיכאל",
      lastName: "האפרתי",
      gender: "MALE",
      birthDate: d(1964),
      biography: `מיכאל האפרתי, בנם של יוסף ורותי, נולד ב־1964. הוא אחיו של עפר, שפרה וגיא. מיכאל כתב את האתר לזכר סבו, פרופ' ליאו שאודינישקי, מתוך הסיפורים שמסרה אמו רותי.`,
    },
  });
  const shifra = await prisma.person.create({
    data: {
      id: "person_shifra",
      slug: "shifra-haephrati",
      firstName: "שפרה",
      lastName: "האפרתי",
      gender: "FEMALE",
      birthDate: d(1968, 3),
      biography: `שפרה האפרתי, בתם של יוסף ורותי, נולדה במרץ 1968 — פחות משנה אחרי פטירת סבתה שפרה, אמו של יוסף, ונושאת את שמה.`,
    },
  });
  const gai = await prisma.person.create({
    data: {
      id: "person_gai",
      slug: "gai-haephrati",
      firstName: "גיא",
      lastName: "האפרתי",
      gender: "MALE",
      birthDate: d(1971, 3),
      biography: `גיא האפרתי, בן הזקונים של יוסף ורותי, נולד במרץ 1971. היה בן שלוש כשנפל אביו בתל ענתר.`,
    },
  });
  const talila = await prisma.person.create({
    data: {
      id: "person_talila",
      slug: "talila-haephrati",
      firstName: "טלילה",
      lastName: "האפרתי",
      maidenName: "ברג",
      gender: "FEMALE",
      biography: `טלילה האפרתי, לבית ברג, בתם של יעקב ועשירה. נישאה לעפר האפרתי, ואמם של איתי, יוסי ואיילת.

דרך טלילה נכנסים אל המשפחה השירה של עשירה, האקורדיון של יעקב, וענף צוברי — בתיה ויוסף.`,
      portraitId: photos.pearls.id,
    },
  });
  const itay = await prisma.person.create({
    data: {
      id: "person_itay",
      slug: "itay-haephrati",
      firstName: "איתי",
      lastName: "האפרתי",
      gender: "MALE",
      biography: `איתי האפרתי, בנם של עפר וטלילה. נכדם של יוסף ורותי מצד אחד, ושל יעקב ועשירה מצד שני.`,
    },
  });
  const yossi = await prisma.person.create({
    data: {
      id: "person_yossi",
      slug: "yossi-haephrati",
      firstName: "יוסי",
      lastName: "האפרתי",
      gender: "MALE",
      biography: `יוסי האפרתי, בנם של עפר וטלילה. נכדם של יוסף ורותי ושל יעקב ועשירה.`,
    },
  });
  const ayelet = await prisma.person.create({
    data: {
      id: "person_ayelet",
      slug: "ayelet-haephrati",
      firstName: "איילת",
      lastName: "האפרתי",
      gender: "FEMALE",
      biography: `איילת האפרתי, בתם של עפר וטלילה. נכדתם של יוסף ורותי ושל יעקב ועשירה.`,
    },
  });

  const attachFamily = async (personId: string, familyId: string) =>
    prisma.personFamily.create({ data: { personId, familyId } });

  await attachFamily(ruti.id, haephrati.id);
  await attachFamily(ruti.id, shaudinishky.id);
  await attachFamily(yosef.id, haephrati.id);
  await attachFamily(ofer.id, haephrati.id);
  await attachFamily(michael.id, haephrati.id);
  await attachFamily(shifra.id, haephrati.id);
  await attachFamily(gai.id, haephrati.id);
  await attachFamily(itay.id, haephrati.id);
  await attachFamily(yossi.id, haephrati.id);
  await attachFamily(ayelet.id, haephrati.id);
  await attachFamily(talila.id, haephrati.id);
  await attachFamily(talila.id, berg.id);
  await attachFamily(yaakov.id, berg.id);
  await attachFamily(ashira.id, berg.id);
  await attachFamily(ashira.id, tzuberi.id);
  await attachFamily(itay.id, berg.id);
  await attachFamily(yossi.id, berg.id);
  await attachFamily(ayelet.id, berg.id);
  await attachFamily(leo.id, shaudinishky.id);
  await attachFamily(eva.id, shaudinishky.id);
  await attachFamily(batya.id, tzuberi.id);
  await attachFamily(yosefTzuberi.id, tzuberi.id);

  await prisma.partnership.createMany({
    data: [
      { personAId: leo.id, personBId: eva.id, type: "MARRIED" },
      { personAId: ruti.id, personBId: yosef.id, type: "MARRIED" },
      { personAId: yaakov.id, personBId: ashira.id, type: "MARRIED" },
      { personAId: ofer.id, personBId: talila.id, type: "MARRIED" },
      { personAId: yosefTzuberi.id, personBId: batya.id, type: "MARRIED" },
    ],
  });

  await prisma.parentChild.createMany({
    data: [
      { parentId: leo.id, childId: ruti.id, sortOrder: 0 },
      { parentId: eva.id, childId: ruti.id, sortOrder: 1 },
      { parentId: yosefTzuberi.id, childId: ashira.id, sortOrder: 0 },
      { parentId: batya.id, childId: ashira.id, sortOrder: 1 },
      { parentId: ruti.id, childId: ofer.id, sortOrder: 0 },
      { parentId: yosef.id, childId: ofer.id, sortOrder: 0 },
      { parentId: ruti.id, childId: michael.id, sortOrder: 1 },
      { parentId: yosef.id, childId: michael.id, sortOrder: 1 },
      { parentId: ruti.id, childId: shifra.id, sortOrder: 2 },
      { parentId: yosef.id, childId: shifra.id, sortOrder: 2 },
      { parentId: ruti.id, childId: gai.id, sortOrder: 3 },
      { parentId: yosef.id, childId: gai.id, sortOrder: 3 },
      { parentId: yaakov.id, childId: talila.id, sortOrder: 0 },
      { parentId: ashira.id, childId: talila.id, sortOrder: 1 },
      { parentId: ofer.id, childId: itay.id, sortOrder: 0 },
      { parentId: talila.id, childId: itay.id, sortOrder: 0 },
      { parentId: ofer.id, childId: yossi.id, sortOrder: 1 },
      { parentId: talila.id, childId: yossi.id, sortOrder: 1 },
      { parentId: ofer.id, childId: ayelet.id, sortOrder: 2 },
      { parentId: talila.id, childId: ayelet.id, sortOrder: 2 },
    ],
  });

  const placeholder = async (
    attachedToId: string,
    kind: "PARTNER" | "CHILDREN" | "GRANDCHILDREN" | "PARENTS",
    firstName: string,
    slug: string,
  ) => {
    const person = await prisma.person.create({
      data: {
        slug,
        firstName,
        lastName: "",
        isPlaceholder: true,
        placeholderKind: kind,
        attachedToId,
        gender: "UNKNOWN",
      },
    });
    if (kind === "PARTNER") {
      await prisma.partnership.create({
        data: { personAId: attachedToId, personBId: person.id, type: "PARTNER" },
      });
    }
    if (kind === "CHILDREN" || kind === "GRANDCHILDREN") {
      await prisma.parentChild.create({
        data: { parentId: attachedToId, childId: person.id, type: "UNKNOWN" },
      });
    }
    return person;
  };

  for (const p of [itay, yossi, ayelet]) {
    await placeholder(p.id, "PARTNER", "בת/בן זוג", `${p.slug}-partner`);
    const kids = await placeholder(p.id, "CHILDREN", "ילדים", `${p.slug}-children`);
    await placeholder(kids.id, "GRANDCHILDREN", "נכדים", `${p.slug}-grandchildren`);
  }

  const tagPeople = async (mediaId: string, personIds: string[]) => {
    await prisma.personMedia.createMany({
      data: personIds.map((personId) => ({ mediaId, personId, role: "SUBJECT" })),
    });
  };

  await tagPeople(photos.old.id, [ofer.id, ruti.id, yosef.id]);
  await tagPeople(photos.wedding.id, [ofer.id, talila.id]);
  await tagPeople(photos.hero.id, [ofer.id, talila.id, itay.id, yossi.id, ayelet.id]);
  await tagPeople(photos.today.id, [itay.id, yossi.id, ayelet.id]);
  await tagPeople(photos.childhood.id, [itay.id, yossi.id, ayelet.id]);
  await tagPeople(photos.holiday.id, [ofer.id, talila.id, itay.id, yossi.id, ayelet.id]);
  await tagPeople(photos.cake.id, [itay.id, yossi.id, ayelet.id]);
  await tagPeople(photos.army.id, [ofer.id]);
  await tagPeople(photos.gens.id, [ruti.id, yosef.id, yaakov.id, ashira.id, ofer.id, talila.id]);
  await tagPeople(photos.album.id, [ruti.id, yosef.id]);
  await tagPeople(photos.linen.id, [yosef.id, ofer.id]);
  await tagPeople(photos.pearls.id, [ruti.id, ashira.id, talila.id]);
  await tagPeople(photos.hills.id, [yaakov.id, ashira.id]);
  await tagPeople(photos.coast.id, [ofer.id, talila.id, itay.id, yossi.id, ayelet.id]);
  await tagPeople(photos.wall.id, [ofer.id, talila.id]);

  await prisma.location.create({
    data: { name: "ירושלים", country: "ישראל" },
  });
  const home = await prisma.location.create({
    data: { name: "הבית", country: "ישראל" },
  });

  const storyOfer = await prisma.story.create({
    data: {
      slug: "sipur-ofer",
      title: "עפר, הבן הבכור",
      excerpt: "נולד במשאבי שדה, כשיוסף עוד עבד ברפת.",
      featured: true,
      year: 1960,
      decade: 1960,
      locationId: home.id,
      body: `עפר האפרתי הוא בנם הבכור של יוסף ורותי. הוא נולד בקיבוץ משאבי שדה, בזמן שיוסף נשא תפקידים במשק ולמד לבגרות במכתבים.

משם יצא הבית: רותי, הפסיכולוגית, בתם של ליאו ואווה שאודינישקי; ויוסף, חוקר הספרות, שנפל בתל ענתר ב־1974.

עפר נישא לטלילה ברג. שלושת ילדיהם — איתי, יוסי ואיילת — הם כבר דור שמכיר את השמות האלה כסבים וסבתות, וכסיפור.`,
    },
  });

  const storyYosef = await prisma.story.create({
    data: {
      slug: "yosef-haephrati",
      title: "יוסף האפרתי",
      excerpt: "ממשאבי שדה לאוניברסיטת תל אביב. נפל בתל ענתר, 17 באפריל 1974.",
      featured: true,
      year: 1974,
      decade: 1970,
      body: `יוסף האפרתי נולד בתל אביב ב־15 במרץ 1931. ב־1949 היה בין מקימי קיבוץ משאבי שדה. ב־1960 יצא ללמוד ספרות. לימד בגימנסיה רחביה, לחם בירושלים ב־1967, עמד בראש החוג לתורת הספרות באוניברסיטת תל אביב, וכתב על טשרניחובסקי ועל תולדות התיאור בשירה העברית.

ב־17 באפריל 1974 עלה למוצב תל ענתר להרצות לפני חיילים. על סף הבונקר נהרג. הוא נקבר בקריית שאול.

הותיר את רותי, ואת עפר, מיכאל, שפרה וגיא.`,
    },
  });

  const storyLeo = await prisma.story.create({
    data: {
      slug: "leo-shaudinishky",
      title: "הבריחה מאייטקונן",
      excerpt: "ליאו שאודינישקי, אווה, ורותי התינוקת.",
      featured: true,
      year: 1933,
      decade: 1930,
      body: `בשנת 1933 ברח ליאו שאודינישקי מגרמניה. הוא נסע באופניים, אחר כך באופנוע לברלין, ואחר כך באונייה לפלשתינה. אווה ורותי התינוקת נשארו מאחור עד שניתנה אשרה. הן הגיעו באונייה מרתה וושינגטון לחיפה.

ליאו היה מוזיקאי, נגן סקסופון, וממציא הסטריאו. בחיפה פיתח מכשירי הגברה לבריטים. אחר כך גר במושב בית הלוי.

רותי סיפרה את הסיפור. מיכאל כתב אותו.`,
    },
  });

  const storyAshira = await prisma.story.create({
    data: {
      slug: "ashira-berg-song",
      title: "שם רחוק רחוק בהרים",
      excerpt: "השיר שעשירה ברג שרה, והקול שקראו לו קול פעמונים.",
      featured: true,
      year: 1955,
      decade: 1950,
      body: `עשירה ברג, בתם של בתיה ויוסף צוברי, שרה. בזמרשת נשמר ביצועה ל״שם רחוק בהרים״.

יעל צור, תלמידה של יעקב, כתבה שעשירה העשירה את המקהלה בתל מונד, שרה אריות ושירים איטלקיים, ונסעה עם יעקב על הוספה ברחבי הארץ. הוא עם האקורדיון, היא מאחור.

הבית של ברג היה בית של פסנתר, רדיו, ושירה.`,
    },
  });

  const storyYaakov = await prisma.story.create({
    data: {
      slug: "yaakov-berg-telmond",
      title: "יעקב ברג בתל מונד",
      excerpt: "המורה לזמרה, האקורדיון, והמקהלה שזכתה בפרסים.",
      year: 1960,
      decade: 1960,
      body: `יעקב ברג היה המורה לזמרה של בית הספר בתל מונד. הוא בא עם אקורדיון ועם גיליונות תווים של שירי מולדת. לימד חלילית, בנה מקהלה, ופתח את ביתו לתלמידים שהיו צריכים בית.

לפני הפרישה לימד גם באבן יהודה. לזכרו כתבה יעל צור במרץ 2006.`,
    },
  });

  const storySiblings = await prisma.story.create({
    data: {
      slug: "shloshet-haachim",
      title: "איתי, יוסי ואיילת",
      excerpt: "ילדיהם של עפר וטלילה.",
      year: 1988,
      decade: 1980,
      featured: false,
      body: `איתי, יוסי ואיילת גדלו בבית של עפר וטלילה. הם נכדיהם של יוסף ורותי, ושל יעקב ועשירה — שני ענפים שכבר היו למשפחה אחת.`,
    },
  });

  const linkStory = async (storyId: string, personIds: string[]) =>
    prisma.personStory.createMany({ data: personIds.map((personId) => ({ storyId, personId })) });

  await linkStory(storyOfer.id, [ofer.id, ruti.id, yosef.id, talila.id]);
  await linkStory(storyYosef.id, [yosef.id, ruti.id, ofer.id, michael.id, shifra.id, gai.id]);
  await linkStory(storyLeo.id, [leo.id, eva.id, ruti.id]);
  await linkStory(storyAshira.id, [ashira.id, yaakov.id, batya.id, yosefTzuberi.id]);
  await linkStory(storyYaakov.id, [yaakov.id, ashira.id]);
  await linkStory(storySiblings.id, [itay.id, yossi.id, ayelet.id, ofer.id, talila.id]);

  await prisma.storyMedia.createMany({
    data: [
      { storyId: storyOfer.id, mediaId: photos.old.id, sortOrder: 0 },
      { storyId: storyYosef.id, mediaId: photos.linen.id, sortOrder: 0 },
      { storyId: storyLeo.id, mediaId: photos.album.id, sortOrder: 0 },
      { storyId: storyAshira.id, mediaId: photos.hills.id, sortOrder: 0 },
      { storyId: storyYaakov.id, mediaId: photos.hills.id, sortOrder: 0 },
    ],
  });

  await prisma.event.createMany({
    data: [
      { title: "ליאו בורח מגרמניה", type: "HISTORIC", year: 1933, description: "מאייטקונן לברלין, ואחר כך לפלשתינה." },
      { title: "הקמת משאבי שדה", type: "HISTORIC", year: 1949, description: "יוסף בגרעין שהקים את הקיבוץ." },
      { title: "נפילת יוסף האפרתי", type: "MILITARY", year: 1974, description: "תל ענתר, 17 באפריל." },
      { title: "עפר וטלילה", type: "WEDDING", year: 1978 },
    ],
  });

  await prisma.memory.create({
    data: {
      title: "היום לפני שנים, בחצר",
      body: "עפר עם הוריו. האור של 1964 עדיין נמצא בתמונה.",
      year: 1964,
      onThisDay: "06-12",
      people: { create: [{ personId: ofer.id }, { personId: ruti.id }, { personId: yosef.id }] },
      media: { create: [{ mediaId: photos.old.id }] },
    },
  });

  await prisma.memory.create({
    data: {
      title: "שולחן השבת",
      body: "השולחן מוכן. המשפחה בדרך.",
      year: 2024,
      people: {
        create: [{ personId: ofer.id }, { personId: talila.id }],
      },
      media: { create: [{ mediaId: photos.hero.id }] },
    },
  });

  const email = "family@haephrati.local";
  const password = process.env.FAMILY_PASSWORD ?? "13";

  await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      displayName: "משפחת האפרתי",
      role: "OWNER",
      personId: itay.id,
    },
  });

  await prisma.comment.create({
    data: {
      body: "אני זוכר שהתמונה הזאת צולמה בחצר, בשעת אחר הצהריים. האבן הייתה חמה והעץ נתן צל דק.",
      authorId: (await prisma.user.findUniqueOrThrow({ where: { email } })).id,
      mediaId: photos.old.id,
    },
  });

  console.log("Seeded משפחת האפרתי");
  console.log("Password: 13");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
