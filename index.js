const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local'); //Qisqa muddatli xotirasi Telegram botlar tabiatan "esda tutmas" (stateless) bo'ladi. Ya'ni, bot foydalanuvchi hozirgina nima deganini darrov unutadi.
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const http = require('http');

// 1. O'zgaruvchilarni tartib bilan e'lon qilish
const ADMIN_ID = parseInt(process.env.ADMIN_ID); 
const bot = new Telegraf(process.env.BOT_TOKEN);
const REQUIRED_CHANNEL = '@student_aitex'; // Kanal yuzernamini yozing (@ bilan)
const CHANNEL_ID = '-1001234567890'; // Kanal ID raqamini yozing (agar bilsangiz)

// Railway uchun doimiy papka (Volume)
const DATA_DIR = '/data'; 

if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
        console.log("LocalStorage rejimi faollashdi");
    }
}

// Fayl manzillari
const DB_FILE = path.join(DATA_DIR, 'ranking_db.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'custom_questions.json');
const VIP_FILE = path.join(DATA_DIR, 'vip_users.json');
const SESSION_FILE = path.join(DATA_DIR, 'session.json');

const SUBJECTS_FILE = path.join(__dirname, 'subjects.json');

// 2. Bazalarni tekshirish va funksiyalar
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));

function getDb() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, settings: {} }, null, 2));
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Bazani o'qishda xato:", error);
        return { users: {}, settings: {} };
    }
}

function saveDb(db) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
        console.error("FAYLGA YOZISHDA XATO:", err);
    }
}

// Bot sozlamalarini yuklash
let botSettings = { timeLimit: 60 }; 
if (fs.existsSync(SETTINGS_FILE)) {
    try {
        botSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch (e) { console.error("Settings o'qishda xato"); }
}

// 3. Sessiyani ulash
bot.use((new LocalSession({ database: SESSION_FILE })).middleware());

// --- MA'LUMOTLAR BAZASI VA REJIMLAR ---
let isBotPaidMode = false;
let vipUsers = [];

try {
    if (fs.existsSync(VIP_FILE)) {
        vipUsers = JSON.parse(fs.readFileSync(VIP_FILE));
    }
} catch (err) { vipUsers = []; }

// --- FANLAR BAZASI ---
// Savollarni o'qiymiz
let SUBJECTS = {};
if (fs.existsSync(SUBJECTS_FILE)) {
    SUBJECTS = JSON.parse(fs.readFileSync(SUBJECTS_FILE, 'utf8'));
} else {
  SUBJECTS = {
   "academic": {
        "name": "📝 Akademik yozuv",
        "questions": [
  {
    "q": "Yozuvchilar, shoirlar, olimlar tomonidan ishlangan, qat’iy me’yorlarga ega bo‘lgan nutq ko‘rinishini to‘g‘ri toping.",
    "options": [
      "Badiiy nutq",
      "Adabiy nutq",
      "Ilmiy nutq",
      "Publitsistik nutq"
    ],
    "a": "Ilmiy nutq"
  },
  {
    "q": "Ommaviy axborot vositalarida (gazeta-jurnal, radio, televideniye), Oliy majlis yig‘inlarida, turli xil anjumanlarda qo‘llaniladigan nutq uslubi qanday nomlanadi?",
    "options": [
      "Badiiy uslub",
      "Ommabop-publitsistik uslub",
      "Ilmiy uslub",
      "Rasmiy-idoraviy uslub"
    ],
    "a": "Ommabop-publitsistik uslub"
  },
  {
    "q": "Daliliy munosabatlar asosida chiqarilgan ilmiy xulosalarga asoslanuvchi, har bir fan sohasining o‘ziga xos atamalariga tayanuvchi, fikrni aniq va mantiqiy izchil bayon qiluvchi uslub qanday uslub hisoblanadi?",
    "options": [
      "Rasmiy-idoraviy uslub",
      "Badiiy uslub",
      "So‘zlashuv uslubi",
      "Ilmiy uslub",
    ],
    "a": "Ilmiy uslub"
  },
  {
    "q": "Ultra tovushlar kashf etilgunga qadar har qanday tovushni qabul qilish vositasi insonning eshitish a’zosi bo‘lgan quloq deb hisoblangan. Tovush to‘lqinlarining vujudga kelishi va tarqalishi bilan bog‘liq hodisalar akustik hodisalar deb yuritiladi. Yuqorida keltirilgan gap qaysi uslubga tegishli?",
    "options": [
      "Rasmiy-idoraviy uslub",
      "Publitsistik uslub",
      "Ilmiy uslub",
      "Badiiy uslub"
    ],
    "a": "Ilmiy uslub"
  },
  {
    "q": "Kishilar o‘rtasidagi faoliyat ehtiyojlaridan kelib chiqadigan bog‘lanishlar rivojlanishining ko‘p qirrali jarayoni bu … dir.",
    "options": [
      "Muloqot",
      "Dialog",
      "Kommunikatsiya",
      "Suhbat"
    ],
    "a": "Muloqot"
  },
  {
    "q": "“Kommunikatsiya” so‘zi qanday ma’noni bildiradi?",
    "options": [
      "aloqa",
      "qatnashmoq",
      "bo‘lishmoq, umumlashtirmoq",
      "xabar bermoq"
    ],
    "a": "aloqa"
  },
  {
    "q": "Nima munosabat yaratishga va muhabbatni shakllantirishga yordam beradi, o‘zaro tushunishni rag‘batlantiradi?",
    "options": [
      "kommunikativ muloqot",
      "individual suhbat",
      "muloqot jarayoni",
      "kommunikativ aloqa"
    ],
    "a": "kommunikativ muloqot"
  },
  {
    "q": "Muloqot texnikasining zaruriy sharti nimadan iborat?",
    "options": [
      "Bu o‘qituvchining o‘z e’tibori va o‘quvchilarning e’tiborlarini boshqara olish demakdir.",
      "Bu qandaydir qo‘l bilan tutib bo‘lmaydigan, balki fahm-farosat bilan amalga oshiriladigan xatti-harakatdir.",
      "Bu behad izlanish va o‘z ustida ishlash, qilgan ishlaridan xursand bo‘lish, boshdan kechirilgan quvonchdan qanoat hosil qilish.",
      "to‘g‘ri javob yo‘q"
    ],
    "a": "Bu o‘qituvchining o‘z e’tibori va o‘quvchilarning e’tiborlarini boshqara olish demakdir."
  },
  {
    "q": "Muloqot texnikasida uchraydigan kamchiliklar nechta?",
    "options": [
      "3 ta",
      "7 ta",
      "4 ta",
      "8 ta"
    ],
    "a": "7 ta"
  },
  {
    "q": "Muloqot madaniyati, mimik pantomima va hissiy holat bu …?",
    "options": [
      "Muloqot texnikasida uchraydigan kamchiliklar",
      "Muloqot texnikasiga qo‘yiladigan talablar",
      "Muloqot texnikasining tarkibiy qismlari",
      "to‘g‘ri javob yo‘q"
    ],
    "a": "Muloqot texnikasining tarkibiy qismlari"
  },
  {
    "q": "………. - savodli gapirish, o'z nutqini chiroyli va tushunarli, ta’sirchan qilib bayon etish, o‘z fikr va his-tuyg‘ularini so'zda aniq ifodalash. Nuqtalar o‘rniga mos javobni toping.",
    "options": [
      "Mimik pantomima",
      "Muloqot madaniyati",
      "Hissiy holat",
      "to‘g‘ri javob yo‘q"
    ],
    "a": "Muloqot madaniyati"
  },
  {
    "q": "………- aniq imo-ishora, ma’noli qarash, rag‘batlantiruvchi yoki iliq tabassum. Nuqtalar o‘rniga mos javobni toping.",
    "options": [
      "Muloqot madaniyati",
      "Hissiy holat",
      "Mimik pantomima",
      "to‘g‘ri javob yo‘q"
    ],
    "a": "Mimik pantomima"
  },
  {
    "q": "Akademik yozuv bu …….?",
    "options": [
      "so'nggi bir necha o'n yilliklarda turli mamlakatlar o'rtasida ilmiy va ta'lim aloqalarini amalga oshirish",
      "qisqa, ammo yetarlicha ishonchli ilmiy matn orqali o'z fikrlarini ifodalash va asoslash qobiliyatidir",
      "to‘g‘ri javob yo‘q",
      "universitetda muvaffaqiyatli o‘qish va keyingi tadqiqot faoliyatining muhim jihatlaridan biridir, shu jumladan xalqaro darajada"
    ],
    "a": "qisqa, ammo yetarlicha ishonchli ilmiy matn orqali o'z fikrlarini ifodalash va asoslash qobiliyatidir"
  },
  {
    "q": "Bugungi kunda akademik yozuv tizimini va uning ilmiy-uslubiy bazasini rivojlantirishda asosiy rol o'ynagan mamlakatlar ko’rsating.",
    "options": [
      "Germaniya",
      "Italiya",
      "Ingliz tilida so'zlashuvchi mamlakatlar",
      "Fransiya"
    ],
    "a": "Ingliz tilida so'zlashuvchi mamlakatlar"
  },
  {
    "q": "Akademik yozuvning qanday janrlarini bilasiz?",
    "options": [
      "Adabiy",
      "Birlamchi va ikkalamchi",
      "Ilmiy",
      "Publisistik"
    ],
    "a": "Birlamchi va ikkalamchi"
  },
  {
    "q": "Akademik yozuvning birlamchi janriga nimalar kiradi?",
    "options": [
      "Ilmiy loyiha tafsifi, tezis, avtoreferat, ensiklopedik maqola",
      "Ilmiy maqola, dissertatsiya, ilmiy diskussiya",
      "Ilmiy maqola, dissertatsiya, taqriz, monografiya",
      "Ilmiy diskussiya, ilmiy loyiha tafsifi, tezis, avtoreferat, ensiklopedik maqola, annotatsiya"
    ],
    "a": "Ilmiy maqola, dissertatsiya, taqriz, monografiya"
  },
  {
    "q": "Akademik yozuvning ikkalamchi janriga nimalar kiradi?",
    "options": [
      "Ilmiy maqola, dissertatsiya, taqriz, monografiya",
      "Ilmiy diskussiya, ilmiy loyiha tafsifi, tezis, avtoreferat, ensiklopedik maqola, annotatsiya",
      "Ilmiy maqola, dissertatsiya, ilmiy diskussiya",
      "Ilmiy loyiha tafsifi, tezis, avtoreferat, ensiklopedik maqola"
    ],
    "a": "Ilmiy diskussiya, ilmiy loyiha tafsifi, tezis, avtoreferat, ensiklopedik maqola, annotatsiya"
  },
  {
    "q": "Ilmiy maqolada ……?",
    "options": [
      "ilmiy matn tahlil qilinadi va asarga tanqidiy baho beriladi",
      "bir mavzuga bag'ishlangan va tadqiqot mavzusi bo'yicha yetarli miqdordagi ma'lumotlar va ilmiy materiallar to'planganidan keyin tayyorlanadi",
      "magistratura yoki boshqa ilmiy darajani olishga tayyorlanish",
      "muallif o'z tadqiqoti natijalarini taqdim etadi. Faktlardan tashqari, u mantiqiy fikrlash va samarali qismni tushunishni o'z ichiga oladi"
    ],
    "a": "muallif o'z tadqiqoti natijalarini taqdim etadi. Faktlardan tashqari, u mantiqiy fikrlash va samarali qismni tushunishni o'z ichiga oladi"
  },
  {
    "q": "Dissertatsiya bu …?",
    "options": [
      "ilmiy matn tahlil qilinadi va asarga tanqidiy baho beriladi",
      "magistratura yoki boshqa ilmiy darajani olishga tayyorlanish",
      "muallif o'z tadqiqoti natijalarini taqdim etadi. Faktlardan tashqari, u mantiqiy fikrlash va samarali qismni tushunishni o'z ichiga oladi",
      "bir mavzuga bag'ishlangan va tadqiqot mavzusi bo'yicha yetarli miqdordagi ma'lumotlar va ilmiy materiallar to'planganidan keyin tayyorlanadi"
    ],
    "a": "magistratura yoki boshqa ilmiy darajani olishga tayyorlanish"
  },
  {
    "q": "Taqriz bu …?",
    "options": [
      "muallif o'z tadqiqoti natijalarini taqdim etadi. Faktlardan tashqari, u mantiqiy fikrlash va samarali qismni tushunishni o'z ichiga oladi",
      "ilmiy matn tahlil qilinadi va asarga tanqidiy baho beriladi",
      "magistratura yoki boshqa ilmiy darajani olishga tayyorlanish",
      "bir mavzuga bag'ishlangan va tadqiqot mavzusi bo'yicha yetarli miqdordagi ma'lumotlar va ilmiy materiallar to'planganidan keyin tayyorlanadi"
    ],
    "a": "ilmiy matn tahlil qilinadi va asarga tanqidiy baho beriladi"
  },
  {
    "q": "Monografiya bu …?",
    "options": [
      "ilmiy matn tahlil qilinadi va asarga tanqidiy baho beriladi",
      "muallif o'z tadqiqoti natijalarini taqdim etadi. Faktlardan tashqari, u mantiqiy fikrlash va samarali qismni tushunishni o'z ichiga oladi",
      "bir mavzuga bag'ishlangan va tadqiqot mavzusi bo'yicha yetarli miqdordagi ma'lumotlar va ilmiy materiallar to'planganidan keyin tayyorlanadi",
      "magistratura yoki boshqa ilmiy darajani olishga tayyorlanish"
    ],
    "a": "bir mavzuga bag'ishlangan va tadqiqot mavzusi bo'yicha yetarli miqdordagi ma'lumotlar va ilmiy materiallar to'planganidan keyin tayyorlanadi"
  },
  {
    "q": "Annotatsiya bu …?",
    "options": [
      "magistratura yoki boshqa ilmiy darajani olishga tayyorlanish",
      "muallif o'z tadqiqoti natijalarini taqdim etadi. Faktlardan tashqari, u mantiqiy fikrlash va samarali qismni tushunishni o'z ichiga oladi",
      "har qanday asosiy manbaning ixchamlashtirilgan xulosasi, uning mohiyatining qisqacha bayoni",
      "bir mavzuga bag'ishlangan va tadqiqot mavzusi bo'yicha yetarli miqdordagi ma'lumotlar va ilmiy materiallar to'planganidan keyin tayyorlanadi"
    ],
    "a": "har qanday asosiy manbaning ixchamlashtirilgan xulosasi, uning mohiyatining qisqacha bayoni"
  },
  {
    "q": "Referat bu …?",
    "options": [
      "bir mavzuga bag'ishlangan va tadqiqot mavzusi bo'yicha yetarli miqdordagi ma'lumotlar va ilmiy materiallar to'planganidan keyin tayyorlanadi",
      "qayta ko‘rib chiqilgan asosiy matnning taqdimoti, unda asl manbadagi ma’lumotlar ishonchli yetkaziladi",
      "har qanday asosiy manbaning ixchamlashtirilgan xulosasi, uning mohiyatining qisqacha bayoni",
      "muallif o'z tadqiqoti natijalarini taqdim etadi"
    ],
    "a": "qayta ko‘rib chiqilgan asosiy matnning taqdimoti, unda asl manbadagi ma’lumotlar ishonchli yetkaziladi"
  },
  {
    "q": "Ilmiy munozara bu …?",
    "options": [
      "muallif o'z tadqiqoti natijalarini taqdim etadi va ilmiy xulosalar chiqaradi",
      "har qanday asosiy manbaning ixchamlashtirilgan xulosasi, uning mohiyatining qisqacha bayoni",
      "ilmiy muammolarni muhokama qilish va ularning yechimlarini topishga qaratilgan, qarama-qarshiliklarni tanqidiy tahlil qilish jarayoni",
      "qayta ko‘rib chiqilgan asosiy matnning taqdimoti"
    ],
    "a": "ilmiy muammolarni muhokama qilish va ularning yechimlarini topishga qaratilgan, qarama-qarshiliklarni tanqidiy tahlil qilish jarayoni"
  },
  {
    "q": "Akademik yozuv uslubining xususiyatlarini belgilang.",
    "options": [
      "Faqat kirish qismidan iborat bo‘ladi",
      "Ilmiy matn kirish, asosiy qism va xulosadan iborat an’anaviy tuzilishga ega bo‘ladi",
      "Asosiy qismda faqat statistik ma’lumotlar keltiriladi",
      "Xulosa qismida mavzu yoritilmaydi"
    ],
    "a": "Ilmiy matn kirish, asosiy qism va xulosadan iborat an’anaviy tuzilishga ega bo‘ladi"
  },
  {
    "q": "Kirish qismi …?",
    "options": [
      "oddiy tuzilishga ega bo‘lishi kerak",
      "xulosalar chiqariladi va prognozlar tuziladi",
      "mavzuni qisqacha ochib beradi",
      "muallif o‘z qarashlarini batafsil bayon etadi"
    ],
    "a": "mavzuni qisqacha ochib beradi"
  },
  {
    "q": "Asosiy qismi …?",
    "options": [
      "xulosalar chiqariladi va kelajak istiqbollari ko‘rsatiladi",
      "muallif mavzu bo‘yicha ilmiy tadqiqotlarga murojaat qiladi va o‘rganilayotgan muammoga o‘z qarashlarini taqdim etadi",
      "mavzuni qisqacha ochib beradi",
      "oddiy tuzilishga ega bo‘lishi kerak"
    ],
    "a": "muallif mavzu bo‘yicha ilmiy tadqiqotlarga murojaat qiladi va o‘rganilayotgan muammoga o‘z qarashlarini taqdim etadi"
  },
  {
    "q": "Xulosa qismi …?",
    "options": [
      "mavzuni qisqacha ochib beradi",
      "oddiy tuzilishga ega bo‘lishi kerak",
      "muallif mavzu bo‘yicha ilmiy tadqiqotlarga murojaat qiladi",
      "xulosalar chiqariladi, o‘rganilayotgan masala bo‘yicha kelajak istiqbollari ko‘rsatiladi va prognozlar tuziladi"
    ],
    "a": "xulosalar chiqariladi, o‘rganilayotgan masala bo‘yicha kelajak istiqbollari ko‘rsatiladi va prognozlar tuziladi"
  },
  {
    "q": "Akademik yozuv uslubining xususiyatlarini yana bir muhim jihatini ko‘rsating.",
    "options": [
      "oddiy tuzilishga ega bo‘lishi kerak",
      "mavzuni qisqacha ochib beradi",
      "bayonlarning aniqligi va lo‘ndaligi hamda o‘quvchi uchun amaliy ahamiyatsiz fikrlarning yo‘qligi",
      "muallif ilmiy tadqiqotlarga murojaat qiladi"
    ],
    "a": "bayonlarning aniqligi va lo‘ndaligi hamda o‘quvchi uchun amaliy ahamiyatsiz fikrlarning yo‘qligi"
  },
  {
    "q": "Akademik yozish nimani o‘z ichiga oladi?",
    "options": [
      "Faqat kirish va asosiy qismni o‘z ichiga oladi",
      "Akademik matn kirish, asosiy qism va an’anaviy xulosadan iborat oddiy tuzilishga ega bo‘lishi kerak",
      "Faqat asosiy qism va xulosani o‘z ichiga oladi",
      "Oddiy tuzilishga ega bo‘lishi kerak"
    ],
    "a": "Akademik matn kirish, asosiy qism va an’anaviy xulosadan iborat oddiy tuzilishga ega bo‘lishi kerak"
  },
  {
    "q": "Qanday qilib akademik yozuvni to'g'ri yozish kerak?",
    "options": [
      "Qisqartmalarni dekodlashsiz ishlatish va so‘zlashuv uslubidan foydalanish mumkin",
      "Akademik yozuv ilmiy yoki ilmiy-publitsistik uslubga rioya qilishi, manbalarga havola berilishi va jargon ishlatilmasligi kerak",
      "Har qanday ma'lumot havolasiz ham berilishi mumkin",
      "To‘g‘ri javob yo‘q"
    ],
    "a": "Akademik yozuv ilmiy yoki ilmiy-publitsistik uslubga rioya qilishi, manbalarga havola berilishi va jargon ishlatilmasligi kerak"
  },
  {
    "q": "Akademik yozuv nima uchun kerak?",
    "options": [
      "Yozish bu tashqi axborotni o'z fikrlari bilan sintezlash uchun kerak",
      "Akademik yozuvlar faqat dalillarni sanab o‘tish uchun kerak",
      "Tadqiqotchiga ilmiy matnni ixcham, ta’sirchan va qulay tarzda yozishga o‘rgatish uchun kerak",
      "Matnni faqat badiiy qilish uchun kerak"
    ],
    "a": "Tadqiqotchiga ilmiy matnni ixcham, ta’sirchan va qulay tarzda yozishga o‘rgatish uchun kerak"
  },
  {
    "q": "Akademik matnlar haqida nima deyish mumkin?",
    "options": [
      "“Akademik matn” faqat akademik tomonidan yoziladi",
      "Bu tushunchalar ajratiladi: akademik matn – talaba, ilmiy matn – olim tomonidan yaratiladi",
      "Akademik va ilmiy matnlar bir xil tushuncha",
      "Ilmiy matnlar talabalar tomonidan yoziladi"
    ],
    "a": "Bu tushunchalar ajratiladi: akademik matn – talaba, ilmiy matn – olim tomonidan yaratiladi"
  },
  {
    "q": "Nutq madaniyati nima?",
    "options": [
      "Badiiy matn yozish qobiliyati",
      "Til me’yorlari va qoidalari majmuyi",
      "Akademik yozish metodikasi",
      "Tuyg‘ularni so‘z orqali ifodalash san’ati"
    ],
    "a": "Til me’yorlari va qoidalari majmuyi"
  },
  {
    "q": "Til qoidalariga oid qaysi gap to‘g‘ri?",
    "options": [
      "Ilmiy matnlarni yozishda qoidalar kam qo‘llaniladi",
      "Akademik yozishda til qoidalari muhim rol o‘ynamaydi",
      "Filologlar va jurnalistlar uchun lug‘atlar juda ko‘p",
      "Har qanday mutaxassis barcha qoidalarni osongina eslab qoladi"
    ],
    "a": "Filologlar va jurnalistlar uchun lug‘atlar juda ko‘p"
  },
  {
    "q": "Akademik yozuvning asosiy maqsadi nima?",
    "options": [
      "Badiiy yozuv an’analarini saqlab qolish",
      "Matnning emotsionalligini kuchaytirish",
      "Haqiqiy ma'lumotlarni aniq va tushunarli berish",
      "Yozilganlarning badiiyligini oshirish"
    ],
    "a": "Haqiqiy ma'lumotlarni aniq va tushunarli berish"
  },
  {
    "q": "Badiiy va ilmiy matnlarning farqi nimada?",
    "options": [
      "Badiiy matnlar isbotni talab qilmaydi, ilmiy matnlar esa dalillarga asoslanadi",
      "Ilmiy matnlar faqat oxirigacha o‘qiladi",
      "Badiiy va ilmiy matnlar orasida farq yo‘q",
      "Ilmiy matnlar faqat hissiyotlarga asoslanadi"
    ],
    "a": "Badiiy matnlar isbotni talab qilmaydi, ilmiy matnlar esa dalillarga asoslanadi"
  },
  {
    "q": "Badiiy adabiyotga nisbatan o‘quvchi tanlovi qanday rol o‘ynaydi?",
    "options": [
      "Bu muhim emas, chunki badiiy adabiyot har doim oxirigacha o‘qiladi",
      "Butun matn o‘qiladimi yoki yo‘qligini aniqlaydi",
      "Ilmiy adabiyotda ham xuddi shunday",
      "Faqat muallifga bog‘liq"
    ],
    "a": "Butun matn o‘qiladimi yoki yo‘qligini aniqlaydi"
  },
  {
    "q": "Badiiy adabiyot ilmiy matndan nimasi bilan farq qiladi?",
    "options": [
      "Badiiy adabiyot so‘z chegarasini talab qilmaydi, ilmiy yozish esa ixcham va ta’sirchan bo‘lishi kerak",
      "Badiiy adabiyot estetik ehtiyojlarni qondirish uchun yoziladi, ilmiy matn esa nihoyatda ma’lumotlidir",
      "Badiiy adabiyot faktlarga asoslanadi, ilmiy yozuvda hissiy elementlar mavjud",
      "Badiiy adabiyot faqat ish uchun o‘qiladi"
    ],
    "a": "Badiiy adabiyot estetik ehtiyojlarni qondirish uchun yoziladi, ilmiy matn esa nihoyatda ma’lumotlidir"
  },
  {
    "q": "Ilmiy matnda bibliografiya qanday rol o‘ynaydi?",
    "options": [
      "Matnning emotsional fonini yaratishga yordam beradi",
      "Ilmiy matnda rol o‘ynamaydi",
      "Kerakli ma'lumotlarni tez topish vositasi",
      "O‘quvchining estetik ehtiyojlarini qondiradi"
    ],
    "a": "Kerakli ma'lumotlarni tez topish vositasi"
  },
  {
    "q": "Publitsistik va ilmiy matn o‘rtasidagi farq nima?",
    "options": [
      "Publitsistik matn bibliografiyani talab qilmaydi",
      "Publitsistik matn keng ommaga, ilmiy matn esa mutaxassislarga mo‘ljallangan",
      "Ilmiy matn hissiy ifodalarni ko‘p ishlatadi",
      "Publitsistik matn faqat faktlarga asoslanadi"
    ],
    "a": "Publitsistik matn keng ommaga, ilmiy matn esa mutaxassislarga mo‘ljallangan"
  },
  {
    "q": "Publisistikada ilmiy matnga nisbatan qanday usullardan foydalaniladi?",
    "options": [
      "Publitsistika subyektiv tajribalardan foydalanadi, ilmiy matn esa fakt va dalillarga asoslanadi",
      "Publitsistika va ilmiy matn bir xil usullardan foydalanadi",
      "Ilmiy matn shaxsiy pozitsiyani ifodalaydi",
      "Publitsistik matn manbalarni talab qilmaydi"
    ],
    "a": "Publitsistika subyektiv tajribalardan foydalanadi, ilmiy matn esa fakt va dalillarga asoslanadi"
  },
  {
    "q": "Ilmiy matnning maqsadiga oid qaysi gaplar to‘g‘ri?",
    "options": [
      "Matnning adabiy qiymatini oshirish",
      "O‘quvchiga hissiy fon taqdim etish",
      "Aniq va tasdiqlangan ma'lumotlarni taqdim etadi",
      "Matnni faqat keng omma uchun yozish"
    ],
    "a": "Aniq va tasdiqlangan ma'lumotlarni taqdim etadi"
  },
  {
    "q": "Ilmiy matnda ma'lumotlarga ko‘ra nima ko‘rsatilishi kerak?",
    "options": [
      "Emotsional bahslar",
      "Shiorlar va e’tiqodlar",
      "Ishonchli va obyektiv manbalarga havolalar",
      "Shaxsiy fikrlar"
    ],
    "a": "Ishonchli va obyektiv manbalarga havolalar"
  },
  {
    "q": "Ilmiy matnda axborot qanday rol o‘ynaydi?",
    "options": [
      "U raqamli axborot shaklida bo‘lishi shart",
      "U qimmatli, to‘liq va ishonchli bo‘lishi kerak",
      "Faqat analog shaklda bo‘lishi kerak",
      "Faqat batafsil bo‘lishi kerak"
    ],
    "a": "U qimmatli, to‘liq va ishonchli bo‘lishi kerak"
  },
  {
    "q": "Matnga ko‘ra ma'lumotlarning qaysi turlari ko‘proq tarqalgan?",
    "options": [
      "Hissiy va mantiqiy",
      "Foydali va foydasiz",
      "Sifat va miqdoriy",
      "Analog va diskret"
    ],
    "a": "Sifat va miqdoriy"
  },
  {
    "q": "Akademik yozuvda triadani tashkil qilishning o‘ziga xos xususiyati nimada?",
    "options": [
      "Emotsional argumentlar yaratishga qaratilgan",
      "Matnga yangi elementlarni kiritish uchun signalli so‘zlardan foydalanadi",
      "Muallifning shaxsiy e’tiqodini ifodalashga intiladi",
      "O‘quvchida subyektiv tajriba hosil qilish uchun mo‘ljallangan"
    ],
    "a": "Matnga yangi elementlarni kiritish uchun signalli so‘zlardan foydalanadi"
  },
  {
    "q": "Ilmiy matn muallifi o‘quvchini qanday ishontiradi?",
    "options": [
      "Shaxsiy e’tiqod va qarashlarni singdirish",
      "Emotsional murojaatlar va manipulyatsiyalar",
      "Dalilning mantiqiyligi va izchilligi",
      "Badiiy tasvirlar orqali"
    ],
    "a": "Dalilning mantiqiyligi va izchilligi"
  },
  {
    "q": "Matnga ko‘ra nutq madaniyati nima?",
    "options": [
      "Chet tillarini ona tiliga moslashtirish",
      "Yangi nutq standartlarini yaratish",
      "Til me’yor va qoidalarini saqlash",
      "Turli madaniyatlar shevalarini o‘rganish"
    ],
    "a": "Til me’yor va qoidalarini saqlash"
  },
  {
    "q": "Matnga ko‘ra akademik yozishda muhokama qanday rol o‘ynaydi?",
    "options": [
      "Muallif va muharrir o‘rtasidagi ziddiyatlarni keltirib chiqaradi",
      "Matnda emotsional bo‘yoq hosil qiladi",
      "Ilmiy aloqa uchun asos bo‘lib xizmat qiladi",
      "Muallifning fikr bildirish erkinligini cheklaydi"
    ],
    "a": "Ilmiy aloqa uchun asos bo‘lib xizmat qiladi"
  },
  {
    "q": "Matnga ko‘ra maktab yoki universitetda qaysi ko‘nikmalar odatda o‘qitilmaydi?",
    "options": [
      "Tilshunoslik nazariyasi asoslari",
      "Badiiy matn yaratish texnologiyalari",
      "Metallingvistik yozish malakasi",
      "Til shevalari bilan ishlash"
    ],
    "a": "Metallingvistik yozish malakasi"
  },
  {
    "q": "Ma’lumotlarga ko‘ra, qaysi gap badiiy matnga mos keladi?",
    "options": [
      "Tasdiqlangan fakt va dalillarga asoslanadi",
      "Tilning qat’iy me’yorlariga bo‘ysunadi",
      "Unda subyektiv kechinmalar va xayoliy g‘oyalar bo‘lishi mumkin",
      "Faqat mutaxassislar uchun yoziladi"
    ],
    "a": "Unda subyektiv kechinmalar va xayoliy g‘oyalar bo‘lishi mumkin"
  },
  {
    "q": "Muallifning badiiy adabiyot o‘qishga munosabati qanday?",
    "options": [
      "Buni qat’iy nazorat qilish kerak, deb hisoblaydi",
      "Matnlarni faqat ilmiy mezon bilan baholaydi",
      "O‘qishda tanlash erkinligi va individual didni qo‘llab-quvvatlaydi",
      "Faqat klassik asarlarni o‘qishni tavsiya qiladi"
    ],
    "a": "O‘qishda tanlash erkinligi va individual didni qo‘llab-quvvatlaydi"
  },
  {
    "q": "Ilmiy matnni matndagi ma'lumotlarga ko‘ra qanday xususiyatlar xarakterlaydi?",
    "options": [
      "O‘qish vaqti minimal bo‘lishi kerak",
      "Axborot mazmuni va xolisligi",
      "Faqat mutaxassislar uchun qiziqarli",
      "Tuyg‘ularning ustuvorligi"
    ],
    "a": "Axborot mazmuni va xolisligi"
  },
  {
    "q": "Matnga ko‘ra akademik yozuvdan maqsad nima?",
    "options": [
      "Til me’yor va qoidalarini asrash",
      "Keng ommani ijtimoiy muammolarga jalb qilish",
      "O‘z fikrlarini ifoda etish va asoslashni o‘rganish",
      "Faqat yozma nutqni rivojlantirish"
    ],
    "a": "O‘z fikrlarini ifoda etish va asoslashni o‘rganish"
  },
  {
    "q": "Matnga ko‘ra publitsistik matn ilmiy matndan qanday farq qiladi?",
    "options": [
      "Maqsad mutaxassislar uchun ma'lumot berish",
      "Muallifning emotsional pozitsiyasini ifodalaydi va umumiy o‘quvchiga qaratilgan",
      "Faqat shaxsiy fikrlardan iborat bo‘ladi",
      "Hech qanday faktlarga tayanmaydi"
    ],
    "a": "Muallifning emotsional pozitsiyasini ifodalaydi va umumiy o‘quvchiga qaratilgan"
  },
  {
    "q": "Matnga ko'ra badiiy adabiyotga qanday xususiyatlar xosdir?",
    "options": [
      "Mutaxassislar uchun axborot berish",
      "O‘qishdan maqsad ish uchun ma’lumot olish",
      "Estetik ehtiyojlarni qondirish",
      "Faqat ilmiy faktlarga asoslanish"
    ],
    "a": "Estetik ehtiyojlarni qondirish"
  },
  {
    "q": "Ilmiy matnda ma'lumotlarga ko'ra nima ko'rsatilishi kerak?",
    "options": [
      "Emotsional bahslar",
      "Shiorlar va e’tiqodlar",
      "Ishonchli va obyektiv manbalarga havolalar",
      "Subyektiv mulohazalar"
    ],
    "a": "Ishonchli va obyektiv manbalarga havolalar"
  },
  {
    "q": "Ilmiy matnda axborot qanday rol o‘ynaydi?",
    "options": [
      "U raqamli shaklda bo‘lishi shart",
      "Analog axborot sifatida beriladi",
      "U qimmatli, to‘liq va ishonchli bo‘lishi kerak",
      "Faqat qisqa va soddalashtirilgan bo‘lishi kerak"
    ],
    "a": "U qimmatli, to‘liq va ishonchli bo‘lishi kerak"
  },
  {
    "q": "Matnga ko‘ra axborotning qaysi turlari ko‘proq uchraydi?",
    "options": [
      "Foydali va foydasiz",
      "Hissiy va mantiqiy",
      "Analog va diskret",
      "Sifat va miqdoriy"
    ],
    "a": "Sifat va miqdoriy"
  },
  {
    "q": "Akademik yozuvda triadani tashkil etishning o‘ziga xos xususiyati nimada?",
    "options": [
      "Muallifning shaxsiy e’tiqodini ifodalash",
      "Emotsional argumentlar yaratish",
      "Matnga yangi elementlarni kiritish uchun signalli so‘zlardan foydalanish",
      "O‘quvchida subyektiv tajriba hosil qilish"
    ],
    "a": "Matnga yangi elementlarni kiritish uchun signalli so‘zlardan foydalanish"
  },
  {
    "q": "Qaysi turdagi matn maksimal hajmga ega va yozma nutqning shakli hisoblanadi?",
    "options": [
      "Mikromatn",
      "Argumentativ matn",
      "Texnik tavsiflovchi matn",
      "Makromatn"
    ],
    "a": "Makromatn"
  },
  {
    "q": "Qaysi turdagi matn obyektlarni tavsiflaydi va texnik yoki badiiy bo‘lishi mumkin?",
    "options": [
      "Hikoya matni",
      "Izohlovchi matn",
      "Argumentativ matn",
      "Ta’riflovchi matn"
    ],
    "a": "Ta’riflovchi matn"
  },
  {
    "q": "Qaysi turdagi matn muallifning shaxsiy fikrini bildirmasdan tushuntirishni maqsad qiladi?",
    "options": [
      "Makromatn",
      "Texnik tavsiflovchi matn",
      "Izohlovchi matn",
      "Mikromatn"
    ],
    "a": "Izohlovchi matn"
  },
  {
    "q": "Matnning qaysi turi o‘quvchini ma’lum bir pozitsiya yoki tezis tarafdori yoki unga qarshi ko‘ndirish uchun mo‘ljallangan?",
    "options": [
      "Ta’riflovchi matn",
      "Hikoya matni",
      "Argumentativ matn",
      "Izohlovchi matn"
    ],
    "a": "Argumentativ matn"
  },
  {
    "q": "Voqea, tarix, fakt yoki rivoyatlar dinamik fe’l va qo‘shimchalar yordamida tasvirlangan matnning qaysi turi?",
    "options": [
      "Izohlovchi matn",
      "Texnik tavsiflovchi matn",
      "Hikoya matni",
      "Ta’riflovchi matn"
    ],
    "a": "Hikoya matni"
  },
  {
    "q": "Faoliyatni rivojlantirish yoki maqsadga erishish yo‘llarini tushuntirishga qaratilgan o‘quv matni qaysi turdagi matn hisoblanadi?",
    "options": [
      "Ilmiy matnlar",
      "Ma’muriy matnlar",
      "Direktiv matn",
      "Huquqiy matnlar"
    ],
    "a": "Direktiv matn"
  },
  {
    "q": "Qaysi matnlar juda ko‘p texnik detallar, qadimiy atamalar va rasmiy tilni o‘z ichiga oladi va mazmunning mantiqiy va progressiv joylashuvi bilan ajralib turadi?",
    "options": [
      "Gumanistik matnlar",
      "Direktiv matnlar",
      "Huquqiy matnlar",
      "Badiiy matnlar"
    ],
    "a": "Huquqiy matnlar"
  },
  {
    "q": "Katta adabiy estetika, majoziy til va boy hissiyotlar qaysi matn turiga xosdir?",
    "options": [
      "Gazeta matnlari",
      "Raqamli matnlar",
      "Badiiy matnlar",
      "Reklama matnlari"
    ],
    "a": "Badiiy matnlar"
  },
  {
    "q": "Qanday matnlar o'quvchini xizmatdan foydalanishga yoki mahsulot sotib olishga ishontirishga qaratilgan?",
    "options": [
      "Raqamli matnlar",
      "Gumanistik matnlar",
      "Reklama matnlari",
      "Gazeta matnlari"
    ],
    "a": "Reklama matnlari"
  },
  {
    "q": "Qaysi matnlar texnik tildan foydalangan holda rasmiy yozish uslubidan foydalanadi va doimo izchil tuzilishga ega?",
    "options": [
      "Gumanistik matnlar",
      "Direktiv matnlar",
      "Ilmiy matnlar",
      "Ma’muriy matnlar"
    ],
    "a": "Ilmiy matnlar"
  },
  {
    "q": "Yunon tilidan so'zma-so'z tarjima qilingan \"bibliografiya\" so'zi nimani anglatadi?",
    "options": [
      "Kitob yozish",
      "Kitoblar ro'yxati",
      "Kitoblar haqidagi kitob",
      "Kitoblar yozish"
    ],
    "a": "Kitoblar haqidagi kitob"
  },
  {
    "q": "Bibliografiya matnga ko'ra o'quvchiga nima beradi?",
    "options": [
      "Adabiyotning mazmuni, maqsadi va asosiy masalalari",
      "Madaniy qadriyatlarning tarixi va rivojlanishi",
      "Adabiyot o‘qish bo‘yicha tavsiyalar",
      "Yangi ma'lumotlar"
    ],
    "a": "Adabiyotning mazmuni, maqsadi va asosiy masalalari"
  },
  {
    "q": "Matnda keltirilgan kutubxonaning xususiyatlari qaysi gapda ifodalangan?",
    "options": [
      "Jamiyatda faol ishtirok etishga undaydi",
      "O‘qish va axborot bilan ishlash madaniyatini tarbiyalaydi",
      "Shaxsiy hayotdagi o'zgarishlarga asos yaratadi",
      "Yuqoridagilarning barchasi"
    ],
    "a": "Yuqoridagilarning barchasi"
  },
  {
    "q": "Kurs ishi, diplom yoki boshqa ilmiy ishdagi adabiyotlar ro‘yxati matnga ko‘ra nimani ko‘rsatadi?",
    "options": [
      "Talabaning olgan bilimlarini amalda qo‘llash qobiliyati",
      "Hujjatlarning tasdiqlanishi va ishonchliligi",
      "Uning to‘g‘riligini asoslash uchun olib boriladigan mustaqil ijodiy ishlar",
      "Yuqoridagilarning barchasi"
    ],
    "a": "Yuqoridagilarning barchasi"
  },
  {
    "q": "Bibliografik fayl matnga ko‘ra nimani o‘z ichiga olishi kerak?",
    "options": [
      "Kataloglar va kartochkalar",
      "Barcha nashrlarning izi",
      "Tadqiqot mavzusiga oid barcha manbalar ro‘yxati",
      "Yuqoridagilarning barchasi"
    ],
    "a": "Yuqoridagilarning barchasi"
  },
  {
    "q": "Bibliografiyada asarlarni bilim sohalari va mavzular bo‘yicha guruhlashda qaysi tamoyildan foydalaniladi?",
    "options": [
      "Alifbo tartibida",
      "Xronologik",
      "Bibliografik",
      "Rasmiy"
    ],
    "a": "Bibliografik"
  },
  {
    "q": "Bibliografiyada nashrlar qanday guruhlarga bo‘linadi?",
    "options": [
      "Rasmiy, norasmiy, ekspert",
      "Ommaviy, shaxsiy, ichki va tashqi",
      "Badiiy, ilmiy, ommabop",
      "Rasmiy davlat, me’yoriy-yo‘riqnoma, ma’lumotnoma"
    ],
    "a": "Rasmiy davlat, me’yoriy-yo‘riqnoma, ma’lumotnoma"
  },
  {
    "q": "Qaysi hujjatlar bibliografiyada har doim ro‘yxatning boshida joylashadi?",
    "options": [
      "Kitoblar, jurnallar, gazetalar",
      "Konstitutsiya, Kodekslar, Qonunlar, Prezident Farmonlari, Hukumat qarorlari",
      "Maqolalar va hisobotlar",
      "Xatlar va buyruqlar"
    ],
    "a": "Konstitutsiya, Kodekslar, Qonunlar, Prezident Farmonlari, Hukumat qarorlari"
  },
  {
    "q": "Muayyan muallifning qarashlari dinamikasini kuzatish uchun bibliografiyada uning asarlari qanday tartibda joylashtiriladi?",
    "options": [
      "Sarlavha yoki nashr yili bo‘yicha alifbo tartibida",
      "Sarlavha yoki nashr yili bo‘yicha tasodifiy",
      "Sarlavha yoki nashr yili bo‘yicha bevosita xronologik tartibda",
      "Sarlavha yoki nashr yili bo‘yicha teskari xronologik tartibda"
    ],
    "a": "Sarlavha yoki nashr yili bo‘yicha bevosita xronologik tartibda"
  },
  {
    "q": "Bibliografiyada chet tilidagi manbalarga iqtibos keltirishda qanday qo‘shimcha qadamlar qo‘yiladi?",
    "options": [
      "Chet tillaridagi adabiyotlar ro‘yxat boshiga joylashtiriladi",
      "Chet tillardagi barcha havolalar o‘chiriladi",
      "Qo‘shimcha harf qatori yaratiladi va chet tillaridagi adabiyotlar ro‘yxat oxiriga joylashtiriladi",
      "Chet tillaridagi adabiyotlar alohida bo‘limsiz beriladi"
    ],
    "a": "Qo‘shimcha harf qatori yaratiladi va chet tillaridagi adabiyotlar ro‘yxat oxiriga joylashtiriladi"
  },
  {
    "q": "Rejaning qanday ta'rifi har qanday taqdimot qismlarining nisbiy joylashishini aks ettiradi?",
    "options": [
      "Reja - bu ishda ko'rib chiqilgan asosiy masalalar, muammolar, faktlarni ma'lum bir ketma-ketlikda sanab o'tish",
      "Reja - sarlavhalar ko'rinishidagi asosiy fikrlar ro'yxati",
      "Reja o‘z-o‘zini nazorat qilish va o‘zini o‘zi qadrlash vositasidir",
      "Reja - qismlarning nisbiy joylashishi, qandaydir taqdimot uchun qisqacha dastur"
    ],
    "a": "Reja - qismlarning nisbiy joylashishi, qandaydir taqdimot uchun qisqacha dastur"
  },
  {
    "q": "Ikki bo‘lakli gap qaysi reja turi bo‘lib, matnning semantik qismining asosiy mazmunini bildiradi?",
    "options": [
      "Oddiy reja",
      "Savolli reja",
      "Tezisli reja",
      "Nominativ reja"
    ],
    "a": "Tezisli reja"
  },
  {
    "q": "Rejaning qaysi turi o‘z fikrlarini shakllantirish uchun so‘roq gaplardan foydalanadi?",
    "options": [
      "Tezisli reja",
      "Murakkab reja",
      "Nominativ reja",
      "Savolli reja"
    ],
    "a": "Savolli reja"
  },
  {
    "q": "Matn tuzilishini eng umumiy darajada ochib berish va axborot markazlarini tuzatish uchun qaysi turdagi reja qo‘llaniladi?",
    "options": [
      "Savolli reja",
      "Oddiy reja",
      "Nominativ reja",
      "Tezisli reja"
    ],
    "a": "Nominativ reja"
  },
  {
    "q": "Matnga ko‘ra tezis konspekti va tezis bayonining asosiy farqi nimada?",
    "options": [
      "Tezislar matn qismlari o‘rtasidagi tizimli aloqalarni aks ettiradi, tezis konturi esa sarlavha ko‘rinishidagi asosiy fikrlar ro‘yxatidan iborat",
      "Tezislar o'z-o'zini nazorat qilish va o'zini o'zi baholash uchun ishlatiladi va tezis rejasi o'qilgan materialni tushunish va eslab qolishga yordam beradi",
      "Tezislar matnning asosiy qoidalarini qisqacha ifodalaydi, tezis rejasi esa matnning semantik qismining asosiy mazmunini aks ettiradi",
      "Tezislarda savol so‘zlardan foydalaniladi, tezis konspekti esa ikki qismli gapdir"
    ],
    "a": "Tezislar matnning asosiy qoidalarini qisqacha ifodalaydi, tezis rejasi esa matnning semantik qismining asosiy mazmunini aks ettiradi"
  },
  {
    "q": "Muvaffaqiyatli universitet ta'lim va tadqiqot faoliyatining muhim jihatlaridan biri nima?",
    "options": [
      "Eksperimental tadqiqotlar",
      "Lingvistik tadqiqotlar",
      "Akademik yozuv",
      "Xalqaro hamkorlik"
    ],
    "a": "Akademik yozuv"
  },
  {
    "q": "Akademik yozuv tizimini ishlab chiquvchilar qanday janrlarni ajratadilar?",
    "options": [
      "Tasviriy va ilmiy maqolalar",
      "Akademik va ilmiy publitsistik matnlar",
      "Falsafiy va sotsiologik risolalar",
      "Birlamchi va ikkinchi darajali janrlar"
    ],
    "a": "Birlamchi va ikkinchi darajali janrlar"
  },
  {
    "q": "Qayta ishlangan birlamchi matnning ma’no jihatdan yaqin taqdimoti qaysi janrga tegishli?",
    "options": [
      "Ilmiy maqola",
      "Dissertatsiya",
      "Referat",
      "Annotatsiya"
    ],
    "a": "Referat"
  },
  {
    "q": "Ilmiy matnning kirish qismida nimalar bo‘lishi kerak?",
    "options": [
      "Ilmiy tadqiqotning batafsil tavsifi",
      "Boshqa olimlarning tadqiqotlariga havolalar",
      "Mavzuni qisqacha ochib berish va o‘quvchini tanishtirish",
      "Mavzu bo‘yicha ko‘rilgan masalalarni sanab o‘tish"
    ],
    "a": "Mavzuni qisqacha ochib berish va o‘quvchini tanishtirish"
  },
  {
    "q": "Ilmiy matnni yakunlashda nima qilish kerak?",
    "options": [
      "Ilmiy tadqiqotlarning batafsil tahlilini berish",
      "Mavzu bo‘yicha muhokama qilingan masalalarni sanab o‘tish",
      "Ilmiy matnni tanqidiy baholash",
      "Xulosalar chiqariladi va kelajak istiqbollari belgilanadi"
    ],
    "a": "Xulosalar chiqariladi va kelajak istiqbollari belgilanadi"
  },
  {
    "q": "Ilmiy matn yozishda nimalardan qochish kerak?",
    "options": [
      "Manba mohiyatining qisqacha mazmuni",
      "O‘rganishning samarali qismini tushunish",
      "Boshqa olimlarning asarlaridan iqtibos va havolalar",
      "Amaliy ahamiyatsiz fazoviy fikrlar"
    ],
    "a": "Amaliy ahamiyatsiz fazoviy fikrlar"
  },
  {
    "q": "Ilmiy matn yozishda qaysi jihatlarni hisobga olish kerak?",
    "options": [
      "Izohsiz maxsus atamalardan foydalanish",
      "Aniqlik, gaplarning lo‘ndaligi va grammatika qoidalariga rioya qilish",
      "Murakkab gap tuzilishi va noaniq fikrlar",
      "Boshqa olimlarning tadqiqotlariga havolalarning kamligi"
    ],
    "a": "Aniqlik, gaplarning lo‘ndaligi va grammatika qoidalariga rioya qilish"
  },
  {
    "q": "Ilmiy-publisistik (ommaviy fan) janri nima uchun ishlatiladi?",
    "options": [
      "Ilmiy muammolarni muhokama qilish va ularning yechimlarini topish",
      "O‘z tadqiqotingiz natijalarini taqdim etish",
      "Ilmiy matnni tahlil qilish va tanqidiy baholash",
      "Keng ijtimoiy sohada ekspert nuqtayi nazarini nashr etish"
    ],
    "a": "Keng ijtimoiy sohada ekspert nuqtayi nazarini nashr etish"
  },
  {
    "q": "Akademik yozuv tizimini ishlab chiquvchilar so‘nggi o‘n yilliklarda nima qilishdi?",
    "options": [
      "Akademik yozuvning turli janrlarining xususiyatlarini egallash",
      "Rus ta'limi uchun yangi fanlarni ishlab chiqish",
      "Dunyodagi ilmiy nashrlar tarkibini tahlil qilish",
      "Turli mamlakatlar o‘rtasida ilmiy-ma’rifiy aloqalarni amalga oshirish"
    ],
    "a": "Turli mamlakatlar o‘rtasida ilmiy-ma’rifiy aloqalarni amalga oshirish"
  },
  {
    "q": "Ilmiy matnda fikrning ravshanligi, aniqligi va bir ma’nosiz ifodalanishini nima ta’minlaydi?",
    "options": [
      "Mulohaza va munozaraning mavjudligi",
      "Murakkab gap va atamalardan foydalanish",
      "Qarama-qarshi tadqiqot va materiallarni jalb qilish",
      "Akademik yozuvning tuzilishi va mazmuni"
    ],
    "a": "Akademik yozuvning tuzilishi va mazmuni"
  },
  {
    "q": "Ilmiy maqolaning referati nima?",
    "options": [
      "Tadqiqot usullarini batafsil tahlil qilish",
      "Maqolaning asosiy tematik bo‘limlarini ko‘rib chiqish",
      "Ilmiy ishning asosiy mohiyatining qisqacha mazmuni",
      "Ish haqidagi barcha ma'lumotlarning to‘liq tavsifi"
    ],
    "a": "Ilmiy ishning asosiy mohiyatining qisqacha mazmuni"
  },
  {
    "q": "Axborotli referat qanday tuzilgan?",
    "options": [
      "Asl artikl qismlarining so‘zma-so‘z nusxasi sifatida",
      "Barcha keltirilgan manbalarning oddiy ro'yxati sifatida",
      "Maqolaning asosiy xulosalarini umumlashtirish sifatida",
      "Muammoni chuqur tushunishni talab qiluvchi konspekt sifatida"
    ],
    "a": "Maqolaning asosiy xulosalarini umumlashtirish sifatida"
  },
  {
    "q": "Referat dissertatsiya yozishni rejalashtirayotgan talabalarga qanday imkoniyat yaratadi?",
    "options": [
      "Maqolaning asosiy xulosalari va g'oyalari ro'yxatini tuzish",
      "Ilmiy tadqiqot jarayonini batafsil tahlil qilish",
      "O‘z ishingga konspekt yozishda mashq qilish",
      "Barcha mavjud manbalar va materiallarni o'rganish"
    ],
    "a": "O‘z ishingga konspekt yozishda mashq qilish"
  },
  {
    "q": "Referat ko’rinishdagi jurnallar nima uchun mavjud?",
    "options": [
      "Ilmiy yozish uslubining asosiy tamoyillarini tavsiflash",
      "Mavzu bo'yicha adabiyotlarning to'liq ro'yxatini taqdim etish",
      "Eng so‘nggi jahon tadqiqotlaridan xabardor bo‘lish",
      "Ilmiy usullar va muammolarni batafsil tahlil qilish"
    ],
    "a": "Eng so‘nggi jahon tadqiqotlaridan xabardor bo‘lish"
  },
  {
    "q": "Ilmiy jurnalda berilgan mavzu bo'yicha referat yozishdan oldin nima qilish kerak?",
    "options": [
      "Maqolani o'qishni o'tkazib yuborish va darhol boshlash",
      "Axborotni erkin taqdim etish va qayta ishlashga ruxsat berish",
      "O'zingizni faqat muallifning asosiy g'oyasini o'rganish bilan cheklash",
      "Ilmiy jurnaldan nashrlarni batafsil o'qish"
    ],
    "a": "Ilmiy jurnaldan nashrlarni batafsil o'qish"
  },
  {
    "q": "Ilmiy ishning kirish qismida qanday savollar yoritilishi kerak?",
    "options": [
      "Kompozitsion tuzilish va muammoli tahlil",
      "Mualliflarning xususiyatlari va erishilgan natijalarni baholash",
      "Qo'llaniladigan usullar va tadqiqot natijalari",
      "Tadqiqotning asosiy g‘oyasi, maqsadi va predmeti"
    ],
    "a": "Tadqiqotning asosiy g‘oyasi, maqsadi va predmeti"
  },
  {
    "q": "Qaysi bo'lim eng hajmli va ilmiy ishning asosiy mohiyati bayonini o'z ichiga olishi kerak?",
    "options": [
      "Kirish qismi",
      "Ishning xususiyatlari",
      "Muammolar va masalalar tahlili",
      "Kompozision qismi"
    ],
    "a": "Muammolar va masalalar tahlili"
  },
  {
    "q": "Ilmiy izlanishlar natijasida xulosalar qanday tuzilishi kerak?",
    "options": [
      "Usullarning batafsil tavsifi shaklida",
      "Keng fikrlash tarzida",
      "Faktlarning oddiy ro'yxati ko'rinishida",
      "Xulosa shaklida nuqtama-nuqta"
    ],
    "a": "Xulosa shaklida nuqtama-nuqta"
  },
  {
    "q": "Nima uchun ilmiy ishlarni yozishda qolipli iboralardan foydalanish tavsiya etiladi?",
    "options": [
      "Murakkabroq va rasmiy tuzilma yaratish",
      "Ilmiy tadqiqotning batafsillik darajasini oshirish",
      "O'quvchilarning ilmiy ish mavzusini tushunishlarini yaxshilash",
      "Tajribasiz talabalarning ishini yengillashtirish"
    ],
    "a": "Tajribasiz talabalarning ishini yengillashtirish"
  },
  {
    "q": "Ushbu turdagi ish kimlar uchun alohida ahamiyatga ega?",
    "options": [
      "Professor va o‘qituvchilar",
      "Turli fan sohalari olimlari",
      "Bakalavr talabalari",
      "Magistratura va aspirantlar"
    ],
    "a": "Magistratura va aspirantlar"
  },
  {
    "q": "“Esse” so‘zi nimani anglatadi va uning kelib chiqishi?",
    "options": [
      "Muayyan mavzuni izohlashga urinish",
      "Ilmiy tadqiqotlar rejasi",
      "Erkin kompozitsiyaning nasriy inshosi",
      "Tizimli adabiy ijod"
    ],
    "a": "Erkin kompozitsiyaning nasriy inshosi"
  },
  {
    "q": "“Esse” janri qanday xususiyatlar bilan tavsiflanadi?",
    "options": [
      "Rasmiy tuzilma va tahlilning o‘ziga xos usullari",
      "Muammolarni keng tahlil qilish va har tomonlama xulosalar chiqarish",
      "Individual taassurotlar va yangi, sub'ektiv rangli so‘z",
      "Ob'ektiv ma'lumotlar va faktlarni tizimli ravishda taqdim etish"
    ],
    "a": "Individual taassurotlar va yangi, sub'ektiv rangli so‘z"
  },
  {
    "q": "Matnga ko‘ra insho yozishdan maqsad nima?",
    "options": [
      "Berilgan qoidalar bo‘yicha matn tuzilishini baholash",
      "Faktlarni tizimli ravishda taqdim etish",
      "Muallifning ish tajribasini to‘liq tavsiflash",
      "Mustaqil ijodiy fikrlash va yozishni rivojlantirish"
    ],
    "a": "Mustaqil ijodiy fikrlash va yozishni rivojlantirish"
  },
  {
    "q": "Qaysi janr so‘nggi yillarda mashhur bo‘lib, ko‘pincha ta’lim muassasasiga hujjat topshirishda yoki ish topishda topshiriq sifatida taklif etiladi?",
    "options": [
      "Roman",
      "Drama",
      "Esse",
      "Ocherk"
    ],
    "a": "Esse"
  },
  {
    "q": "Yosh mutaxassis essesi uchun qaysi mavzu eng dolzarb hisoblanadi?",
    "options": [
      "Ilmiy tadqiqotlarning rivojlanish tarixi",
      "Zamonaviy adabiy tanqidga taqriz",
      "Men va mening karyeram",
      "Zamonamizning falsafiy muammolari"
    ],
    "a": "Men va mening karyeram"
  },
  {
    "q": "Esse qanday tuzilish bilan tavsiflanadi?",
    "options": [
      "Asosiy va ikkinchi darajali g‘oyalar bilan taqsimlangan tuzilma",
      "Vaqt chegaralarini ko‘rsatuvchi xronologik tuzilma",
      "Halqa tuzilishi, jumladan kirish, tezislar, dalillar va xulosalar",
      "Asosiy fikr va misollar bilan chiziqli tuzilish"
    ],
    "a": "Halqa tuzilishi, jumladan kirish, tezislar, dalillar va xulosalar"
  },
  {
    "q": "Esse yozishda qaysi jihatlarga e’tibor qaratish lozim?",
    "options": [
      "Qattiq mantiq va qat’iy shakl",
      "Formatlashtirishga rioya qilish va manbalarni keltirish",
      "Gaplarning murakkabligi va o‘quv uslubi",
      "Diqqatni muammoga qaratish, paragraflar o‘rtasida mantiqiy aloqa va uslubning emotsionalligi"
    ],
    "a": "Diqqatni muammoga qaratish, paragraflar o‘rtasida mantiqiy aloqa va uslubning emotsionalligi"
  },
  {
    "q": "Mazmuniga ko‘ra esselarning qanday turlari mavjud?",
    "options": [
      "Ilmiy, badiiy, publitsistik va diniy",
      "Analitik, ijodiy, hujjatli va emotsional",
      "Falsafiy, adabiy-tanqidiy, tarixiy va boshqalar",
      "Mantiqiy, tavsiflovchi, bayoniy va aks ettiruvchi"
    ],
    "a": "Falsafiy, adabiy-tanqidiy, tarixiy va boshqalar"
  },
  {
    "q": "Esselar adabiy shaklga ko‘ra qanday tasniflanadi?",
    "options": [
      "Ilmiy maqolalar, dissertatsiyalar va publitsistik matnlar",
      "She’rlar, dramalar va romanlar",
      "Sharhlar, lirik miniatyuralar, eslatmalar, kundalik sahifalari, xatlar va boshqalar",
      "Tahlillar, tanqidlar va tadqiqotlar"
    ],
    "a": "Sharhlar, lirik miniatyuralar, eslatmalar, kundalik sahifalari, xatlar va boshqalar"
  },
  {
    "q": "Esselarning tavsiya etilgan tasnifida qanday guruhlar ajratiladi?",
    "options": [
      "Stilistik, kompozitsion va adabiy esse",
      "Ilmiy, tadqiqot va ilmiy-ommabop esse",
      "Shaxsiy, subyektiv va obyektiv esse",
      "Hissiy, mantiqiy va tahliliy esse"
    ],
    "a": "Shaxsiy, subyektiv va obyektiv esse"
  },
  {
    "q": "Akademik yozuv nima: esse?",
    "options": [
      "Bu qisqacha tadqiqot bayonoti",
      "Bu badiiy ocherk emas",
      "Falsafiy, adabiy tanqid, publitsistik va badiiy adabiyot janri bo‘lib, muayyan masalani erkin va individual mualliflik uslubida yoritadi",
      "Bu falsafiy insho emas, bir nechta oson tushunaladigan paragraflar"
    ],
    "a": "Falsafiy, adabiy tanqid, publitsistik va badiiy adabiyot janri bo‘lib, muayyan masalani erkin va individual mualliflik uslubida yoritadi"
  },
  {
    "q": "Xat qanday to'g'ri yoziladi?",
    "options": [
      "Xatni xulosangiz bilan boshlash kerak",
      "Xulosani harakatga chaqirish sifatida takrorlash kerak",
      "Har bir dalilni dalil bilan tasdiqlash kerak",
      "Har doim nima haqida yozmoqchi ekanligingiz haqida aniq tasavvurga ega bo‘lish kerak"
    ],
    "a": "Har doim nima haqida yozmoqchi ekanligingiz haqida aniq tasavvurga ega bo‘lish kerak"
  },
  {
    "q": "Akademik hisobot nima?",
    "options": [
      "Bu badiiy insho emas",
      "Tahlillar, tanqidlar va sharhlar",
      "Xabar, harakatlaringiz va ishlaringiz haqida doklad",
      "O‘z fikringizni erkin ifoda etish"
    ],
    "a": "Xabar, harakatlaringiz va ishlaringiz haqida doklad"
  },
  {
    "q": "Akademik nima?",
    "options": [
      "O‘quv yili",
      "Akademik rasm",
      "O‘rnatilgan an’analarga rioya qilish (fan, san’atda)",
      "O‘quv (oliy o‘quv yurtlariga nisbatan qo‘llaniladigan)"
    ],
    "a": "O‘rnatilgan an’analarga rioya qilish (fan, san’atda)"
  },
  {
    "q": "Matnning mohiyati nima deb ataladi?",
    "options": [
      "Tashqi",
      "Yashirin",
      "Tagmatn",
      "Ichki"
    ],
    "a": "Tagmatn"
  },
  {
    "q": "Tavsiflash nima?",
    "options": [
      "Ketma-ket harakatlar va voqealar haqida hikoya qiluvchi matn turi",
      "Matnning bu turi publitsistikada va ilmiy ishlarida fikrni isbotlashga qaratilgan",
      "Adabiyotshunoslik va tilshunoslikda predmet yoki hodisalarni batafsil tasvirlash uchun ishlatiladigan kompozitsion shakl",
      "Turli uslublarda farq qiluvchi umumiy nutq shakli"
    ],
    "a": "Adabiyotshunoslik va tilshunoslikda predmet yoki hodisalarni batafsil tasvirlash uchun ishlatiladigan kompozitsion shakl"
  },
  {
    "q": "Matn bu ...?",
    "options": [
      "Matnlar uslubi va ko‘rinishi jihatidan farqlanadi",
      "Matn nutqning eng katta birligi bo‘lib, yozma yoki og‘zaki bayon hisoblanadi",
      "Yagona fikr bilan birlashgan gaplardan iborat bo‘lib, ichki uyushqoqlik va to‘liqlikni nazarda tutadi",
      "Yuqoridagilarning barchasi"
    ],
    "a": "Yuqoridagilarning barchasi"
  },
  {
    "q": "Akademik yozish uchun qanday malakalar kerak?",
    "options": [
      "Ilmiy maqolalarni muallifning tadqiqot strategiyasi nuqtai nazaridan tahlil qila olish",
      "Mustaqil ravishda ilmiy maqolalarga tezis va annotatsiya yaratish malakalariga ega bo‘lish",
      "Talabalar akademik yozuv janrlarining asosiy xususiyatlarini bilishlari kerak: ilmiy maqola, referat, insho",
      "Yuqoridagilarning barchasi"
    ],
    "a": "Yuqoridagilarning barchasi"
  },
  {
    "q": "Ingliz tilida akademik yozuv nima?",
    "options": [
      "Academic presentation – akademik yozuv",
      "Academic writing – akademik yozuv",
      "Academic speech – akademik yozuv",
      "Academic listen – akademik yozish"
    ],
    "a": "Academic writing – akademik yozuv"
  },
  {
    "q": "Hujjatlar mazmuniga ko‘ra necha turga bo‘linadi?",
    "options": [
      "Rasmiy va shaxsiy hujjatlar",
      "Namunaviy va qolipli hujjatlar",
      "Ichki va tashqi hujjatlar",
      "Sodda va murakkab hujjatlar"
    ],
    "a": "Sodda va murakkab hujjatlar"
  },
  {
    "q": "Qaysi uslub uchun frazeologik birikma ishlatilishi xos emas ?",
    "options": [
      "Badiiy va rasmiy",
      "So‘zlashuv va ilmiy",
      "Ilmiy va rasmiy",
      "Ilmiy va badiiy"
    ],
    "a": "Ilmiy va rasmiy"
  },
  {
    "q": "Til madaniyatining asosiy tekshirish obyekti nima ?",
    "options": [
      "Uslubiyat",
      "Lug‘at boyligi",
      "Imlo",
      "Adabiy til me’yorlari"
    ],
    "a": "Adabiy til me’yorlari"
  },
  {
    "q": "Adabiy me’yorning qanday ko‘rinishi mavjud ?",
    "options": [
      "Fonetik",
      "Imloviy",
      "Og‘zaki va yozma",
      "Uslubiy"
    ],
    "a": "Og‘zaki va yozma"
  },
  {
    "q": "Hujjat matni qanday talablar asosida ko‘riladi ?",
    "options": [
      "Ixchamlik, lo‘ndalik",
      "Mazmuniy to‘liqlik",
      "Xolislik, aniqlik",
      "Barcha javoblar to‘g‘ri"
    ],
    "a": "Barcha javoblar to‘g‘ri"
  },
  {
    "q": "Adabiy normaning qanday ko‘rinishlari mavjud ?",
    "options": [
      "Dialektal norma",
      "Og‘zaki va yozma",
      "Jargonlar normasi",
      "Uzus"
    ],
    "a": "Og‘zaki va yozma"
  },
  {
    "q": "Qaysi uslubda atamalar kamroq qo‘llaniladi ?",
    "options": [
      "Ilmiy – ommabop uslubda",
      "Rasmiy uslubda",
      "Badiiy uslubda",
      "Ommabop uslubda"
    ],
    "a": "Badiiy uslubda"
  },
  {
    "q": "Qaysi uslubda qo‘shma gaplar faol qo‘llanadi ?",
    "options": [
      "Badiiy uslubda",
      "Ommabop uslubda",
      "Rasmiy uslubda",
      "Ilmiy uslubda"
    ],
    "a": "Ilmiy uslubda"
  },
  {
    "q": "So‘zlashuv uslubi nechaga bo‘linadi va qaysilari ?",
    "options": [
      "2 ga rasmiy va ilmiy uslub",
      "2 ga og‘zaki va ilmiy uslub",
      "2 ga adabiy va rasmiy uslub",
      "2 ga og‘zaki va adabiy so‘zlashuv uslubi"
    ],
    "a": "2 ga og‘zaki va adabiy so‘zlashuv uslubi"
  },
  {
    "q": "Xodimlar faoliyatiga doir hujjatlar turiga qaysi hujjatlar kiradi ?",
    "options": [
      "Ariza, guvohnoma, buyruq",
      "Da’vo xati, kafolat xati, eslatma xat",
      "Vasiyatnoma, ma’lumotnoma, ishonchnoma",
      "Mehnat daftarchasi, shaxsiy hujjatlar yig‘indisi"
    ],
    "a": "Mehnat daftarchasi, shaxsiy hujjatlar yig‘indisi"
  },
  {
    "q": "Rasmiy uslubda qanday matnlar tuziladi ?",
    "options": [
      "E’lonlar, she’rlar, romanlar",
      "Qarorlar, idora hujjatlari, dostonlar",
      "Hujjatlar, ish yuritish qog‘ozlari, she’rlar",
      "E’lonlar, qarorlar, qonunlar"
    ],
    "a": "E’lonlar, qarorlar, qonunlar"
  },
  {
    "q": "Matn nima ?",
    "options": [
      "Gap",
      "So‘z",
      "Tinish belgilari",
      "A , B , C"
    ],
    "a": "A , B , C"
  },
  {
    "q": "Quyidagi matn qaysi uslubga mansub?\nMen dunyoga kelgan kundanoq\nVatanim deb seni uyg‘ondim.\nOdam baxti birgina senda\nBo‘lurida mukammal qondim.",
    "options": [
      "So‘zlashuv uslubi",
      "Publisistik uslub",
      "Rasmiy uslub",
      "Badiiy uslub"
    ],
    "a": "Badiiy uslub"
  },
  {
    "q": "Ilmiy uslubga xos hususiyat ?",
    "options": [
      "Ko‘chma ma’noli so‘zlarni qo‘llash",
      "Neologizmlarni qo‘llash",
      "So‘z va atamalarni ko‘proq qo‘llash",
      "Eskirgan so‘zlarni qo‘llash"
    ],
    "a": "So‘z va atamalarni ko‘proq qo‘llash"
  },
  {
    "q": "Badiiy uslubga xos xususiyat qaysi javobda berilgan ?",
    "options": [
      "Tasviriy vositalarni qo‘llamaslik",
      "Soddalik , tantanavorlik",
      "Badiiylik, atamalarni qo‘llash",
      "Obrazlilik , estetik ta’sir etish vazifasi"
    ],
    "a": "Obrazlilik , estetik ta’sir etish vazifasi"
  },
  {
    "q": "Qonun matnlari, farmonlar, buyruqlar, ariza… kabi hujjatlar qaysi uslubda yoziladi ?",
    "options": [
      "So‘zlashuv uslubda",
      "Ilmiy uslubda",
      "Badiiy uslubda",
      "Rasmiy uslubda"
    ],
    "a": "Rasmiy uslubda"
  },
  {
    "q": "Rasmiy uslubda ko‘pincha qanday gaplardan foydalaniladi ?",
    "options": [
      "Faqat darak gaplardan",
      "Ritorik so‘roq gaplardan",
      "Darak va undov gaplardan",
      "Darak va buyruq gaplardan"
    ],
    "a": "Darak va buyruq gaplardan"
  },
  {
    "q": "Til va unga xos asosiy hususiyatlar nimalardan iborat ?",
    "options": [
      "Nutq",
      "So‘z",
      "Til",
      "Nutqiy faoliyat"
    ],
    "a": "Nutqiy faoliyat"
  },
  {
    "q": "Matnning belgilari nimalardan iborat ?",
    "options": [
      "Tasvir",
      "Mulohaza",
      "Fikr",
      "U yoki bu hodisa haqidagi mazmun birligi"
    ],
    "a": "U yoki bu hodisa haqidagi mazmun birligi"
  },
  {
    "q": "Matnning uslubini aniqlang.\nMaishatman kayfu safo bir yoqda ,\nMehnat bilan jabro jafo bir yoqda",
    "options": [
      "Rasmiy",
      "So‘zlashuv",
      "Publisistik",
      "Badiiy"
    ],
    "a": "Badiiy"
  },
  {
    "q": "Ilmiy uslubga xos hususiyat ?",
    "options": [
      "Ko‘chma ma’noli so‘zlarni qo‘llash",
      "Neologizmlarni qo‘llash",
      "So‘z va atamalarni ko‘proq qo‘llash",
      "Eskirgan so‘zlarni qo‘llash"
    ],
    "a": "So‘z va atamalarni ko‘proq qo‘llash"
  },
  {
    "q": "Badiiy uslubga xos xususiyat qaysi javobda berilgan ?",
    "options": [
      "Tasviriy vositalarni qo‘llamaslik",
      "Soddalik , tantanavorlik",
      "Badiiylik, atamalarni qo‘llash",
      "Obrazlilik , estetik ta’sir etish vazifasi"
    ],
    "a": "Obrazlilik , estetik ta’sir etish vazifasi"
  },
  {
    "q": "Qonun matnlari, farmonlar, buyruqlar, ariza… kabi hujjatlar qaysi uslubda yoziladi ?",
    "options": [
      "So‘zlashuv uslubda",
      "Ilmiy uslubda",
      "Badiiy uslubda",
      "Rasmiy uslubda"
    ],
    "a": "Rasmiy uslubda"
  },
  {
    "q": "Rasmiy uslubda ko‘pincha qanday gaplardan foydalaniladi ?",
    "options": [
      "Faqat darak gaplardan",
      "Ritorik so‘roq gaplardan",
      "Darak va undov gaplardan",
      "Darak va buyruq gaplardan"
    ],
    "a": "Darak va buyruq gaplardan"
  },
  {
    "q": "Til va unga xos asosiy hususiyatlar nimalardan iborat ?",
    "options": [
      "Nutq",
      "So‘z",
      "Til",
      "Nutqiy faoliyat"
    ],
    "a": "Nutqiy faoliyat"
  },
  {
    "q": "Matnning belgilari nimalardan iborat ?",
    "options": [
      "Tasvir",
      "Mulohaza",
      "Fikr",
      "U yoki bu hodisa haqidagi mazmun birligi"
    ],
    "a": "U yoki bu hodisa haqidagi mazmun birligi"
  },
  {
    "q": "Matnning uslubini aniqlang.\nMaishatman kayfu safo bir yoqda ,\nMehnat bilan jabro jafo bir yoqda",
    "options": [
      "Rasmiy",
      "So‘zlashuv",
      "Publisistik",
      "Badiiy"
    ],
    "a": "Badiiy"
  },
  


]

    },
    "history": {
        "name": "📜 Tarix",
        "questions": [
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2022–2026-yillarga mo‘ljallangan Taraqqiyot strategiyasi nechta ustuvor yo‘nalishdan iborat?",
    "options": ["5 ta", "6 ta", "7 ta", "8 ta"],
    "a": "7 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Prezidenti farmonlari va qarorlarining ijrosini ta’minlovchi organ qaysi?",
    "options": [
      "O‘zbekiston Respublikasi Oliy Sudi",
      "O‘zbekiston Respublikasi Vazirlar Mahkamasi",
      "Oliy Majlis",
      "Konstitutsiyaviy sud"
    ],
    "a": "O‘zbekiston Respublikasi Vazirlar Mahkamasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasining hududi qancha?",
    "options": [
      "346,6 ming km²",
      "576,7 ming km²",
      "448,9 ming km²",
      "946,6 ming km²"
    ],
    "a": "448,9 ming km²"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Paxta ishi” deb atalgan siyosiy qatag‘onlar davrida 1983-yilda tuzilgan tergov guruhi rahbarlari kimlar edi?",
    "options": [
      "D.X. Bozorov va P.X. Ivanov",
      "T.X. Gdlyan va N.V. Ivanov",
      "A.D. Molotov va S. Beriya",
      "R. Nishonov va U. Ho‘jayev"
    ],
    "a": "T.X. Gdlyan va N.V. Ivanov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda Prezidentlik lavozimi qachon joriy etilgan?",
    "options": [
      "1991-yil 31-avgust",
      "1990-yil 24-mart",
      "1991-yil 29-dekabr",
      "1992-yil 8-dekabr"
    ],
    "a": "1990-yil 24-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Mustaqil O‘zbekiston Respublikasida birinchi muqobil prezidentlik saylovlari qachon bo‘lib o‘tgan?",
    "options": [
      "1992-yil 2-mart",
      "1990-yil 24-mart",
      "1991-yil 29-dekabr",
      "1991-yil 31-avgust"
    ],
    "a": "1991-yil 29-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi nechta davlat bilan chegaradosh?",
    "options": ["3 ta", "4 ta", "5 ta", "6 ta"],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbek tiliga davlat tili maqomini berish to‘g‘risidagi Qonun qachon qabul qilingan?",
    "options": [
      "1990-yil 20-iyun",
      "1989-yil 21-oktyabr",
      "1991-yil 31-avgust",
      "1992-yil 8-dekabr"
    ],
    "a": "1989-yil 21-oktyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1992-yil 10-dekabrda O‘zbekiston Respublikasining qaysi davlat ramzi qabul qilingan?",
    "options": [
      "Davlat bayrog‘i",
      "Davlat gerbi",
      "Davlat madhiyasi",
      "Konstitutsiya"
    ],
    "a": "Davlat madhiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Davlat va jamiyat hayotining eng muhim masalalari xalq muhokamasiga qo‘yilishi nima deb ataladi?",
    "options": [
      "Ombudsman",
      "Referendum",
      "Muqobil saylov",
      "Umumxalq saylovi"
    ],
    "a": "Referendum"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1991-yil 18-noyabrda O‘zbekiston Respublikasining qaysi davlat ramzi qabul qilingan?",
    "options": [
      "Davlat madhiyasi",
      "Davlat gerbi",
      "Davlat bayrog‘i",
      "Konstitutsiya"
    ],
    "a": "Davlat bayrog‘i"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasining milliy valyutasi — so‘m qachondan muomalaga kiritildi?",
    "options": [
      "1992-yil 8-dekabrdan",
      "1994-yil 1-iyuldan",
      "1993-yil 1-sentabrdan",
      "1995-yil 1-yanvardan"
    ],
    "a": "1994-yil 1-iyuldan"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Davlat hokimiyati nechta bo‘g‘inga bo‘linadi?",
    "options": ["2", "3", "4", "5"],
    "a": "3"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasida viloyat va Toshkent shahar hokimlarini kim tayinlaydi?",
    "options": [
      "Oliy Majlis",
      "Prezident",
      "Vazirlar Mahkamasi",
      "Xalq deputatlari kengashi"
    ],
    "a": "Prezident"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Tuman va shahar hokimlarini kim tayinlaydi?",
    "options": [
      "Prezident",
      "Viloyat hokimi",
      "Oliy Majlis",
      "Senat"
    ],
    "a": "Viloyat hokimi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasida necha yoshga to‘lgan shaxslar saylash huquqiga ega?",
    "options": ["16 yosh", "17 yosh", "18 yosh", "21 yosh"],
    "a": "18 yosh"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda faoliyat yuritayotgan siyosiy partiyalar qaysilar?",
    "options": [
      "O‘zXDP, O‘zLiDeP, Adolat SDP, Milliy tiklanish, Ekologik partiya",
      "Birlik va Erk partiyalari",
      "Faqat O‘zXDP va O‘zLiDeP",
      "Milliy tiklanish va To‘maris harakati"
    ],
    "a": "O‘zXDP, O‘zLiDeP, Adolat SDP, Milliy tiklanish, Ekologik partiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Necha yoshga to‘lgan fuqarolar viloyat, tuman, shahar Kengashlariga deputat bo‘lib saylanishi mumkin?",
    "options": ["18 yosh", "21 yosh", "25 yosh", "30 yosh"],
    "a": "21 yosh"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda Bosh vazir Virtual qabulxonasi va Prezident Xalq qabulxonalari qaysi yilda tashkil etildi?",
    "options": ["2015-yil", "2016-yil", "2017-yil", "2018-yil"],
    "a": "2016-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Yurtimizda “Xalq bilan muloqot va inson manfaatlari yili” deb e’lon qilingan yil qaysi?",
    "options": ["2016-yil", "2017-yil", "2018-yil", "2019-yil"],
    "a": "2017-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1991-yilda yurtimizda qaysi allomaning 550 yilligi nishonlangan edi?",
    "options": [
      "Mirzo Ulug‘bek",
      "Bobur",
      "Alisher Navoiy",
      "Ibn Sino"
    ],
    "a": "Alisher Navoiy"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Yurtimizda Ahmad al-Farg‘oniyning 1200 yillik yubileyi qachon nishonlangan?",
    "options": [
      "1996-yilda",
      "1998-yilda",
      "2000-yilda",
      "2001-yilda"
    ],
    "a": "1998-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Yurtimizda Imom al-Buxoriyning 1225 yillik yubileyi qachon nishonlangan?",
    "options": [
      "1996-yilda",
      "1997-yilda",
      "1998-yilda",
      "2001-yilda"
    ],
    "a": "1998-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Islom Karimov farmoni bilan Xorazm Ma’mun akademiyasi qachon qayta tiklangan?",
    "options": [
      "1996-yilda",
      "1997-yilda",
      "2000-yil 12-mayda",
      "2005-yil 27-avgustda"
    ],
    "a": "1997-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Toshkentda “Shahidlar xotirasi” majmui qachon ochilgan?",
    "options": [
      "1999-yilda",
      "2000-yil 12-mayda",
      "2001-yilda",
      "2005-yil 27-avgustda"
    ],
    "a": "2000-yil 12-mayda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Toshkentda Temuriylar tarixi davlat muzeyi qachon ochilgan?",
    "options": [
      "1996-yil 18-oktyabrda",
      "1997-yil 16-martda",
      "1998-yil 1-sentabrda",
      "1995-yil 1-sentabrda"
    ],
    "a": "1996-yil 18-oktyabrda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Jaloliddin Manguberdi tavalludining 800 yilligi qachon nishonlangan?",
    "options": [
      "1997-yilda",
      "1999-yilda",
      "2000-yilda",
      "2001-yilda"
    ],
    "a": "1999-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Siyosiy partiya deganda nima tushuniladi?",
    "options": [
      "Davlat hokimiyatini amalga oshiruvchi rasmiy organ",
      "Fuqarolarning ixtiyoriy ijtimoiy birlashmasi",
      "Davlat muassasasi",
      "Faoliyatini faqat saylovda olib boruvchi tuzilma"
    ],
    "a": "Fuqarolarning ixtiyoriy ijtimoiy birlashmasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2019-yildan “Mahalla posboni” o‘rniga qaysi lavozim joriy etildi?",
    "options": [
      "Profilaktika inspektori",
      "Tuman hokimining jamoat tartibi bo‘yicha yordamchisi",
      "Ichki ishlar bo‘limi boshlig‘i",
      "Mahalla raisi"
    ],
    "a": "Tuman hokimining jamoat tartibi bo‘yicha yordamchisi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Konstitutsiyasiga ko‘ra Qurolli Kuchlarning Oliy Bosh qo‘mondoni kim?",
    "options": [
      "Bosh vazir",
      "Mudofaa vaziri",
      "Oliy Majlis raisi",
      "O‘zbekiston Respublikasi Prezidenti"
    ],
    "a": "O‘zbekiston Respublikasi Prezidenti"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Qachon Qoraqalpog‘iston Respublikasining Davlat suvereniteti to‘g‘risidagi Deklaratsiyasi qabul qilingan?",
    "options": [
      "1990-yil 14-dekabr",
      "1991-yil 31-avgust",
      "1992-yil 8-dekabr",
      "1991-yil 18-noyabr"
    ],
    "a": "1990-yil 14-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston qachon YUNESKOga a’zo bo‘lib kirgan?",
    "options": [
      "1991-yil",
      "1992-yil 2-mart",
      "1993-yil",
      "1995-yil"
    ],
    "a": "1993-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi qaysi tashkilotga a’zo emas?",
    "options": [
      "YUNESKO",
      "Yevropa Ittifoqi",
      "BMT",
      "MDH"
    ],
    "a": "Yevropa Ittifoqi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Birlashgan Millatlar Tashkilotiga qachon a’zo bo‘lgan?",
    "options": [
      "1991-yil 31-avgust",
      "1992-yil 2-mart",
      "1993-yil",
      "1995-yil"
    ],
    "a": "1992-yil 2-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Toshkentda BMT vakolatxonasi qachon o‘z faoliyatini boshlagan?",
    "options": [
      "1992-yilda",
      "1993-yilda",
      "1995-yilda",
      "1997-yilda"
    ],
    "a": "1993-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasini yanada rivojlantirish bo‘yicha Harakatlar strategiyasi qaysi yillarni qamrab olgan?",
    "options": [
      "2016–2020",
      "2017–2021",
      "2018–2022",
      "2020–2025"
    ],
    "a": "2017–2021"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Prezident Sh.M. Mirziyoyevning “Yangi O‘zbekiston strategiyasi” asari qachon nashr etilgan?",
    "options": [
      "2019-yil",
      "2020-yil",
      "2021-yil",
      "2022-yil"
    ],
    "a": "2021-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Shavkat Mirziyoyev BMT Bosh Assambleyasining 75-sessiyasida o‘zbek tilida qachon nutq so‘zlagan?",
    "options": [
      "2019-yil 23-sentabr",
      "2020-yil 23-sentabr",
      "2021-yil 23-sentabr",
      "2018-yil 20-sentabr"
    ],
    "a": "2020-yil 23-sentabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2020-yil may oyida Toshkent shahrida fashizm ustidan g‘alabaning 75 yilligi munosabati bilan nima bo‘lib o‘tdi?",
    "options": [
      "Xalqaro konferensiya",
      "G‘alaba bog‘i majmuasining ochilishi",
      "Yarim marafon musobaqasi",
      "Adiblar xiyoboni ochildi"
    ],
    "a": "G‘alaba bog‘i majmuasining ochilishi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2016-yil 4-dekabrda bo‘lib o‘tgan Prezident saylovlarida Sh.M. Mirziyoyev qaysi partiyadan nomzod sifatida ko‘rsatilgan?",
    "options": [
      "O‘zbekiston Xalq demokratik partiyasi",
      "Milliy tiklanish demokratik partiyasi",
      "Adolat sotsial-demokratik partiyasi",
      "O‘zbekiston Liberal-demokratik partiyasi"
    ],
    "a": "O‘zbekiston Liberal-demokratik partiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Prezidenti Shavkat Mirziyoyev tashabbusi bilan Islom sivilizatsiyasi markazi qaysi shaharda tashkil etildi?",
    "options": [
      "Samarqand",
      "Buxoro",
      "Toshkent",
      "Xiva"
    ],
    "a": "Toshkent"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Shanxay Hamkorlik Tashkilotiga (ShHT) qachon a’zo bo‘lgan?",
    "options": [
      "1998-yil 12-fevral",
      "2001-yil 15-iyun",
      "2005-yil 15-iyun",
      "2010-yil"
    ],
    "a": "2001-yil 15-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Qaysi yildan boshlab ilk bor mamlakat aholisi va hukumatning to‘g‘ridan-to‘g‘ri muloqoti yo‘lga qo‘yildi?",
    "options": [
      "2015-yil",
      "2016-yil",
      "2017-yil",
      "2018-yil"
    ],
    "a": "2016-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Yoshlarga oid davlat siyosati to‘g‘risida”gi Qonunning yangi tahriri qachon qabul qilingan?",
    "options": [
      "2015-yil",
      "2016-yil",
      "2017-yil 14-sentabr",
      "2018-yil"
    ],
    "a": "2017-yil 14-sentabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Renessans so‘zining lug‘aviy ma’nosi nimani anglatadi?",
    "options": [
      "Taraqqiyot",
      "Yangilanish",
      "Qayta tug‘ilish, uyg‘onish",
      "Islohot"
    ],
    "a": "Qayta tug‘ilish, uyg‘onish"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi qachon mustaqillikka erishgan?",
    "options": [
      "1991-yil 30-avgust",
      "1991-yil 31-avgust",
      "1992-yil 8-dekabr",
      "1990-yil 20-iyun"
    ],
    "a": "1991-yil 31-avgust"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Islom Karimov tavalludining 80 yilligini nishonlash to‘g‘risidagi qaror qachon qabul qilingan?",
    "options": [
      "2016-yil",
      "2017-yil 27-noyabr",
      "2018-yil 26-noyabr",
      "2015-yil"
    ],
    "a": "2017-yil 27-noyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Davlat madhiyasining so‘zlarini kim yozgan?",
    "options": [
      "Yunus Rajabiy",
      "Mutal Burhonov",
      "Abdulla Oripov",
      "Abdulla Qodiriy"
    ],
    "a": "Abdulla Oripov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Davlat madhiyasiga musiqani kim bastalagan?",
    "options": [
      "Yunus Rajabiy",
      "Mutal Burhonov",
      "Abdulla Oripov",
      "Komiljon Otaniyozov"
    ],
    "a": "Mutal Burhonov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Xalq demokratik partiyasi (O‘zXDP) qachon tashkil etilgan?",
    "options": [
      "1991-yilda",
      "1992-yilda",
      "1993-yilda",
      "1995-yilda"
    ],
    "a": "1991-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Hozirgi kunda O‘zbekistonda nechta siyosiy partiya faoliyat yuritmoqda?",
    "options": [
      "4 ta",
      "5 ta",
      "6 ta",
      "7 ta"
    ],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbek modeli” nechta tamoyil asosida ishlab chiqilgan?",
    "options": [
      "4 ta",
      "5 ta",
      "6 ta",
      "7 ta"
    ],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Oliy Majlis davlat va jamiyat boshqaruvida qanday organ hisoblanadi?",
    "options": [
      "Ijro etuvchi organ",
      "Sud organi",
      "Qonun chiqaruvchi organ",
      "Nazorat qiluvchi organ"
    ],
    "a": "Qonun chiqaruvchi organ"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Xalq davlat idoralariga emas, davlat idoralari xalqqa xizmat qilishi kerak” tamoyilini ilgari surgan rahbar kim?",
    "options": [
      "Islom Karimov",
      "Shavkat Mirziyoyev",
      "Abdulla Aripov",
      "Nursulton Nazarboyev"
    ],
    "a": "Shavkat Mirziyoyev"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Prezident Sh.M. Mirziyoyev fikricha, jamiyat rivojiga g‘ov bo‘layotgan asosiy illatlardan biri nima?",
    "options": [
      "Innovatsiya",
      "Raqobat",
      "Korrupsiya",
      "Modernizatsiya"
    ],
    "a": "Korrupsiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Quyidagi davlatlardan qaysi biri O‘zbekiston mustaqilligini birinchi bo‘lib tan olgan?",
    "options": [
      "AQSh",
      "Turkiya",
      "Rossiya",
      "Xitoy"
    ],
    "a": "Turkiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston BMTga qachon a’zo bo‘lgan?",
    "options": [
      "1991-yil 31-avgust",
      "1992-yil 2-mart",
      "1993-yil",
      "1995-yil"
    ],
    "a": "1992-yil 2-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Ikki yoki ko‘ppartiyaviylik tizimi qaysi siyosiy tartibotga xos?",
    "options": [
      "Avtoritar",
      "Totalitar",
      "Demokratik",
      "Monarxik"
    ],
    "a": "Demokratik"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xususiy mulk insonda qanday xisni shakllantiradi?",
    "options": [
      "Beparvolik",
      "Mas’uliyatsizlik",
      "O‘ziga ishonch hissi",
      "Qaramlik"
    ],
    "a": "O‘ziga ishonch hissi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2020-yilda O‘zbekiston paxta yetishtirish bo‘yicha dunyoda nechanchi o‘rinda turgan?",
    "options": [
      "3-o‘rin",
      "5-o‘rin",
      "6-o‘rin",
      "9-o‘rin"
    ],
    "a": "6-o‘rin"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Umuminsoniy qadriyatlar deganda nimani tushunasiz?",
    "options": [
      "Faqat milliy manfaatlarni",
      "Butun insoniyat uchun umumiy bo‘lgan qadriyatlarni",
      "Faqat diniy qadriyatlarni",
      "Mahalliy an’analarni"
    ],
    "a": "Butun insoniyat uchun umumiy bo‘lgan qadriyatlarni"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Biznes erkinligi, mehnat erkinligi va investitsiya erkinligi qaysi xalqaro reyting tarkibiga kiradi?",
    "options": [
      "Inson taraqqiyoti indeksi",
      "Iqtisodiy erkinlik indeksi",
      "Korrupsiya indekslari",
      "Demokratiya indeksi"
    ],
    "a": "Iqtisodiy erkinlik indeksi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbekiston — 2030” strategiyasi to‘g‘risidagi Prezident farmoni qachon qabul qilingan?",
    "options": [
      "2022-yil 11-sentyabr",
      "2023-yil 11-sentyabr",
      "2023-yil 22-sentyabr",
      "2024-yil 1-yanvar"
    ],
    "a": "2023-yil 11-sentyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda “Yoshlar ittifoqi” ijtimoiy harakati qachon tashkil etilgan?",
    "options": [
      "2015-yil",
      "2016-yil 30-iyun",
      "2017-yil 30-iyun",
      "2018-yil"
    ],
    "a": "2017-yil 30-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda faol demokratik yangilanish va modernizatsiya jarayoni qachondan boshlangan?",
    "options": [
      "2000-yildan",
      "2010-yildan",
      "2016-yildan",
      "2020-yildan"
    ],
    "a": "2016-yildan"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston SSRning Mustaqillik Deklaratsiyasi qachon qabul qilingan?",
    "options": [
      "1990-yil 20-iyun",
      "1991-yil 31-avgust",
      "1992-yil 8-dekabr",
      "1989-yil 21-oktyabr"
    ],
    "a": "1990-yil 20-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Sovet Ittifoqida davlat to‘ntarishi sodir bo‘lgan sanalarni ko‘rsating.",
    "options": [
      "19–21-avgust",
      "19–21-sentyabr",
      "1–3-may",
      "10–12-iyun"
    ],
    "a": "19–21-avgust"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“SSSR GKCHP hujjatlari O‘zbekiston hududida amal qilmaydi” degan qaror qachon qabul qilingan?",
    "options": [
      "1991-yil 21-avgust",
      "1991-yil 22-avgust",
      "1990-yil 20-iyun",
      "1992-yil 8-dekabr"
    ],
    "a": "1991-yil 21-avgust"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Konstitutsiyasi 1992-yil bahoridagi muhokamada nechta moddadan iborat bo‘lgan?",
    "options": [
      "138 ta",
      "149 ta",
      "150 ta",
      "128 ta"
    ],
    "a": "149 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbekiston Respublikasi davlat mustaqilligi asoslari to‘g‘risida”gi Qonun nechta moddadan iborat?",
    "options": [
      "13 ta",
      "15 ta",
      "17 ta",
      "21 ta"
    ],
    "a": "17 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbekiston Respublikasi Mudofaa ishlari vazirligini tuzish to‘g‘risida”gi qonun qachon qabul qilingan?",
    "options": [
      "1991-yil 6-sentyabr",
      "1991-yil 8-sentyabr",
      "1990-yil 24-mart",
      "1992-yil 8-dekabr"
    ],
    "a": "1991-yil 6-sentyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Prezidentlik instituti O‘zbekistonda qachon joriy etilgan?",
    "options": [
      "1990-yil 24-mart",
      "1991-yil 31-avgust",
      "1992-yil 8-dekabr",
      "1989-yil 21-oktyabr"
    ],
    "a": "1990-yil 24-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1996-yil 18-oktyabrda Toshkentda qaysi muzey ochilgan?",
    "options": [
      "Temuriylar tarixi davlat muzeyi",
      "Shahidlar xotirasi majmui",
      "Adiblar xiyoboni",
      "Qatag‘on qurbonlari muzeyi"
    ],
    "a": "Temuriylar tarixi davlat muzeyi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston davlat hokimiyati tizimi nechta bo‘linish prinsipiga asoslanadi?",
    "options": [
      "2 ta",
      "3 ta",
      "4 ta",
      "5 ta"
    ],
    "a": "3 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Har bir hokimiyat faoliyatini muvofiqlashtiruvchi mustaqil organ qaysi?",
    "options": [
      "Prezident",
      "Oliy Majlis",
      "Vazirlar Mahkamasi",
      "Sud hokimiyati"
    ],
    "a": "Prezident"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Qoraqalpog‘iston Respublikasida davlat suvereniteti to‘g‘risidagi deklaratsiya qachon qabul qilingan?",
    "options": [
      "1990-yil 14-dekabr",
      "1991-yil 31-avgust",
      "1992-yil 4-yanvar",
      "1991-yil 18-noyabr"
    ],
    "a": "1990-yil 14-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda vitse-prezident lavozimi qachon tugatilgan?",
    "options": [
      "1992-yil",
      "1996-yil",
      "1998-yil",
      "2000-yil"
    ],
    "a": "1992-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda Bosh vazir lavozimi qachon ta’sis etilgan?",
    "options": [
      "1992-yil",
      "1994-yil",
      "1996-yil",
      "2000-yil"
    ],
    "a": "1992-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda o‘lim jazosi qachon bekor qilingan?",
    "options": [
      "2003-yil",
      "2005-yil",
      "2008-yil",
      "2010-yil"
    ],
    "a": "2008-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "14-yanvar “Vatan himoyachilari kuni” qaysi yildan nishonlanadi?",
    "options": [
      "1992-yil",
      "1993-yil",
      "1998-yil",
      "2000-yil"
    ],
    "a": "1992-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1997-yilda qaysi shaharlarning 2500 yilligi keng nishonlangan?",
    "options": [
      "Samarqand va Toshkent",
      "Buxoro va Xiva",
      "Termiz va Qarshi",
      "Andijon va Namangan"
    ],
    "a": "Buxoro va Xiva"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Senat O‘zbekiston Respublikasi Oliy Majlisining qaysi palatasi hisoblanadi?",
    "options": [
      "Quyi palata",
      "Ijro etuvchi palata",
      "Yuqori palata",
      "Mahalliy palata"
    ],
    "a": "Yuqori palata"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xalq deputatlari Kengashlari qaysi organlar tarkibiga kiradi?",
    "options": [
      "Sud hokimiyati",
      "Ijroiya hokimiyat",
      "Mahalliy vakillik organlari",
      "Qonun chiqaruvchi organlar"
    ],
    "a": "Mahalliy vakillik organlari"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xalq deputatlari Kengashlari ishining asosiy tashkiliy-huquqiy shakli nima?",
    "options": [
      "Sessiya",
      "Majlis",
      "Qurultoy",
      "Forum"
    ],
    "a": "Sessiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Markaziy saylov komissiyasi qachondan doimiy organ sifatida faoliyat yuritmoqda?",
    "options": [
      "1998-yildan",
      "2000-yildan",
      "2016-yildan",
      "2020-yildan"
    ],
    "a": "2016-yildan"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Ko‘ppartiyaviylik tizimi deganda nima tushuniladi?",
    "options": [
      "Bir partiyaning hukmronligi",
      "Ikki yoki undan ortiq siyosiy partiyalarning faoliyati",
      "Faqat parlament partiyalari",
      "Davlat partiyasi tizimi"
    ],
    "a": "Ikki yoki undan ortiq siyosiy partiyalarning faoliyati"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1991-yil noyabr oyida asos solingan siyosiy partiya qaysi?",
    "options": [
      "O‘zbekiston Xalq demokratik partiyasi",
      "Erk demokratik partiyasi",
      "Milliy tiklanish demokratik partiyasi",
      "Adolat sotsial-demokratik partiyasi"
    ],
    "a": "O‘zbekiston Xalq demokratik partiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1995-yil iyun oyida tuzilgan siyosiy partiya qaysi?",
    "options": [
      "Fidokorlar milliy-demokratik partiyasi",
      "Milliy tiklanish demokratik partiyasi",
      "O‘zbekiston Liberal-demokratik partiyasi",
      "Adolat sotsial-demokratik partiyasi"
    ],
    "a": "Milliy tiklanish demokratik partiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Prezidentining Oliy Majlisga Birinchi Murojaatnomasi qachon e’lon qilingan?",
    "options": [
      "2016-yil 14-dekabr",
      "2017-yil 22-dekabr",
      "2018-yil 28-noyabr",
      "2019-yil 5-mart"
    ],
    "a": "2017-yil 22-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Farg‘ona voqealari sodir bo‘lgan davrda O‘zbekiston SSR Kompartiyasi rahbari kim edi?",
    "options": [
      "Islom Karimov",
      "Shavkat Mirziyoyev",
      "Rafiq Nishonov",
      "Sharof Rashidov"
    ],
    "a": "Rafiq Nishonov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Bugungi kunda O‘zbekistonda nechta tilda teleradio eshittirishlar olib boriladi?",
    "options": [
      "10 tilda",
      "11 tilda",
      "12 tilda",
      "13 tilda"
    ],
    "a": "12 tilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Inson huquqlari umumjahon deklaratsiyasi qachon qabul qilingan?",
    "options": [
      "1945-yil",
      "1947-yil",
      "1948-yil",
      "1950-yil"
    ],
    "a": "1948-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda milliy madaniy markazlar soni nechta?",
    "options": [
      "100 dan ortiq",
      "120 dan ortiq",
      "150 dan ortiq",
      "200 dan ortiq"
    ],
    "a": "150 dan ortiq"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "BMT Ustavi va xalqaro huquq prinsiplari bo‘yicha asosiy prinsiplar qaysilar?",
    "options": [
      "Kuch ishlatmaslik, aralashmaslik, suveren tenglik, tinch yo‘l bilan hal etish",
      "Milliy ustunlik va kuch ishlatish",
      "Faqat iqtisodiy manfaatlar",
      "Harbiy ittifoqlar ustuvorligi"
    ],
    "a": "Kuch ishlatmaslik, aralashmaslik, suveren tenglik, tinch yo‘l bilan hal etish"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“6+3” guruhi qanday maqsadda tashkil etilgan?",
    "options": [
      "Markaziy Osiyo iqtisodiy integratsiyasi uchun",
      "Afg‘oniston muammosini tinch yo‘l bilan hal etish uchun",
      "Yevroosiyo ittifoqini tuzish uchun",
      "Harbiy alyans yaratish uchun"
    ],
    "a": "Afg‘oniston muammosini tinch yo‘l bilan hal etish uchun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Fuqarolik jamiyatining eng muhim omillaridan biri qaysi?",
    "options": [
      "Davlat aralashuvining kuchayishi",
      "Iqtisodiy erkinlik va mulk shakllarining xilma-xilligi",
      "Faqat davlat mulki ustuvorligi",
      "Markazlashgan boshqaruv"
    ],
    "a": "Iqtisodiy erkinlik va mulk shakllarining xilma-xilligi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "So‘m-kupon O‘zbekistonda qachondan muomalaga kiritilgan?",
    "options": [
      "1992-yil",
      "1993-yil",
      "1994-yil",
      "1995-yil"
    ],
    "a": "1993-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Fuqarolik jamiyatining asosiy belgilaridan biri nima?",
    "options": [
      "Bir partiyaviylik",
      "O‘zini o‘zi boshqarish va jamoatchilik nazorati",
      "Harbiy boshqaruv",
      "Davlat ustuvorligi"
    ],
    "a": "O‘zini o‘zi boshqarish va jamoatchilik nazorati"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Quyidagi tashkilotlardan qaysisiga O‘zbekiston oxirgi bo‘lib a’zo bo‘lgan?",
    "options": [
      "MDH",
      "BMT",
      "SHHT",
      "YUNESKO"
    ],
    "a": "SHHT"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Prezidenti Shavkat Mirziyoyev tashabbusi bilan Islom sivilizatsiyasi markazi qaysi shaharda tashkil etildi?",
    "options": ["Buxoro", "Samarqand", "Toshkent", "Xiva"],
    "a": "Toshkent"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Shanxay Hamkorlik Tashkilotiga (ShHT) qachon a’zo bo‘ldi?",
    "options": ["1998-yil 12-fevral", "2001-yil 15-iyun", "2005-yil 20-mart", "2010-yil 1-yanvar"],
    "a": "2001-yil 15-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Qaysi yildan boshlab mamlakat aholisi va hukumat o‘rtasida to‘g‘ridan-to‘g‘ri muloqot yo‘lga qo‘yildi?",
    "options": ["2015-yil", "2016-yil", "2017-yil", "2018-yil"],
    "a": "2016-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Yoshlarga oid davlat siyosati to‘g‘risida”gi Qonunning yangi tahriri qachon qabul qilingan?",
    "options": ["2015-yil", "2016-yil", "2017-yil 14-sentabr", "2018-yil"],
    "a": "2017-yil 14-sentabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Renessans so‘zining lug‘aviy ma’nosi nima?",
    "options": ["Islohot", "Taraqqiyot", "Qayta tug‘ilish, uyg‘onish", "Modernizatsiya"],
    "a": "Qayta tug‘ilish, uyg‘onish"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi qachon mustaqillikka erishgan?",
    "options": ["1990-yil 20-iyun", "1991-yil 31-avgust", "1992-yil 8-dekabr", "1989-yil 21-oktyabr"],
    "a": "1991-yil 31-avgust"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Islom Karimov tavalludining 80 yilligini nishonlash to‘g‘risidagi qaror qachon qabul qilingan?",
    "options": ["2016-yil", "2017-yil 27-noyabr", "2018-yil 26-noyabr", "2015-yil"],
    "a": "2017-yil 27-noyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Davlat madhiyasining so‘zlarini kim yozgan?",
    "options": ["Mutal Burhonov", "Yunus Rajabiy", "Abdulla Oripov", "Abdulla Qodiriy"],
    "a": "Abdulla Oripov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Davlat madhiyasiga musiqani kim bastalagan?",
    "options": ["Yunus Rajabiy", "Abdulla Oripov", "Mutal Burhonov", "Komiljon Otaniyozov"],
    "a": "Mutal Burhonov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Xalq demokratik partiyasi (O‘zXDP) qachon tashkil etilgan?",
    "options": ["1991-yil", "1992-yil", "1993-yil", "1995-yil"],
    "a": "1991-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Hozirgi kunda O‘zbekistonda nechta siyosiy partiya faoliyat yuritmoqda?",
    "options": ["4 ta", "5 ta", "6 ta", "7 ta"],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbek modeli” nechta tamoyil asosida ishlab chiqilgan?",
    "options": ["4 ta", "5 ta", "6 ta", "7 ta"],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Oliy Majlis davlat va jamiyat boshqaruvida qanday organ hisoblanadi?",
    "options": ["Ijro etuvchi organ", "Sud organi", "Qonun chiqaruvchi organ", "Nazorat qiluvchi organ"],
    "a": "Qonun chiqaruvchi organ"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Xalq davlat idoralariga emas, davlat idoralari xalqqa xizmat qilishi kerak” degan tamoyilni kim ilgari surgan?",
    "options": ["Islom Karimov", "Shavkat Mirziyoyev", "Abdulla Aripov", "Rafiq Nishonov"],
    "a": "Shavkat Mirziyoyev"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Prezident Sh.M. Mirziyoyev fikricha, jamiyat rivojiga g‘ov bo‘layotgan asosiy illat qaysi?",
    "options": ["Innovatsiya", "Raqobat", "Korrupsiya", "Modernizatsiya"],
    "a": "Korrupsiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Quyidagi davlatlardan qaysi biri O‘zbekiston mustaqilligini birinchi bo‘lib tan olgan?",
    "options": ["AQSh", "Rossiya", "Xitoy", "Turkiya"],
    "a": "Turkiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Birlashgan Millatlar Tashkilotiga qachon a’zo bo‘lgan?",
    "options": ["1991-yil 31-avgust", "1992-yil 2-mart", "1993-yil", "1995-yil"],
    "a": "1992-yil 2-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Ikki yoki ko‘ppartiyaviylik tizimi qaysi siyosiy tartibotga xos?",
    "options": ["Avtoritar", "Totalitar", "Demokratik", "Monarxik"],
    "a": "Demokratik"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xususiy mulk insonda qanday hissiyot uyg‘otadi?",
    "options": ["Qaramlik", "Beparvolik", "O‘ziga ishonch hissi", "Mas’uliyatsizlik"],
    "a": "O‘ziga ishonch hissi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2020-yilda O‘zbekiston paxta yetishtirish bo‘yicha dunyoda nechanchi o‘rinda turgan?",
    "options": ["3-o‘rin", "5-o‘rin", "6-o‘rin", "9-o‘rin"],
    "a": "6-o‘rin"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2022–2026-yillarga mo‘ljallangan Taraqqiyot strategiyasi nechta ustuvor yo‘nalishdan iborat?",
    "options": [
      "6 ta",
      "7 ta",
      "5 ta",
      "8 ta"
    ],
    "a": "7 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Prezidenti farmonlari va qarorlarining ijrosini ta’minlovchi organ qaysi?",
    "options": [
      "O‘zbekiston Respublikasi Oliy sudi",
      "O‘zbekiston Respublikasi Vazirlar Mahkamasi",
      "Oliy Majlis",
      "Konstitutsiyaviy sud"
    ],
    "a": "O‘zbekiston Respublikasi Vazirlar Mahkamasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasining hududi qancha?",
    "options": [
      "576,7 ming km²",
      "448,978 ming km²",
      "946,6 ming km²",
      "346,6 ming km²"
    ],
    "a": "448,978 ming km²"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Paxta ishi” deb atalgan siyosiy qatag‘onlar davrida 1983-yilda tuzilgan tergov guruhi rahbarlari kimlar edi?",
    "options": [
      "D.X. Bozorov va P.X. Ivanov",
      "T.X. Gdlyan va N.V. Ivanov",
      "A.D. Molotov va N.V. Ivanov",
      "T.X. Tuxugov va A. Molotov"
    ],
    "a": "T.X. Gdlyan va N.V. Ivanov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda Prezidentlik lavozimi qachon joriy etilgan?",
    "options": [
      "1991-yil 31-avgust",
      "1990-yil 24-mart",
      "1992-yil 8-dekabr",
      "1989-yil 21-oktyabr"
    ],
    "a": "1990-yil 24-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Mustaqil O‘zbekiston Respublikasida birinchi muqobil prezidentlik saylovlari qachon bo‘lib o‘tgan?",
    "options": [
      "1992-yil 2-mart",
      "1991-yil 29-dekabr",
      "1991-yil 31-avgust",
      "1990-yil 20-iyun"
    ],
    "a": "1991-yil 29-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi nechta davlat bilan chegaradosh?",
    "options": [
      "3 ta",
      "4 ta",
      "5 ta",
      "6 ta"
    ],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbek tiliga davlat tili maqomini berish to‘g‘risidagi Qonun qachon qabul qilingan?",
    "options": [
      "1990-yil 20-iyun",
      "1989-yil 21-oktyabr",
      "1991-yil 31-avgust",
      "1992-yil 8-dekabr"
    ],
    "a": "1989-yil 21-oktyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1992-yil 10-dekabrda O‘zbekiston Respublikasining qaysi davlat ramzi qabul qilingan?",
    "options": [
      "Davlat bayrog‘i",
      "Davlat madhiyasi",
      "Davlat gerbi",
      "Konstitutsiya"
    ],
    "a": "Davlat madhiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Davlat va jamiyat hayotining eng muhim masalalari xalq muhokamasiga qo‘yilishi nima deb ataladi?",
    "options": [
      "Umumxalq saylovi",
      "Referendum",
      "Muqobil saylov",
      "Ombudsman"
    ],
    "a": "Referendum"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1991-yil 18-noyabrda O‘zbekiston Respublikasining qaysi davlat ramzi qabul qilingan?",
    "options": [
      "Davlat gerbi",
      "Davlat madhiyasi",
      "Davlat bayrog‘i",
      "Konstitutsiya"
    ],
    "a": "Davlat bayrog‘i"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasining milliy valyutasi — so‘m qachondan muomalaga kiritildi?",
    "options": [
      "1992-yil 8-dekabr",
      "1993-yil 1-noyabr",
      "1994-yil 1-iyul",
      "1991-yil 31-avgust"
    ],
    "a": "1994-yil 1-iyul"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Davlat hokimiyati necha bo‘g‘inga bo‘linadi?",
    "options": [
      "2",
      "3",
      "4",
      "5"
    ],
    "a": "3"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasida viloyatlar va Toshkent shahar hokimlarini kim tayinlaydi?",
    "options": [
      "Oliy Majlis",
      "Vazirlar Mahkamasi",
      "Prezident",
      "Xalq deputatlari kengashi"
    ],
    "a": "Prezident"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Tuman va shahar hokimlarini kim tayinlaydi?",
    "options": [
      "Prezident",
      "Viloyat hokimi",
      "Oliy Majlis",
      "Vazirlar Mahkamasi"
    ],
    "a": "Viloyat hokimi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasida necha yoshga to‘lgan shaxslar saylash huquqiga ega?",
    "options": [
      "21 yosh",
      "16 yosh",
      "25 yosh",
      "18 yosh"
    ],
    "a": "18 yosh"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda faoliyat yuritayotgan siyosiy partiyalar qaysilar?",
    "options": [
      "O‘zXDP, O‘zLiDeP, Adolat SDP, Ekologik partiya, O‘zMTDP",
      "O‘zXDP, Birlik, Erk, O‘zMDP",
      "O‘zLiDeP, Fidokorlar, Birlik",
      "Adolat SDP, Vatan taraqqiyoti"
    ],
    "a": "O‘zXDP, O‘zLiDeP, Adolat SDP, Ekologik partiya, O‘zMTDP"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Necha yoshga to‘lgan fuqarolar viloyat, tuman va shahar Kengashlariga deputat etib saylanishi mumkin?",
    "options": [
      "18 yosh",
      "30 yosh",
      "21 yosh",
      "25 yosh"
    ],
    "a": "21 yosh"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Bosh vazir Virtual qabulxonasi va Prezident Xalq qabulxonalari qachon tashkil etilgan?",
    "options": [
      "2018-yilda",
      "2016-yilda",
      "2015-yilda",
      "2017-yilda"
    ],
    "a": "2016-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Yurtimizda “Xalq bilan muloqot va inson manfaatlari yili” deb e’lon qilingan yil qaysi?",
    "options": [
      "2018-yil",
      "2015-yil",
      "2016-yil",
      "2017-yil"
    ],
    "a": "2017-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1991-yilda yurtimizda qaysi allomaning 550 yilligi nishonlangan?",
    "options": [
      "Alisher Navoiy",
      "Zahiriddin Muhammad Bobur",
      "Mirzo Ulug‘bek",
      "Ahmad al-Farg‘oniy"
    ],
    "a": "Zahiriddin Muhammad Bobur"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Ahmad al-Farg‘oniyning 1200 yillik yubileyi qachon nishonlangan?",
    "options": [
      "1998-yilda",
      "2005-yilda",
      "1996-yilda",
      "2001-yilda"
    ],
    "a": "1998-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Imom al-Buxoriyning 1225 yillik yubileyi qachon nishonlangan?",
    "options": [
      "2001-yilda",
      "1996-yilda",
      "1998-yilda",
      "1995-yilda"
    ],
    "a": "1998-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "I.Karimov farmoni bilan Xorazm Fanlar akademiyasi (Ma’mun akademiyasi) qachon qayta tiklangan?",
    "options": [
      "1996-yilda",
      "1999-yilda",
      "2000-yil 12-mayda",
      "2005-yil 27-avgustda"
    ],
    "a": "2000-yil 12-mayda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Toshkentda “Shahidlar xotirasi” majmui qachon ochilgan?",
    "options": [
      "1999-yilda",
      "1996-yil 18-oktabrda",
      "1997-yilda",
      "2001-yilda"
    ],
    "a": "1999-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Toshkentda Temuriylar tarixi davlat muzeyi qachon ochilgan?",
    "options": [
      "1997-yil 16-martda",
      "1996-yil 18-oktabrda",
      "1998-yil 1-sentabrda",
      "2000-yil 12-mayda"
    ],
    "a": "1996-yil 18-oktabrda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Jaloliddin Manguberdi tavalludining 800 yilligi qachon nishonlangan?",
    "options": [
      "1997-yilda",
      "2000-yilda",
      "1999-yilda",
      "2001-yilda"
    ],
    "a": "1999-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Siyosiy partiya nima?",
    "options": [
      "Davlat hokimiyatini nazorat qiluvchi organ",
      "Fuqarolarning ijtimoiy harakati",
      "Davlat boshqaruv idorasi",
      "Davlat hokimiyatini qo‘lga kiritish va amalga oshirishga intiluvchi fuqarolar uyushmasi"
    ],
    "a": "Davlat hokimiyatini qo‘lga kiritish va amalga oshirishga intiluvchi fuqarolar uyushmasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2019-yildan “Mahalla posboni” lavozimi o‘rniga qaysi lavozim joriy etildi?",
    "options": [
      "Profilaktika inspektori yordamchisi",
      "Mahalla raisi",
      "Tuman hokimi yordamchisi",
      "Ichki ishlar boshlig‘i"
    ],
    "a": "Profilaktika inspektori yordamchisi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Qurolli Kuchlarining Oliy Bosh qo‘mondoni kim?",
    "options": [
      "Mudofaa vaziri",
      "Oliy Majlis raisi",
      "Prezident",
      "Bosh vazir"
    ],
    "a": "Prezident"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Qachon Qoraqalpog‘iston Respublikasining Davlat suvereniteti to‘g‘risidagi Deklaratsiyasi qabul qilingan?",
    "options": [
      "1991-yil 31-avgust",
      "1990-yil 14-dekabr",
      "1992-yil 8-dekabr",
      "1991-yil 1-sentabr"
    ],
    "a": "1990-yil 14-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston qachon YUNESKOga a’zo bo‘lib kirgan?",
    "options": [
      "1995-yil 12-mayda",
      "1992-yil 2-martda",
      "1993-yilda",
      "1990-yilda"
    ],
    "a": "1993-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi qaysi tashkilotga a’zo emas?",
    "options": [
      "YUNESKO",
      "Birlashgan Millatlar Tashkiloti",
      "Yevropa Ittifoqi",
      "Shanxay Hamkorlik Tashkiloti"
    ],
    "a": "Yevropa Ittifoqi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Birlashgan Millatlar Tashkilotiga (BMT) qachon a’zo bo‘lgan?",
    "options": [
      "1995-yil 12-may",
      "1992-yil 2-mart",
      "1993-yil",
      "1991-yil 31-avgust"
    ],
    "a": "1992-yil 2-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Toshkentda BMT vakolatxonasi qachon o‘z faoliyatini boshlagan?",
    "options": [
      "1993-yilda",
      "1990-yilda",
      "1995-yilda",
      "1992-yilda"
    ],
    "a": "1993-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasini yanada rivojlantirish bo‘yicha Harakatlar strategiyasi qaysi yillarni qamrab olgan?",
    "options": [
      "2016–2020",
      "2017–2021",
      "2018–2022",
      "2021–2026"
    ],
    "a": "2017–2021"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Prezident Sh.M. Mirziyoyevning “Yangi O‘zbekiston strategiyasi” asari qaysi yilda nashr etilgan?",
    "options": [
      "2020-yil",
      "2022-yil",
      "2021-yil",
      "2019-yil"
    ],
    "a": "2021-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Sh.M. Mirziyoyev BMT Bosh Assambleyasining 75-sessiyasida qachon o‘zbek tilida nutq so‘zlagan?",
    "options": [
      "2016-yil 15-sentabr",
      "2021-yil 23-sentabr",
      "2020-yil 23-sentabr",
      "2019-yil 26-sentabr"
    ],
    "a": "2020-yil 23-sentabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2020-yil may oyida Toshkent shahrida fashizm ustidan qozonilgan g‘alabaning 75 yilligi munosabati bilan nima bo‘lib o‘tdi?",
    "options": [
      "Xalqaro marafon o‘tkazildi",
      "G‘alaba bog‘i majmuasining ochilish marosimi bo‘lib o‘tdi",
      "Harbiy parad o‘tkazildi",
      "Ilmiy konferensiya tashkil etildi"
    ],
    "a": "G‘alaba bog‘i majmuasining ochilish marosimi bo‘lib o‘tdi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2016-yil 4-dekabrda bo‘lib o‘tgan Prezident saylovlarida Sh.M. Mirziyoyev qaysi partiyadan nomzod sifatida ko‘rsatilgan?",
    "options": [
      "O‘zbekiston Liberal-demokratik partiyasi",
      "O‘zbekiston Xalq demokratik partiyasi",
      "Adolat sotsial-demokratik partiyasi",
      "Milliy tiklanish demokratik partiyasi"
    ],
    "a": "O‘zbekiston Liberal-demokratik partiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Prezidenti Shavkat Mirziyoyev tashabbusi bilan Islom sivilizatsiyasi markazi qaysi shaharda tashkil etildi?",
    "options": [
      "Buxoro",
      "Samarqand",
      "Toshkent",
      "Xiva"
    ],
    "a": "Toshkent"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Shanxay Hamkorlik Tashkilotiga (ShHT) qachon a’zo bo‘ldi?",
    "options": [
      "1998-yil",
      "2001-yil 15-iyun",
      "2005-yil",
      "2010-yil"
    ],
    "a": "2001-yil 15-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Qaysi yildan boshlab ilk bor mamlakat aholisi va hukumat o‘rtasida to‘g‘ridan-to‘g‘ri muloqot yo‘lga qo‘yildi?",
    "options": [
      "2015-yil",
      "2017-yil",
      "2016-yil",
      "2018-yil"
    ],
    "a": "2016-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Yoshlarga oid davlat siyosati to‘g‘risida”gi Qonunning yangi tahriri qachon qabul qilingan?",
    "options": [
      "2017-yil 14-sentabr",
      "2019-yil 5-mart",
      "2016-yil 7-fevral",
      "2018-yil 1-iyun"
    ],
    "a": "2016-yil 14-sentabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Renessans” so‘zining lug‘aviy ma’nosi nima?",
    "options": [
      "Taraqqiyot",
      "Yuksalish",
      "Qayta tug‘ilish",
      "Islohot"
    ],
    "a": "Qayta tug‘ilish"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi qachon mustaqillikka erishgan?",
    "options": [
      "1991-yil 31-avgust",
      "1991-yil 1-sentabr",
      "1990-yil 20-iyun",
      "1992-yil 8-dekabr"
    ],
    "a": "1991-yil 31-avgust"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Islom Karimov tavalludining 80 yilligini nishonlash to‘g‘risidagi qaror qachon qabul qilingan?",
    "options": [
      "2017-yil 27-noyabr",
      "2018-yil 26-noyabr",
      "2016-yil 14-sentabr",
      "2019-yil 5-mart"
    ],
    "a": "2017-yil 27-noyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi davlat madhiyasining matnini kim yozgan?",
    "options": [
      "Yunus Rajabiy",
      "Mutal Burhonov",
      "Abdulla Oripov",
      "Erkin Vohidov"
    ],
    "a": "Abdulla Oripov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi davlat madhiyasiga kim kuy bastalagan?",
    "options": [
      "Yunus Rajabiy",
      "Mutal Burhonov",
      "Abdulla Oripov",
      "Komiljon Otaniyozov"
    ],
    "a": "Mutal Burhonov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Xalq demokratik partiyasi (O‘zXDP) qachon tashkil etilgan?",
    "options": [
      "1991-yilda",
      "1993-yilda",
      "1996-yilda",
      "1990-yilda"
    ],
    "a": "1991-yilda"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda nechta siyosiy partiya faoliyat yuritadi?",
    "options": [
      "5 ta",
      "6 ta",
      "7 ta",
      "4 ta"
    ],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbek modeli” nechta tamoyil asosida joriy etilgan?",
    "options": [
      "6 ta",
      "7 ta",
      "5 ta",
      "4 ta"
    ],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Davlat va jamiyat boshqaruvida Oliy Majlis qanday organ hisoblanadi?",
    "options": [
      "Ijro etuvchi organ",
      "Sud organi",
      "Qonun chiqaruvchi va qabul qiluvchi organ",
      "Nazorat qiluvchi organ"
    ],
    "a": "Qonun chiqaruvchi va qabul qiluvchi organ"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Xalq davlat idorasiga emas, davlat idoralari xalqqa xizmat qilishi kerak” tamoyilini kim ilgari surgan?",
    "options": [
      "Islom Karimov",
      "Shavkat Mirziyoyev",
      "Abdulla Aripov",
      "Nig‘matilla Yo‘ldoshev"
    ],
    "a": "Shavkat Mirziyoyev"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Prezident Sh.M.Mirziyoyev fikricha, jamiyat rivojiga g‘ov bo‘layotgan illat qaysi?",
    "options": [
      "Innovatsiya",
      "Korrupsiya",
      "Modernizatsiya",
      "Raqobat"
    ],
    "a": "Korrupsiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Quyidagi davlatlardan qaysi biri O‘zbekiston mustaqilligini birinchi bo‘lib tan olgan?",
    "options": [
      "AQSh",
      "Turkiya",
      "Rossiya",
      "Xitoy"
    ],
    "a": "Turkiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Birlashgan Millatlar Tashkilotiga (BMT) qachon a’zo bo‘lgan?",
    "options": [
      "1992-yil 2-mart",
      "1991-yil 31-avgust",
      "1993-yil 12-may",
      "1990-yil 20-iyun"
    ],
    "a": "1992-yil 2-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Ikki yoki ko‘ppartiyaviylik tizimi qaysi siyosiy tartibotga xos?",
    "options": [
      "Avtoritar",
      "Totalitar",
      "Demokratik",
      "Monarxik"
    ],
    "a": "Demokratik"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xususiy mulk insonga qanday his baxsh etadi?",
    "options": [
      "Beqarorlik hissini",
      "O‘ziga ishonch hissini",
      "Qo‘rquv hissini",
      "Bo‘ysunish hissini"
    ],
    "a": "O‘ziga ishonch hissini"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2020-yilda O‘zbekiston paxta yetishtirish bo‘yicha dunyoda nechanchi o‘rinda turgan?",
    "options": [
      "9-o‘rin",
      "6-o‘rin",
      "3-o‘rin",
      "12-o‘rin"
    ],
    "a": "6-o‘rin"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Umuminsoniy qadriyatlar deganda nima tushuniladi?",
    "options": [
      "Faqat milliy qadriyatlar majmui",
      "Jahonda tinchlikni saqlash va inson huquqlarini ta’minlash",
      "Davlat manfaatlarining ustuvorligi",
      "Faqat iqtisodiy erkinliklar"
    ],
    "a": "Jahonda tinchlikni saqlash va inson huquqlarini ta’minlash"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Biznes erkinligi, mehnat erkinligi va investitsiya erkinligi qaysi xalqaro reyting tarkibiga kiradi?",
    "options": [
      "Inson taraqqiyoti indeksi",
      "Iqtisodiy erkinlik indeksi",
      "Demokratiya indeksi",
      "Korrupsiya indekslari"
    ],
    "a": "Iqtisodiy erkinlik indeksi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbekiston – 2030” strategiyasi to‘g‘risidagi Prezident Farmoni qachon qabul qilingan?",
    "options": [
      "2023-yil 22-sentyabr",
      "2022-yil 15-iyun",
      "2021-yil 7-fevral",
      "2024-yil 1-yanvar"
    ],
    "a": "2023-yil 22-sentyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Respublikamizda “Yoshlar ittifoqi” ijtimoiy harakati qachon tashkil etilgan?",
    "options": [
      "2016-yil 30-iyun",
      "2015-yil 1-yanvar",
      "2017-yil 14-sentabr",
      "2018-yil 10-mart"
    ],
    "a": "2016-yil 30-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda faol demokratik yangilanish va modernizatsiya jarayoni qachondan boshlandi?",
    "options": [
      "2000-yildan",
      "2010-yildan",
      "2017-yildan",
      "1995-yildan"
    ],
    "a": "2017-yildan"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston SSR Mustaqillik Deklaratsiyasi qachon qabul qilingan?",
    "options": [
      "1990-yil 20-iyun",
      "1991-yil 31-avgust",
      "1990-yil 21-iyul",
      "1991-yil 18-noyabr"
    ],
    "a": "1990-yil 20-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Sovet Ittifoqida davlat to‘ntarishi (GKCHP) sodir bo‘lgan sanalar qaysilar?",
    "options": [
      "19–21-avgust 1991-yil",
      "18–20-sentyabr 1991-yil",
      "21–23-iyul 1990-yil",
      "15–17-mart 1991-yil"
    ],
    "a": "19–21-avgust 1991-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“SSSR GKCHP ning O‘zbekiston SSR Konstitutsiyasi va qonunlariga zid hujjatlari amal qilmaydi” degan qaror qachon qabul qilingan?",
    "options": [
      "1991-yil 21-avgust",
      "1991-yil 31-avgust",
      "1990-yil 20-iyun",
      "1992-yil 8-dekabr"
    ],
    "a": "1991-yil 21-avgust"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Konstitutsiyasi 1992-yil bahorida umumxalq muhokamasiga qo‘yilganda nechta moddadan iborat bo‘lgan?",
    "options": [
      "150 ta",
      "149 ta",
      "128 ta",
      "138 ta"
    ],
    "a": "149 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbekiston Respublikasi davlat mustaqilligi asoslari to‘g‘risida”gi qonun nechta moddadan iborat?",
    "options": [
      "13 ta",
      "17 ta",
      "21 ta",
      "15 ta"
    ],
    "a": "17 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbekiston Respublikasi Mudofaa ishlari vazirligini tuzish to‘g‘risida”gi qonun qachon qabul qilingan?",
    "options": [
      "1991-yil 6-sentyabr",
      "1990-yil 24-mart",
      "1992-yil 8-dekabr",
      "1991-yil 31-avgust"
    ],
    "a": "1991-yil 6-sentyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Prezidentlik instituti O‘zbekistonda qachon tashkil etilgan?",
    "options": [
      "1990-yil 24-mart",
      "1991-yil 31-avgust",
      "1992-yil 8-dekabr",
      "1989-yil 21-oktyabr"
    ],
    "a": "1990-yil 24-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1996-yil 18-oktyabrda O‘zbekistonda qaysi muzey ochilgan?",
    "options": [
      "Temuriylar tarixi davlat muzeyi",
      "Shahidlar xotirasi majmui",
      "Qatag‘on qurbonlari muzeyi",
      "O‘zbekiston tarixi muzeyi"
    ],
    "a": "Temuriylar tarixi davlat muzeyi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston davlat hokimiyati tizimi nechta bo‘linish prinsipiga asoslanadi?",
    "options": [
      "2 ta",
      "3 ta",
      "4 ta",
      "5 ta"
    ],
    "a": "3 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Davlat hokimiyati tarmoqlari faoliyatini muvofiqlashtiruvchi mustaqil organ qaysi?",
    "options": [
      "Prezident",
      "Oliy Majlis",
      "Vazirlar Mahkamasi",
      "Konstitutsiyaviy sud"
    ],
    "a": "Prezident"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Qoraqalpog‘iston Respublikasida “Davlat suvereniteti to‘g‘risida”gi deklaratsiya qachon qabul qilingan?",
    "options": [
      "1990-yil 14-dekabr",
      "1991-yil 31-avgust",
      "1992-yil 4-yanvar",
      "1993-yil 22-mart"
    ],
    "a": "1990-yil 14-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda vitse-prezident lavozimi qachon tugatilgan?",
    "options": [
      "1992-yil",
      "1990-yil",
      "1996-yil",
      "1994-yil"
    ],
    "a": "1992-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda Bosh vazir lavozimi qachon ta’sis etilgan?",
    "options": [
      "1992-yil",
      "1990-yil",
      "1994-yil",
      "1996-yil"
    ],
    "a": "1992-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekistonda o‘lim jazosi qachon bekor qilingan?",
    "options": [
      "2008-yil 1-yanvar",
      "2003-yil dekabr",
      "2010-yil 1-yanvar",
      "1998-yil 1-yanvar"
    ],
    "a": "2008-yil 1-yanvar"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "14-yanvar “Vatan himoyachilari kuni” deb qaysi yilda e’lon qilingan?",
    "options": [
      "1993-yil",
      "1992-yil",
      "1995-yil",
      "1998-yil"
    ],
    "a": "1993-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1997-yilda qaysi shaharlarning 2500 yilligi keng nishonlangan?",
    "options": [
      "Buxoro va Xiva",
      "Samarqand va Buxoro",
      "Toshkent va Qarshi",
      "Xiva va Termiz"
    ],
    "a": "Buxoro va Xiva"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Senat O‘zbekiston Respublikasi Oliy Majlisining qaysi palatasi hisoblanadi?",
    "options": [
      "Quyi palata",
      "Vakillik palatasi",
      "Yuqori palata",
      "Ijroiya palata"
    ],
    "a": "Yuqori palata"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xalq deputatlari Kengashlari qaysi organlar tarkibiga kiradi?",
    "options": [
      "Sud hokimiyati organlariga",
      "Mahalliy vakillik organlariga",
      "Ijroiya hokimiyatiga",
      "Qonun chiqaruvchi organlarga"
    ],
    "a": "Mahalliy vakillik organlariga"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xalq deputatlari Kengashlari ishining asosiy tashkiliy-huquqiy shakli nima?",
    "options": [
      "Qurultoy",
      "Sessiya",
      "Majlis",
      "Kengash"
    ],
    "a": "Sessiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Markaziy saylov komissiyasi qachondan doimiy organ sifatida faoliyat yuritmoqda?",
    "options": [
      "1998-yildan",
      "2016-yildan",
      "1995-yildan",
      "2000-yildan"
    ],
    "a": "1998-yildan"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Ko‘ppartiyaviylik tizimi deganda nima tushuniladi?",
    "options": [
      "Jamiyatda bir partiyaning ustunligi",
      "Davlat boshqaruvida harbiylar roli",
      "Jamiyatda ikki yoki undan ortiq siyosiy partiyalar faoliyati",
      "Faqat parlament partiyalarining mavjudligi"
    ],
    "a": "Jamiyatda ikki yoki undan ortiq siyosiy partiyalar faoliyati"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1991-yil noyabr oyida asos solingan siyosiy partiya qaysi?",
    "options": [
      "Erk demokratik partiyasi",
      "O‘zbekiston Xalq demokratik partiyasi",
      "Milliy tiklanish demokratik partiyasi",
      "Fidokorlar milliy-demokratik partiyasi"
    ],
    "a": "O‘zbekiston Xalq demokratik partiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "1995-yil iyun oyida tuzilgan siyosiy partiya qaysi?",
    "options": [
      "O‘zbekiston Milliy tiklanish demokratik partiyasi",
      "Fidokorlar milliy-demokratik partiyasi",
      "Erk demokratik partiyasi",
      "O‘zbekiston Liberal-demokratik partiyasi"
    ],
    "a": "O‘zbekiston Milliy tiklanish demokratik partiyasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi Prezidentining Oliy Majlisga birinchi Murojaatnomasi qachon e’lon qilingan?",
    "options": [
      "2017-yil 22-dekabr",
      "2016-yil 14-dekabr",
      "2018-yil 5-mart",
      "2019-yil 28-noyabr"
    ],
    "a": "2017-yil 22-dekabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Farg‘ona voqealari sodir bo‘lgan davrda O‘zbekiston SSR KP rahbari kim edi?",
    "options": [
      "I.A. Karimov",
      "Usmonxo‘jayev",
      "Sh. Rashidov",
      "R. Nishonov"
    ],
    "a": "R. Nishonov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Bugungi kunda mamlakatimizda nechta tillarda teleradio eshittirishlar efirga chiqmoqda?",
    "options": ["12 ta", "13 ta", "14 ta", "15 ta"],
    "a": "12 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Inson huquqlari umumjahon deklaratsiyasi qachon qabul qilingan?",
    "options": ["1945-yil", "1947-yil", "1948-yil", "1950-yil"],
    "a": "1948-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Mamlakatimizda milliy madaniy markazlar soni nechta?",
    "options": ["100 dan ortiq", "120 dan ortiq", "150 dan ortiq", "80 dan ortiq"],
    "a": "150 dan ortiq"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "BMT Ustavi va xalqaro huquq prinsiplari bo‘yicha deklaratsiyada nechta asosiy prinsip belgilangan?",
    "options": ["5 ta", "6 ta", "7 ta", "8 ta"],
    "a": "7 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“6+3” guruhi qaysi masala yuzasidan tashkil etilgan?",
    "options": ["Afg‘oniston masalasi", "Markaziy Osiyo xavfsizligi", "Yaqin Sharq tinchligi", "Yadro qurolsizlanish"],
    "a": "Afg‘oniston masalasi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2016-yil 4-dekabr Prezident saylovida Sh.M. Mirziyoyev qaysi partiyadan nomzod bo‘lgan?",
    "options": ["XDP", "O‘zLiDeP", "Milliy tiklanish", "Adolat SDP"],
    "a": "O‘zLiDeP"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Islom sivilizatsiyasi markazi qaysi shaharda tashkil etilgan?",
    "options": ["Buxoro", "Samarqand", "Toshkent", "Termiz"],
    "a": "Toshkent"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Shanxay hamkorlik tashkilotiga (ShHT) qachon a’zo bo‘lgan?",
    "options": ["1998-yil", "2000-yil", "2001-yil 15-iyun", "2005-yil"],
    "a": "2001-yil 15-iyun"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Aholi va hukumat o‘rtasida to‘g‘ridan-to‘g‘ri muloqot qaysi yildan yo‘lga qo‘yildi?",
    "options": ["2015-yil", "2016-yil", "2017-yil", "2018-yil"],
    "a": "2016-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Yoshlarga oid davlat siyosati to‘g‘risida”gi Qonunning yangi tahriri qachon qabul qilingan?",
    "options": ["2016-yil 14-sentabr", "2017-yil 14-sentabr", "2018-yil 19-mart", "2019-yil 5-mart"],
    "a": "2016-yil 14-sentabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Renessans so‘zining lug‘aviy ma’nosi nima?",
    "options": ["Inglizcha “taraqqiyot”", "Fransuzcha “qayta tug‘ilish”", "Lotincha “islohot”", "Yunoncha “ilm-fan ravnaqi”"],
    "a": "Fransuzcha “qayta tug‘ilish”"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi qachon mustaqillikka erishgan?",
    "options": ["1991-yil 30-avgust", "1991-yil 31-avgust", "1991-yil 1-sentabr", "1992-yil 2-mart"],
    "a": "1991-yil 31-avgust"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Islom Karimov tavalludining 80 yilligini nishonlash to‘g‘risidagi qaror qachon qabul qilingan?",
    "options": ["2017-yil 27-noyabr", "2018-yil 26-noyabr", "2019-yil 28-noyabr", "2016-yil 14-dekabr"],
    "a": "2017-yil 27-noyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi davlat madhiyasi matni muallifi kim?",
    "options": ["Yunus Rajabiy", "Mutal Burhonov", "Abdulla Oripov", "Abdulla Qodiriy"],
    "a": "Abdulla Oripov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Respublikasi davlat madhiyasiga kuy bastalagan bastakor kim?",
    "options": ["Yunus Rajabiy", "Mutal Burhonov", "Abdulla Oripov", "Komiljon Otaniyozov"],
    "a": "Mutal Burhonov"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston Xalq demokratik partiyasi (O‘zXDP) qachon tashkil topgan?",
    "options": ["1991-yil", "1992-yil", "1993-yil", "1995-yil"],
    "a": "1991-yil"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Hozirgi kunda O‘zbekistonda nechta siyosiy partiya faoliyat yuritadi?",
    "options": ["5 ta", "6 ta", "7 ta", "8 ta"],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbek modeli” nechta tamoyilga asoslanadi?",
    "options": ["4 ta", "5 ta", "6 ta", "7 ta"],
    "a": "5 ta"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Oliy Majlis davlat va jamiyat boshqaruvida qanday organ?",
    "options": ["Ijro etuvchi", "Sud", "Qonun chiqaruvchi", "Nazorat qiluvchi"],
    "a": "Qonun chiqaruvchi"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Xalq davlat idoralariga emas, davlat idoralari xalqqa xizmat qilishi kerak” degan tamoyil kim tomonidan ilgari surilgan?",
    "options": ["I.A. Karimov", "Sh.M. Mirziyoyev", "A. Aripov", "R. Nishonov"],
    "a": "Sh.M. Mirziyoyev"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Jamiyat rivojiga g‘ov bo‘layotgan illat sifatida Prezidentimiz nimani ko‘rsatgan?",
    "options": ["Innovatsiya", "Korrupsiya", "Raqobat", "Xususiy mulk"],
    "a": "Korrupsiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston mustaqilligini birinchi bo‘lib qaysi davlat tan olgan?",
    "options": ["AQSh", "Turkiya", "Hindiston", "Rossiya"],
    "a": "Turkiya"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "O‘zbekiston BMTga qachon a’zo bo‘lgan?",
    "options": ["1991-yil 31-avgust", "1992-yil 2-mart", "1993-yil 12-may", "1995-yil 9-aprel"],
    "a": "1992-yil 2-mart"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Ko‘ppartiyaviylik tizimi qaysi siyosiy tartibotga xos?",
    "options": ["Avtoritar", "Totalitar", "Demokratik", "Monarxik"],
    "a": "Demokratik"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Xususiy mulk insonga qanday his baxsh etadi?",
    "options": ["Bo‘ysunish", "Mas’uliyatsizlik", "O‘ziga ishonch", "Qaramlik"],
    "a": "O‘ziga ishonch"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "2020-yilda O‘zbekiston paxta yetishtirish bo‘yicha dunyoda nechanchi o‘rinda bo‘lgan?",
    "options": ["6-o‘rin", "7-o‘rin", "8-o‘rin", "9-o‘rin"],
    "a": "6-o‘rin"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Umuminsoniy qadriyatlar nimalarni o‘z ichiga oladi?",
    "options": ["Faqat milliy manfaatlar", "Barchasi to‘g‘ri", "Faqat iqtisodiy erkinlik", "Faqat siyosiy barqarorlik"],
    "a": "Barchasi to‘g‘ri"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "Biznes erkinligi, mehnat erkinligi qaysi reytingning asosiy tarkibi?",
    "options": ["Inson taraqqiyoti", "Biznes yuritish osonligi", "Iqtisodiy erkinlik", "Ekologik samaradorlik"],
    "a": "Iqtisodiy erkinlik"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“O‘zbekiston – 2030” strategiyasi qachon qabul qilingan?",
    "options": ["2023-yil 11-sentyabr", "2023-yil 22-sentyabr", "2022-yil 7-fevral", "2024-yil 1-yanvar"],
    "a": "2023-yil 22-sentyabr"
  },
  {
    "fan": "O‘zbekistonning eng yangi tarixi",
    "q": "“Yoshlar ittifoqi” tashkiloti qachon tuzilgan?",
    "options": ["2016-yil 30-iyun", "2017-yil 14-sentabr", "2018-yil 1-iyun", "2019-yil 5-mart"],
    "a": "2016-yil 30-iyun"
  }


  





]

    },
    math: { // Yangi qo'shilgan fan
    name: "Matematika",
    questions: [
     {
        q: "Limitni hisoblang: lim x→−5 (x²+4x−5)/(x²+8x+15)",
        options: ["-3", "-1", "1", "3"],
        a: "-1"
      },
      {
        q: "Aniqmas integralni toping: ∫(5 + sin 2x) dx",
        options: [
          "5x − cos2x + C",
          "5x − (1/2)cos2x + C",
          "5x + cos2x + C",
          "5x + (1/2)cos2x + C"
        ],
        a: "5x − (1/2)cos2x + C"
      },
      {
        q: "Agar Σ f(ci)Δxi limit mavjud bo‘lsa, u nima deb ataladi?",
        options: ["Limit", "Hosila", "Integral", "Funksiya qiymati"],
        a: "Integral"
      },
      {
        q: "Funksiyaning uzilish nuqtalarini toping: f(x) = (3x+7)/(x²−9x+18)",
        options: ["x = 3 va x = 6", "x = 2 va x = 9", "x = 6", "Uzluksiz"],
        a: "x = 3 va x = 6"
      },
      {
        q: "Hosilani toping: y = 4ctg(8x)",
        options: [
          "−32csc²(8x)",
          "−4csc²(8x)",
          "32csc(8x)",
          "−8ctg(8x)"
        ],
        a: "−32csc²(8x)"
      },
      {
        q: "Funksiyaning aniqlanish sohasini toping: y = ⁵√(3x−15)",
        options: ["x > 5", "x < 5", "x ≥ 5", "(−∞,+∞)"],
        a: "(−∞,+∞)"
      },
      {
        q: "Limitni hisoblang: lim x→2 (x²+3x−10)/(x²+x−6)",
        options: ["5", "-5", "1", "3"],
        a: "5"
      },
      {
        q: "y = (1/3)x³ − x² − 3x + 1 funksiyaning ekstremumlarini toping",
        options: [
          "Max x = −1, Min x = 3",
          "Max x = 1, Min x = −3",
          "Max x = 3, Min x = −1",
          "Ekstremum yo‘q"
        ],
        a: "Max x = −1, Min x = 3"
      },
      {
        q: "Funksiyaning aniqlanish sohasini toping: y = ⁴√(8x + 48)",
        options: ["x > −6", "x ≥ −6", "x < −6", "(−∞,+∞)"],
        a: "x ≥ −6"
      },
      {
        q: "Limitni hisoblang: lim x→−7 (x²+6x−7)/(x²+12x+35)",
        options: ["1", "-1", "0", "2"],
        a: "-1"
      },
      {
        "q": "Limitni hisoblang: lim x→5 (x²+8x+15)/(x²+3x−10)",
        "options": ["-2", "2", "1", "0"],
        "a": "2"
      },
      {
        "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (−9x+2)/(x²−4x−5)",
        "options": ["x = 5 va x = −1", "x = 1 va x = 5", "x = −5 va x = 1", "Uzluksiz"],
        "a": "x = 5 va x = −1"
      },
      {
        "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (−9x+2)/(x²−6x+5)",
        "options": ["x = 1 va x = 5", "x = −1 va x = 5", "x = 3 va x = 5", "Uzluksiz"],
        "a": "x = 1 va x = 5"
      },
      {
        "q": "y = −(1/3)x³ − 2x² + 12x + 9 funksiyaning ekstremumlarini toping",
        "options": [
          "Max x = 2, Min x = −6",
          "Max x = −2, Min x = 6",
          "Max x = 6, Min x = −2",
          "Ekstremum yo‘q"
        ],
        "a": "Max x = 2, Min x = −6"
      },
      {
        "q": "Hosilani toping: y = −x² + 4x − 5 + arctg x",
        "options": [
          "−2x + 4 + 1/(1+x²)",
          "−2x − 4 + 1/(1+x²)",
          "−x + 4 + 1/(1+x²)",
          "−2x + 4 − 1/(1+x²)"
        ],
        "a": "−2x + 4 + 1/(1+x²)"
      },
      {
        "q": "Funksiyaning aniqlanish sohasini toping: y = ∛(31x + 93)",
        "options": ["x ≥ −3", "x ≤ −3", "(−∞,+∞)", "x > −3"],
        "a": "(−∞,+∞)"
      },
      {
        "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 18x² − 13x + 4",
        "options": [
          "x < −6 qavariq, x > −6 botiq",
          "x > −6 qavariq, x < −6 botiq",
          "Hamma joyda qavariq",
          "Hamma joyda botiq"
        ],
        "a": "x > −6 qavariq, x < −6 botiq"
      },
      {
        "q": "Qachon E₁ va E₂ to‘plamlar teng deyiladi?",
        "options": [
          "Agar E₁ ⊂ E₂ bo‘lsa",
          "Agar E₂ ⊂ E₁ bo‘lsa",
          "Agar E₁ va E₂ bir xil elementlardan iborat bo‘lsa",
          "Agar E₁ bo‘sh bo‘lsa"
        ],
        "a": "Agar E₁ va E₂ bir xil elementlardan iborat bo‘lsa"
      },
      {
        "q": "y = −(1/3)x³ + x² + 15x − 11 funksiyaning ekstremumlarini toping",
        "options": [
          "Max x = −3, Min x = 5",
          "Max x = 3, Min x = −5",
          "Max x = 5, Min x = −3",
          "Ekstremum yo‘q"
        ],
        "a": "Max x = −3, Min x = 5"
      },
      {
        "q": "A va B to‘plamlarning kesishmasi nima deb ataladi?",
        "options": [
          "Birlashtma",
          "Ayirma",
          "Kesishma",
          "Komplement"
        ],
        "a": "Kesishma"
      },
      
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = ⁶√(−8x + 24)",
    "options": ["x ≤ 3", "x ≥ 3", "(−∞,+∞)", "x < 3"],
    "a": "x ≤ 3"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = −x³ + 6x² − 3x + 4",
    "options": [
      "x < 2 qavariq, x > 2 botiq",
      "x > 2 qavariq, x < 2 botiq",
      "Hamma joyda qavariq",
      "Hamma joyda botiq"
    ],
    "a": "x < 2 qavariq, x > 2 botiq"
  },
  {
    "q": "A va B to‘plamlarning ayirmasi nima deb ataladi?",
    "options": [
      "Kesishma",
      "Birlashtma",
      "Ayirma",
      "Komplement"
    ],
    "a": "Ayirma"
  },
  {
    "q": "Limitni hisoblang: lim x→1 (x² + 6x − 7)/(x² + 4x − 5)",
    "options": ["1", "2", "3", "4"],
    "a": "2"
  },
  {
    "q": "Limitni hisoblang: lim x→4 (x² + 9x + 20)/(x² + 3x − 4)",
    "options": ["4", "5", "6", "7"],
    "a": "5"
  },
  {
    "q": "Funksiyaning ta’rifini ko‘rsating",
    "options": [
      "Bir to‘plamdan ikkinchisiga moslik",
      "Faqat sonlar to‘plami",
      "Faqat grafik",
      "Faqat formula"
    ],
    "a": "Bir to‘plamdan ikkinchisiga moslik"
  },
  {
    "q": "y = −(1/3)x³ + 2x² + 12x − 6 funksiyaning ekstremumlarini toping",
    "options": [
      "Max x = 6, Min x = −2",
      "Max x = −6, Min x = 2",
      "Max x = 2, Min x = −6",
      "Ekstremum yo‘q"
    ],
    "a": "Max x = 2, Min x = −6"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 3x² + 5x − 4",
    "options": [
      "x < −1 qavariq, x > −1 botiq",
      "x > −1 qavariq, x < −1 botiq",
      "Hamma joyda qavariq",
      "Hamma joyda botiq"
    ],
    "a": "x > −1 qavariq, x < −1 botiq"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / ∛(3x − 12)",
    "options": [
      "(−∞,4) ∪ (4,+∞)",
      "(−∞,4]",
      "[4,+∞)",
      "(−∞,+∞)"
    ],
    "a": "(−∞,4) ∪ (4,+∞)"
  },
  {
    "q": "D to‘plamda aniqlangan y = f(x) funksiya qachon juft deyiladi?",
    "options": [
      "f(−x) = −f(x)",
      "f(−x) = f(x)",
      "f(x) = 0",
      "f(x) > 0"
    ],
    "a": "f(−x) = f(x)"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = √(5 − x)",
    "options": ["x ≤ 5", "x ≥ 5", "(−∞,+∞)", "x < 5"],
    "a": "x ≤ 5"
  },
  {
    "q": "y = x² − 4x + 1 funksiyaning minimum qiymati nechaga teng?",
    "options": ["−3", "−4", "1", "0"],
    "a": "−3"
  },
  {
    "q": "Funksiya qachon toq deyiladi?",
    "options": [
      "f(−x) = −f(x)",
      "f(−x) = f(x)",
      "f(x) ≥ 0",
      "f(x) = 0"
    ],
    "a": "f(−x) = −f(x)"
  },
  {
    "q": "Limitni toping: lim x→0 (sin x)/x",
    "options": ["0", "1", "∞", "−1"],
    "a": "1"
  },
  {
    "q": "Limitni hisoblang: lim x→∞ (3x² + 5)/(x² − 1)",
    "options": ["0", "1", "3", "∞"],
    "a": "3"
  },
  {
    "q": "Hosilaning geometrik ma’nosi nima?",
    "options": [
      "Tangensning og‘ish burchagi tangensi",
      "Funksiyaning qiymati",
      "Integral osti funksiya",
      "Grafik yuzasi"
    ],
    "a": "Tangensning og‘ish burchagi tangensi"
  },
  {
    "q": "y = 2x³ − 6x² + 4 funksiyaning kritik nuqtalari nechta?",
    "options": ["0 ta", "1 ta", "2 ta", "3 ta"],
    "a": "2 ta"
  },
  {
    "q": "y = x³ funksiyaning ikkinchi hosilasi nechaga teng?",
    "options": ["6x", "3x²", "x²", "6"],
    "a": "6x"
  },
  {
    "q": "Funksiya o‘suvchi bo‘lishi uchun qanday shart bajarilishi kerak?",
    "options": [
      "f′(x) > 0",
      "f′(x) < 0",
      "f′(x) = 0",
      "f(x) = 0"
    ],
    "a": "f′(x) > 0"
  },
  {
    "q": "Integralning asosiy vazifasi nima?",
    "options": [
      "Yuzani hisoblash",
      "Hosila topish",
      "Limitni aniqlash",
      "Tenglama yechish"
    ],
    "a": "Yuzani hisoblash"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 3x² + 5x - 4",
    "options": ["(-∞,-1) qavariq, (-1,∞) botiq", "(-∞,1) botiq, (1,∞) qavariq", "Doimo qavariq", "Doimo botiq"],
    "a": "(-∞,-1) qavariq, (-1,∞) botiq"
  },
  {
    "q": "Ushbu funksiyaning aniqlanish sohasini toping: y = 1 / ∛(3x-12)",
    "options": ["x ≠ 4", "x > 4", "x < 4", "(-∞,+∞)"],
    "a": "x ≠ 4"
  },
  {
    "q": "D to'plamda aniqlangan y = f(x) funksiya qachon juft deyiladi?",
    "options": ["f(-x) = f(x)", "f(-x) = -f(x)", "f(x+T) = f(x)", "f(x) > 0"],
    "a": "f(-x) = f(x)"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = -1/3x³ + 3x² + 16x - 8",
    "options": ["Max x=8, Min x=-2", "Max x=2, Min x=-8", "Max x=4, Min x=-4", "Ekstremum yo'q"],
    "a": "Max x=8, Min x=-2"
  },
  {
    "q": "D to'plamda aniqlangan y = f(x) funksiya qachon o'suvchi deyiladi?",
    "options": ["x2 > x1 bo'lganda f(x2) > f(x1)", "x2 > x1 bo'lganda f(x2) < f(x1)", "f'(x) < 0 bo'lganda", "f(x) = const bo'lganda"],
    "a": "x2 > x1 bo'lganda f(x2) > f(x1)"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 4 arcsin 5x",
    "options": ["20 / √(1-25x²)", "4 / √(1-25x²)", "-20 / √(1-25x²)", "20 / (1+25x²)"],
    "a": "20 / √(1-25x²)"
  },
  {
    "q": "Juft funksiyalar qatorini ko'rsating:",
    "options": ["x², cos x, |x|", "x³, sin x, tg x", "eˣ, ln x", "x+1, x²"],
    "a": "x², cos x, |x|"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 15x² - 9x + 1",
    "options": ["(-∞,-5) qavariq, (-5,∞) botiq", "(-∞,5) botiq, (5,∞) qavariq", "(-∞,0) qavariq", "Doimo botiq"],
    "a": "(-∞,-5) qavariq, (-5,∞) botiq"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping f(x) = (3x+12) / (x²+6x-16)",
    "options": ["x = 2 va x = -8", "x = -2 va x = 8", "x = 4 va x = -4", "x = 0"],
    "a": "x = 2 va x = -8"
  },
  {
    "q": "Qachon {xn} ketma-ketlik chegaralangan deyiladi?",
    "options": ["|xn| ≤ M sharti bajarilsa", "xn > 0 bo'lsa", "limitga ega bo'lsa", "xn+1 > xn bo'lsa"],
    "a": "|xn| ≤ M sharti bajarilsa"
  },
  {
    "q": "Qachon {xn} ketma-ketlik o'suvchi deyiladi?",
    "options": ["xn+1 > xn", "xn+1 < xn", "xn = c", "xn > 0"],
    "a": "xn+1 > xn"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = -1/3x³ + 4x² + 9x - 4",
    "options": ["Max x=9, Min x=-1", "Max x=1, Min x=-9", "Max x=3, Min x=-3", "Ekstremum yo'q"],
    "a": "Max x=9, Min x=-1"
  },
  {
    "q": "lim (n→∞) xn = a yozuv qanday ma'noni anglatadi?",
    "options": ["Ketma-ketlik limiti a ga teng", "Ketma-ketlik cheksiz", "Ketma-ketlik o'suvchi", "a soni xn dan katta"],
    "a": "Ketma-ketlik limiti a ga teng"
  },
  {
    "q": "Ikkita funksiya yig'indisining limiti haqidagi teorema:",
    "options": ["lim(f+g) = lim f + lim g", "lim(f+g) = lim f * lim g", "lim(f+g) = f(a) + g(a)", "Mavjud emas"],
    "a": "lim(f+g) = lim f + lim g"
  },
  {
    "q": "Ikkinchi ajoyib limitni ko'rsating:",
    "options": ["lim (1 + 1/n)ⁿ = e", "sin x / x = 1", "lim (1+x) = 1", "eˣ = 1"],
    "a": "lim (1 + 1/n)ⁿ = e"
  },
  {
    "q": "Qanday nuqtalarni funksiyaning uzilish nuqtalari deb ataymiz?",
    "options": ["Funksiya aniqlanmagan yoki uzluksizlik sharti buzilgan nuqtalar", "f(x) = 0 bo'lgan nuqtalar", "f'(x) = 0 bo'lgan nuqtalar", "Ekstremum nuqtalar"],
    "a": "Funksiya aniqlanmagan yoki uzluksizlik sharti buzilgan nuqtalar"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping va turini aniqlang: y = (x-5) / (x+4)",
    "options": ["x = -4, II-tur uzilish", "x = 4, I-tur uzilish", "x = 5, bartaraf qilinadigan", "Uzilish yo'q"],
    "a": "x = -4, II-tur uzilish"
  },
  {
    "q": "y = f(x) funksiyaning x nuqtadagi argumentining Δx orttirmasiga mos Δy orttirmasi qanday hisoblanadi?",
    "options": ["Δy = f(x+Δx) - f(x)", "Δy = f(x) - f(Δx)", "Δy = f'(x)Δx", "Δy = Δx / x"],
    "a": "Δy = f(x+Δx) - f(x)"
  },
  {
    "q": "y = f(x) funksiyaning x nuqtadagi hosilasining ta'rifini ko'rsating:",
    "options": ["lim (Δx→0) Δy/Δx", "Δy / Δx", "f(x+Δx)", "f'(x) = 0"],
    "a": "lim (Δx→0) Δy/Δx"
  },
  {
    "q": "Qachon y = f(x) funksiya (a; b) oraliqda differensiallanuvchi deyiladi?",
    "options": ["Oraliqning har bir nuqtasida chekli hosilaga ega bo'lsa", "Funksiya uzluksiz bo'lsa", "Funksiya o'suvchi bo'lsa", "f(a) = f(b) bo'lsa"],
    "a": "Oraliqning har bir nuqtasida chekli hosilaga ega bo'lsa"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ + 3x² + 5x + 2",
    "options": ["Max x = -5, Min x = -1", "Max x = -1, Min x = -5", "Max x = 5, Min x = 1", "Ekstremum yo'q"],
    "a": "Max x = -5, Min x = -1"
  },
  {
    "q": "u = u(x) va v = v(x) funksiyalar (a; b) oraliqda differensiallanuvchi bo'lsin. U holda bu funksiyalar yig'indisining hosilasi qanday?",
    "options": ["(u+v)' = u' + v'", "(u+v)' = u' - v'", "(u+v)' = u'v + uv'", "(u+v)' = u'v'"],
    "a": "(u+v)' = u' + v'"
  },
  {
    "q": "Ikki funksiya ko'paytmasining hosilasi qaysi formula bilan hisoblanadi?",
    "options": ["(u·v)' = u'v + uv'", "(u·v)' = u'v'", "(u·v)' = u'v - uv'", "(u·v)' = u' + v'"],
    "a": "(u·v)' = u'v + uv'"
  },
  {
    "q": "Ikki funksiya nisbatining hosilasi qaysi formula bilan hisoblanadi?",
    "options": ["(u/v)' = (u'v - uv')/v²", "(u/v)' = u'/v'", "(u/v)' = (u'v + uv')/v²", "(u/v)' = u'v - uv'"],
    "a": "(u/v)' = (u'v - uv')/v²"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 4x⁶ + 1/x + 2 sin x",
    "options": ["24x⁵ - 1/x² + 2 cos x", "24x⁵ + 1/x² + 2 cos x", "4x⁵ - 1/x² - 2 cos x", "24x⁶ - ln x + 2 cos x"],
    "a": "24x⁵ - 1/x² + 2 cos x"
  },
  {
    "q": "Toq funksiyalar qatorini ko'rsating:",
    "options": ["x³, sin x, tg x, ctg x", "x², cos x, |x|", "eˣ, ln x", "x+1, x⁴"],
    "a": "x³, sin x, tg x, ctg x"
  },
  {
    "q": "Aniq integralni hisoblang: ∫(1 dan 2 gacha) 2e²ˣ dx",
    "options": ["e⁴ - e²", "e² - e", "2e⁴ - 2e²", "e⁴ + e²"],
    "a": "e⁴ - e²"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = x⁵ + √x + eˣ",
    "options": ["5x⁴ + 1/(2√x) + eˣ", "5x⁴ + √x + eˣ", "x⁴ + 1/√x + eˣ", "5x⁴ - 1/(2√x) + eˣ"],
    "a": "5x⁴ + 1/(2√x) + eˣ"
  },
  {
    "q": "Qachon x0 nuqta y = f(x) funksiyaning maksimum nuqtasi deyiladi?",
    "options": ["f(x) ≤ f(x0)", "f(x) ≥ f(x0)", "f'(x0) = 0", "f''(x0) > 0"],
    "a": "f(x) ≤ f(x0)"
  },
  {
    "q": "Qachon x0 nuqta y = f(x) funksiyaning minimum nuqtasi deyiladi?",
    "options": ["f(x) ≥ f(x0)", "f(x) ≤ f(x0)", "f'(x0) = 0", "f''(x0) < 0"],
    "a": "f(x) ≥ f(x0)"
  },
  {
    "q": "Funksiya ekstremumining zaruriy shartini ko'rsating:",
    "options": ["f'(x) = 0", "f'(x) > 0", "f''(x) = 0", "f(x) = 0"],
    "a": "f'(x) = 0"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = eˣ cos x",
    "options": ["eˣ(cos x - sin x)", "eˣ(cos x + sin x)", "eˣ sin x", "-eˣ cos x"],
    "a": "eˣ(cos x - sin x)"
  },
  {
    "q": "Funksiya minimumining yetarli shartini toping:",
    "options": ["f'(x0)=0 va f''(x0)>0", "f'(x0)=0 va f''(x0)<0", "f'(x0)>0", "f(x0)=0"],
    "a": "f'(x0)=0 va f''(x0)>0"
  },
  {
    "q": "f'(x0)=0 bo'lib, ikkinchi tartibli hosila mavjud va f''(x0) < 0 bo'lsa, x0 nima?",
    "options": ["Maksimum nuqta", "Minimum nuqta", "Burilish nuqtasi", "Uzlilish nuqtasi"],
    "a": "Maksimum nuqta"
  },
  {
    "q": "f'(x0)=0 bo'lib, ikkinchi tartibli hosila mavjud va f''(x0) > 0 bo'lsa, x0 nima?",
    "options": ["Minimum nuqta", "Maksimum nuqta", "Egar nuqta", "Kritik nuqta"],
    "a": "Minimum nuqta"
  },
  {
    "q": "Limitni hisoblang: lim (x→2) (3x + 5)",
    "options": ["11", "6", "10", "13"],
    "a": "11"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (7x+15)/(x²+10x+9)",
    "options": ["x = -1 va x = -9", "x = 1 va x = 9", "x = 0", "x = -3"],
    "a": "x = -1 va x = -9"
  },
  {
    "q": "Limitni hisoblang: lim (x→0) (-7x+1)/(9x-4)",
    "options": ["-1/4", "1/4", "7/9", "0"],
    "a": "-1/4"
  },
  {
    "q": "Limitni hisoblang: lim (x→8) (2x-3)/(5x-34)",
    "options": ["13/6", "2/5", "1", "3"],
    "a": "13/6"
  },
  {
    "q": "D to'plamda aniqlangan y = f(x) funksiya qachon toq deyiladi?",
    "options": ["f(-x) = -f(x)", "f(-x) = f(x)", "f(x+T) = f(x)", "f(x) < 0"],
    "a": "f(-x) = -f(x)"
  },
  {
    "q": "Limitni hisoblang: lim (x→3) (3x+8)/(-4x+5)",
    "options": ["-17/7", "17/7", "11/7", "0"],
    "a": "-17/7"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 5x⁴",
    "options": ["20x³", "5x³", "20x⁴", "x⁵"],
    "a": "20x³"
  },
  {
    "q": "Agar A = {1,2,3,a,b,c,d} va B = {3,4,5,6,c,d,e} bo'lsa, A ∪ B ni toping:",
    "options": ["{1,2,3,4,5,6,a,b,c,d,e}", "{3,c,d}", "{1,2,a,b}", "{e}"],
    "a": "{1,2,3,4,5,6,a,b,c,d,e}"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = √(-6x + 12)",
    "options": ["x ≤ 2", "x ≥ 2", "x < 2", "x > 2"],
    "a": "x ≤ 2"
  },
  {
    "q": "Limitni hisoblang: lim (x→5) (x²-13x+40)/(x²+2x-35)",
    "options": ["-1/4", "1/4", "3/12", "0"],
    "a": "-1/4"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = -7x⁴",
    "options": ["-28x³", "28x³", "-7x³", "x⁴"],
    "a": "-28x³"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = √x",
    "options": ["1/(2√x)", "2√x", "1/√x", "-1/x²"],
    "a": "1/(2√x)"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 3∛x",
    "options": ["1/∛x²", "∛x", "3/x", "1/x"],
    "a": "1/∛x²"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 5/x",
    "options": ["-5/x²", "5/x²", "5 ln x", "-5/x"],
    "a": "-5/x²"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlarini toping: y = -1/3x³ + x² + 8x - 19",
    "options": ["Max x=4, Min x=-2", "Max x=2, Min x=-4", "Max x=0", "Ekstremum yo'q"],
    "a": "Max x=4, Min x=-2"
  },
  {
    "q": "y = 3ˣ funksiyaning hosilasini toping:",
    "options": ["3ˣ ln 3", "3ˣ / ln 3", "x·3ˣ⁻¹", "3ˣ"],
    "a": "3ˣ ln 3"
  },
  {
    "q": "y = log₈ x funksiyaning hosilasini toping:",
    "options": ["1/(x ln 8)", "x / ln 8", "1/x", "ln 8 / x"],
    "a": "1/(x ln 8)"
  },
  {
    "q": "Funksiya maksimumining yetarli shartini toping:",
    "options": ["f'(x0)=0 va f''(x0)<0", "f'(x0)=0 va f''(x0)>0", "f'(x0)=0", "f(x0)=0"],
    "a": "f'(x0)=0 va f''(x0)<0"
  },
  {
    "q": "y = log₆ x funksiyaning hosilasini toping:",
    "options": ["1/(x ln 6)", "1/x", "6/x", "ln 6 / x"],
    "a": "1/(x ln 6)"
  },
  {
    "q": "D to'plamda aniqlangan y = f(x) funksiya qachon kamayuvchi deyiladi?",
    "options": ["x2 > x1 bo'lganda f(x2) < f(x1)", "x2 > x1 bo'lganda f(x2) > f(x1)", "f'(x) > 0", "f(x) = 0"],
    "a": "x2 > x1 bo'lganda f(x2) < f(x1)"
  },
  {
    "q": "y = ln 3x funksiyaning hosilasini toping:",
    "options": ["1/x", "3/x", "1/3x", "ln 3"],
    "a": "1/x"
  },
  {
    "q": "Qachon {xn} ketma-ketlik kamayuvchi deyiladi?",
    "options": ["xn+1 < xn", "xn+1 > xn", "xn = 0", "xn < 0"],
    "a": "xn+1 < xn"
  },
  {
    "q": "y = ln 7x funksiyaning hosilasini toping:",
    "options": ["1/x", "7/x", "1/7x", "ln 7"],
    "a": "1/x"
  },
  {
    "q": "y = 11 cos 2x funksiyaning hosilasini toping:",
    "options": ["-22 sin 2x", "22 sin 2x", "-11 sin 2x", "22 cos 2x"],
    "a": "-22 sin 2x"
  },
  {
    "q": "Aniq integralda o'zgaruvchini almashtirish formulasini ko'rsating:",
    "options": ["∫ f(x)dx = ∫ f(φ(t))φ'(t)dt", "∫ udv = uv - ∫ vdu", "F(b) - F(a)", "f(b) - f(a)"],
    "a": "∫ f(x)dx = ∫ f(φ(t))φ'(t)dt"
  },
  {
    "q": "y = 5 cos 3x funksiyaning hosilasini toping:",
    "options": ["-15 sin 3x", "15 sin 3x", "-5 sin 3x", "15 cos 3x"],
    "a": "-15 sin 3x"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ + 2x² + 3x - 1",
    "options": ["Max x=-3, Min x=-1", "Max x=-1, Min x=-3", "Max x=3, Min x=1", "Ekstremum yo'q"],
    "a": "Max x=-3, Min x=-1"
  },
  {
    "q": "N, Z, Q, R to'plamlar orasidagi munosabatni ko'rsating:",
    "options": ["N ⊂ Z ⊂ Q ⊂ R", "R ⊂ Q ⊂ Z ⊂ N", "N ⊂ Q ⊂ Z ⊂ R", "Z ⊂ N ⊂ Q ⊂ R"],
    "a": "N ⊂ Z ⊂ Q ⊂ R"
  },
  {
    "q": "y = 3 tg 6x funksiyaning hosilasini toping:",
    "options": ["18 / cos² 6x", "3 / cos² 6x", "18 tg 6x", "18 / sin² 6x"],
    "a": "18 / cos² 6x"
  },
  {
    "q": "Aniq integralni hisoblang: ∫(0 dan 2 gacha) (8x³ + 9x² + 2x - 20) dx",
    "options": ["14", "10", "20", "0"],
    "a": "14"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 5 ctg 6x",
    "options": ["-30 / sin² 6x", "30 / sin² 6x", "-5 / sin² 6x", "30 ctg 6x"],
    "a": "-30 / sin² 6x"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 9 arcsin 2x",
    "options": ["18 / √(1 - 4x²)", "9 / √(1 - 4x²)", "18 / (1 + 4x²)", "18 / √(1 - x²)"],
    "a": "18 / √(1 - 4x²)"
  },
  {
    "q": "Limitni hisoblang: lim (x→−7) (x² + 2x - 35) / (x² - x - 56)",
    "options": ["12/15", "4/5", "1", "0"],
    "a": "4/5"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 7 arctg 8x",
    "options": ["56 / (1 + 64x²)", "7 / (1 + 64x²)", "56 / (1 + 8x²)", "56 / √(1 - 64x²)"],
    "a": "56 / (1 + 64x²)"
  },
  {
    "q": "O'suvchi, kamayuvchi, o'smaydigan va kamaymaydigan funksiyalar umumlashtirilib qanday nomlanadi?",
    "options": ["Monoton funksiyalar", "Davriy funksiyalar", "Uzluksiz funksiyalar", "Chegaralangan funksiyalar"],
    "a": "Monoton funksiyalar"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 11 arcctg 3x",
    "options": ["-33 / (1 + 9x²)", "33 / (1 + 9x²)", "-11 / (1 + 9x²)", "-33 / √(1 - 9x²)"],
    "a": "-33 / (1 + 9x²)"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = xeˣ",
    "options": ["eˣ(x + 1)", "eˣ", "xeˣ", "eˣ(x - 1)"],
    "a": "eˣ(x + 1)"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 12x² - x + 4",
    "options": ["(-∞,-4) qavariq, (-4,∞) botiq", "(-∞,4) botiq, (4,∞) qavariq", "Doimo botiq", "Doimo qavariq"],
    "a": "-4,∞) botiq"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = (2x + 1) sin x",
    "options": ["2 sin x + (2x + 1) cos x", "2 cos x", "2 sin x - cos x", "sin x + 2x cos x"],
    "a": "2 sin x + (2x + 1) cos x"
  },
  {
    "q": "Differensiallanuvchi funksiya kamayishining zaruriy shartini toping:",
    "options": ["f'(x) ≤ 0", "f'(x) ≥ 0", "f'(x) = 0", "f''(x) < 0"],
    "a": "f'(x) ≤ 0"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = (x² + 1) tg x",
    "options": ["2x tg x + (x² + 1) / cos² x", "2x / cos² x", "2x tg x", "x² / cos² x"],
    "a": "2x tg x + (x² + 1) / cos² x"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = (3x - 1) arcsin x",
    "options": ["3 arcsin x + (3x - 1) / √(1 - x²)", "3 / √(1 - x²)", "3 arcsin x", "arcsin x + 3x"],
    "a": "3 arcsin x + (3x - 1) / √(1 - x²)"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = sin x ln x",
    "options": ["cos x ln x + sin x / x", "cos x / x", "sin x / x", "cos x + ln x"],
    "a": "cos x ln x + sin x / x"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = ⁶√(-6x + 42)",
    "options": ["x ≤ 7", "x ≥ 7", "x < 7", "x > 7"],
    "a": "x ≤ 7"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = (1 + x²) arctg x",
    "options": ["2x arctg x + 1", "2x arctg x", "1 + x²", "2x / (1 + x²)"],
    "a": "2x arctg x + 1"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 6x⁵",
    "options": ["30x⁴", "6x⁴", "30x⁵", "x⁶"],
    "a": "30x⁴"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = -x⁴ + sin x",
    "options": ["-4x³ + cos x", "4x³ + cos x", "-4x³ - cos x", "-x³ + cos x"],
    "a": "-4x³ + cos x"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = x⁵ - ln x",
    "options": ["5x⁴ - 1/x", "5x⁴ + 1/x", "x⁴ - 1/x", "5x⁴ - ln x"],
    "a": "5x⁴ - 1/x"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping f(x) = (x + 2) / (x² + 8x - 9)",
    "options": ["x = 1 va x = -9", "x = -1 va x = 9", "x = 2", "x = 0"],
    "a": "x = 1 va x = -9"
  },
  {
    "q": "Qachon F(x) funksiya (a; b) oraliqda f(x) funksiyaning boshlang'ich funksiyasi deb ataladi?",
    "options": ["F'(x) = f(x)", "f'(x) = F(x)", "∫ F(x) = f(x)", "F(x) = f(x) + C"],
    "a": "F'(x) = f(x)"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = -3x⁵",
    "options": ["-15x⁴", "15x⁴", "-3x⁴", "-15x⁵"],
    "a": "-15x⁴"
  },
  {
    "q": "Aniqmas integralning xossalaridan birini ko'rsating:",
    "options": ["∫ k f(x) dx = k ∫ f(x) dx", "∫ f(x) dx = f'(x)", "∫ (f+g) = ∫ f · ∫ g", "∫ f dx = F(b) - F(a)"],
    "a": "∫ k f(x) dx = k ∫ f(x) dx"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = ⁸√(5x + 20)",
    "options": ["x ≥ -4", "x > -4", "x ≤ -4", "(-∞,+∞)"],
    "a": "x ≥ -4"
  },
  {
    "q": "Aniqmas integralni toping: ∫ (3x² - 5 sin x) dx",
    "options": ["x³ + 5 cos x + C", "x³ - 5 cos x + C", "6x - 5 cos x + C", "3x³ + 5 cos x + C"],
    "a": "x³ + 5 cos x + C"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 5 arcctg 9x",
    "options": ["-45 / (1 + 81x²)", "45 / (1 + 81x²)", "-5 / (1 + 81x²)", "-45 / √(1 - 81x²)"],
    "a": "-45 / (1 + 81x²)"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ - 12x² + 7x - 1",
    "options": ["(-∞,4) qavariq, (4,∞) botiq", "(-∞,-4) botiq, (-4,∞) qavariq", "Doimo qavariq", "Doimo botiq"],
    "a": "(-∞,4) qavariq, (4,∞) botiq"
  },
  {
    "q": "Limitni hisoblang: lim (x→3) (7x - 4)",
    "options": ["17", "21", "25", "11"],
    "a": "17"
  },
  {
    "q": "Aniqmas integralni toping: ∫ (3ˣ - 1/cos²x) dx",
    "options": ["3ˣ/ln3 - tg x + C", "3ˣ ln3 - tg x + C", "3ˣ - tg x + C", "3ˣ/ln3 + tg x + C"],
    "a": "3ˣ/ln3 - tg x + C"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 4 sin 9x",
    "options": ["36 cos 9x", "4 cos 9x", "-36 cos 9x", "36 sin 9x"],
    "a": "36 cos 9x"
  },
  {
    "q": "Aniqmas integralni toping: ∫ (5ˣ + cos 3x) dx",
    "options": ["5ˣ/ln5 + (1/3)sin 3x + C", "5ˣ ln5 + sin 3x + C", "5ˣ/ln5 - sin 3x + C", "5ˣ + sin 3x + C"],
    "a": "5ˣ/ln5 + (1/3)sin 3x + C"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlarini toping: y = 1/3x³ + 2x² + 3x + 10",
    "options": ["Max x = -3, Min x = -1", "Max x = -1, Min x = -3", "Max x = 3, Min x = 1", "Ekstremum yo'q"],
    "a": "Max x = -3, Min x = -1"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = ⁶√(-5x - 15)",
    "options": ["x ≤ -3", "x ≥ -3", "x < -3", "(-∞,+∞)"],
    "a": "x ≤ -3"
  },
  {
    "q": "Nyuton-Leybnits formulasini ko'rsating:",
    "options": ["∫ f(x) dx = F(b) - F(a)", "∫ f(x) dx = f(b) - f(a)", "∫ f = F(x) + C", "∫ udv = uv - ∫ vdu"],
    "a": "∫ f(x) dx = F(b) - F(a)"
  },
  {
    "q": "Limitni hisoblang: lim (x→-4) (-2x + 6)",
    "options": ["14", "-2", "8", "12"],
    "a": "14"
  },
  {
    "q": "Bo'laklab integrallash formulasini ko'rsating:",
    "options": ["∫ u dv = uv - ∫ v du", "∫ f(x) dx = F(b) - F(a)", "∫ kf = k∫f", "∫ (f+g) = ∫f + ∫g"],
    "a": "∫ u dv = uv - ∫ v du"
  },
  {
    "q": "Aniq integralni hisoblang: ∫ (2 dan 4 gacha) (3x² - 4x) dx",
    "options": ["32", "24", "40", "16"],
    "a": "32"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 7 arccos 5x",
    "options": ["-35 / √(1 - 25x²)", "35 / √(1 - 25x²)", "-7 / √(1 - 25x²)", "-35 / (1 + 25x²)"],
    "a": "-35 / √(1 - 25x²)"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 9x² + 4x - 5",
    "options": ["(-∞,-3) qavariq, (-3,∞) botiq", "(-∞,3) botiq, (3,∞) qavariq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞,-3) qavariq, (-3,∞) botiq"
  },
  {
    "q": "Aniq integralni hisoblang: ∫ (0 dan 3 gacha) (4x³ - 3x² + 6x) dx",
    "options": ["81", "72", "90", "64"],
    "a": "81"
  },
  {
    "q": "y = 1/x funksiyaning hosilasi nimaga teng?",
    "options": ["-1/x²", "1/x²", "ln x", "1/x"],
    "a": "-1/x²"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping f(x) = (5x - 1) / (x² + 7x + 10)",
    "options": ["x = -2 va x = -5", "x = 2 va x = 5", "x = 1/5", "Uzilish yo'q"],
    "a": "x = -2 va x = -5"
  },
  {
    "q": "Agar A = {1,2,3,a,b,c,d} va B = {3,4,5,6,c,d,e} bo'lsa, A ∩ B ni toping:",
    "options": ["{3,c,d}", "{1,2,a,b,e}", "{1,2,3,4,5,6,a,b,c,d,e}", "∅"],
    "a": "{3,c,d}"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping f(x) = (7x - 1) / (x² - 3x - 10)",
    "options": ["x = 5 va x = -2", "x = -5 va x = 2", "x = 7", "Uzilish yo'q"],
    "a": "x = 5 va x = -2"
  },
  {
    "q": "Aniq integralni hisoblang: ∫ (1 dan 4 gacha) (2x - 5) dx",
    "options": ["0", "5", "-5", "2"],
    "a": "0"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping f(x) = (-5x + 7) / (x² + 9x + 18)",
    "options": ["x = -3 va x = -6", "x = 3 va x = 6", "x = 0", "Uzilish yo'q"],
    "a": "x = -3 va x = -6"
  },
  {
    "q": "Σ f(ci) · Δxi ifoda qanday nomlanadi?",
    "options": ["Integral yig'indi (Riman yig'indisi)", "Limit", "Hosila", "Argument orttirmasi"],
    "a": "Integral yig'indi (Riman yig'indisi)"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (-3x + 5) / (x² + 3x - 18)",
    "options": ["x = 3 va x = -6", "x = -3 va x = 6", "x = 5", "Uzilish yo'q"],
    "a": "x = 3 va x = -6"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ + 4x² + 7x - 3",
    "options": ["Max x = -7, Min x = -1", "Max x = -1, Min x = -7", "Max x = 7, Min x = 1", "Ekstremum yo'q"],
    "a": "Max x = -7, Min x = -1"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = e⁷ˣ",
    "options": ["7e⁷ˣ", "e⁷ˣ", "7x e⁷ˣ⁻¹", "e⁷ˣ / 7"],
    "a": "7e⁷ˣ"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (-7x + 5) / (x² - 3x - 18)",
    "options": ["x = 6 va x = -3", "x = -6 va x = 3", "x = 0", "x = 7"],
    "a": "x = 6 va x = -3"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = e³ˣ",
    "options": ["3e³ˣ", "e³ˣ", "3x e³ˣ⁻¹", "e³"],
    "a": "3e³ˣ"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (7x + 21) / (x² - 8x - 9)",
    "options": ["x = 9 va x = -1", "x = -9 va x = 1", "x = -3", "Uzilish yo'q"],
    "a": "x = 9 va x = -1"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ - 6x² + 2x - 1",
    "options": ["(-∞,-2) botiq, (-2,∞) qavariq", "(-∞,2) qavariq, (2,∞) botiq", "Doimo qavariq", "Doimo botiq"],
    "a": "(-∞,-2) botiq, (-2,∞) qavariq"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (3x + 21) / (x² - 10x + 9)",
    "options": ["x = 1 va x = 9", "x = -1 va x = -9", "x = -7", "x = 0"],
    "a": "x = 1 va x = 9"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ - 6x² + 2x - 1",
    "options": ["(-∞,-2) botiq, (-2,∞) qavariq", "(-∞,-2) qavariq", "(-2,∞) qavariq", "Doimo botiq"],
    "a": "(-∞,-2) botiq, (-2,∞) qavariq"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (3x+21)/(x²-10x+9)",
    "options": ["x = 1 va x = 9", "x = -1 va x = -9", "x = 3", "x = 7"],
    "a": "x = 1 va x = 9"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 6 tg 7x",
    "options": ["42/cos²7x", "6/cos²7x", "42 tg 7x", "42/sin²7x"],
    "a": "42/cos²7x"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (5x + 3) / (x² - 3x - 28)",
    "options": ["x = 7 va x = -4", "x = -7 va x = 4", "x = 0", "x = 5"],
    "a": "x = 7 va x = -4"
  },
  {
    "q": "Birinchi ajoyib limitni ko'rsating:",
    "options": ["lim (x→0) sin x / x = 1", "lim (x→∞) (1 + 1/x)ˣ = e", "lim (x→0) tg x / x = 1", "lim (x→0) cos x = 1"],
    "a": "lim (x→0) sin x / x = 1"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (5x+4)/(x²+3x-28)",
    "options": ["x = 4 va x = -7", "x = -4 va x = 7", "x = 1", "x = 0"],
    "a": "x = 4 va x = -7"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 2 arccos 6x",
    "options": ["-12 / √(1 - 36x²)", "12 / √(1 - 36x²)", "-2 / √(1 - 36x²)", "-12 / (1 + 36x²)"],
    "a": "-12 / √(1 - 36x²)"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (5x + 6) / (x² - 11x + 28)",
    "options": ["x = 4 va x = 7", "x = -4 va x = -7", "x = 6", "Uzilish yo'q"],
    "a": "x = 4 va x = 7"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = ⁶√(11x + 33)",
    "options": ["x ≥ -3", "x > -3", "x ≤ -3", "(-∞,+∞)"],
    "a": "x ≥ -3"
  },
  {
    "q": "Funksiya qanday ko'rinishdagi uzilish nuqtalariga ega bo'ladi?",
    "options": ["I-tur va II-tur", "Faqat I-tur", "Faqat II-tur", "Uzluksiz nuqtalar"],
    "a": "I-tur va II-tur"
  },
  {
    "q": "Qachon x0 uzilish nuqtasi y = f(x) funksiyaning ikkinchi tur uzilish nuqtasi deyiladi?",
    "options": ["Kamida bitta bir tomonlama limit cheksiz yoki mavjud emas bo'lsa", "Ikkala limit mavjud bo'lsa", "Limitlar teng bo'lsa", "Funksiya f(x0) ga teng bo'lsa"],
    "a": "Kamida bitta bir tomonlama limit cheksiz yoki mavjud emas bo'lsa"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (-9x + 2) / (x² + 4x - 5)",
    "options": ["x = 1 va x = -5", "x = -1 va x = 5", "x = 0", "x = 2"],
    "a": "x = 1 va x = -5"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ + 12x² + 3x - 4",
    "options": ["(-∞,4) botiq, (4,∞) qavariq", "(-∞,4) qavariq, (4,∞) botiq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞,4) botiq, (4,∞) qavariq"
  },
  {
    "q": "Limitni hisoblang: lim (x→-3) (x² + 8x + 15) / (x² + 2x - 3)",
    "options": ["-0.5", "0.5", "1", "-1"],
    "a": "-0.5"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = -7x⁴",
    "options": ["-28x³", "28x³", "-7x³", "21x⁴"],
    "a": "-28x³"
  },
  {
    "q": "Limitni hisoblang: lim (x→5) (x² + 2x - 35) / (x² - 2x - 15)",
    "options": ["1.5", "1", "0", "5"],
    "a": "1.5"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 6x² + x - 7",
    "options": ["(-∞,-2) qavariq, (-2,∞) botiq", "(-∞,2) botiq, (2,∞) qavariq", "Doimo qavariq", "Doimo botiq"],
    "a": "(-∞,-2) qavariq, (-2,∞) botiq"
  },
  {
    "q": "Limitni hisoblang: lim (x→7) (x² - 12x + 35) / (x² - 4x - 21)",
    "options": ["0.2", "-0.2", "1", "0"],
    "a": "0.2"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = -1/3x³ + 4x² - 12x + 9",
    "options": ["Max x = 6, Min x = 2", "Max x = 2, Min x = 6", "Max x = 4, Min x = 0", "Ekstremum yo'q"],
    "a": "Max x = 6, Min x = 2"
  },
  {
    "q": "Limitni hisoblang: lim (x→1) (x² - 8x + 7) / (x² + 2x - 3)",
    "options": ["-1.5", "1.5", "1", "0"],
    "a": "-1.5"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ + x² - 8x + 8",
    "options": ["Max x = -4, Min x = 2", "Max x = 2, Min x = -4", "Max x = 0", "Ekstremum yo'q"],
    "a": "Max x = -4, Min x = 2"
  },
  {
    "q": "Limitni hisoblang: lim (x→-5) (x² - 3x - 40) / (x² + 8x + 15)",
    "options": ["6.5", "-6.5", "1", "0"],
    "a": "6.5"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ - 15x² + 11x - 3",
    "options": ["(-∞,-5) botiq, (-5,∞) qavariq", "(-∞,5) qavariq, (5,∞) botiq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞,-5) botiq, (-5,∞) qavariq"
  },
  {
    "q": "Limitni hisoblang: lim (x→8) (x² - x - 56) / (x² - 5x - 24)",
    "options": ["15/11", "11/15", "1", "0"],
    "a": "15/11"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 3 arctg 8x",
    "options": ["24 / (1 + 64x²)", "3 / (1 + 64x²)", "24 / (1 + 8x²)", "24 / √(1 - 64x²)"],
    "a": "24 / (1 + 64x²)"
  },
  {
    "q": "Limitni hisoblang: lim (x→4) (x² + x - 20) / (x² - 5x + 4)",
    "options": ["3", "-3", "1", "0"],
    "a": "3"
  },
  {
    "q": "Aniqmas integralni toping: ∫ (x⁵ - 1/sin²x) dx",
    "options": ["x⁶/6 + ctg x + C", "x⁶/6 - ctg x + C", "5x⁴ + ctg x + C", "x⁶/6 + tg x + C"],
    "a": "x⁶/6 + ctg x + C"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / √(-9x - 27)",
    "options": ["x < -3", "x ≤ -3", "x > -3", "x ≠ -3"],
    "a": "x < -3"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = -1/3x³ + 3x² + 7x + 3",
    "options": ["Max x = 7, Min x = -1", "Max x = -1, Min x = 7", "Max x = 3, Min x = -3", "Ekstremum yo'q"],
    "a": "Max x = 7, Min x = -1"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ - 12x² - 8x + 9",
    "options": ["(-∞,-4) botiq, (-4,∞) qavariq", "(-∞,4) qavariq, (4,∞) botiq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞,-4) botiq, (-4,∞) qavariq"
  },
  {
    "q": "Aniq integralni hisoblang: ∫ (1 dan 3 gacha) (6x² - 4x - 7) dx",
    "options": ["22", "18", "25", "30"],
    "a": "22"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / √(5x + 20)",
    "options": ["x > -4", "x ≥ -4", "x < -4", "x ≠ -4"],
    "a": "x > -4"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ + 15x² + 15x - 9",
    "options": ["(-∞,5) botiq, (5,∞) qavariq", "(-∞,5) qavariq", "(-5,∞) botiq", "Doimo botiq"],
    "a": "(-∞,5) botiq, (5,∞) qavariq"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = ⁹√x + 36",
    "options": ["(-∞,+∞)", "x > 0", "x ≥ 0", "x ≠ -36"],
    "a": "(-∞,+∞)"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ - 9x² + 2x + 10",
    "options": ["(-∞,-3) botiq, (-3,∞) qavariq", "(-∞,3) qavariq, (3,∞) botiq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞,-3) botiq, (-3,∞) qavariq"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = ⁷√7x + 35",
    "options": ["(-∞,+∞)", "x ≥ -5", "x > -5", "x ≠ -35"],
    "a": "(-∞,+∞)"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 3x⁵",
    "options": ["15x⁴", "3x⁴", "15x⁵", "5x⁴"],
    "a": "15x⁴"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / √(4x + 16)",
    "options": ["x > -4", "x ≥ -4", "x < -4", "x ≠ -4"],
    "a": "x > -4"
  },
  {
    "q": "Limitni hisoblang: lim (x→-5) (x² + 8x + 15) / (x² - 3x - 40)",
    "options": ["-2/13", "2/13", "0", "1"],
    "a": "-2/13"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / √(6x + 24)",
    "options": ["x > -4", "x ≥ -4", "x < -4", "x ≠ -4"],
    "a": "x > -4"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ - 15x² + 10x - 7",
    "options": ["(-∞, 5) qavariq, (5, ∞) botiq", "(-∞, 5) botiq, (5, ∞) qavariq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞, 5) qavariq, (5, ∞) botiq"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / √(2x + 18)",
    "options": ["x > -9", "x ≥ -9", "x < -9", "x ≠ -9"],
    "a": "x > -9"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ - 2x² - 5x - 2",
    "options": ["Max x = -1, Min x = 5", "Max x = 5, Min x = -1", "Max x = 0", "Ekstremum yo'q"],
    "a": "Max x = -1, Min x = 5"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (7x + 2) / (x² + 10x + 16)",
    "options": ["x = -2 va x = -8", "x = 2 va x = 8", "x = 0", "Uzilish yo'q"],
    "a": "x = -2 va x = -8"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = -3x⁴ + 1/x - 2 cos x",
    "options": ["-12x³ - 1/x² + 2 sin x", "-12x³ + 1/x² - 2 sin x", "-3x³ - ln x + 2 sin x", "-12x³ - 1/x² - 2 sin x"],
    "a": "-12x³ - 1/x² + 2 sin x"
  },
  {
    "q": "Limitni hisoblang: lim (x→-7) (x² + 6x - 7) / (x² + 10x + 21)",
    "options": ["2", "1", "0", "Mavjud emas"],
    "a": "2"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ + 5x² + 9x + 1",
    "options": ["Max x = -9, Min x = -1", "Max x = -1, Min x = -9", "Max x = 3", "Ekstremum yo'q"],
    "a": "Max x = -9, Min x = -1"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (5x + 2) / (x² + 11x + 28)",
    "options": ["x = -4 va x = -7", "x = 4 va x = 7", "x = -2", "Uzilish yo'q"],
    "a": "x = -4 va x = -7"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 5 sin 4x",
    "options": ["20 cos 4x", "5 cos 4x", "-20 cos 4x", "20 sin 4x"],
    "a": "20 cos 4x"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ + 3x² + 8x - 20",
    "options": ["Max x = -4, Min x = -2", "Max x = -2, Min x = -4", "Max x = 0", "Ekstremum yo'q"],
    "a": "Max x = -4, Min x = -2"
  },
  {
    "q": "Limitni hisoblang: lim (x→-7) (x² - 4x - 21) / (x² + 2x - 3)",
    "options": ["11/8", "1", "0", "Mavjud emas"],
    "a": "11/8"
  },
  {
    "q": "A ⊂ E yozuvi nimani anglatadi?",
    "options": ["A to'plam E ning qism to'plami", "A to'plam E ga tegishli", "E to'plam A ning qismi", "To'plamlar teng"],
    "a": "A to'plam E ning qism to'plami"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (3x + 11) / (x² - 6x - 16)",
    "options": ["x = 8 va x = -2", "x = -8 va x = 2", "x = 0", "Uzilish yo'q"],
    "a": "x = 8 va x = -2"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = -5x⁴ + 6/x + 2 tg x",
    "options": ["-20x³ - 6/x² + 2/cos²x", "-20x³ + 6/x² + 2/cos²x", "-5x³ - 6 ln x + 2/cos²x", "20x³ - 6/x² + 2/sin²x"],
    "a": "-20x³ - 6/x² + 2/cos²x"
  },
  {
    "q": "Limitni hisoblang: lim (x→-1) (x² + 2x - 3) / (x² + 4x - 5)",
    "options": ["2/3", "1", "0", "Mavjud emas"],
    "a": "2/3"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = -1/3x³ + 5x² - 16x + 10",
    "options": ["Max x = 8, Min x = 2", "Max x = 2, Min x = 8", "Max x = 5", "Ekstremum yo'q"],
    "a": "Max x = 8, Min x = 2"
  },
  {
    "q": "Qanday to'plamga A va B to'plamlarning birlashmasi deb ataladi?",
    "options": ["A yoki B ga tegishli barcha elementlar to'plami", "Faqat umumiy elementlar", "A da bor, B da yo'q elementlar", "Bo'sh to'plam"],
    "a": "A yoki B ga tegishli barcha elementlar to'plami"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / √(3x + 15)",
    "options": ["x > -5", "x ≥ -5", "x < -5", "x ≠ -5"],
    "a": "x > -5"
  },
  {
    "q": "y = f(x) funksiyaning x0 nuqtadagi hosilasining ta'rifini ko'rsating:",
    "options": ["lim (Δx→0) Δy/Δx", "lim (x→0) f(x)", "f(x+Δx) - f(x)", "Δy/Δx"],
    "a": "lim (Δx→0) Δy/Δx"
  },
  {
    "q": "Funksiyaning o'sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3x³ + 4x² + 15x + 11",
    "options": ["Max x = -5, Min x = -3", "Max x = -3, Min x = -5", "Max x = 0", "Ekstremum yo'q"],
    "a": "Max x = -5, Min x = -3"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ + 3x² - 7x + 5",
    "options": ["(-∞, 1) botiq, (1, ∞) qavariq", "(-∞, 1) qavariq, (1, ∞) botiq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞, 1) botiq, (1, ∞) qavariq"
  },
  {
    "q": "D to'plamda aniqlangan y = f(x) funksiya qachon davriy deyiladi?",
    "options": ["f(x+T) = f(x) sharti bajarilsa", "f(-x) = f(x) bo'lsa", "f'(x) = 0 bo'lsa", "Doimo o'suvchi bo'lsa"],
    "a": "f(x+T) = f(x) sharti bajarilsa"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ - 6x² + 5x + 1",
    "options": ["(-∞, 2) qavariq, (2, ∞) botiq", "(-∞, 2) botiq, (2, ∞) qavariq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞, 2) qavariq, (2, ∞) botiq"
  },
  {
    "q": "Limitni hisoblang: lim (x→-5) (x² - 7x + 10) / (x² - 2x - 15)",
    "options": ["-1.5", "1.5", "0", "1"],
    "a": "-1.5"
  },
  {
    "q": "x ∈ E yozuvi nimani anglatadi?",
    "options": ["x elementi E to'plamga tegishli", "E to'plam x ga tegishli", "x to'plam E ning qismi", "x va E teng"],
    "a": "x elementi E to'plamga tegishli"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = x ln x",
    "options": ["ln x + 1", "ln x", "1/x", "x + ln x"],
    "a": "ln x + 1"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ - 9x² - 7x + 3",
    "options": ["(-∞, 3) qavariq, (3, ∞) botiq", "(-∞, 3) botiq, (3, ∞) qavariq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞, 3) qavariq, (3, ∞) botiq"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = √(3x - 21)",
    "options": ["x ≥ 7", "x > 7", "x < 7", "x ≤ 7"],
    "a": "x ≥ 7"
  },
  {
    "q": "Funksiyalar qanday usullar bilan beriladi?",
    "options": ["Analitik, jadval, grafik", "Faqat grafik", "Faqat analitik", "Og'zaki va yozma"],
    "a": "Analitik, jadval, grafik"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = -x³ + 9x² + 5x + 4",
    "options": ["(-∞, 3) botiq, (3, ∞) qavariq", "(-∞, 3) qavariq, (3, ∞) botiq", "Doimo botiq", "Doimo qavariq"],
    "a": "(-∞, 3) botiq, (3, ∞) qavariq"
  },
  {
    "q": "Qachon A to'plam B to'plamning qism to'plami deyiladi?",
    "options": ["A ning barcha elementlari B da bo'lsa", "B ning barcha elementlari A da bo'lsa", "Umumiy elementlari bo'lsa", "Hech qanday umumiy element bo'lmasa"],
    "a": "A ning barcha elementlari B da bo'lsa"
  },
  {
    "q": "Limitni hisoblang: lim (x→4) (-6x + 8) / (2x + 9)",
    "options": ["-16/17", "16/17", "0", "1"],
    "a": "-16/17"
  },
  {
    "q": "Funksiyaning aniqlanish sohasini toping: y = 1 / √(-5x - 25)",
    "options": ["x < -5", "x ≤ -5", "x > -5", "x ≥ -5"],
    "a": "x < -5"
  },
  {
    "q": "Limitni hisoblang: lim (x→-1) (x² + 4x - 5) / (x² + 2x - 3)",
    "options": ["1.5", "-1.5", "0", "1"],
    "a": "1.5"
  },
  {
    "q": "Aniq integralni hisoblang: ∫(1 dan 3 gacha) 3x² dx",
    "options": ["26", "27", "9", "30"],
    "a": "26"
  },
  {
    "q": "Qachon a soni ketma-ketlikning limiti deyiladi?",
    "options": ["Har qanday ε > 0 uchun |xn - a| < ε bo'lsa", "xn = a bo'lsa", "xn > a bo'lsa", "Ketma-ketlik cheksiz bo'lsa"],
    "a": "Har qanday ε > 0 uchun |xn - a| < ε bo'lsa"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 5ˣ",
    "options": ["5ˣ ln 5", "5ˣ / ln 5", "x 5ˣ⁻¹", "5ˣ"],
    "a": "5ˣ ln 5"
  },
  {
    "q": "Davriy funksiyalar qatorini ko'rsating:",
    "options": ["sin x, cos x, tg x", "x², x³, x", "eˣ, ln x", "√x, |x|"],
    "a": "sin x, cos x, tg x"
  },
  {
    "q": "Limitni hisoblang: lim (x→2) (x² - 10x + 16) / (x² + 3x - 10)",
    "options": ["-6/7", "6/7", "0", "1"],
    "a": "-6/7"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (8x + 3) / (x² + 3x - 10)",
    "options": ["x = 2 va x = -5", "x = -2 va x = 5", "x = 0", "Uzilish yo'q"],
    "a": "x = 2 va x = -5"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarining uzluksizligi ta'rifini ko'rsating:",
    "options": ["lim (x→x0) f(x) = f(x0)", "f'(x) = 0", "f(x) mavjud bo'lsa", "Limit cheksiz bo'lsa"],
    "a": "lim (x→x0) f(x) = f(x0)"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (x + 9) / (x² - 7x + 10)",
    "options": ["x = 2 va x = 5", "x = -2 va x = -5", "x = -9", "Uzilish yo'q"],
    "a": "x = 2 va x = 5"
  },
  {
    "q": "Limitni hisoblang: lim (x→2) (3x + 5) / (5x - 4)",
    "options": ["11/6", "11/4", "1", "0"],
    "a": "11/6"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = x³ + 5x² - 6x + 5 + ln x",
    "options": ["3x² + 10x - 6 + 1/x", "3x² + 10x - 6", "x² + 5x - 6 + 1/x", "3x² + 5x + 1/x"],
    "a": "3x² + 10x - 6 + 1/x"
  },
  {
    "q": "Funksiyaning qavariqlik va botiqlik oraliqlarini toping: y = x³ + 6x² − 2x + 7",
    "options": [
      "Qavariq: (−∞, −2), Botiq: (−2, +∞)",
      "Qavariq: (−2, +∞), Botiq: (−∞, −2)",
      "Qavariq: (−∞, +∞)",
      "Botiq: (−∞, +∞)"
    ],
    "a": "Qavariq: (−∞, −2), Botiq: (−2, +∞)"
  },
  {
    "q": "Funksiyaning o‘sish, kamayish oraliqlari va ekstremum nuqtalarini toping: y = 1/3 x³ + 4x² + 12x + 6",
    "options": [
      "Kamayadi: (−∞, −2), O‘sadi: (−2, +∞), minimum x = −2",
      "O‘sadi: (−∞, −2), Kamayadi: (−2, +∞), maksimum x = −2",
      "Faqat o‘suvchi",
      "Faqat kamayuvchi"
    ],
    "a": "Kamayadi: (−∞, −2), O‘sadi: (−2, +∞), minimum x = −2"
  },
  {
    "q": "Differensiallanuvchi funksiya o‘sishining zaruriy sharti qaysi?",
    "options": [
      "f′(x) ≥ 0",
      "f′(x) > 0",
      "f(x) ≥ 0",
      "f′(x) = 0"
    ],
    "a": "f′(x) ≥ 0"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping va turini aniqlang: y = (x + 3)/(x − 7)",
    "options": [
      "x = 7, cheksiz uzilish",
      "x = −3, bartaraf etiladigan uzilish",
      "Uzilish yo‘q",
      "x = 0, sakrashli uzilish"
    ],
    "a": "x = 7, cheksiz uzilish"
  },
  {
    "q": "Funksiyaning uzilish nuqtalarini toping: f(x) = (−9x + 2)/(x² − 6x + 5)",
    "options": [
      "x = 1 va x = 5",
      "x = −1 va x = −5",
      "x = 0",
      "Uzilish yo‘q"
    ],
    "a": "x = 1 va x = 5"
  },
  {
    "q": "Funksiyaning hosilasini toping: y = 2x⁵ − 3/x + 2√x",
    "options": [
      "10x⁴ + 3/x² + 1/√x",
      "10x⁴ − 3/x² + 1/√x",
      "10x⁴ − 3/x + √x",
      "8x⁴ − 3/x² + 1/√x"
    ],
    "a": "10x⁴ + 3/x² + 1/√x"
  },
  {
    "q": "Funksiyaning nuqtadagi limitining ta’rifini ko‘rsating",
    "options": [
      "x → a da f(x) → L bo‘lsa, har qanday ε > 0 uchun shunday δ > 0 topiladiki |x − a| < δ ⇒ |f(x) − L| < ε",
      "f(a) mavjud bo‘lsa",
      "f′(a) mavjud bo‘lsa",
      "Funksiya uzluksiz bo‘lsa"
    ],
    "a": "x → a da f(x) → L bo‘lsa, har qanday ε > 0 uchun shunday δ > 0 topiladiki |x − a| < δ ⇒ |f(x) − L| < ε"
  }




    ]
    },
  dasturlash: { 
    name: "💻 Dasturlash 1", 
    questions: [
  {
    "q": "Algoritm deganda nima tushuniladi?",
    "options": [
      "Kompyuter qurilmasi",
      "Muayyan masalani yechish uchun chekli qadamlar ketma-ketligi",
      "Ma’lumotlar bazasi",
      "Faqat dasturlash tilida yozilgan kod"
    ],
    "a": "Muayyan masalani yechish uchun chekli qadamlar ketma-ketligi",
    "hint": "💡 Algoritm — bu qo'yilgan maqsadga erishish yoki masalani yechish uchun bajarilishi kerak bo'lgan aniq va chekli amallar ketma-ketligidir."
  },
  {
    "q": "“Algoritm” so‘zi qanday ma’noni anglatadi?",
    "options": [
      "Kompyuter xotirasi turi ma’noni anglatadi",
      "Hisoblash yoki masalani yechishda cheksiz amal qilinadigan qoidalari ma’noni anglatadi",
      "Dasturlash muhiti ma’noni anglatadi",
      "Dedikim Al-Xorazmiy degan ma’noni anglatadi"
    ],
    "a": "Hisoblash yoki masalani yechishda cheksiz amal qilinadigan qoidalari ma’noni anglatadi",
    "hint": "💡 Algoritm atamasi buyuk matematik Muhammad al-Xorazmiy nomining lotinchalashtirilgan (Algorithmi) shaklidan kelib chiqqan bo'lib, hisoblash qoidalarini bildiradi."
  },
  {
    "q": "Algoritm cheklanganlik xossasi nimani bildiradi?",
    "options": [
      "Algoritm faqat murakkab bo‘ladi",
      "Algoritm chekli qadam va ma’lum vaqtdan keyin to‘xtashi kerak",
      "Algoritm doimiy ishlashi kerak",
      "Algoritm cheksiz qadamdan keyin to‘xtaydi"
    ],
    "a": "Algoritm chekli qadam va ma’lum vaqtdan keyin to‘xtashi kerak",
    "hint": "💡 Cheklanganlik xossasi algoritmning cheksiz davom etmasligini, ya'ni ma'lum bir qadamlardan so'ng albatta natijaga erishib, to'xtashini anglatadi."
  },
  {
    "q": "Algoritm kamida nechta natija berishi kerak?",
    "options": [
      "Kamida ikkita",
      "Ikki yoki undan ortiq",
      "Kamida bitta",
      "Hech qachon natija bermaydi"
    ],
    "a": "Kamida bitta",
    "hint": "💡 Algoritm natijaviylik xossasiga ko'ra, bajarilgan ish oxirida kamida bitta aniq natija (chiqish ma'lumoti) taqdim etishi shart."
  },
  {
    "q": "Algoritm dasturlash tiliga bog‘liq bo‘lmasligi nimani anglatadi?",
    "options": [
      "Faqat mashina tilida yoziladi",
      "Faqat Python tilida yoziladi",
      "Har qanday dasturlash tilida amalga oshirilishi mumkin",
      "Faqat diagramma ko‘rinishida bo‘ladi"
    ],
    "a": "Har qanday dasturlash tilida amalga oshirilishi mumkin",
    "hint": "💡 Algoritm bu mantiqiy ketma-ketlikdir. Uni xohlagan tilda (Python, C++, Java) yoki oddiy so'zlar bilan ham ifodalash mumkin."
  },
  {
    "q": "Algoritm murakkabligi qaysi omillar bilan belgilanadi?",
    "options": [
      "Faqat foydalanuvchi soni bilan",
      "Faqat kompyuter narxi bilan",
      "Vaqt va xotira sarfi bilan",
      "Faqat dasturlash tili bilan"
    ],
    "a": "Vaqt va xotira sarfi bilan",
    "hint": "💡 Algoritmning samaradorligi u qancha vaqtda bajarilishi (Time Complexity) va kompyuter xotirasidan qancha joy olishi (Space Complexity) bilan o'lchanadi."
  },
  {
    "q": "Algoritmni ishlab chiqishda birinchi navbatda nima aniqlanadi?",
    "options": [
      "Grafik dizayn",
      "Kompyuter turi",
      "Hal qilinishi kerak bo‘lgan muammo",
      "Dasturlash tili"
    ],
    "a": "Hal qilinishi kerak bo‘lgan muammo",
    "hint": "💡 Har qanday algoritm ma'lum bir muammoni hal qilish uchun yaratiladi, shuning uchun birinchi navbatda aynan muammoning mohiyati tushunib olinadi."
  },
  {
    "q": "Chiziqli algoritmning asosiy xususiyati qaysi?",
    "options": [
      "Buyruqlar bir necha marta takrorlanadi",
      "Buyruqlar qat’iy ketma-ketlikda bir marta bajariladi",
      "Shartga bog‘liq holda bajariladi",
      "Amallar cheksiz marta takrorlanadi"
    ],
    "a": "Buyruqlar qat’iy ketma-ketlikda bir marta bajariladi",
    "hint": "💡 Chiziqli algoritmlarda hech qanday shart yoki takrorlanish bo'lmaydi, amallar xuddi bir to'g'ri chiziq kabi yuqoridan pastga qarab bajariladi."
  },
  {
    "q": "Tarmoqlanuvchi algoritm qachon qo‘llaniladi?",
    "options": [
      "Hech qanday shart bo‘lmaganda",
      "Buyruqlar cheksiz takrorlanganda",
      "Shartga qarab turli yo‘nalishlardan biri tanlanganda",
      "Barcha buyruqlar ketma-ket bajarilganda"
    ],
    "a": "Shartga qarab turli yo‘nalishlardan biri tanlanganda",
    "hint": "💡 Agar masalani yechishda biron bir shartga ko'ra (masalan, agar son musbat bo'lsa...) yo'nalish o'zgarsa, bu tarmoqlanuvchi algoritm deyiladi."
  },
  {
    "q": "Takrorlanuvchi algoritmga qaysi misol to‘g‘ri?",
    "options": [
      "Faqat bitta buyruqni bajarish",
      "Shart bajarilguncha bir amalni qayta-qayta bajarish",
      "Uchta sonni qo‘shish",
      "Shartsiz bajarish"
    ],
    "a": "Shart bajarilguncha bir amalni qayta-qayta bajarish",
    "hint": "💡 Takrorlanuvchi (siklik) algoritmlar ma'lum bir amalni bir necha marta (masalan, 1 dan 100 gacha sonlarni chiqarish) bajarish uchun ishlatiladi."
  },
  {
    "q": "Tarmoqlanuvchi algoritmlarda asosan qaysi konstruksiya ishlatiladi?",
    "options": [
      "for operatori",
      "ketma-ket operatorlar",
      "if–else shart operatori",
      "while operatori"
    ],
    "a": "if–else shart operatori",
    "hint": "💡 Dasturlashda shartlarni tekshirish uchun 'if' (agar) va 'else' (aks holda) operatorlaridan foydalaniladi."
  },
  {
    "q": "Takrorlanuvchi algoritmning asosiy vazifasi nimadan iborat?",
    "options": [
      "Ma’lumotlarni saqlash",
      "Bir xil amallarni bir necha marta bajarish",
      "Faqat bitta natija chiqarish",
      "Shartlarsiz bajarish"
    ],
    "a": "Bir xil amallarni bir necha marta bajarish",
    "hint": "💡 Takrorlanish operatorlari (for, while) yordamida bir xil turdagi ishlarni qayta-qayta yozmasdan, botga avtomatlashtirilgan holda bajartirish mumkin."
  },
  {
    "q": "Python’da o‘zgaruvchi nima?",
    "options": [
      "Ma’lumotni saqlash uchun ajratilgan son",
      "Ma’lumotni saqlash uchun ajratilgan nom",
      "Ma’lumotni saqlash uchun ajratilgan operator",
      "Ma’lumotni saqlash uchun ajratilgan funksiya"
    ],
    "a": "Ma’lumotni saqlash uchun ajratilgan nom",
    "hint": "💡 O'zgaruvchi — bu xotiradagi ma'lum bir qiymatga murojaat qilish uchun ishlatiladigan 'yorliq' yoki nomdir."
  },
  {
    "q": "Python’da butun sonlar qaysi turga mansub?",
    "options": [
      "float",
      "bool",
      "int",
      "str"
    ],
    "a": "int",
    "hint": "💡 Python'da 'integer' (butun son) so'zining qisqartmasi sifatida 'int' turi ishlatiladi. Masalan: 5, -10, 100."
  },
  {
    "q": "Haqiqiy (o‘nli) sonlar qaysi turda saqlanadi?",
    "options": [
      "int",
      "bool",
      "float",
      "str"
    ],
    "a": "float",
    "hint": "💡 Vergul (nuqta) bilan yoziladigan o'nli sonlar 'floating point' (suzuvchi nuqtali sonlar), ya'ni 'float' turi deb ataladi. Masalan: 3.14."
  },
  {
    "q": "Quyidagilardan qaysi biri o‘zgaruvchi nomi bo‘la oladi?",
    "options": [
      "2son",
      "class",
      "my-var",
      "my_var"
    ],
    "a": "my_var",
    "hint": "💡 Python'da o'zgaruvchi nomi raqam bilan boshlanishi, chiziqcha (-) ishlatilishi yoki xizmatchi so'zlar (class) bo'lishi mumkin emas. Pastki chiziq (_) esa ruxsat etilgan."
  },
  {
    "q": "Haqiqiy (o‘nli) sonlar qaysi turda saqlanadi?",
    "options": ["bool", "str", "int", "float"],
    "a": "float",
    "hint": "💡 Ingliz tilidagi 'floating point' (suzuvchi nuqta) so'zidan olingan bo'lib, o'nli kasr sonlarni ifodalash uchun ishlatiladi."
  },
  {
    "q": "Mantiqiy qiymatlar (True, False) qaysi turga tegishli?",
    "options": ["int", "str", "float", "bool"],
    "a": "bool",
    "hint": "💡 Bu tur matematik Jorj Bul nomi bilan atalgan (Boolean). U faqat ikkita qiymatni: True (rost) yoki False (yolg'on) qabul qiladi."
  },
  {
    "q": "Satr (matn) ma’lumotlar turi qaysi?",
    "options": ["float", "bool", "int", "str"],
    "a": "str",
    "hint": "💡 'String' (satr) so'zining qisqartmasi. Qo'shtirnoq yoki bir tirnoq ichiga olingan har qanday belgi yoki matn shu turga kiradi."
  },
  {
    "q": "Kompleks sonlar qaysi tur bilan ifodalanadi?",
    "options": ["float", "int", "str", "complex"],
    "a": "complex",
    "hint": "💡 Haqiqiy va mavhum qismdan iborat sonlar (masalan, 3 + 5j) Python'da 'complex' turi orqali ifodalanadi."
  },
  {
    "q": "Python’da o‘zgaruvchi turi qachon aniqlanadi?",
    "options": [
      "Dastur boshida",
      "Kompilyatsiya vaqtida",
      "Oldindan e’lon qilinganda",
      "Qiymat yuklanganda"
    ],
    "a": "Qiymat yuklanganda",
    "hint": "💡 Python - dinamik tiplashuvchi til. Ya'ni o'zgaruvchining turi u yaratilganda emas, unga biron qiymat (son, matn) berilgan vaqtda aniqlanadi."
  },
  {
    "q": "Quyidagi ifodada x ning turi qanday?  x = 10",
    "options": ["float", "complex", "char", "int"],
    "a": "int",
    "hint": "💡 10 - bu butun son. Python'da butun sonlar (nuqtasiz sonlar) 'integer' ya'ni 'int' deb ataladi."
  },
  {
    "q": "Quyidagi ifodada y ning turi qanday?  y = \"Python\"",
    "options": ["float", "complex", "char", "str"],
    "a": "str",
    "hint": "💡 Qo'shtirnoq ichidagi har qanday ma'lumot (so'z, gap yoki belgi) satr turi, ya'ni 'string' (str) hisoblanadi."
  },
  {
    "q": "Python’da foydalanuvchidan ma’lumot kiritish uchun qaysi funksiya ishlatiladi?",
    "options": ["print()", "len()", "type()", "input()"],
    "a": "input()",
    "hint": "💡 'Input' so'zi inglizchadan 'kiritish' deb tarjima qilinadi. Bu funksiya dastur ishini to'xtatib, foydalanuvchi biror narsa yozishini kutadi."
  },
  {
    "q": "input() funksiyasi orqali kiritilgan ma’lumotning boshlang‘ich turi qanday bo‘ladi?",
    "options": ["float", "int", "char", "str"],
    "a": "str",
    "hint": "💡 Juda muhim! Foydalanuvchi raqam kiritsa ham, input() funksiyasi uni matn (str) sifatida qabul qiladi. Uni son qilish uchun int() yoki float() funksiyalari kerak."
  },
  {
    "q": "Butun son kiritish uchun qaysi ko‘rinish to‘g‘ri?",
    "options": ["float(input())", "bool(input())", "complex(input())", "int(input())"],
    "a": "int(input())",
    "hint": "💡 Avval foydalanuvchi matn kiritadi, so'ngra int() funksiyasi o'sha matnni butun songa aylantiradi."
  },
  {
    "q": "Haqiqiy son (float) kiritish uchun qaysi usul ishlatiladi?",
    "options": ["int(input())", "bool(input())", "complex(input())", "float(input())"],
    "a": "float(input())",
    "hint": "💡 Nuqtali yoki o'nli kasr sonlarni kiritish uchun input() funksiyasini float() qobig'iga olish kerak."
  },
  {
    "q": "Quyidagi kod nimani bildiradi? x, y = map(int, input().split())",
    "options": [
      "Sonlarni ekranga chiqarishni",
      "Faqat bitta son kiritishni",
      "Ikki satrni bitta qatorda kiritishni",
      "Ikki butun sonni bitta qatorda kiritishni"
    ],
    "a": "Ikki butun sonni bitta qatorda kiritishni",
    "hint": "💡 .split() matnni bo'laklarga ajratadi, map(int, ...) esa har bir bo'lakni songa aylantirib, x va y o'zgaruvchilariga yuklaydi."
  },
  {
    "q": "map() funksiyasi formatli kiritishda nima uchun ishlatiladi?",
    "options": [
      "Ma’lumotlarni saqlash uchun",
      "Ma’lumotni ekranga chiqarish uchun",
      "O‘zgaruvchi yaratish uchun",
      "Kiritilgan qiymatlarni kerakli turga o‘girish uchun"
    ],
    "a": "Kiritilgan qiymatlarni kerakli turga o‘girish uchun",
    "hint": "💡 'Map' xaritaga o'xshatish yoki 'qo'llash' ma'nosida keladi. U barcha kiritilgan elementlarga bir vaqtda funksiyani (masalan, int) qo'llaydi."
  },
  {
    "q": "Quyidagi kiritish usuli qaysi holatda qo‘llaniladi? a, b, c = map(float, input().split())",
    "options": [
      "Uchta char sonni bitta qatorda kiritishda",
      "Uchta int sonni bitta qatorda kiritishda",
      "Uchta complex sonni bitta qatorda kiritishda",
      "Uchta haqiqiy sonni bitta qatorda kiritishda"
    ],
    "a": "Uchta haqiqiy sonni bitta qatorda kiritishda",
    "hint": "💡 float - bu o'nli kasr (haqiqiy) son. Bu kod bitta qatorda probel bilan ajratilgan uchta kasr sonni o'qib olish imkonini beradi."
  },
  {
    "q": "Quyidagi kod nima vazifani bajaradi? x = int(input()) if x > 0: print(\"Musbat\") else: print(\"Manfiy yoki nol\")",
    "options": [
      "Kiritilgan son musbat emasligini aniqlaydi",
      "Kiritilgan son manfiy emasligini aniqlaydi",
      "Kiritilgan son musbat yoki musbat emasligini aniqlaydi",
      "Kiritilgan butun son musbat yoki musbat emasligini aniqlaydi"
    ],
    "a": "Kiritilgan butun son musbat yoki musbat emasligini aniqlaydi",
    "hint": "💡 if (agar) sharti sonning noldan kattaligini tekshiradi. Agar shart bajarilsa 'Musbat', aks holda (else) ikkinchi xabar chiqadi."
  },
  {
    "q": "Quyidagi dasturda qachon \"True\" chiqadi? a = int(input()) if a % 2 == 0: print(\"True\") else: print(\"False\")",
    "options": [
      "Agar a son toq bo‘lsa",
      "Agar a son manfiy bo‘lsa",
      "Agar a son nol bo‘lsa",
      "Agar a son juft bo‘lsa"
    ],
    "a": "Agar a son juft bo‘lsa",
    "hint": "💡 Python'da '%' belgisi qoldiqli bo'lishni bildiradi. Agar sonni 2 ga bo'lgandagi qoldiq 0 bo'lsa, demak u juft son."
  },
  {
    "q": "Quyidagi kod nimani tekshiradi? n = int(input()) if n % 5 == 0: print(\"Bo‘linadi\") else: print(\"Bo‘linmaydi\")",
    "options": [
      "Sonning juftligini",
      "Sonning toqligini",
      "Sonning kattaligini",
      "Sonning 5 ga bo‘linishini"
    ],
    "a": "Sonning 5 ga bo‘linishini",
    "hint": "💡 n % 5 == 0 sharti sonni 5 ga bo'lganda qoldiq qolmasligini (ya'ni qoldiq nol ekanligini) tekshiradi."
  },
  {
    "q": "Ushbu dastur natijasini toping: a=1 b=2 c=3 a,b,c=b,c,a print(a,b,c)",
    "options": ["1 2 3", "2 1 3", "3 1 2", "2 3 1"],
    "a": "2 3 1",
    "hint": "💡 Python'da o'zgaruvchilar qiymatini bitta qatorda almashtirish (multiple assignment) mumkin. Bunda a=b(2), b=c(3) va c=a(1) bo'lib qoladi."
  },
  {
    "q": "Quyidagi kod nima bajaradi?\n i = 1\n while i <= 5:\n   print(i)\n   i += 1",
    "options": [
      "1 dan 4 gacha bo‘lgan sonlarni chiqaradi",
      "Cheksiz sikl hosil qiladi",
      "Faqat 5 ni chiqaradi",
      "1 dan 5 gacha bo‘lgan sonlarni chiqaradi"
    ],
    "a": "1 dan 5 gacha bo‘lgan sonlarni chiqaradi",
    "hint": "💡 'while' sikli i ning qiymati 5 dan kichik yoki teng bo'lguncha ishlaydi. Har safar i ga 1 qo'shilgani uchun 1, 2, 3, 4, 5 sonlari ekranga chiqadi."
  },
  {
    "q": "Quyidagi kod natijasi nima bo‘ladi?\n i = 5\n while i > 0:\n   print(i)\n   i -= 1",
    "options": [
      "Faqat 0 ni chiqaradi",
      "Cheksiz sikl bo‘ladi",
      "1 dan 5 gacha bo‘lgan sonlarni chiqaradi",
      "5 dan 1 gacha bo‘lgan sonlarni chiqaradi"
    ],
    "a": "5 dan 1 gacha bo‘lgan sonlarni chiqaradi",
    "hint": "💡 Bu yerda sikl teskari tartibda ishlaydi. i har safar 1 taga kamayadi va 0 dan katta bo'lguncha davom etadi."
  },
  {
    "q": "Quyidagi dastur nimani hisoblaydi?\n n=int(input())\n s=0\n while n>0:\n   s+=n\n   n-=1\n print(s)",
    "options": [
      "To‘g‘ri javob yo‘q",
      "n gacha bo‘lgan sonlar ko‘paytmasi",
      "n gacha bo‘lgan sonlar ayirmasi",
      "n gacha bo‘lgan sonlar yig‘indisini"
    ],
    "a": "n gacha bo‘lgan sonlar yig‘indisini",
    "hint": "💡 Sikl davomida 's' o'zgaruvchisiga n dan boshlab 1 gacha bo'lgan barcha sonlar qo'shib boriladi (s = s + n)."
  },
  {
    "q": "Quyidagi kod qachon to‘xtaydi?\n x = 10\n while x != 0:\n   x -= 2",
    "options": [
      "x 10 teng bo‘lganda",
      "x 2 teng bo‘lganda",
      "Hech qachon",
      "x nolga teng bo‘lganda"
    ],
    "a": "x nolga teng bo‘lganda",
    "hint": "💡 'while x != 0' sharti x nolga teng bo'lmaguncha ishla degani. x har safar 2 taga kamayib borsa (10, 8, 6, 4, 2, 0), x=0 bo'lganda sikl to'xtaydi."
  },
  {
    "q": "Quyidagi dastur nimani tekshiradi?\n n=int(input())\n while n<0:\n   n=int(input())\n print(n)",
    "options": [
      "Faqat manfiy sonlarni chiqaradi",
      "Bir marta kiritishni tekshiradi",
      "Sonni kvadratga oshiradi",
      "Manfiy bo‘lmagan son kiritilguncha so‘raydi"
    ],
    "a": "Manfiy bo‘lmagan son kiritilguncha so‘raydi",
    "hint": "💡 Bu kod kiritilgan son manfiy bo'lsa (n < 0), qaytadan son so'rayveradi. Musbat son kiritilsa, shart buziladi va sikldan chiqadi."
  },
  {
    "q": "Quyidagi kodda cheksiz sikl nima uchun yuzaga keladi?\n i=1\n while i<5:\n   print(i)",
    "options": [
      "print noto‘g‘ri yozilgani uchun",
      "while ishlamagani uchun",
      "i 5 ga teng bo‘lgani uchun",
      "i o‘zgarmagani uchun"
    ],
    "a": "i o‘zgarmagani uchun",
    "hint": "💡 Diqqat qiling! Sikl ichida i ning qiymati oshirilmagan (i += 1 yo'q). Shuning uchun i har doim 1 bo'lib qolaveradi va shart doim True bo'ladi."
  },
  {
    "q": "Quyidagi dastur natijasi nima?\n i=0\n while i<3:\n   print(\"Python\")\n   i+=1",
    "options": [
      "Hech narsa chiqarmaydi",
      "Cheksiz chiqaradi",
      "\"Python\" so‘zini 3 marta chiqaradi",
      "\"Python\" so‘zini 1 marta chiqaradi"
    ],
    "a": "\"Python\" so‘zini 3 marta chiqaradi",
    "hint": "💡 i o'zgaruvchisi 0 dan boshlab 3 gacha (0, 1, 2) o'zgaradi. Har bir qadamda so'z ekranga chiqadi."
  },
  {
    "q": "Quyidagi dastur natijasi nima?\n a=4\n b=3\n c=4\n t=(a+b>c) and (a+c>b) and (b+c>a)\n print(t)",
    "options": ["0", "1", "false", "True"],
    "a": "True",
    "hint": "💡 Bu uchburchak mavjudlik sharti. Agar barcha mantiqiy and shartlari True bo'lsa (7>4, 8>3, 7>4), yakuniy natija True chiqadi."
  },
  {
    "q": "Quyidagi dastur natijasi nima?\n a=4\n b=3\n c=5\n t=(a*a+b*b==c*c) or (a*a+c*c==b*b) or (b*b+c*c==a*a)\n print(t)",
    "options": ["False", "0", "1", "True"],
    "a": "True",
    "hint": "💡 Bu Pifagor teoremasi (to'g'ri burchakli uchburchak). 'or' amali ishlatilgani uchun hech bo'lmaganda bitta shart bajarilsa (16+9==25), natija True bo'ladi."
  },
  {
    "q": "Quyidagi dastur natijasi nima?\n a=4\n b=3\n c=5\n t=(a==b and b!=c) or (c==a and b!=c) or (b==c and c!=a)\n print(t)",
    "options": ["True", "1", "0", "False"],
    "a": "False",
    "hint": "💡 Bu kod uchburchakning teng yonli ekanligini tekshiradi. 4, 3, 5 sonlari ichida bir-biriga tengi yo'q, shuning uchun natija False."
  },
  {
    "q": "Quyidagi dastur natijasi nima?\n a=4\n b=3\n c=4\n t=(a==b and b!=c) or (c==a and b!=c) or (b==c and c!=a)\n print(t)",
    "options": ["0", "False", "True", "1"],
    "a": "True",
    "hint": "💡 Bu yerda a=4 va c=4 teng, shuning uchun (c==a and b!=c) sharti True bo'ladi. 'or' operatori tufayli umumiy natija True chiqadi."
  },
  {
    "q": "a=8, b=3\n print(a>5 and b<5)\n Dastur natijasini aniqlang",
    "options": ["0", "3", "False", "True"],
    "a": "True",
    "hint": "💡 8 > 5 (True) va 3 < 5 (True). 'and' amali ikkala tomon rost bo'lganda rost (True) natija beradi."
  },
  {
    "q": "x=10, y=0\n print(x and y)\n Dastur natijasini aniqlang",
    "options": ["true", "false", "10", "0"],
    "a": "0",
    "hint": "💡 Python'da 'and' operatori agar birinchi qiymat True (nol emas) bo'lsa, ikkinchi qiymatni qaytaradi. Bu yerda y=0 bo'lgani uchun 0 chiqadi."
  },
  {
    "q": "a=4, b=9\n print(a>10 or b>=9)\n Dastur natijasini aniqlang",
    "options": ["9", "False", "1", "True"],
    "a": "True",
    "hint": "💡 4 > 10 (False) bo'lsa ham, 9 >= 9 (True) rost. 'or' amali uchun bitta rost qiymat kifoya."
  },
  {
    "q": "x=5\n print(not (x>3 and x<10))\n Dastur natijasini aniqlang",
    "options": ["5", "False", "3", "True"],
    "a": "False",
    "hint": "💡 Qavs ichi: (5>3 and 5<10) ya'ni True. 'not' amali bu natijani teskarisiga o'zgartiradi: not True = False."
  },
  {
    "q": "a = 6, b = 2\nprint(a == 6 and not b == 3)\nDastur natijasini aniqlang?",
    "options": ["False", "6", "True", "2"],
    "a": "True",
    "hint": "💡 a == 6 (True) va not (2 == 3) ya'ni not False (True). Ikkala tomon rost bo'lgani uchun True chiqadi."
  },
  {
    "q": "x = 0, y = 7\nprint(x or y)\nDastur natijasini aniqlang?",
    "options": ["True", "0", "False", "7"],
    "a": "7",
    "hint": "💡 'or' operatori birinchi rost (nolga teng bo'lmagan) qiymatni qaytaradi. 0 False hisoblanadi, shuning uchun 7 qaytariladi."
  },
  {
    "q": "a = 5, b = 5\nprint(not (a != b))\nDastur natijasini aniqlang?",
    "options": ["5", "None", "False", "True"],
    "a": "True",
    "hint": "💡 a != b ya'ni 5 != 5 (False). 'not False' esa rost (True) natijasini beradi."
  },
  {
    "q": "x = 4, y = 6\nprint(x > 2 and y < 5 or y == 6)\nDastur natijasini aniqlang?",
    "options": ["4", "False", "6", "True"],
    "a": "True",
    "hint": "💡 Amallar tartibi: oldin 'and', keyin 'or'. (True and False) bo'ladi False. Keyin (False or True) bo'lib, yakuniy natija True chiqadi."
  },
  {
    "q": "a = 3\nprint(a and not a)\nDastur natijasini aniqlang?",
    "options": ["True", "3", "None", "False"],
    "a": "False",
    "hint": "💡 Qiymat va uning teskarisini 'and' bilan bog'lash doim False beradi. 3 (True) and not 3 (False) = False."
  },
  {
    "q": "x = 2, y = 8\nprint(not x > 5 or y < 10)\nDastur natijasini aniqlang?",
    "options": ["2", "False", "8", "True"],
    "a": "True",
    "hint": "💡 not (2 > 5) ya'ni not False (True). 'or' amalida birinchi tomon rost bo'lsa, ikkinchi tomonni tekshirmasdan True qaytaradi."
  },
  {
    "q": "Python’da bir qatorda bir nechta buyruq yozish uchun qaysi belgi ishlatiladi?",
    "options": [";", ",", ":", "hech narsa"],
    "a": ";",
    "hint": "💡 Python'da odatda har bir buyruq yangi qatordan yoziladi. Lekin bitta qatorda yozish kerak bo'lsa, nuqtali vergul (;) dan foydalaniladi."
  },
  {
    "q": "Python’da katta-kichik harflar (case sensitivity) qanday ahamiyatga ega?",
    "options": [
      "Farqlanmaydi",
      "Faqat o‘zgaruvchilarda farqlanmaydi",
      "Katta-kichik harflar farqlanadi",
      "Katta-kichik harflar funksiyada farqlanadi"
    ],
    "a": "Katta-kichik harflar farqlanadi",
    "hint": "💡 Python Case-Sensitive til. Masalan: 'ism', 'Ism' va 'ISM' uchtasi uch xil o'zgaruvchi hisoblanadi."
  },
  {
    "q": "print(1, 2, 3, sep=\"\") natijasi nima bo‘ladi?",
    "options": ["1,2,3", "123", "Error", "1  2  3"],
    "a": "123",
    "hint": "💡 'sep' (separator) parametri print ichidagi qiymatlar orasiga nima qo'yishni belgilaydi. sep=\"\" bo'sh joy qoldirmasdan hammasini yopishtirib chiqaradi."
  },
  {
    "q": "range(5) qanday qiymatlar ketma-ketligini beradi?",
    "options": ["0 dan 5 gacha", "Faqat 5", "0,1,2,3,4,5", "0,1,2,3,4"],
    "a": "0,1,2,3,4",
    "hint": "💡 range(n) funksiyasi doimo 0 dan boshlanadi va n gacha davom etadi, lekin n ning o'zi ketma-ketlikka kirmaydi."
  },
  {
    "q": "s = 0\nfor i in range(5):\n  s += i\nprint(s)\nDastur nimani chiqaradi?",
    "options": ["5", "0", "15", "10"],
    "a": "10",
    "hint": "💡 i o'zgaruvchisi 0, 1, 2, 3, 4 qiymatlarini oladi. Ularning yig'indisi: 0+1+2+3+4 = 10."
  },
  {
    "q": "range(2, 5) qaysi sonlarni o‘z ichiga oladi?",
    "options": ["2,3,4,5", "3,4,5", "2.5", "2,3,4"],
    "a": "2,3,4",
    "hint": "💡 range(start, stop) shaklida start (2) kiradi, lekin stop (5) kirmaydi."
  },
  {
    "q": "Qaysi operator qoldiqni hisoblaydi?",
    "options": ["*", "/", "//", "%"],
    "a": "%",
    "hint": "💡 % belgisi matematikada modulli bo'lish deyiladi va bo'lishdan qolgan qoldiqni qaytaradi."
  },
  {
    "q": "x sonning oxirgi raqamini aniqlash formulasi qaysi?",
    "options": ["x/10", "x//10", "x^10", "x % 10"],
    "a": "x % 10",
    "hint": "💡 Har qanday sonni 10 ga bo'lgandagi qoldiq (%) o'sha sonning oxirgi raqamiga teng bo'ladi."
  },
  {
    "q": "Cheksiz sikldan chiqish uchun qaysi operator ishlatiladi?",
    "options": ["exit", "return", "stop", "break"],
    "a": "break",
    "hint": "💡 'break' buyrug'i siklning sharti hali bajarilmayotgan bo'lsa ham, siklni darhol to'xtatish uchun ishlatiladi."
  },
  {
    "q": "k = 0\nx = int(input())\nwhile x != 0:\n    if x > 0:\n        k += 1\n    x = int(input())\nprint(k)\nDastur nimani aniqlaydi?",
    "options": ["Manfiy sonlar sonini", "Eng katta sonni", "Barcha sonlar sonini", "Musbat sonlar sonini"],
    "a": "Musbat sonlar sonini",
    "hint": "💡 x > 0 sharti kiritilgan son musbat bo'lgandagina k (hisoblagich)ni 1 taga oshiradi. 0 kiritilganda dastur to'xtaydi."
  },
  {
    "q": "s = 0\nfor i in range(4):\n    s += i\nprint(s)\nDastur natijasini aniqlang?",
    "options": ["0", "6", "10", "4"],
    "a": "6",
    "hint": "💡 range(4) orqali i: 0, 1, 2, 3 qiymatlarini oladi. Yig'indisi: 0+1+2+3 = 6."
  },
  {
    "q": "for i in range(2, 6):\n    print(i)\nDastur natijasini aniqlang?",
    "options": ["3 4 5", "2 3 4 5 6", "Xato", "2 3 4 5"],
    "a": "2 3 4 5",
    "hint": "💡 range(2, 6) sonlari 2 dan boshlanib 6 gacha (6 kirmaydi) davom etadi."
  },
  {
    "q": "s = 1\nfor i in range(3):\n    s *= 2\nprint(s)\nDastur natijasini aniqlang?",
    "options": ["4", "6", "2", "8"],
    "a": "8",
    "hint": "💡 Tsikl 3 marta aylanadi va har safar s ni 2 ga ko'paytiradi. 1 * 2 * 2 * 2 = 8."
  },
  {
    "q": "for i in range(1, 6, 2):\n    print(i)\nDastur natijasini aniqlang?",
    "options": ["1 3 5", "2 4 6", "1 2 3", "Xato"],
    "a": "1 3 5",
    "hint": "💡 range(1, 6, 2) da uchinchi son (2) qadamni bildiradi. 1 dan boshlab 2 tadan sakrab yuradi: 1, 3, 5."
  },
  {
    "q": "s = 0\nfor i in range(1, 6):\n    s += i\nprint(s)\nDastur natijasini aniqlang?",
    "options": ["10", "21", "5", "15"],
    "a": "15",
    "hint": "💡 1 dan 5 gacha (6 kirmaydi) bo'lgan sonlar yig'indisi: 1+2+3+4+5 = 15."
  },
  {
    "q": "for i in range(4, 7):\n    print(i)\nDastur natijasini aniqlang?",
    "options": ["5 6 7", "Xato", "4 5 6 7", "4 5 6"],
    "a": "4 5 6",
    "hint": "💡 range(4, 7) ketma-ketligi 4 dan 6 gacha bo'lgan butun sonlarni qaytaradi."
  },
  {
    "q": "k = 0\nfor i in range(5):\n    k += 1\nprint(k)\nDastur natijasini aniqlang?",
    "options": ["0", "4", "6", "5"],
    "a": "5",
    "hint": "💡 range(5) tsikl 5 marta aylanishini ta'minlaydi. Har bir aylanishda k (0) bir taga oshsa, natija 5 bo'ladi."
  },
  {
    "q": "for i in range(3):\n    print(i + 1)\nDastur natijasini aniqlang?",
    "options": ["0 1 2", "1 2", "Xato", "1 2 3"],
    "a": "1 2 3",
    "hint": "💡 i o'zgaruvchisi 0, 1, 2 qiymatlarini oladi. print(i + 1) esa ularga birni qo'shib chiqaradi: 1, 2, 3."
  },
  {
    "q": "s = 0\nfor i in range(2, 5):\n    s += i\nprint(s)\nDastur natijasini aniqlang?",
    "options": ["10", "9", "7", "5"],
    "a": "9",
    "hint": "💡 range(2, 5) dagi i qiymatlari: 2, 3, 4. Yig'indi: 2+3+4 = 9."
  },
  {
    "q": "for i in range(5, 0, -1):\n    print(i)\nDastur natijasini aniqlang?",
    "options": ["4 3 2 1", "5 4 3 2", "Xato", "5 4 3 2 1"],
    "a": "5 4 3 2 1",
    "hint": "💡 range uchinchi parametri manfiy bo'lsa (-1), ketma-ketlik kamayish tartibida bo'ladi. 5 dan 1 gacha (0 kirmaydi)."
  },
  {
    "q": "s = 10\nfor i in range(3):\n    s -= 2\nprint(s)\nDastur natijasini aniqlang?",
    "options": ["10", "8", "4", "6"],
    "a": "4",
    "hint": "💡 Tsikl 3 marta aylanadi va har safar s (10) dan 2 ni ayiradi: 10 - 2 - 2 - 2 = 4."
  },
  {
    "q": "for i in range(0, 6, 3):\n    print(i)\nDastur natijasini aniqlang?",
    "options": ["3 6", "0 3", "6", "Xato"],
    "a": "0 3",
    "hint": "💡 0 dan boshlanib 6 gacha 3 qadam bilan yuradi: 0, 3 (keyingisi 6 bo'lishi kerak edi, lekin 6 kirmaydi)."
  },
  {
    "q": "s = 1\nfor i in range(4):\n    s += s\nprint(s)\nDastur natijasini aniqlang?",
    "options": ["8", "4", "32", "16"],
    "a": "16",
    "hint": "💡 s += s bu sonni ikki baravar oshirish demakdir. 1 -> 2 -> 4 -> 8 -> 16."
  },
  {
    "q": "for i in range(1, 5):\n    if i % 2 == 0:\n        print(i)\nDastur natijasini aniqlang?",
    "options": ["1 3", "Hech narsa chiqmaydi", "2 4", "1 2 3 4"],
    "a": "2 4",
    "hint": "💡 i % 2 == 0 sharti sonning juftligini tekshiradi. 1 dan 4 gacha bo'lgan juft sonlar: 2, 4."
  },
  {
    "q": "k = 0\nfor i in range(1, 10):\n    if i % 3 == 0:\n        k += 1\nprint(k)\nDastur natijasini aniqlang?",
    "options": ["6", "2", "3", "4"],
    "a": "3",
    "hint": "💡 1 dan 9 gacha bo'lgan sonlar ichida 3 ga bo'linadiganlari: 3, 6, 9. Ularning soni jami 3 ta."
  },
  {
    "q": "s = 0\nfor i in range(1, 4):\n    s = s * 2 + i\nprint(s)\nDastur natijasini aniqlang?",
    "options": ["9", "13", "11", "7"],
    "a": "11",
    "hint": "💡 Qadamma-qadam: 1) s=0*2+1=1. 2) s=1*2+2=4. 3) s=4*2+3=11."
  },
  {
    "q": "for i in range(2, 8, 2):\n    print(i)\nDastur natijasini aniqlang?",
    "options": ["4 6 8", "2 4 6", "Xato", "2 4 6 8"],
    "a": "2 4 6",
    "hint": "💡 2 dan boshlab 2 qadam bilan 8 gacha yuradi: 2, 4, 6 (8 kirmaydi)."
  },
  {
    "q": "def salom():\n    print(\"Salom\")\nsalom()\nDastur natijasini aniqlang?",
    "options": ["None", "Xato", "Salom", "Hech narsa chiqmaydi"],
    "a": "Salom",
    "hint": "💡 Funksiya e'lon qilingandan so'ng (def), uni nomi bilan chaqirish kerak. salom() funksiya ichidagi matnni ekranga chiqaradi."
  },
  {
    "q": "def chiqar():\n    return 5\nprint(chiqar())\nDastur natijasini aniqlang?",
    "options": ["None", "Xato", "chiqar", "5"],
    "a": "5",
    "hint": "💡 'return' funksiyadan qiymatni qaytaradi. print esa shu qaytgan qiymatni (5) konsolga chiqaradi."
  },
  {
    "q": "def kvadrat(x):\n    return x * x\nprint(kvadrat(4))\nDastur natijasini aniqlang?",
    "options": ["8", "None", "4", "16"],
    "a": "16",
    "hint": "💡 x o'rniga 4 keladi va funksiya 4 * 4, ya'ni 16 qiymatini qaytaradi."
  },
  {
    "q": "def yigindi(a, b):\n    print(a - b)\nyigindi(3, 7)\nDastur natijasini aniqlang?",
    "options": ["7", "3", "-4", "10"],
    "a": "-4",
    "hint": "💡 Funksiya chaqirilganda a=3 va b=7 bo'ladi. print(3 - 7) natijasi esa -4."
  },
  {
    "q": "def yigindi(a, b):\n    print(a * b)\nyigindi(3, 7)\nDastur natijasini aniqlang?",
    "options": ["10", "3", "7", "21"],
    "a": "21",
    "hint": "💡 a=3 va b=7 qiymatlari ko'paytiriladi: 3 * 7 = 21."
  },
  {
    "q": "def nol():\n    return 0\nprint(nol())\nDastur natijasini aniqlang?",
    "options": ["Bo‘sh satr", "Xato", "None", "0"],
    "a": "0",
    "hint": "💡 Funksiya aniq 0 qiymatini qaytaryapti."
  },
  {
    "q": "def zero():\n    return -1\nprint(zero())\nDastur natijasini aniqlang?",
    "options": ["1", "Xato", "None", "-1"],
    "a": "-1",
    "hint": "💡 Funksiya aniq -1 qiymatini qaytaryapti."
  },
  {
    "q": "def zero():\n    return\nprint(zero())\nDastur natijasini aniqlang?",
    "options": ["0", "1", "None", "Xato"],
    "a": "None",
    "hint": "💡 Python'da agar 'return' hech narsasiz yozilsa yoki umuman yozilmasa, funksiya 'None' (hech narsa) qiymatini qaytaradi."
  },
  {
    "q": "def ikki_baravar(x):\n    return x * 2\nprint(ikki_baravar(5))\nDastur natijasini aniqlang?",
    "options": ["25", "7", "2", "10"],
    "a": "10",
    "hint": "💡 Funksiya unga berilgan argumentni (5) ikkiga ko'paytiradi."
  },
  {
    "q": "def f(a, b=5):\n    return a + b\nprint(f(3))\nDastur natijasini aniqlang?",
    "options": ["5", "3", "Xato", "8"],
    "a": "8",
    "hint": "💡 Bu yerda b ning standart qiymati (default value) 5 ga teng. f(3) chaqirilganda a=3 bo'ladi va b o'zining 5 qiymatini ishlatadi. 3 + 5 = 8."
  },
  {
    "q": "def f(a, b=5):\n    return a * b\nprint(f(2, 3))\nDastur natijasini aniqlang?",
    "options": ["10", "Xato", "6", "15"],
    "a": "6",
    "hint": "💡 Agar funksiya chaqirilganda b uchun qiymat berilsa (3), standart qiymat (5) ishlatilmaydi. 2 * 3 = 6."
  },
  {
    "q": "def salom(ism):\n    print(\"Salom\", ism)\nsalom(\"Ali\")\nDastur natijasini aniqlang?",
    "options": ["Ali", "Salom", "Ali Salom", "Salom Ali"],
    "a": "Salom Ali",
    "hint": "💡 print funksiyasi bir nechta qiymatlarni vergul bilan chiqarsa, ular orasida avtomatik bo'sh joy qo'yiladi: 'Salom' + ' ' + 'Ali'."
  },
  {
    "q": "Funksiya nima uchun ishlatiladi?",
    "options": [
      "Kodni qisqartirish",
      "Takroriy ishlardan qochish",
      "Dastur tuzilishini yaxshilash",
      "Barchasi to‘g‘ri"
    ],
    "a": "Barchasi to‘g‘ri",
    "hint": "💡 Funksiya — bu ma'lum bir vazifani bajaruvchi kod bo'lagi bo'lib, u dasturni tartibli qilishga va bir xil kodni qayta-qayta yozmaslikka yordam beradi."
  },
  {
    "q": "def f():\n    return 10\nprint(f())\nFunksiya natijasi nima?",
    "options": ["None", "Xato", "0", "10"],
    "a": "10",
    "hint": "💡 Funksiya ichidagi 'return 10' buyrug'i funksiya chaqirilganda uning o'rniga 10 qiymatini qaytarib beradi."
  },
  {
    "q": "def add(a, b):\n    return a + b\nFunksiya qanday e’lon qilingan?",
    "options": ["Parametrsiz funksiya", "Rekursiv funksiya", "Lambda funksiya", "Parametrli funksiya"],
    "a": "Parametrli funksiya",
    "hint": "💡 Funksiya nomidan keyingi qavs ichida (a, b) kabi o'zgaruvchilar bo'lsa, bu parametrli funksiya deyiladi. Ular tashqaridan qiymat qabul qiladi."
  },
  {
    "q": "def test():\n    return 5\nFunksiya chaqirish qaysi qatorda?",
    "options": ["return test", "print test()", "def test()", "test()"],
    "a": "test()",
    "hint": "💡 Funksiyani ishga tushirish (chaqirish) uchun uning nomidan keyin qavslarni yozish kerak: nomi()."
  },
  {
    "q": "def f(a, b):\n    return a - b\nFunksiya nechta argument qabul qiladi?",
    "options": ["1", "3", "0", "2"],
    "a": "2",
    "hint": "💡 Qavs ichidagi parametrlar soniga qarab (a va b), funksiya chaqirilayotganda ham aynan 2 ta qiymat yuborilishi kerak."
  },
  {
    "q": "Quyidagi kod natijasi?\ndef f(x=4):\n    return x+1\nprint(f())",
    "options": ["4", "1", "0", "5"],
    "a": "5",
    "hint": "💡 Bu yerda x uchun 'default' (standart) qiymat 4 qilib belgilangan. f() chaqirilganda hech qanday qiymat berilmagani uchun 4 ishlatiladi: 4 + 1 = 5."
  },
  {
    "q": "Quyidagi funksiya nimani hisoblaydi?\ndef kv(x):\n    return x*x",
    "options": ["Son ildizini", "Son kubini", "Son kvadratini", "Son yig‘indisini"],
    "a": "Son kvadratini",
    "hint": "💡 Sonni o'zini o'ziga ko'paytirish (x * x) uning kvadratini hisoblash demakdir."
  },
  {
    "q": "Quyidagi kod natijasi?\ndef f(a, b=4):\n    return a*b\nprint(f(2))",
    "options": ["4", "6", "2", "8"],
    "a": "8",
    "hint": "💡 Chaqirilayotgan f(2) da a=2 bo'ladi. b berilmagani uchun standart 4 qiymatini oladi: 2 * 4 = 8."
  },
  {
    "q": "return operatori nima qiladi?",
    "options": ["Natijani ekranga chiqaradi", "Funktsiyani chaqiradi", "O‘zgaruvchi yaratadi", "Qiymat qaytaradi"],
    "a": "Qiymat qaytaradi",
    "hint": "💡 'return' funksiyaning yakuniy natijasini u chaqirilgan joyga yuboradi. U 'print' kabi ekranga chiqarmaydi, shunchaki qiymatni qaytaradi."
  },
  {
    "q": "Funksiya ichida funksiya yozish mumkinmi?",
    "options": ["Yo‘q", "Faqat klassda", "Faqat modulda", "Ha"],
    "a": "Ha",
    "hint": "💡 Python'da 'nested functions' (ichma-ich funksiyalar) yaratish mumkin. Tashqi funksiya ichida yangi funksiya e'lon qilishingiz mumkin."
  },
  {
    "q": "Quyidagi kod natijasi?\ndef f(a):\n    return a+2\nprint(f(1)+f(2))",
    "options": ["3", "5", "7", "6"],
    "a": "7",
    "hint": "💡 Qadam-baqadam: f(1) = 1+2=3. f(2) = 2+2=4. Natija: 3 + 4 = 7."
  },
  {
    "q": "Quyidagi funksiya qaysi turga kiradi?\ndef f():\n    print(\"Hello\")",
    "options": ["Lambda funksiya", "Parametrli funksiya", "Rekursiv funksiya", "Parametrsiz funksiya"],
    "a": "Parametrsiz funksiya",
    "hint": "💡 Qavs ichi bo'sh bo'lganligi sababli, bu funksiya tashqaridan hech qanday ma'lumot qabul qilmaydi."
  },
  {
    "q": "Quyidagi kod natijasi?\ndef f(x):\n    return x%2==0\nprint(f(4))",
    "options": ["0", "False", "1", "True"],
    "a": "True",
    "hint": "💡 4 % 2 == 0 sharti True (Rost) qiymat qaytaradi, chunki 4 juft son va qoldiq nolga teng."
  },
  {
    "q": "Funksiya parametri nima?",
    "options": ["Funksiya natijasi", "O‘zgaruvchi turi", "Operator", "Funksiyaga uzatiladigan qiymat"],
    "a": "Funksiyaga uzatiladigan qiymat",
    "hint": "💡 Parametr — bu funksiya ishlashi uchun zarur bo'lgan xomashyo (ma'lumot) hisoblanadi."
  },
  {
    "q": "Quyidagi kod natijasi?\ndef f(a=1, b=2):\n    return a+b\nprint(f(3,4))",
    "options": ["3", "2", "7", "1"],
    "a": "7",
    "hint": "💡 Garchi standart qiymatlar (1 va 2) bo'lsa-da, chaqirilayotganda yangi qiymatlar (3 va 4) berilgan. 3 + 4 = 7."
  },
  {
    "q": "Quyidagi funksiya nima qaytaradi?\ndef f(x):\n    return x//2\nprint(f(9))",
    "options": ["Error", "Xato", "4", "5"],
    "a": "4",
    "hint": "💡 '//' belgisi butun sonli bo'lishni anglatadi. 9 ni 2 ga bo'lganda butun qismi 4 ga teng."
  },
  {
    "q": "Funksiya nima uchun ishlatiladi?",
    "options": [
      "Faqat chiqarish uchun",
      "Faqat hisoblash uchun",
      "O‘zgaruvchi saqlash uchun",
      "Kodni tartibli va qayta ishlatish uchun"
    ],
    "a": "Kodni tartibli va qayta ishlatish uchun",
    "hint": "💡 Funksiyalar kodni modullarga bo'lish, tushunarli qilish va bir marta yozilgan kodni ko'p marta ishlatish imkonini beradi."
  },
  {
    "q": "Python’da modul nima?",
    "options": [
      "Faqat bitta funksiya",
      "O‘zgaruvchi",
      "Operator",
      "Alohida faylda yozilgan va qayta qo‘llaniladigan kodlar majmui"
    ],
    "a": "Alohida faylda yozilgan va qayta qo‘llaniladigan kodlar majmui",
    "hint": "💡 Har qanday .py kengaytmali fayl modul bo'lishi mumkin. Uning ichida funksiyalar, o'zgaruvchilar va klasslar bo'ladi."
  },
  {
    "q": "Python modulining kengaytmasi qanday?",
    "options": [".txt", ".exe", ".docx", ".py"],
    "a": ".py",
    "hint": "💡 Python dasturiy fayllari har doim .py (Python source code) kengaytmasi bilan saqlanadi."
  },
  {
    "q": "Modulni dasturga ulash uchun qaysi kalit so‘z ishlatiladi?",
    "options": ["include", "using", "load", "import"],
    "a": "import",
    "hint": "💡 Boshqa fayldagi (moduldagi) kodlardan foydalanish uchun 'import' (olib kirish) buyrug'i beriladi."
  },
  {
    "q": "metodlar.py modulidagi Sum() funksiyasini chaqirish qaysi ko‘rinishda bo‘ladi?",
    "options": ["Sum()", "call Sum()", "metodlar->Sum()", "metodlar.Sum()"],
    "a": "metodlar.Sum()",
    "hint": "💡 Nuqta operatori moduldagi biror funksiyaga murojaat qilish uchun ishlatiladi: modul_nomi.funksiya_nomi."
  },
  {
    "q": "Modul funksiyalarini global nomlar maydoniga kiritish uchun qaysi buyruq ishlatiladi?",
    "options": ["import modul_nomi", "load modul_nomi", "include modul_nomi", "from modul_nomi import funksiya"],
    "a": "from modul_nomi import funksiya",
    "hint": "💡 'from ... import ...' shakli funksiyani to'g'ridan-to'g'ri chaqirish imkonini beradi (modul nomini yozmasdan)."
  },
  {
    "q": "Barcha funksiyalarni moduldan birdaniga import qilish qaysi ko‘rinishda?",
    "options": ["import *", "import all", "from * import modul_nomi", "from modul_nomi import *"],
    "a": "from modul_nomi import *",
    "hint": "💡 Yulduzcha (*) belgisi 'hamma narsani' degan ma'noni bildiradi."
  },
  {
    "q": "import * ishlatishning kamchiligi nimada?",
    "options": ["Kod ishlamaydi", "Modul yuklanmaydi", "Xotira tejalmaydi", "Funksiya nomlari to‘qnashuvi yuz berishi mumkin"],
    "a": "Funksiya nomlari to‘qnashuvi yuz berishi mumkin",
    "hint": "💡 Agar sizning dasturingizda ham, modulda ham bir xil nomli funksiya bo'lsa, xatolik kelib chiqadi."
  },
  {
    "q": "Python’da modul necha marta import qilinsa ham, u:",
    "options": ["Har safar qayta yuklanadi", "Umuman yuklanmaydi", "Xato beradi", "Faqat bir marta yuklanadi"],
    "a": "Faqat bir marta yuklanadi",
    "hint": "💡 Dastur samaradorligini oshirish uchun Python modulni birinchi marta import qilinganda xotiraga yuklaydi va keyingi chaqiriqlarda qayta yuklamaydi."
  },
  {
    "q": "Quyidagi kodda xatolik nimada?\nfrom math import sqrt\nprint(sqrt(144))\nprint(pi)",
    "options": ["sqrt noto‘g‘ri yozilgan", "math yo‘q", "Sintaksis xato", "pi import qilinmagan"],
    "a": "pi import qilinmagan",
    "hint": "💡 Biz faqat 'sqrt' funksiyasini import qildik. 'pi' o'zgaruvchisidan foydalanish uchun uni ham import qilish yoki 'import math' qilish kerak edi."
  },
  {
    "q": "if __name__ == \"__main__\": sharti nima uchun ishlatiladi?",
    "options": [
      "Funksiya chaqirish uchun",
      "Modul import qilish uchun",
      "Xatolarni ushlash uchun",
      "Modul to‘g‘ridan-to‘g‘ri ishga tushirilganda asosiy kodni bajarish uchun"
    ],
    "a": "Modul to‘g‘ridan-to‘g‘ri ishga tushirilganda asosiy kodni bajarish uchun",
    "hint": "💡 Bu shart modul boshqa faylga import qilinganda uning ichidagi test kodlari o'z-o'zidan ishlab ketmasligi uchun kerak."
  },
  {
    "q": "Massiv nima?",
    "options": ["Faqat bitta o‘zgaruvchi", "Funksiya", "Operator", "Bir xil turdagi ma’lumotlar ketma-ketligi"],
    "a": "Bir xil turdagi ma’lumotlar ketma-ketligi",
    "hint": "💡 Massiv (yoki Python'da list) — ko'plab ma'lumotlarni tartibli tartibda bitta nom ostida saqlash imkonini beruvchi konteynerdir."
  },
  {
    "q": "Python’da 2D massiv qanday ifodalanadi?",
    "options": ["Faqat tuple yordamida", "Dictionary yordamida", "String yordamida", "Listlar ichidagi listlar yordamida"],
    "a": "Listlar ichidagi listlar yordamida",
    "hint": "💡 Ikki o'lchovli massivni jadval deb tasavvur qilsangiz, har bir qator o'zi bitta alohida listdir."
  },
  {
    "q": "Quyidagi kod nimani yaratadi?\nmatrix = [[1,2],[3,4]]",
    "options": ["Bir o‘lchovli massiv", "Funksiya", "Klass", "Ikki o‘lchovli massiv"],
    "a": "Ikki o‘lchovli massiv",
    "hint": "💡 Tashqi list ichida ikkita ichki list bor, bu jadval ko'rinishidagi tuzilmani anglatadi."
  },
  {
    "q": "matrix[0][1] nimani bildiradi?",
    "options": [
      "2-qator, 1-ustun elementini",
      "Oxirgi elementni",
      "Butun qatorni",
      "1-qator, 2-ustun elementini"
    ],
    "a": "1-qator, 2-ustun elementini",
    "hint": "💡 Indekslash 0 dan boshlanadi. matrix[0] — birinchi qator, [1] — shu qatordagi ikkinchi element."
  },
  {
    "q": "2D massivda birinchi indeks nimani bildiradi?",
    "options": ["Ustunni", "Qiymatni", "Hajmni", "Qatorni"],
    "a": "Qatorni",
    "hint": "💡 matrix[i][j] formatida 'i' har doim qator raqamini, 'j' esa ustun raqamini bildiradi."
  },
  {
    "q": "Oxirgi qatorni olish uchun qaysi indeks ishlatiladi?",
    "options": ["1", "0", "n", "-1"],
    "a": "-1",
    "hint": "💡 Python'da manfiy indekslash orqadan boshlanadi. -1 indeksi har doim ro'yxatning eng oxirgi elementini (qatorini) qaytaradi."
  },
  {
    "q": "Massiv elementini o‘zgartirish qaysi ko‘rinishda?",
    "options": ["matrix(1,1)=10", "set(matrix)", "change matrix", "matrix[1][1] = 10"],
    "a": "matrix[1][1] = 10",
    "hint": "💡 Massiv elementini o'zgartirish uchun uning manzili (indeksi) ko'rsatiladi va yangi qiymat o'zlashtiriladi."
  },
  {
    "q": "Yangi qator qo‘shish uchun qaysi metod ishlatiladi?",
    "options": ["add()", "insert()", "push()", "append()"],
    "a": "append()",
    "hint": "💡 'Append' so'zi inglizchadan 'oxiriga qo'shish' deb tarjima qilinadi. U massivning oxiriga yangi qator yoki element qo'shadi."
  },
  {
    "q": "Qatorni o‘chirish qaysi buyruq bilan bajariladi?",
    "options": ["remove matrix", "erase matrix", "poprow()", "del matrix[0]"],
    "a": "del matrix[0]",
    "hint": "💡 'del' (delete) operatori massivdagi ma'lum bir indeksda turgan elementni yoki butun bir qatorni butunlay o'chirib tashlaydi."
  },
  {
    "q": "Massivni to‘liq o‘qish uchun nima ishlatiladi?",
    "options": ["if operatori", "while operatori", "break", "Ichma-ich for sikllar"],
    "a": "Ichma-ich for sikllar",
    "hint": "💡 Ikki o'lchovli massivda (jadvalda) birinchi 'for' qatorlarni, ikkinchi 'for' esa o'sha qatordagi ustunlarni (elementlarni) bittalab o'qib chiqadi."
  },
  {
    "q": "len(matrix) nimani qaytaradi?",
    "options": ["Ustunlar sonini", "Elementlar yig‘indisini", "Oxirgi indeksni", "Qatorlar sonini"],
    "a": "Qatorlar sonini",
    "hint": "💡 Python'da 2D massivga len() funksiyasi qo'llanilsa, u ichki listlar sonini, ya'ni jadvalning qancha qatori borligini ko'rsatadi."
  },
  {
    "q": "Bir o‘lchovli massivga misol qaysi?",
    "options": ["[[1,2],[3,4]]", "{1:2}", "(1,2,3)", "[1, 2, 3, 4]"],
    "a": "[1, 2, 3, 4]",
    "hint": "💡 Bir o'lchovli massiv (vektor) — bu faqat bitta qatordan iborat bo'lgan oddiy ro'yxatdir."
  },
  {
    "q": "NumPy kutubxonasi nima uchun ishlatiladi?",
    "options": [
      "Faqat grafik chizish uchun",
      "Fayl yaratish uchun",
      "Tarmoq uchun",
      "Massivlar va matematik amallar uchun"
    ],
    "a": "Massivlar va matematik amallar uchun",
    "hint": "💡 NumPy (Numerical Python) — katta hajmdagi massivlar bilan tezkor matematik hisob-kitoblarni bajaruvchi eng mashhur kutubxonadir."
  },
  {
    "q": "NumPy asosiy obyekt nomi?",
    "options": ["arraylist", "matrix2d", "vector", "ndarray"],
    "a": "ndarray",
    "hint": "💡 'ndarray' — bu 'n-dimensional array' (n-o'lchovli massiv) so'zining qisqartmasi bo'lib, NumPy'ning asosiy ma'lumot tuzilmasi hisoblanadi."
  },
  {
    "q": "Massivni transponirlash nimani bildiradi?",
    "options": [
      "Elementlarni o‘chirish",
      "Massivni teskari qilish",
      "Qiymatlarni yig‘ish",
      "Qator va ustunlarni almashtirish"
    ],
    "a": "Qator va ustunlarni almashtirish",
    "hint": "💡 Matritsani transponirlashda uning qatorlari ustun bo'lib, ustunlari esa qator bo'lib qoladi."
  },
  {
    "q": "Matrisani ko‘paytirish nimani talab qiladi?",
    "options": [
      "Faqat bir xil sonlarni",
      "Kvadrat matrisani",
      "Bir o‘lchovli massivni",
      "Qator va ustunlar mosligini"
    ],
    "a": "Qator va ustunlar mosligini",
    "hint": "💡 Ikki matritsani ko'paytirish uchun birinchi matritsaning ustunlar soni ikkinchi matritsaning qatorlar soniga teng bo'lishi shart."
  },
  {
    "q": "SciPy kutubxonasi qaysi sohada ishlatiladi?",
    "options": [
      "Veb dizaynda",
      "Fayl boshqarishda",
      "Matn tahririda",
      "Ilmiy va matematik hisob-kitoblarda"
    ],
    "a": "Ilmiy va matematik hisob-kitoblarda",
    "hint": "💡 SciPy (Scientific Python) NumPy ustiga qurilgan bo'lib, optimallashtirish, integrallash va statistika kabi murakkab ilmiy masalalar uchun ishlatiladi."
  },
  {
    "q": "Quyidagi kod nimani hisoblaydi? np.mean(arr)",
    "options": [
      "Maksimumni",
      "Minimumni",
      "Elementlar sonini",
      "O‘rta arifmetik qiymatni"
    ],
    "a": "O‘rta arifmetik qiymatni",
    "hint": "💡 'Mean' inglizchadan 'o'rtacha' degan ma'noni anglatadi. U barcha elementlar yig'indisini ularning soniga bo'lib beradi."
  },
  {
    "q": "arr[4] = mean_value nimani anglatadi?",
    "options": [
      "Oxirgi elementni o‘chirish",
      "Massivni tozalash",
      "Element qo‘shish",
      "5-elementni o‘rta qiymatga almashtirish"
    ],
    "a": "5-elementni o‘rta qiymatga almashtirish",
    "hint": "💡 Indeks 0 dan boshlangani uchun arr[4] massivning 5-elementini bildiradi. Unga yangi qiymat o'zlashtirilmoqda."
  },
  {
    "q": "Juft sonni aniqlash sharti qaysi?",
    "options": ["a[i] / 2 == 0", "a[i] == 2", "a[i] > 0", "a[i] % 2 == 0"],
    "a": "a[i] % 2 == 0",
    "hint": "💡 Sonni 2 ga bo'lgandagi qoldiq (%) 0 bo'lsa, bu son albatta juft son hisoblanadi."
  },
  {
    "q": "for i in range(n): nimani bildiradi?",
    "options": [
      "Ustunlar bo‘yicha yurishni",
      "Element o‘chirishni",
      "Funksiya chaqirishni",
      "Qatorlar bo‘yicha yurishni"
    ],
    "a": "Qatorlar bo‘yicha yurishni",
    "hint": "💡 range(n) sikli odatda 2D massivlarda qatorlar indeksi bo'ylab tartib bilan harakatlanish uchun ishlatiladi."
  },
  {
    "q": "2D massivdagi elementlar yig‘indisi qanday topiladi?",
    "options": [
      "Faqat sum() bilan",
      "len() bilan",
      "append() bilan",
      "Ichma-ich sikllar yordamida"
    ],
    "a": "Ichma-ich sikllar yordamida",
    "hint": "💡 Barcha elementlarni qo'shib chiqish uchun jadvalning har bir qatoriga kirib, undagi har bir sonni bittalab yig'ish kerak."
  },
  {
    "q": "NumPy va Pandas birgalikda nima beradi?",
    "options": [
      "Grafik dizaynni",
      "O‘yin dvijokini",
      "Operatsion tizimni",
      "Kuchli ma’lumotlar tahlilini"
    ],
    "a": "Kuchli ma’lumotlar tahlilini",
    "hint": "💡 NumPy matematik asosni, Pandas esa ma'lumotlarni jadvallar (DataFrame) shaklida tahlil qilish imkonini beradi."
  },
  {
    "q": "NumPy nima?",
    "options": [
      "Grafik chizish dasturi",
      "Matn muharriri",
      "Operatsion tizim",
      "Ilmiy hisoblashlar uchun mo‘ljallangan Python kutubxonasi"
    ],
    "a": "Ilmiy hisoblashlar uchun mo‘ljallangan Python kutubxonasi",
    "hint": "💡 NumPy — bu Python'da vektor va matritsalar bilan yuqori tezlikda ishlash imkonini beruvchi eng fundamental kutubxonadir."
  },
  {
    "q": "NumPy kutubxonasini o‘rnatish buyrug‘i qaysi?",
    "options": ["install numpy", "python numpy", "add numpy", "pip install numpy"],
    "a": "pip install numpy",
    "hint": "💡 Python'da kutubxonalarni o'rnatish uchun standart 'pip' paket menejeridan foydalaniladi."
  },
  {
    "q": "NumPy’ni dasturga import qilishning to‘g‘ri usuli qaysi?",
    "options": ["include numpy", "using numpy", "load numpy", "import numpy as np"],
    "a": "import numpy as np",
    "hint": "💡 'as np' qismi NumPy'ni qisqa nom bilan chaqirish imkonini beradi, bu esa kod yozishni tezlashtiradi."
  },
  {
    "q": "NumPy massivlari Python listlaridan nimasi bilan farq qiladi?",
    "options": [
      "Har xil turdagi ma’lumotlarni saqlaydi",
      "Sekin ishlaydi",
      "Faqat matn saqlaydi",
      "Bir xil turdagi ma’lumotlarni saqlaydi"
    ],
    "a": "Bir xil turdagi ma’lumotlarni saqlaydi",
    "hint": "💡 NumPy massivlari bir xil tipdagi ma'lumotlarni saqlagani uchun xotiradan kam joy oladi va Python listlariga qaraganda ancha tez ishlaydi."
  },
  {
    "q": "Quyidagi kod nimani yaratadi? np.array([1, 2, 3, 4])",
    "options": [
      "Ikki o‘lchovli massiv",
      "Funksiya",
      "Klass",
      "Bir o‘lchovli massiv"
    ],
    "a": "Bir o‘lchovli massiv",
    "hint": "💡 Bu yerda faqat bitta list uzatilmoqda, demak natija bir o'lchovli vektor bo'ladi."
  },
  {
    "q": "Nollardan iborat 5 ta elementli massiv qaysi funksiya bilan yaratiladi?",
    "options": ["np.ones(5)", "np.empty(5)", "np.full(5)", "np.zeros(5)"],
    "a": "np.zeros(5)",
    "hint": "💡 'Zeros' so'zi inglizchadan 'nollar' degan ma'noni anglatadi. U ko'rsatilgan miqdorda nollardan iborat massiv yaratadi."
  },
  {
    "q": "3×3 birlik (identity) matritsa qaysi funksiya bilan yaratiladi?",
    "options": ["np.zeros(3)", "np.ones(3)", "np.identity(1)", "np.eye(3)"],
    "a": "np.eye(3)",
    "hint": "💡 np.eye() funksiyasi diagonal bo'ylab 1 sonlari, qolgan joylari esa 0 bo'lgan kvadrat matritsa yaratadi."
  },
  {
    "q": "Massiv o‘lchamini ko‘rsatuvchi xususiyat qaysi?",
    "options": ["size", "dtype", "ndim", "shape"],
    "a": "shape",
    "hint": "💡 'Shape' massivda nechta qator va nechta ustun borligini ko'rsatuvchi kortej (tuple) qaytaradi."
  },
  {
    "q": "Massivning o‘lchovlar sonini aniqlovchi xususiyat?",
    "options": ["shape", "size", "itemsize", "ndim"],
    "a": "ndim",
    "hint": "💡 'ndim' (number of dimensions) massivning necha o'lchovli (1D, 2D yoki 3D) ekanligini raqam ko'rinishida ko'rsatadi."
  },
  {
    "q": "arr.size nimani bildiradi?",
    "options": [
      "Ustunlar sonini",
      "Qatorlar sonini",
      "Baytlar sonini",
      "Massivdagi elementlar sonini"
    ],
    "a": "Massivdagi elementlar sonini",
    "hint": "💡 'Size' massivning shaklidan qat'i nazar, uning ichidagi barcha elementlarning umumiy sonini hisoblab beradi."
  },
  {
    "q": "Massiv elementiga murojaat qilishning to‘g‘ri ko‘rinishi qaysi?",
    "options": ["arr(0)", "arr{0}", "arr<0>", "arr[0]"],
    "a": "arr[0]",
    "hint": "💡 Python va NumPy'da elementlarga murojaat qilish uchun har doim to'rtburchak qavslardan [] foydalaniladi."
  },
  {
    "q": "2D massivda elementga murojaat qilish qaysi ko‘rinishda?",
    "options": [
      "matrix(1)(2)",
      "matrix[1][2][ ]",
      "matrix{1,2}",
      "matrix[1, 2]"
    ],
    "a": "matrix[1, 2]",
    "hint": "💡 NumPy'da 2D massiv elementini olish uchun qator va ustun indekslari vergul bilan ajratilgan holda bitta qavs ichida yozilishi mumkin."
  },
  {
    "q": "Quyidagi kesma nimani qaytaradi? arr[2:5]",
    "options": [
      "2-indeksdan 5-indeksgacha",
      "Faqat 2-indeksni",
      "Oxirgi elementlarni",
      "2-indeksdan 4-indeksgacha bo‘lgan elementlarni"
    ],
    "a": "2-indeksdan 4-indeksgacha bo‘lgan elementlarni",
    "hint": "💡 Kesishda (slicing) birinchi indeks kiradi, lekin oxirgi indeks (5) natijaga kirmaydi."
  },
  {
    "q": "arr[::2] nimani bildiradi?",
    "options": [
      "Oxirgi elementni",
      "Faqat juft indekslarni",
      "Faqat toq indekslarni",
      "Har ikkinchi elementni olish"
    ],
    "a": "Har ikkinchi elementni olish",
    "hint": "💡 'start:stop:step' formatida uchinchi raqam qadamni bildiradi. 2 qadami har ikkinchi elementni tanlab olishni anglatadi."
  },
  {
    "q": "np.arange(1, 5) natijasi qaysi?",
    "options": ["[1, 2, 3, 4, 5]", "[0, 1, 2, 3, 4]", "[5]", "[1, 2, 3, 4]"],
    "a": "[1, 2, 3, 4]",
    "hint": "💡 np.arange() funksiyasi range() kabi ishlaydi: boshlang'ich qiymat (1) kiradi, lekin oxirgi qiymat (5) natijaga kirmaydi."
  },
  {
    "q": "Python’da o‘zgaruvchi nomi nimadan boshlanishi mumkin?",
    "options": [
      "Raqamdan",
      "Maxsus belgidan (#, @, !)",
      "Harf yoki pastki chiziq (_) dan",
      "Bo‘sh joydan"
    ],
    "a": "Harf yoki pastki chiziq (_) dan",
    "hint": "💡 Python’da o‘zgaruvchi nomi harf (a–z, A–Z) yoki pastki chiziq (_) bilan boshlanishi mumkin. Raqam bilan boshlash mumkin emas."
  },
  {
    "q": "Quyidagi dastur natijasini toping:\na = 1\nb = 2\nc = 3\ntemp = a\na = b\nb = c\nc = temp\nprint(a, b, c)",
    "options": [
      "1 2 3",
      "3 2 1",
      "2 3 1",
      "2 1 3"
    ],
    "a": "2 3 1",
    "hint": "💡 Bu yerda qiymatlar vaqtinchalik 'temp' o‘zgaruvchisi orqali aylantirilmoqda: a→b, b→c, c→a."
  },
  {
    "q": "Chiziqli algoritm qanday algoritm hisoblanadi?",
    "options": [
      "Shart asosida turli yo‘nalishga bo‘linadigan algoritm",
      "Buyruqlari faqat bir marta va ketma-ket bajariladigan algoritm",
      "Bir amal ko‘p marta takrorlanadigan algoritm",
      "Faqat matematik hisob-kitob qiladigan algoritm"
    ],
    "a": "Buyruqlari faqat bir marta va ketma-ket bajariladigan algoritm",
    "hint": "💡 Chiziqli algoritmda barcha amallar boshidan oxirigacha hech qanday shartsiz va takrorlanishsiz ketma-ket bajariladi."
  },
  {
    "q": "Tarmoqlanuvchi algoritmning asosiy belgisi nima?",
    "options": [
      "Buyruqlar doim bir xil tartibda bajariladi",
      "Amallar cheksiz davom etadi",
      "Shartga bog‘liq holda bajarilish yo‘li tanlanadi",
      "Faqat sonlar bilan ishlaydi"
    ],
    "a": "Shartga bog‘liq holda bajarilish yo‘li tanlanadi",
    "hint": "💡 Tarmoqlanish degani — masala yechimi davomida 'agar shunday bo‘lsa — bunday, aks holda — boshqacha' yo‘l tanlanishi."
  },
  {
    "q": "Takrorlanuvchi algoritm qaysi holatda ishlatiladi?",
    "options": [
      "Faqat bitta amal bajarish kerak bo‘lsa",
      "Shart bajarilguncha bir xil amallar qayta-qayta bajarilganda",
      "Hech qanday shart bo‘lmaganda",
      "Faqat natijani chiqarishda"
    ],
    "a": "Shart bajarilguncha bir xil amallar qayta-qayta bajarilganda",
    "hint": "💡 Takrorlanuvchi (siklik) algoritmlar bir xil turdagi ishlarni ko‘p marta bajarish kerak bo‘lganda ishlatiladi. Masalan: 1 dan 100 gacha sonlarni chiqarish."
  },
  {
    "q": "Python’da izoh (kommentariya) yozish uchun qaysi belgi ishlatiladi?",
    "options": ["//", "/* */", "#", "--"],
    "a": "#",
    "hint": "💡 # belgidan keyin yozilgan matn Python tomonidan bajarilmaydi, faqat tushuntirish uchun xizmat qiladi."
  },
  {
    "q": "Quyidagi ifoda natijasi nima? print(2 ** 3)",
    "options": ["6", "8", "9", "5"],
    "a": "8",
    "hint": "💡 ** operatori darajaga oshirishni bildiradi. 2 ning 3-darajasi = 2×2×2 = 8."
  },
  {
    "q": "Quyidagi ifoda natijasi nima? print(7 // 2)",
    "options": ["3.5", "3", "4", "2"],
    "a": "3",
    "hint": "💡 // butun bo‘lish operatori. 7 ni 2 ga bo‘lganda butun qismi 3 bo‘ladi."
  },
  {
    "q": "Quyidagi ifoda natijasi nima? print(7 % 2)",
    "options": ["3", "1", "2", "0"],
    "a": "1",
    "hint": "💡 % operatori qoldiqni beradi. 7 ni 2 ga bo‘lganda qoldiq 1."
  },
  {
    "q": "list(range(3)) natijasi nima bo‘ladi?",
    "options": ["[1,2,3]", "[0,1,2]", "[0,1,2,3]", "[3]"],
    "a": "[0,1,2]",
    "hint": "💡 range(3) 0 dan boshlanadi va 3 gacha boradi, lekin 3 ning o‘zi kirmaydi."
  },
  {
    "q": "Quyidagilardan qaysi biri ro‘yxat (list) hisoblanadi?",
    "options": ["{1,2,3}", "(1,2,3)", "[1,2,3]", "<1,2,3>"],
    "a": "[1,2,3]",
    "hint": "💡 Python’da listlar kvadrat qavslar [ ] bilan yoziladi."
  },
  {
    "q": "len([1,2,3,4]) natijasi nima?",
    "options": ["3", "4", "5", "1"],
    "a": "4",
    "hint": "💡 len() funksiyasi ro‘yxat ichidagi elementlar sonini qaytaradi."
  },
  {
    "q": "Quyidagi kod natijasi nima? a = [1,2,3]; a.append(4); print(a)",
    "options": ["[1,2,3]", "[1,2,3,4]", "[4,1,2,3]", "Error"],
    "a": "[1,2,3,4]",
    "hint": "💡 append() ro‘yxat oxiriga yangi element qo‘shadi."
  },
  {
    "q": "Quyidagi kod natijasi nima? a = [1,2,3]; a.pop(); print(a)",
    "options": ["[1,2]", "[1,2,3]", "[2,3]", "Error"],
    "a": "[1,2]",
    "hint": "💡 pop() oxirgi elementni o‘chiradi. 3 olib tashlanadi."
  },
  {
    "q": "Quyidagi shart qachon True bo‘ladi? len(s) == 0",
    "options": [
      "s son bo‘lsa",
      "s bo‘sh satr bo‘lsa",
      "s ro‘yxat bo‘lsa",
      "s musbat bo‘lsa"
    ],
    "a": "s bo‘sh satr bo‘lsa",
    "hint": "💡 Uzunligi 0 bo‘lgan satr yoki ro‘yxat — bo‘sh (empty) hisoblanadi."
  },
  {
    "q": "Quyidagi kod natijasi nima? print(type(5.0))",
    "options": ["int", "float", "str", "bool"],
    "a": "float",
    "hint": "💡 5.0 nuqtali son bo‘lgani uchun float turiga kiradi."
  },
  {
    "q": "Quyidagi kod natijasi nima? print(type(\"5\"))",
    "options": ["int", "float", "str", "char"],
    "a": "str",
    "hint": "💡 Qo‘shtirnoq ichidagi har qanday narsa matn (string) hisoblanadi."
  },
  {
    "q": "Quyidagi kod natijasi nima? print(bool(0))",
    "options": ["True", "False", "0", "Error"],
    "a": "False",
    "hint": "💡 Python’da 0 qiymati mantiqiy jihatdan False deb qabul qilinadi."
  },
  {
    "q": "Quyidagi kod natijasi nima? print(bool(5))",
    "options": ["True", "False", "5", "Error"],
    "a": "True",
    "hint": "💡 Nolga teng bo‘lmagan har qanday son True deb baholanadi."
  },
  {
    "q": "Quyidagi kod natijasi nima? a = \"Salom\"; print(a[0])",
    "options": ["S", "a", "Salom", "Error"],
    "a": "S",
    "hint": "💡 Indekslar 0 dan boshlanadi. a[0] satrning birinchi harfini beradi."
  },
     ]

  },
  physics: {
        title: "Fizika",
        questions: [
  {
    "q": "Tezlanish deb nimaga aytiladi?",
    "options": [
      "Moddiy nuqta tezligining birlik vaqt davomidagi o‘zgarishini xarakterlaydigan kattalikka tezlanish deyiladi.",
      "Moddiy nuqta ko‘chishining birlik vaqt davomidagi o‘zgarishini xarakterlaydigan kattalikka tezlanish deyiladi.",
      "Moddiy nuqta trayektoriyasining birlik vaqt davomidagi o‘zgarishini xarakterlaydigan kattalikka tezlanish deyiladi.",
      "Moddiy nuqta harakatining birlik vaqt davomidagi o‘zgarishini xarakterlaydigan kattalikka tezlanish deyiladi."
    ],
    "a": "Moddiy nuqta tezligining birlik vaqt davomidagi o‘zgarishini xarakterlaydigan kattalikka tezlanish deyiladi.",
    "hint": "💡 Tezlanish — bu tezlikning qanchalik tez o'zgarayotganini ko'rsatadi. Masalan, mashina gazini bossangiz, tezlik orta boshlaydi, demak tezlanish paydo bo'ladi. Formula: a = Δv / Δt."
  },
  {
    "q": "Klassik mexanikada fazoning bir jinsli va izotropligi nimani bildiradi?",
    "options": [
      "Turli yo‘nalishlardagi xususiyatlarining bir xil deb qabul qilinishini",
      "Bir xil yo‘nalishlardagi xususiyatlarining har xil deb qabul qilinishini",
      "Turli yo‘nalishlardagi xususiyatlarining har xil deb qabul qilinishini",
      "Bir xil yo‘nalishlardagi xususiyatlarining bir xil deb qabul qilinishini"
    ],
    "a": "Turli yo‘nalishlardagi xususiyatlarining bir xil deb qabul qilinishini",
    "hint": "💡 Izotroplik — bu fazoning barcha yo'nalishlarda bir xil xususiyatga ega ekanligini anglatadi. Ya'ni, tajribani shimolga qarab o'tkazasizmi yoki janubga, fizika qonunlari o'zgarmaydi."
  },
  {
    "q": "Moddiy nuqta deb nimaga aytiladi?",
    "options": [
      "Qaralayotgan sharoitlarda shakli va o‘lchamlarini e’tiborga olmasa ham bo‘ladigan jismga moddiy nuqta deyiladi.",
      "Qaralayotgan sharoitlarda faqat shaklini e’tiborga olmasa bo‘ladigan jism.",
      "Qaralayotgan sharoitlarda faqat o‘lchamlarini e’tiborga olmasa bo‘ladigan jism.",
      "Qaralayotgan sharoitlarda hajmini e’tiborga olmasa bo‘ladigan jism."
    ],
    "a": "Qaralayotgan sharoitlarda shakli va o‘lchamlarini e’tiborga olmasa ham bo‘ladigan jismga moddiy nuqta deyiladi.",
    "hint": "💡 Moddiy nuqta — bu ideal tushuncha. Masalan, Yerdan Quyoshgacha bo'lgan masofani hisoblaganda, Yerning o'lchami juda kichik bo'lgani uchun uni oddiy nuqta deb hisoblashimiz mumkin."
  },
  {
    "q": "Sanoq sistemasi deb nimaga aytiladi?",
    "options": [
      "Sanoq jismi, koordinatalar sistemasi va vaqtni qayd qiluvchi asbob-soat majmuasi.",
      "Faqat koordinatalar sistemasi.",
      "Faqat sanoq jismi va soat.",
      "Faqat vaqtni qayd qiluvchi asbob."
    ],
    "a": "Sanoq jismi, koordinatalar sistemasi va vaqtni qayd qiluvchi asbob-soat majmuasi.",
    "hint": "💡 Harakatni o'rganish uchun bizga 3 ta narsa kerak: 1. Nimaga nisbatan harakatlanyapmiz (jism), 2. Qayerda turibmiz (koordinata), 3. Qachon (vaqt/soat)."
  },
  {
    "q": "Trayektoriya deb nimaga aytiladi?",
    "options": [
      "Moddiy nuqtaning harakati davomida qoldirgan iziga trayektoriya deyiladi.",
      "Moddiy nuqtaning tezligiga trayektoriya deyiladi.",
      "Bosib o‘tilgan yo‘lga trayektoriya deyiladi.",
      "Ko‘chishga trayektoriya deyiladi."
    ],
    "a": "Moddiy nuqtaning harakati davomida qoldirgan iziga trayektoriya deyiladi.",
    "hint": "💡 Trayektoriya — bu jism harakatlanayotganda chizgan chizig'i. Masalan, samolyot osmonda qoldirgan oq chiziq uning trayektoriyasini ko'rsatadi."
  },
  {
    "q": "Tezlik deb nimaga aytiladi?",
    "options": [
      "Moddiy nuqtaning fazodagi vaziyati vaqt bo‘yicha o‘zgarish jadalligini xarakterlovchi kattalik.",
      "Moddiy nuqtaning harakati davomida bosib o‘tgan yo‘li.",
      "Moddiy nuqtaning tezlanishi.",
      "Moddiy nuqtaning massasi."
    ],
    "a": "Moddiy nuqtaning fazodagi vaziyati vaqt bo‘yicha o‘zgarish jadalligini xarakterlovchi kattalik.",
    "hint": "💡 Tezlik jismning qanchalik tez joyini o'zgartirayotganini bildiradi. Agar jism qisqa vaqtda uzoqqa ko'chsa, demak uning tezligi yuqori. Formula: v = s / t."
  },
  {
    "q": "Markazga intilma yoki normal tezlanish formulasini ko‘rsating?",
    "options": [
      "aₙ = dv / dt",
      "aₙ = v² / R",
      "aₜ = dv / dt",
      "a = v / R"
    ],
    "a": "aₙ = v² / R",
    "hint": "💡 Normal tezlanish jism aylanma harakat qilayotganda tezlikning yo'nalishini o'zgartirishga xizmat qiladi. U har doim aylana markaziga yo'nalgan bo'ladi."
  },
  {
    "q": "Bosib o‘tilgan yo‘l deb nimaga aytiladi?",
    "options": [
      "Moddiy nuqta trayektoriyasining ma’lum qismiga bosib o‘tilgan yo‘l deyiladi.",
      "Moddiy nuqta trayektoriyasining uzunligi va shakliga bosib o‘tilgan yo‘l deyiladi.",
      "Moddiy nuqta harakat trayektoriyasining uzunligiga bosib o‘tilgan yo‘l deyiladi.",
      "Moddiy nuqta harakatining tezligiga bosib o‘tilgan yo‘l deyiladi."
    ],
    "a": "Moddiy nuqta harakat trayektoriyasining uzunligiga bosib o‘tilgan yo‘l deyiladi.",
    "hint": "💡 Yo'l — bu trayektoriyaning uzunligi. Masalan, siz uydan maktabgacha egri yo'llar bilan yursangiz, barcha bosib o'tgan qadamlaringiz yig'indisi yo'l hisoblanadi."
  },
  {
    "q": "Tezlik qanday kattalik?",
    "options": [
      "Tezlik o‘zgarmaydigan kattalik.",
      "Tezlik skalyar kattalik.",
      "Tezlik vektor va skalyar kattalik.",
      "Tezlik vektor kattalik.",
    ],
    "a": "Tezlik vektor kattalik.",
    "hint": "💡 Vektor kattalik — bu ham miqdori (qiymati), ham yo'nalishi bor kattalikdir. Tezlik haqida gapirganda nafaqat 'necha km/soat', balki 'qaysi tomonga' harakatlanayotgani ham muhim."
  },
  {
    "q": "Nyutonning ikkinchi qonuni formulasini ko‘rsating?",
    "options": [
      "F = m·a",
      "F = m·v",
      "F = −F",
      "F = m·g"
    ],
    "a": "F = m·a",
    "hint": "💡 Nyutonning 2-qonuni: Jismga ta'sir etuvchi kuch (F) uning massasi (m) va olgan tezlanishi (a) ko'paytmasiga teng. Kuch qancha katta bo'lsa, tezlanish ham shuncha katta bo'ladi."
  },
  {
    "q": "Ilgarilanma harakat deb nimaga aytiladi?",
    "options": [
      "Jismdagi ixtiyoriy ikki nuqtani tutashtiruvchi to‘g‘ri chiziq o‘z-o‘ziga parallel va perpendikulyar ravishda ko‘chadigan harakat.",
      "Jismdagi ixtiyoriy ikki nuqtani tutashtiruvchi to‘g‘ri chiziq o‘z-o‘ziga parallel ravishda ko‘chadigan harakat.",
      "Jismdagi ixtiyoriy ikki nuqtani tutashtiruvchi to‘g‘ri chiziq o‘z-o‘ziga perpendikulyar ravishda ko‘chadigan harakat.",
      "Jismdagi ixtiyoriy ikki nuqtani tutashtiruvchi to‘g‘ri chiziq o‘z-o‘ziga parallel ravishda ko‘chmaydigan harakat."
    ],
    "a": "Jismdagi ixtiyoriy ikki nuqtani tutashtiruvchi to‘g‘ri chiziq o‘z-o‘ziga parallel ravishda ko‘chadigan harakat.",
    "hint": "💡 Ilgarilanma harakatda jismning barcha nuqtalari bir xil harakat qiladi. Tasavvur qiling, qutini polda sursangiz, uning burchaklarini tutashtiruvchi chiziq har doim bir xil yo'nalishda (parallel) qoladi."
  },
  {
    "q": "Nyutonning uchinchi qonuni formulasini ko‘rsating?",
    "options": [
      "F₁₂ = F₂₁",
      "F = m·a",
      "F₁₂ = −F₂₁",
      "F = −F₁"
    ],
    "a": "F₁₂ = −F₂₁",
    "hint": "💡 Bu qonun 'Ta'sir va aks ta'sir' qonunidir. Minus belgisi kuchlarning yo'nalishi bir-biriga qarama-qarshi ekanligini bildiradi. Siz devorni qanchalik bossangiz, devor ham sizni shunchalik kuch bilan qaytaradi."
  },
  {
    "q": "Jismning impulsi formulasini ko‘rsating?",
    "options": [
      "F = m + v",
      "p = m·v",
      "p = m·a",
      "F = m·a"
    ],
    "a": "p = m·v",
    "hint": "💡 Impuls — bu 'harakat miqdori'. Jismning massasi va tezligi qanchalik katta bo'lsa, uning impulsi ham shunchalik yuqori bo'ladi. Masalan, og'ir yuk mashinasini to'xtatish yengil mashinaga qaraganda qiyinroq, chunki uning impulsi katta."
  },
  {
    "q": "Jism inertligining o‘lchovi — jismning massasi deb nimaga aytiladi?",
    "options": [
      "Jismga ta’sir etuvchi kuchning tezlanishga nisbati bilan xarakterlanadigan fizik kattalik.",
      "Jismga ta’sir etuvchi kuchning shu kuch ta’sirida jism oladigan tezligiga nisbati bilan xarakterlanadigan fizik kattalik.",
      "Jismga ta’sir etuvchi kuchning shu kuch ta’sirida jism oladigan tezlanishga ko‘paytmasi bilan xarakterlanadigan fizik kattalik.",
      "Jismga ta’sir etuvchi kuchning shu kuch ta’sirida jism oladigan tezlanishga nisbati bilan xarakterlanadigan fizik kattalik.",
    ],
    "a": "Jismga ta’sir etuvchi kuchning shu kuch ta’sirida jism oladigan tezlanishga nisbati bilan xarakterlanadigan fizik kattalik.",
    "hint": "💡 Massa jismning 'taysalligi' yoki inertligini bildiradi. Bir xil kuch bilan itarsangiz, og'ir jism (katta massa) kamroq tezlanish oladi. Shuning uchun m = F / a."
  },
  {
    "q": "Nyutonning uchinchi qonuniga ta’rif bering?",
    "options": [
      "Ikki jismning o‘zaro ta’sir kuchlari kichiklik jihatidan teng bo‘lib, qarama-qarshi yo‘nalgan.",
      "Bir jismning o‘zaro ta’sir kuchlari kattalik jihatidan teng bo‘lib, qarama-qarshi yo‘nalgan.",
      "Ikki jismning o‘zaro ta’sir kuchlari kattalik jihatidan teng bo‘lib, jismlarni birlashtiruvchi to‘g‘ri chiziq bo‘ylab qarama-qarshi yo‘nalgan.",
      "Bir jismning o‘zaro ta’sir kuchlari kichiklik jihatidan teng bo‘lib, yo‘nalgan."
    ],
    "a": "Ikki jismning o‘zaro ta’sir kuchlari kattalik jihatidan teng bo‘lib, jismlarni birlashtiruvchi to‘g‘ri chiziq bo‘ylab qarama-qarshi yo‘nalgan.",
    "hint": "💡 Kuchlar har doim juft-juft bo'lib yuzaga keladi. Muhim jihati: bu kuchlar qiymat jihatdan teng, lekin yo'nalishi qarama-qarshi va turli jismlarga qo'yilgan bo'ladi."
  },
  {
    "q": "Mexanik ish formulasi va o‘lchov birligini ko‘rsating?",
    "options": [
      "A = F·s·cosα, Joul",
      "F = μ·m·g, Nyuton",
      "A = F / s, Pa",
      "A = F·s·cosα, Vatt"
    ],
    "a": "A = F·s·cosα, Joul",
    "hint": "💡 Ish bajarilishi uchun kuch (F) ta'sirida jism ko'chishi (s) kerak. Agar siz devorni itarsangiz-u, u joyidan jilmasa, fizik ma'noda ish bajarilmagan hisoblanadi. Birligi — Joul."
  },
  {
    "q": "Kinetik energiya formulasi va o‘lchov birligini ko‘rsating?",
    "options": [
      "E = S / t, Pa",
      "E = m·v² / 2, Joul",
      "E = F·s, Vatt",
      "E = m·v / t, Joul"
    ],
    "a": "E = m·v² / 2, Joul",
    "hint": "💡 Kinetik energiya — bu harakatlanayotgan jismning energiyasidir. Jismning tezligi (v) ortishi bilan uning energiyasi kvadratik ravishda o'sib boradi."
  },
  {
    "q": "Butun olam tortishish (gravitasiya) qonunining formulasini ko‘rsating?",
    "options": [
      "F = γ·m₁·m₂ / r",
      "F = m₁·m₂ / r²",
      "F = γ·m₁·m₂ / r²",
      "F = −γ·m₁·m₂ / r²"
    ],
    "a": "F = γ·m₁·m₂ / r²",
    "hint": "💡 Nyutonning tortishish qonuniga ko'ra, barcha massaga ega jismlar bir-birini tortadi. Bu kuch masofaning (r) kvadrati ortishi bilan juda tez kamayib boradi."
  },
  {
    "q": "Butun olam tortishish (gravitasiya) doimiysining qiymati va o‘lchov birligini ko‘rsating?",
    "options": [
      "γ = 6,67·10⁻¹¹ N·m/kg",
      "γ = 6,67·10⁻¹¹ N·m²/kg²",
      "γ = 6,67·10⁻¹¹ N·kg²",
      "γ = 6,67·10⁻¹¹ m²/kg²"
    ],
    "a": "γ = 6,67·10⁻¹¹ N·m²/kg²",
    "hint": "💡 Bu juda kichik son (6,67·10⁻¹¹). Shuning uchun biz kundalik hayotda kichik jismlarning bir-birini tortishini sezmaymiz, lekin sayyoralar darajasida bu kuch ulkan ahamiyatga ega."
  },
  {
    "q": "Ishning asosiy o‘lchov birligi Joul (J) ga berilgan to‘g‘ri ta’rifni ko‘rsating?",
    "options": [
      "1 J — 1 sekund davomida 1 joul ish bajaradigan mashinaning quvvati.",
      "1 J — 1 m/s tezlik bilan harakat qiluvchi moddiy nuqtaning 1 s dagi yo‘li.",
      "1 J — 1 N kuch ta’sirida jismni 1 m masofaga ko‘chirishda bajarilgan ish.",
      "1 J — tezlanish bilan harakat qilayotgan moddiy nuqtaning tezligi."
    ],
    "a": "1 J — 1 N kuch ta’sirida jismni 1 m masofaga ko‘chirishda bajarilgan ish.",
    "hint": "💡 1 Joul juda oddiy: 1 Nyuton kuch bilan jismni 1 metrga sursangiz, aynan 1 Joul energiya sarflagan bo'lasiz."
  },
  {
    "q": "Chiziqli va burchak tezliklar orasidagi bog‘lanish formulasini ko‘rsating?",
    "options": [
      "v = ω + r",
      "v = ω·r",
      "v = ω − r",
      "v = ω / r"
    ],
    "a": "v = ω·r",
    "hint": "💡 Tasavvur qiling, charxpalak aylanmoqda. Markazga yaqin turgan nuqta va chekkadagi nuqta bir xil vaqtda aylanib chiqadi (ω bir xil), lekin chekkadagi nuqta ko'proq yo'l bosadi (v kattaroq). Chunki uning radiusi (r) kattaroq."
  },
  {
    "q": "Jismning erkin tushish tezlanishi Yer tortish maydonining shu jism joylashgan nuqtasidagi ............dir.",
    "options": [
      "tezligi",
      "kuchlanganligi",
      "kuchi",
      "ko‘chishi"
    ],
    "a": "kuchlanganligi",
    "hint": "💡 Gravitatsion maydon kuchlanganligi (g) — bu maydonning jismga qanchalik kuchli ta'sir qilishini ko'rsatadi. Yer yuzida bu qiymat taxminan 9.8 m/s² ga teng."
  },
  {
    "q": "Normal tezlanish formulasini ko‘rsating?",
    "options": [
      "aₙ = v / t",
      "aₙ = v·t",
      "aₙ = v² / r",
      "aₙ = v² / t"
    ],
    "a": "aₙ = v² / r",
    "hint": "💡 Normal tezlanish har doim aylana markaziga yo'nalgan bo'ladi. U tezlikning qiymatini emas, balki yo'nalishini o'zgartirish uchun mas'uldir."
  },
  {
    "q": "Jismning og‘irlik kuchi Yerning tortish maydonining mazkur nuqtasi uchun ............ kattalikdir.",
    "options": [
      "kamayuvchi",
      "o‘zgarmas",
      "o‘zgaruvchan",
      "ortuvchi"
    ],
    "a": "o‘zgaruvchan",
    "hint": "💡 Og'irlik kuchi Yerning qayerida ekanligingizga bog'liq. Masalan, Yer qutblarida og'irlik kuchi ekvatorga qaraganda biroz kuchliroq, chunki qutblar markazga yaqinroq."
  },
  {
    "q": "Tangensial tezlanish formulasini ko‘rsating?",
    "options": [
      "aₜ = v² / r",
      "aₜ = ε·r",
      "aₜ = v + t",
      "aₜ = v + a / t"
    ],
    "a": "aₜ = ε·r",
    "hint": "💡 Tangensial tezlanish aylanma harakat qilayotgan jismning tezligi (v) ortayotganini yoki kamayayotganini ko'rsatadi. U trayektoriyaga urinma yo'nalishda bo'ladi."
  },
  {
    "q": "Jismning ............ deganda jism tomonidan o‘zi osilib turgan ipga yoki bosib turgan tayanchga ta’sir etadigan kuch tushuniladi.",
    "options": [
      "tezligi",
      "og‘irligi",
      "vazni",
      "yengilmasligi"
    ],
    "a": "vazni",
    "hint": "💡 Muhim farq: Og'irlik kuchi Yerning jismni tortishidir, VAZN esa jismning yerga (tayanchni) bosish kuchi. Shuning uchun lift tepaga keskin harakatlansa, vazningiz ortib ketganini sezasiz."
  },
  {
    "q": "Kuch moment formulasini ko‘rsating?",
    "options": [
      "M = F / l",
      "M = F − l",
      "M = F·l",
      "M = F + l"
    ],
    "a": "M = F·l",
    "hint": "💡 Kuch momenti — bu kuchning jismni aylantirish qobiliyatidir. Eshikni tutqichidan (markazdan uzoqroq, ya'ni l katta) itarish osonroq, chunki moment kattaroq bo'ladi."
  },
  {
    "q": "O‘ta yuklanish deb nimaga aytiladi?",
    "options": [
      "Vazn og‘irlik kuchiga tenglashib qolgan holatlarga aytiladi",
      "Vazn og‘irlik kuchidan kamayib ketgan holatlarga aytiladi",
      "Vazn og‘irlik kuchidan ortib ketgan holatlarga aytiladi",
      "Vazn og‘irlik kuchidan juda ko‘p marta kamayib ketgan holatlarga aytiladi"
    ],
    "a": "Vazn og‘irlik kuchidan ortib ketgan holatlarga aytiladi",
    "hint": "💡 Raketa uchayotgan vaqtda kosmonavtlarning vazni ularning og'irlik kuchidan bir necha barobar ortib ketadi. Bu holat o'ta yuklanish (overload) deb ataladi."
  },
  {
    "q": "Kuch momentining “SI” dagi o‘lchov birligini ko‘rsating?",
    "options": [
      "J/m",
      "N/m",
      "N·m",
      "J·m"
    ],
    "a": "N·m",
    "hint": "💡 Kuch (Nyuton - N) va kuch yelkasi (metr - m) ko'paytmasidan Nyuton-metr (N·m) hosil bo'ladi."
  },
  {
    "q": "Potensial energiya deb nimaga aytiladi?",
    "options": [
      "Jismlarning ish bajarish qobiliyatiga bog‘liq bo‘lgan energiya",
      "Jismlarning harakat tezligiga bog‘liq bo‘lgan energiya",
      "Jismlarning bir-biriga nisbatan joylashishiga bog‘liq bo‘lgan energiya",
      "Jismlarning joylashuvi va harakatiga bog‘liq bo‘lgan energiya"
    ],
    "a": "Jismlarning bir-biriga nisbatan joylashishiga bog‘liq bo‘lgan energiya",
    "hint": "💡 Potensial energiya — bu yashirin energiya. Masalan, balandda turgan toshni qo'yib yuborsangiz, u joylashgan balandligi hisobiga ish bajaradi. Eₚ = mgh."
  },
  {
    "q": "Maydon ixtiyoriy nuqtasining potensiali deb nimaga aytiladi?",
    "options": [
      "Mazkur nuqtadagi maksimal energiya",
      "Mazkur nuqtadagi kuchlanganlik",
      "Mazkur nuqtaga kiritilgan birlik massali sinov jismning potensial energiyasiga teng kattalik",
      "Mazkur nuqtaga kiritilgan birlik massali jismning kinetik energiyasi"
    ],
    "a": "Mazkur nuqtaga kiritilgan birlik massali sinov jismning potensial energiyasiga teng kattalik",
    "hint": "💡 Potensial — bu maydonning energetik xarakteristikasi. U maydonning ma'lum bir nuqtasida turgan jism qancha energiyaga ega bo'lishini ko'rsatadi. Gravitatsion maydon uchun bu: φ = Eₚ / m."
  },
  {
    "q": "Energiyaning saqlanish qonunining eng umumiy ta’rifini ko‘rsating?",
    "options": [
      "Energiya faqat ish bajaradi",
      "Energiya yo‘qolmaydi va yo‘qdan paydo bo‘lmaydi, faqat bir ko‘rinishdan boshqasiga aylanadi",
      "Energiya doimo issiqlikka aylanadi",
      "Energiya har doim yo‘qoladi"
    ],
    "a": "Energiya yo‘qolmaydi va yo‘qdan paydo bo‘lmaydi, faqat bir ko‘rinishdan boshqasiga aylanadi",
    "hint": "💡 Bu tabiatning eng fundamental qonuni. Masalan, batareyadagi kimyoviy energiya elektr energiyasiga, u esa chiroqda yorug'lik va issiqlik energiyasiga aylanadi. Umumiy miqdor esa o'zgarmas qoladi."
  },
  {
    "q": "Inersiya momentining “SI” dagi o‘lchov birligini ko‘rsating?",
    "options": [
      "N·m",
      "kg·m",
      "kg·m²",
      "J"
    ],
    "a": "kg·m²",
    "hint": "💡 Inersiya momenti jismning massasi (kg) va uning aylanish o'qigacha bo'lgan masofasining kvadrati (m²) ko'paytmasiga bog'liq. Shuning uchun birligi kg·m²."
  },
  {
    "q": "Fizikada urilish tushunchasiga ta’rif bering?",
    "options": [
      "Jismlarning katta fazoda uzoq vaqtli harakati",
      "Jismlarning to‘xtab qolishi",
      "Jismlarning kichik fazoda qisqa vaqtli o‘zaro ta’sirlashuvi",
      "Jismlarning bir xil tezlikda harakati"
    ],
    "a": "Jismlarning kichik fazoda qisqa vaqtli o‘zaro ta’sirlashuvi",
    "hint": "💡 Urilish — bu juda qisqa vaqt ichida sodir bo'ladigan jarayon. Masalan, futbol to'pini tepganingizda, oyoq va to'p orasidagi ta'sir soniyaning ulushlarida sodir bo'ladi, lekin juda katta kuch hosil qiladi."
  },
  {
    "q": "Qattiq jism impuls momenti formulasini ko‘rsating?",
    "options": [
      "L = J·ω²",
      "L = J·ω",
      "L = J·ω³",
      "L = J·ω⁴"
    ],
    "a": "L = J·ω",
    "hint": "💡 Impuls momenti (L) — aylanma harakat miqdori. U jismning inersiya momenti (J) va burchak tezligi (ω) ko'paytmasiga teng. Bu chiziqli harakatdagi p = m·v formulasining aylanma harakatdagi analogidir."
  },
  {
    "q": "Sharning markazidan o‘tuvchi o‘qqa nisbatan inersiya momenti formulasini ko‘rsating?",
    "options": [
      "J = m·r²",
      "J = J₀ + m·d²",
      "J = 2/5·m·r²",
      "J = 1/3·m·r²"
    ],
    "a": "J = 2/5·m·r²",
    "hint": "💡 Har xil geometrik shakllar aylanish o'qiga nisbatan turlicha inersiyaga ega. To'la shar uchun bu koeffitsient 2/5 ga teng."
  },
  {
    "q": "Absolyut noelastik urilishga yaqin bo‘lgan urilishlar qaysi?",
    "options": [
      "Po‘lat va loy jismlarining urilishi",
      "Plastilin, loy, qo‘rg‘oshin jismlarining urilishi",
      "Faqat po‘lat jismlarining urilishi",
      "Po‘lat, qo‘rg‘oshin, fil suyagi jismlarining urilishi"
    ],
    "a": "Plastilin, loy, qo‘rg‘oshin jismlarining urilishi",
    "hint": "💡 Noelastik urilishda jismlar to'qnashuvdan keyin bir-biriga yopishib qoladi yoki shaklini o'zgartiradi. Plastilin va loy bunga eng yaxshi misol — ular urilishdan keyin qaytib o'z holiga kelmaydi."
  },
  {
    "q": "Absolyut elastik urilishga yaqin bo‘lgan urilishlar qaysi?",
    "options": [
      "Plastilin va loy jismlarining urilishi",
      "Po‘lat va fil suyagi jismlarining urilishi",
      "Yumshoq jismlar urilishi",
      "Qo‘rg‘oshin jismlarining urilishi"
    ],
    "a": "Po‘lat va fil suyagi jismlarining urilishi",
    "hint": "💡 Elastik urilishda jismlar to'qnashuvdan so'ng darhol bir-biridan itariladi va deformatsiyaga uchramaydi (shakli buzilmaydi). Po'lat sharchalar yoki billiard toshlari (fil suyagi) shunday xususiyatga ega."
  },
  {
    "q": "Deformatsiyalanmaydigan jism qanday ataladi?",
    "options": [
      "absolyut yumshoq jism",
      "absolyut qora jism",
      "absolyut qattiq jism",
      "absolyut qattiq yoki yumshoq jism"
    ],
    "a": "absolyut qattiq jism",
    "hint": "💡 Absolyut qattiq jism — bu har qanday kuch ta'sirida ham o'z shaklini va o'lchamini zarracha bo'lsa ham o'zgartirmaydigan ideal jismdir."
  },
  {
    "q": "Inersiya momentining “SI” dagi o‘lchov birligini ko‘rsating?",
    "options": [
      "kg·m",
      "N·m",
      "kg·m²",
      "J"
    ],
    "a": "kg·m²",
    "hint": "💡 Eslatma: Inersiya momenti (J) jism massasining taqsimlanishini xarakterlaydi. Formulasi: J = Σ mᵢrᵢ². Shuning uchun birligi kg va metr kvadrat ko'paytmasidir."
  },
  {
    "q": "Fizikada urilish tushunchasiga ta’rif bering?",
    "options": [
      "Jismlarning katta fazoda uzoq vaqtli harakati",
      "Jismlarning kichik fazoda qisqa vaqtli o‘zaro ta’sirlashuvi",
      "Jismlarning bir xil tezlikda harakati",
      "Jismlarning to‘xtab qolishi"
    ],
    "a": "Jismlarning kichik fazoda qisqa vaqtli o‘zaro ta’sirlashuvi",
    "hint": "💡 Urilish — bu bir zumda sodir bo'ladigan hodisa. Masalan, billiard sharlari to'qnashganda ular juda kichik masofada va juda qisqa soniyalar ichida bir-biriga kuch bilan ta'sir qiladi."
  },
  {
    "q": "Qattiq jism impuls momenti formulasini ko‘rsating?",
    "options": [
      "L = J·ω²",
      "L = J·ω³",
      "L = J·ω",
      "L = J·ω⁴"
    ],
    "a": "L = J·ω",
    "hint": "💡 Aylana harakatdagi impuls momenti (L), chiziqli harakatdagi impulsga (p=mv) o'xshaydi. Bunda massa o'rnida inersiya momenti (J), tezlik o'rnida esa burchak tezligi (ω) keladi."
  },
  {
    "q": "Sharning markazidan o‘tuvchi o‘qqa nisbatan inersiya momenti formulasini ko‘rsating?",
    "options": [
      "J = m·r²",
      "J = 1/3·m·r²",
      "J = J₀ + m·d²",
      "J = 2/5·m·r²"
    ],
    "a": "J = 2/5·m·r²",
    "hint": "💡 Shar aylanayotganda uning massasi markazdan qanchalik uzoqda taqsimlanganiga qarab formula o'zgaradi. To'la shar uchun bu koeffitsient aynan 2/5 ni tashkil etadi."
  },
  {
    "q": "Absolyut noelastik urilishga yaqin bo‘lgan urilishlar qaysi?",
    "options": [
      "Po‘lat va loy jismlarining urilishi",
      "Plastilin, loy, qo‘rg‘oshin jismlarining urilishi",
      "Faqat po‘lat jismlarining urilishi",
      "Po‘lat, qo‘rg‘oshin, fil suyagi jismlarining urilishi"
    ],
    "a": "Plastilin, loy, qo‘rg‘oshin jismlarining urilishi",
    "hint": "💡 Noelastik urilishda jismlar to'qnashgandan so'ng ajralmaydi, balki birga harakatlanadi yoki butunlay deformatsiyaga uchraydi. Plastilinni devorga urganingizda u qaytib tushmasdan yopishib qolishi bunga misol."
  },
  {
    "q": "Absolyut elastik urilishga yaqin bo‘lgan urilishlar qaysi?",
    "options": [
      "Plastilin va loy jismlarining urilishi",
      "Qo‘rg‘oshin jismlarining urilishi",
      "Po‘lat va fil suyagi jismlarining urilishi",
      "Yumshoq jismlar urilishi"
    ],
    "a": "Po‘lat va fil suyagi jismlarining urilishi",
    "hint": "💡 Elastik urilishda energiya saqlanadi va jismslar to'qnashuvdan so'ng o'z shaklini tiklab, bir-biridan itariladi. Po'lat sharchalarning urilishi shunday jarayonga juda yaqin."
  },
  {
    "q": "Deformatsiyalanmaydigan jism qanday ataladi?",
    "options": [
      "absolyut yumshoq jism",
      "absolyut qattiq jism",
      "absolyut qora jism",
      "absolyut qattiq yoki yumshoq jism"
    ],
    "a": "absolyut qattiq jism",
    "hint": "💡 Haqiqiy hayotda barcha jismlar biroz bo'lsa-da deformatsiyalanadi, lekin mexanika masalalarida shakli o'zgarmaydigan jismlarni biz 'absolyut qattiq' deb soddalashtirib olamiz."
  },
  {
    "q": "Jismning inersiya momenti shu jismning aylana harakatga nisbatan ........ ifodalaydigan kattalikdir.",
    "options": [
      "tezligini",
      "massasini",
      "inersiya momentini",
      "inersiyasini"
    ],
    "a": "inersiyasini",
    "hint": "💡 Inersiya — bu jismning o'z holatini saqlashga intilishi. Inersiya momenti qanchalik katta bo'lsa, jismni aylantirish yoki aylanayotgan jismni to'xtatish shunchalik qiyin bo'ladi."
  },
  {
    "q": "Mexanika necha qismdan iborat?",
    "options": [
      "2",
      "5",
      "3",
      "4"
    ],
    "a": "3",
    "hint": "💡 Klassik mexanika asosan 3 ta katta bo'limdan tashkil topgan: Kinematika (harakat tavsifi), Dinamika (harakat sabablari) va Statika (muvozanat)."
  },
  {
    "q": "36 km/soat ni m/s ga aylantiring.",
    "options": [
      "15",
      "20",
      "10",
      "30"
    ],
    "a": "10",
    "hint": "💡 Km/soat ni m/s ga o'tkazish uchun qiymatni 3.6 ga bo'lish kerak. (36 / 3.6 = 10). Chunki 1 km = 1000m, 1 soat = 3600s."
  },
  {
    "q": "Trayektoriya nima?",
    "options": [
      "Jismning bosib o‘tgan masofasi",
      "Jismning fazoda qoldirgan izi",
      "Boshlang‘ich va oxirgi vaziyatni tutashtiruvchi chiziq",
      "Jism tezligining o‘zgarishi"
    ],
    "a": "Jismning fazoda qoldirgan izi",
    "hint": "💡 Tasavvur qiling, qorda yura turib orqangizda qolgan izlar — bu sizning harakat trayektoriyangizdir. Bu jism harakatlangan yo'nalishni ko'rsatuvchi xayoliy yoki real chiziq."
  },
  {
    "q": "Statika nimani o‘rganadi?",
    "options": [
      "Faqat tekis harakatni",
      "Muvozanat shartlarini o‘rganadigan mexanikaning bir bo‘limini",
      "Harakat turlarini",
      "Harakat sabablarini"
    ],
    "a": "Muvozanat shartlarini o‘rganadigan mexanikaning bir bo‘limini",
    "hint": "💡 Statika — jism qachon qimirlamay turishi (muvozanatda bo'lishi) kerakligini o'rgatadi. Masalan, bino yoki ko'priklar qurishda statika qonunlari asosiy o'rin tutadi."
  },
  {
    "q": "Nexia avtomobili to‘g‘ri chiziqli tekis harakatlanib 120 km masofani 2 soatda bosib o‘tdi. Tezligini toping (m/s).",
    "options": [
      "16,7",
      "40",
      "60",
      "30"
    ],
    "a": "16,7",
    "hint": "💡 Dastlab km/soat dagi tezlikni topamiz: 120 / 2 = 60 km/soat. Uni m/s ga o'tkazish uchun 3.6 ga bo'lamiz: 60 / 3.6 ≈ 16.7 m/s."
  },
  {
    "q": "Burchak tezlik ifodasini toping.",
    "options": [
      "ω = dφ / dt",
      "v = ds / dt",
      "a = dv / dt",
      "φ = ω·t"
    ],
    "a": "ω = dφ / dt",
    "hint": "💡 Burchak tezlik (ω) — vaqt birligi ichida jismning necha gradusga yoki radiana burilganini ko'rsatadi. Bu oddiy tezlikning aylana harakatdagi analogidir."
  },
  {
    "q": "Bir marta to‘liq aylanish uchun sarflangan vaqt nima deyiladi?",
    "options": [
      "burchakli tezlik",
      "aylanish chastotasi",
      "aylanish davri",
      "burchakli tezlanish"
    ],
    "a": "aylanish davri",
    "hint": "💡 Davr — bu bitta to'liq aylanishga ketgan vaqt. Masalan, sekund milining aylanish davri 60 sekundga teng."
  },
  {
    "q": "Chastotaning birligi qanday?",
    "options": [
      "sekund",
      "rad/s",
      "Amper",
      "Hz"
    ],
    "a": "Hz",
    "hint": "💡 Chastota — bir sekundda jism necha marta aylanishini ko'rsatadi. U Gerts (Hz) birligida o'lchanadi. 1 Hz = 1/sekund."
  },
  {
    "q": "Kuchning birligi qanday?",
    "options": [
      "Joul",
      "Watt",
      "Nyuton",
      "Amper"
    ],
    "a": "Nyuton",
    "hint": "💡 Fizikada kuch buyuk olim Isaak Nyuton sharafiga Nyuton (N) birligida o'lchanadi. 1 N — 1 kg jismga 1 m/s² tezlanish beradigan kuchdir."
  },
  {
    "q": "Stol ustida turgan 8 kg massali jismning stolga ta’sir etuvchi og‘irlik kuchini aniqlang (g≈10 m/s²).",
    "options": [
      "60",
      "40",
      "80",
      "70"
    ],
    "a": "80",
    "hint": "💡 Og'irlik kuchi formulasi: P = m * g. Berilgan: 8 kg * 10 m/s² = 80 Nyuton."
  },
  {
    "q": "Jismga tashqi kuch ta’sir etilmaguncha u o‘zining tinch yoki to‘g‘ri chiziqli tekis harakatini saqlaydi. Bu Nyutonning qaysi qonuni?",
    "options": [
      "2-qonuni",
      "3-qonuni",
      "4-qonuni",
      "1-qonuni"
    ],
    "a": "1-qonuni",
    "hint": "💡 Bu inersiya qonunidir. Jism o'z holatini saqlashga intiladi. Masalan, avtobus to'satdan to'xtasa, yo'lovchilarning oldinga ketib qolishi aynan shu qonun natijasidir."
  },
  {
    "q": "Nyutonning 3-qonuni qanday ataladi?",
    "options": [
      "inersiya qonuni",
      "dalton qonuni",
      "aks ta’sir qonuni",
      "mustaqillik qonuni"
    ],
    "a": "aks ta’sir qonuni",
    "hint": "💡 'Har bir ta'sirga teng va qarama-qarshi aks ta'sir mavjud'. Siz devorni urganingizda qo'lingiz og'rishiga sabab — devor ham sizni aynan o'sha kuch bilan urganidir."
  },
  {
    "q": "Bir-biriga tegib turgan jismlarning bir-biriga nisbatan sirpanishiga to‘sqinlik qiluvchi kuch qanday nomlanadi?",
    "options": [
      "og‘irlik kuchi",
      "elastiklik kuchi",
      "taranglik kuchi",
      "ishqalanish kuchi"
    ],
    "a": "ishqalanish kuchi",
    "hint": "💡 Ishqalanish kuchi har doim harakatga qarshi yo'naladi. Agar u bo'lmaganida, biz muz ustida turgandek sirpanib ketar edik va hech qachon to'xtay olmas edik."
  },
  {
    "q": "Burilish burchagidan vaqt bo‘yicha olingan birinchi tartibli hosila qaysi kattalikka teng?",
    "options": [
      "normal tezlanish",
      "burchakli tezlik",
      "tangensial tezlanish",
      "burchakli tezlanish"
    ],
    "a": "burchakli tezlik",
    "hint": "💡 Matematikada hosila o'zgarish tezligini bildiradi. Burchak (φ) qanchalik tez o'zgarsa, burchakli tezlik (ω) shunchalik yuqori bo'ladi. Formulasi: ω = dφ / dt."
  },
  {
    "q": "Inersiya momenti qaysi harf bilan belgilanadi?",
    "options": [
      "R",
      "U",
      "B",
      "I"
    ],
    "a": "I",
    "hint": "💡 Inersiya momenti (Inertia moment) odatda bosh harf 'I' yoki ba'zi darsliklarda 'J' harfi bilan belgilanadi. U jismning aylanishga bo'lgan qarshiligini ifodalaydi."
  },
  {
    "q": "O‘zaro ta’sirlashuvchi jismlarning bir-biriga nisbatan joylashuvi tufayli ega bo‘lgan energiyasi … deb ataladi.",
    "options": [
      "issiqlik energiya",
      "kinetik energiya",
      "potensial energiya",
      "ichki energiya"
    ],
    "a": "potensial energiya",
    "hint": "💡 Potensial energiya — bu vaziyat energiyasidir. Masalan, pishirilgan prujina yoki balandlikka ko'tarilgan tosh o'zining joylashuvi tufayli ish bajarish imkoniyatiga (energiyaga) ega bo'ladi."
  },
  {
    "q": "Massasi 60 kg bo‘lgan quruvchi 45 m balandlikda ishlamoqda. Uning potensial energiyasini hisoblang (g≈10 m/s²).",
    "options": [
      "25 kJ",
      "60 kJ",
      "27 kJ",
      "270 kJ"
    ],
    "a": "27 kJ",
    "hint": "💡 Formula: Eₚ = m·g·h. Hisoblaymiz: 60 * 10 * 45 = 27,000 Joul. Uni kilojoulga o'tkazish uchun 1000 ga bo'lamiz: 27 kJ."
  },
  {
    "q": "Energiya ta’rifini toping.",
    "options": [
      "Jismning harakati davomida bosib o‘tgan masofasi",
      "Jismning ish bajarish qobiliyati",
      "Jismning tezligi tufayli hosil bo‘lgan kattalik",
      "Jismning vaziyati tufayli hosil bo‘lgan kattalik"
    ],
    "a": "Jismning ish bajarish qobiliyati",
    "hint": "💡 Energiya — bu jismning zaxirasidagi 'kuch' kabi. Jism qancha ko'p energiyaga ega bo'lsa, u shuncha ko'p mexanik ish bajara oladi."
  },
  {
    "q": "Ishning birligi qanday?",
    "options": [
      "Watt",
      "Candela",
      "Kulon",
      "Joul"
    ],
    "a": "Joul",
    "hint": "💡 Mexanik ish va energiya bir xil birlikda — Joul (J) da o'lchanadi. Bu 1 Nyuton kuch bilan jismni 1 metrga surishda sarflangan energiyadir."
  },
  {
    "q": "Jismning tezligi tufayli hosil bo‘lgan energiya qanday nomlanadi?",
    "options": [
      "potensial energiya",
      "ichki energiya",
      "mexanik energiya",
      "kinetik energiya"
    ],
    "a": "kinetik energiya",
    "hint": "💡 'Kinetikos' yunoncha 'harakatlantiruvchi' degan ma'noni beradi. Harakatlanayotgan har qanday jism kinetik energiyaga ega. Formulasi: Eₖ = mv²/2."
  },
  {
    "q": "Sinus yoki kosinus qonuniga nisbatan tebranish qanday nomlanadi?",
    "options": [
      "Erkin tebranish",
      "Elektromagnit tebranish",
      "Majburiy tebranish",
      "Garmonik tebranish"
    ],
    "a": "Garmonik tebranish",
    "hint": "💡 Agar tebranish grafigi chiroyli to'lqin (sinusoida) shaklida bo'lsa, bu garmonik tebranishdir. U tabiatda eng ko'p uchraydigan ideal tebranish turidir."
  },
  {
    "q": "Muvozanat vaziyatidan eng chetki vaziyatgacha bo‘lgan masofa nima deyiladi?",
    "options": [
      "to‘lqin uzunligi",
      "yo‘l",
      "amplituda",
      "masofa"
    ],
    "a": "amplituda",
    "hint": "💡 Amplituda — bu tebranishning qulochi (kattaligi). Masalan, belanchakni qanchalik balandga uchirsangiz, uning amplitudasi shunchalik katta bo'ladi."
  },
  {
    "q": "2π s ichidagi tebranish soniga … deb ataladi.",
    "options": [
      "tebranish davri",
      "maksimal tezlik",
      "tebranish chastotasi",
      "siklik chastota"
    ],
    "a": "siklik chastota",
    "hint": "💡 Oddiy chastota 1 sekunddagi tebranishlar soni bo'lsa, siklik chastota (ω) 2π sekunddagi sonidir. Bu ko'pincha aylanma va tebranma harakatlarni bog'lash uchun ishlatiladi."
  },
  {
    "q": "Prujinali mayatnikning tebranish davri, chastotasi yoki siklik chastota nimalarga bog‘liq?",
    "options": [
      "faqat prujinaning materialiga",
      "erkin tushish tezlanishiga",
      "jism massasiga va prujinaning bikrligiga",
      "prujinaning uzunligiga"
    ],
    "a": "jism massasiga va prujinaning bikrligiga",
    "hint": "💡 Prujinali mayatnikda yuk qancha og'ir bo'lsa (m), u shuncha sekin tebranadi. Prujina qancha qattiq (bikr - k) bo'lsa, tebranish shuncha tezlashadi. T = 2π√(m/k)."
  },
  {
    "q": "Bir-biriga nisbatan tekis va to‘g‘ri chiziqli harakat qilayotgan sanoq tizimlarida Nyuton qonunlari bajarilsa, bunday sanoq tizimlari … deb ataladi.",
    "options": [
      "sanoq sistema",
      "noinersial sanoq tizim",
      "inersial sanoq tizimlari",
      "sanoq jism"
    ],
    "a": "inersial sanoq tizimlari",
    "hint": "💡 Inersial tizim — bu tinch turgan yoki bir tekis harakatlanayotgan tizimdir. Ularda inersiya qonuni (Nyutonning 1-qonuni) mukammal ishlaydi."
  },
  {
    "q": "Relativistik massani topish formulasini ko‘rsating.",
    "options": [
      "m = F / a",
      "m = m₀ / √(1 − v² / c²)",
      "m = F / g",
      "m = v · p"
    ],
    "a": "m = m₀ / √(1 − v² / c²)",
    "hint": "💡 Eynshteynning nisbiylik nazariyasiga ko'ra, jism tezligi yorug'lik tezligiga (c) yaqinlashsa, uning massasi orta boshlaydi. Bu formula o'sha massaning qanchalik ortishini hisoblaydi."
  },
  {
    "q": "√(1 − v² / c²) formula nimani ifodalaydi?",
    "options": [
      "Relativistik tezlik",
      "Relativistik vaqt",
      "Relativistik massa",
      "Relativistik energiya"
    ],
    "a": "Relativistik vaqt",
    "hint": "💡 Bu formula vaqtning sekinlashishini (Time Dilation) hisoblashda ishlatiladi. Yorug'lik tezligiga (c) yaqin tezlikda (v) harakatlanayotgan jism uchun vaqt o'tishi sekinlashadi."
  },
  {
    "q": "Gazni to‘g‘ri davom ettiring: “Issiqlik almashmaydigan jarayon … ”",
    "options": [
      "izobarik",
      "izoxorik",
      "izotermik",
      "adiabatik"
    ],
    "a": "adiabatik",
    "hint": "💡 Adiabatik jarayonda tizim o'zini tashqi muhitdan issiqlik jihatidan 'izolatsiya' qiladi. Masalan, termos ichidagi jarayonlar yoki porshenning juda tez siqilishi adiabatikka yaqin bo'ladi."
  },
  {
    "q": "Berilgan tenglamalar orasidan izoxorik jarayon tenglamasini toping.",
    "options": [
      "P/T = const",
      "V/T = const",
      "P·V = const",
      "P·T = const"
    ],
    "a": "P/T = const",
    "hint": "💡 'Izo' - bir xil, 'Xora' - hajm demakdir. Hajm (V) o'zgarmas bo'lsa, bosim (P) va temperatura (T) to'g'ri proporsional bo'ladi (Sharl qonuni)."
  },
  {
    "q": "Izoxorik jarayon uchun termodinamikaning birinchi qonuni formulasini ko‘rsating.",
    "options": [
      "Q = A",
      "Q = A + ΔU",
      "Q = ΔU",
      "P/T = const"
    ],
    "a": "Q = ΔU",
    "hint": "💡 Izoxorik jarayonda hajm o'zgarmaydi, demak gaz ish bajarmaydi (A=0). Shuning uchun berilgan barcha issiqlik (Q) faqat gazning ichki energiyasini (ΔU) oshirishga sarflanadi."
  },
  {
    "q": "Quyidagi kattaliklardan Avogadro sonini ko‘rsating.",
    "options": [
      "0,023·10²³ 1/mol",
      "6,023·10²³ 1/mol",
      "6,023·10²⁰ 1/mol",
      "23·10²³ 1/mol"
    ],
    "a": "6,023·10²³ 1/mol",
    "hint": "💡 Avogadro soni (Nₐ) — 1 mol moddadagi zarralar (atom yoki molekulalar) sonini bildiradi. Bu juda ulkan son: 6 dan keyin 23 ta nol bor deb tasavvur qiling."
  },
  {
    "q": "Termodinamikaning birinchi qonuni nimani ifodalaydi?",
    "options": [
      "Nyutonning birinchi qonunini",
      "Inersiya qonunini",
      "Aks ta’sir qonunini",
      "Energiya saqlanish qonunini"
    ],
    "a": "Energiya saqlanish qonunini",
    "hint": "💡 Bu qonun issiqlik jarayonlari uchun energiya saqlanishini bildiradi: tizimga berilgan issiqlik uning ichki energiyasini o'zgartirishga va ish bajarishga sarflanadi."
  },
  {
    "q": "Moddaning … deb, 1 kg moddaning 1°C ga isitishga sarf bo‘lgan issiqlik miqdoriga teng fizik kattalik ataladi.",
    "options": [
      "zichligi",
      "modda miqdori",
      "solishtirma issiqlik sig‘imi",
      "hajmi"
    ],
    "a": "solishtirma issiqlik sig‘imi",
    "hint": "💡 Har bir moddaning 'issiqni o'ziga olish' qobiliyati har xil. Masalan, suvning issiqlik sig'imi qumnikidan ancha katta, shuning uchun dengiz suvi qumga qaraganda kechroq isib, kechroq soviydi."
  },
  {
    "q": "Modda temperaturasi o‘zgarmas bo‘lgan jarayon qanday nomlanadi?",
    "options": [
      "adiabatik",
      "izoxorik",
      "izobarik",
      "izotermik"
    ],
    "a": "izotermik",
    "hint": "💡 'Term' - issiqlik/temperatura demakdir. Izotermik jarayonda temperatura o'zgarmaydi (T=const). Bunda Boyl-Mariott qonuni (P·V = const) amal qiladi."
  },
  {
    "q": "Adiabatik jarayon qanday jarayon?",
    "options": [
      "hajmi o‘zgarmas bo‘lgan jarayon",
      "bosimi o‘zgarmas bo‘lgan jarayon",
      "temperaturasi o‘zgarmas bo‘lgan jarayon",
      "tashqi muhit bilan issiqlik almashmaydigan jarayon"
    ],
    "a": "tashqi muhit bilan issiqlik almashmaydigan jarayon",
    "hint": "💡 Bu jarayon juda tez sodir bo'ladi, natijada gaz atrof-muhitdan issiqlik olishga yoki berishga ulgurmaydi. Velosiped nasosida havoni tez siqqanda uning isib ketishi bunga misol."
  },
  {
    "q": "Bu grafikda izobarik jarayonlarning grafigini aniqlang.",
    "image": "image.png",
    "options": [
      "3–2, 4–1",
      "2–1, 4–1",
      "3–4, 2–1",
      "3–2, 3–4"
    ],
    "a": "3–4, 2–1",
    "hint": "💡 'Bar' - bosim demakdir. Izobarik jarayonda bosim (P) o'zgarmas qoladi. Grafikda bu chiziqlar bosim o'qi (P) ga perpendikulyar yoki V-T koordinatasida koordinata boshidan chiquvchi to'g'ri chiziq bo'ladi."
  },
  {
    "q": "Zaryadlarning o‘zaro ta’sir kuchi qanday nomlanadi?",
    "options": [
      "Elastiklik kuchi",
      "Ishqalanish kuchi",
      "Og‘irlik kuchi",
      "Kulon kuchi"
    ],
    "a": "Kulon kuchi",
    "hint": "💡 Ikki zaryadlangan jism o'rtasidagi tortishish yoki itarish kuchi buyuk olim Sharl Kulon sharafiga Kulon kuchi deb ataladi."
  },
  {
    "q": "Kulon kuchiga ta’rif bering.",
    "options": [
      "Vaqt birligi ichida bosib o‘tilgan yo‘l",
      "Zaryadlarning o‘zaro ta’sir kuchi zaryadlar ko‘paytmasiga to‘g‘ri, masofa kvadratiga teskari proportsional",
      "Jismning harakati davomida olgan tezlanishi",
      "Vaqt birligi ichida tezlikning o‘zgarishi"
    ],
    "a": "Zaryadlarning o‘zaro ta’sir kuchi zaryadlar ko‘paytmasiga to‘g‘ri, masofa kvadratiga teskari proportsional",
    "hint": "💡 Formula: F = k·q₁·q₂ / r². Bu shuni bildiradiki, zaryadlar kattalashsa kuch ortadi, lekin ular bir-biridan uzoqlashsa kuch juda tez kamayadi."
  },
  {
    "q": "Zaryad miqdorining birligi qanday?",
    "options": [
      "V",
      "N",
      "C",
      "F"
    ],
    "a": "C",
    "hint": "💡 Elektr zaryadi Kulon (C) birligida o'lchanadi. Masalan, bitta elektronning zaryadi juda kichik bo'lib, -1.6·10⁻¹⁹ C ga teng."
  },
  {
    "q": "Zaryadlar o‘zaro qanday ta’sirlashadi?",
    "options": [
      "Zaryadlar faqat tortishadi",
      "Zaryadlar itarishmaydi ham tortishmaydi ham",
      "Qarama-qarshi zaryadlar tortishadi, bir xil zaryadlar itarishadi",
      "Faqat bir xil zaryadlar tortishadi"
    ],
    "a": "Qarama-qarshi zaryadlar tortishadi, bir xil zaryadlar itarishadi",
    "hint": "💡 Tabiat qoidasi: 'Plyus' va 'minus' bir-birini yaxshi ko'radi (tortishadi), bir xil ishoralilar esa bir-birini yomon ko'radi (itarishadi)."
  },
  ,
  {
    "q": "Elektr maydon kuchlanganligi qanday kattalik?",
    "options": [
      "Oddiy kattalik",
      "Skalyar kattalik",
      "Murakkab kattalik",
      "Vektor kattalik"
    ],
    "a": "Vektor kattalik",
    "hint": "💡 Kuchlanganlik (E) nafaqat qiymatga, balki yo'nalishga ham ega. U har doim musbat zaryaddan chiquvchi va manfiy zaryadga kiruvchi yo'nalishda bo'ladi."
  },
  {
    "q": "Elektr zaryadining bajargan ishini ifodasini aniqlang.",
    "options": [
      "A = U·I·t",
      "A = k·q₁·q₂ / r",
      "A = F·l·cosα",
      "A = W₁ − W₂"
    ],
    "a": "A = k·q₁·q₂ / r",
    "hint": "💡 Zaryadni bir nuqtadan ikkinchi nuqtaga ko'chirishda elektr maydon kuchlari ish bajaradi. Bu ish zaryadlarning o'zaro ta'sir energiyasiga bog'liq."
  },
  {
    "q": "Ishning birligi to‘g‘ri ko‘rsatilgan javobni aniqlang.",
    "options": [
      "A",
      "s",
      "W",
      "J"
    ],
    "a": "J",
    "hint": "💡 Mexanikada bo'lgani kabi, elektrda ham barcha turdagi ish va energiya Joul (J) birligida o'lchanadi."
  },
  {
    "q": "Zaryad miqdori 80 C ga teng va potensiallar farqi 2 V bo‘lsa, bajarilgan ishni aniqlang.",
    "options": [
      "20 J",
      "160 J",
      "320 J",
      "40 J"
    ],
    "a": "160 J",
    "hint": "💡 Formula: A = q · U. Hisoblaymiz: 80 C * 2 V = 160 Joul."
  },
  {
    "q": "Ish qanday kattalik?",
    "options": [
      "Vektor kattalik",
      "Oddiy kattalik",
      "Skalyar kattalik",
      "Murakkab kattalik"
    ],
    "a": "Skalyar kattalik",
    "hint": "💡 Ishning yo'nalishi bo'lmaydi, u faqat son qiymati (miqdori) bilan xarakterlanadi. Shuning uchun u skalyar kattalikdir."
  },
  {
    "q": "Kondensator sig‘imining birligi qanday?",
    "options": [
      "V",
      "A",
      "J",
      "F"
    ],
    "a": "F",
    "hint": "💡 Elektr sig'imi Farada (F) birligida o'lchanadi. 1 Farada — bu juda katta sig'im, shuning uchun amaliyotda mikrofarada (μF) yoki pikofarada (pF) ko'p ishlatiladi."
  },
  {
    "q": "Yassi kondensatorning sig‘imi ifodasini ko‘rsating.",
    "options": [
      "C = q / φ",
      "C = 4π ε₀ R",
      "C = εε₀ S / d",
      "C = 4π ε₀ rR / (R − r)"
    ],
    "a": "C = εε₀ S / d",
    "hint": "💡 Yassi kondensatorning sig'imi uning qoplamalarining yuzasiga (S) to'g'ri va ular orasidagi masofaga (d) teskari proporsionaldir."
  },
  ,
  {
    "q": "Biz katta sig‘imga erishish uchun kondensatorlarni qanday ulashimiz kerak?",
    "options": [
      "ketma-ket",
      "aralash",
      "birin-ketin",
      "parallel"
    ],
    "a": "parallel",
    "hint": "💡 Parallel ulanganda umumiy sig'im barcha kondensatorlar sig'imlarining yig'indisiga teng bo'ladi (C = C₁ + C₂ + ...), bu esa umumiy sig'imni oshiradi."
  },
  {
    "q": "Aralash ulash qanday ulash?",
    "options": [
      "faqat ketma-ket",
      "parallel",
      "ketma-ket va parallel ulash",
      "birin-ketin"
    ],
    "a": "ketma-ket va parallel ulash",
    "hint": "💡 Murakkab elektr zanjirlarida ba'zi qismlar bir-biriga ketma-ket, ba'zi qismlar esa parallel ulanishi mumkin. Bu aralash ulash deyiladi."
  },
  {
    "q": "Tok kuchini o‘lchovchi asbob nomi qaysi?",
    "options": [
      "Ommetr",
      "Akselerometr",
      "Ampermetr",
      "Voltmetr"
    ],
    "a": "Ampermetr",
    "hint": "💡 Tok kuchi Amperda o'lchanadi, uni o'lchovchi asbob esa Ampermetr deb ataladi. U zanjirga har doim ketma-ket ulanadi."
  },
  {
    "q": "Joul–Lens qonunining ifodasini ko‘rsating.",
    "options": [
      "I = dq / dt",
      "Q = I²Rt",
      "N = q / e",
      "j = dI / dS"
    ],
    "a": "Q = I²Rt",
    "hint": "💡 Bu qonun o'tkazgichdan tok o'tganda undan ajralib chiqadigan issiqlik miqdorini aniqlaydi. Tok kuchi (I) ikki baravar ortsa, ajraladigan issiqlik (Q) to'rt baravar ortadi."
  },
  {
    "q": "Elektr qarshiligining birligi to‘g‘ri ko‘rsatilgan javobni belgilang.",
    "options": [
      "A",
      "V",
      "W",
      "Ω"
    ],
    "a": "Ω",
    "hint": "💡 Elektr qarshiligi Om (Ω) birligida o‘lchanadi. Bu o‘tkazgichning tok o‘tishiga ko‘rsatadigan to‘sqinligidir. 1 Om — 1 Volt kuchlanishda 1 Amper tok o‘tkazuvchi qismning qarshiligi."
  },
  {
    "q": "I = ε / (R + r) formulasi nimani ifodalaydi?",
    "options": [
      "Zanjirning bir qismi uchun Om qonuni",
      "Joul–Lens qonuni",
      "Butun zanjir uchun Om qonuni",
      "Kirxgof qoidasi"
    ],
    "a": "Butun zanjir uchun Om qonuni",
    "hint": "💡 Bu formula butun zanjirdagi tok kuchi (I) manbaning elektr yurituvchi kuchi (ε) va umumiy qarshilikka (tashqi R + ichki r) bog‘liqligini ko‘rsatadi."
  },
  {
    "q": "Magnit maydonning tokli o‘tkazgichga ta’sir kuchi qanday nomlanadi?",
    "options": [
      "Ishqalanish kuchi",
      "Elastiklik kuchi",
      "Og‘irlik kuchi",
      "Amper kuchi"
    ],
    "a": "Amper kuchi",
    "hint": "💡 Amper kuchi magnit maydoni ichida turgan va o‘zidan tok o‘tkazayotgan simni itaradigan yoki tortadigan kuchdir. Formulasi: F = BIl sinα."
  },
  {
    "q": "Magnit maydon zaryadli zarrachaga ta’sir kuchi qanday nomlanadi?",
    "options": [
      "Og‘irlik kuchi",
      "Ishqalanish kuchi",
      "Lorens kuchi",
      "Elastiklik kuchi"
    ],
    "a": "Lorens kuchi",
    "hint": "💡 Lorens kuchi faqat harakatlanayotgan zaryadli zarrachalarga (elektron, proton) magnit maydoni tomonidan ko‘rsatiladigan ta’sirdir."
  },
  
  {
    "q": "Magnit induksiya oqimining birligi qanday?",
    "options": [
      "J (Joul)",
      "N (Nyuton)",
      "W (Vatt)",
      "Wb (Veber)"
    ],
    "a": "Wb (Veber)",
    "hint": "💡 Magnit oqimi Veber (Wb) birligida o‘lchanadi. 1 Veber — induksiyasi 1 Tesla bo‘lgan maydonning 1 kvadrat metr yuzadan o‘tishidir."
  },
  {
    "q": "F = Bqv sinα formulasi orqali qaysi kuch hisoblanadi?",
    "options": [
      "Og‘irlik kuchi",
      "Elastiklik kuchi",
      "Ishqalanish kuchi",
      "Lorens kuchi"
    ],
    "a": "Lorens kuchi",
    "hint": "💡 Bu formula Lorens kuchining qiymatini hisoblaydi. Bunda B — magnit induksiyasi, q — zaryad miqdori, v — zarrachaning tezligi."
  },
  {
    "q": "Magnit maydon induksiyasini magnit maydon kuchlanganligiga bog‘liqlik ifodasini toping.",
    "options": [
      "B = μ₀ μ H",
      "B = F / q",
      "B = Φ / S",
      "B = I / R"
    ],
    "a": "B = μ₀ μ H",
    "hint": "💡 Bu formula maydonning muhitga bog‘liqligini ko‘rsatadi. μ — muhitning magnit singdiruvchanligi bo‘lib, modda maydonni qanchalik kuchaytirishini bildiradi."
  },
  {
    "q": "Magnit maydon kuchlanganligini qanday harf bilan belgilaymiz?",
    "options": [
      "F",
      "I",
      "B",
      "H"
    ],
    "a": "H",
    "hint": "💡 Magnit maydon kuchlanganligi 'H' harfi bilan belgilanadi. Uni induksiya (B) bilan adashtirmang; B maydonning kuchini, H esa tashqi sharoitni xarakterlaydi."
  },
  {
    "q": "Eng katta magnitlik xususiyati to‘g‘ri ko‘rsatilgan javobni aniqlang.",
    "options": [
      "Diamagnit",
      "Paramagnit",
      "To‘g‘ri javob yo‘q",
      "Ferromagnit"
    ],
    "a": "Ferromagnit",
    "hint": "💡 Ferromagnitlar (temir, nikel, kobalt) magnit maydonini o‘n minglab marta kuchaytiradi va o‘zida magnitlikni saqlab qoladi."
  },
  {
    "q": "Matematik mayatnikning tebranish davri formulasini ko‘rsating.",
    "options": [
      "T = √(ℓ / g)",
      "T = 2π √(ℓ / g)",
      "T = 2π √(g / ℓ)",
      "T = 2π √(ℓ·g)"
    ],
    "a": "T = 2π √(ℓ / g)",
    "hint": "💡 Matematik mayatnikning davri (T) ipning uzunligiga (ℓ) va erkin tushish tezlanishiga (g) bog‘liq. Ip qancha uzun bo‘lsa, tebranish shuncha sekinlashadi."
  },
  
  {
    "q": "Elektr zaryadining bajargan ishini ifodasini aniqlang.",
    "options": [
      "A = U·I·t",
      "A = F·l",
      "A = k·q₁·q₂ / r",
      "A = m·g·h"
    ],
    "a": "A = k·q₁·q₂ / r",
    "hint": "💡 Elektr maydoni ichida zaryadlarni o‘zaro harakatlantirishda bajarilgan ish zaryadlarning miqdori va ular orasidagi masofaga bog‘liq bo‘ladi."
  },
  {
    "q": "Ishning birligi to‘g‘ri ko‘rsatilgan javobni aniqlang.",
    "options": [
      "V",
      "J",
      "W",
      "A"
    ],
    "a": "J",
    "hint": "💡 Fizikada energiya kabi ish ham Joul (J) birligida o‘lchanadi. Bu zaryadning potensial energiyasi o‘zgarishiga teng."
  },
  {
    "q": "Zaryad miqdori 80 C va potensiallar farqi 2 V bo‘lsa, bajarilgan ish qancha?",
    "options": [
      "320 J",
      "40 J",
      "160 J",
      "20 J"
    ],
    "a": "160 J",
    "hint": "💡 Formula: A = q · U. Bizda q = 80 va U = 2. Ko‘paytiramiz: 80 * 2 = 160 Joul."
  },
  {
    "q": "Ish qanday kattalik?",
    "options": [
      "Vektor kattalik",
      "Murakkab kattalik",
      "Oddiy kattalik",
      "Skalyar kattalik"
    ],
    "a": "Skalyar kattalik",
    "hint": "💡 Ishning yo‘nalishi yo‘q, u faqat son qiymati bilan ifodalanadi, shuning uchun u skalyar kattalikdir."
  },
  {
    "q": "Kondensator sig‘imining birligi qaysi?",
    "options": [
      "V",
      "F",
      "A",
      "J"
    ],
    "a": "F",
    "hint": "💡 Kondensator sig‘imi Farada (F) birligida o‘lchanadi. Bu zaryad to‘plash qobiliyatini ko‘rsatadi. 1 Farada — 1 Volt kuchlanishda 1 Kulon zaryad to‘play olish demakdir."
  },
  {
    "q": "Yassi kondensatorning sig‘imi ifodasini ko‘rsating.",
    "options": [
      "C = q / φ",
      "C = 4πϵ₀R",
      "C = ϵϵ₀S / d",
      "C = U / I"
    ],
    "a": "C = ϵϵ₀S / d",
    "hint": "💡 Yassi kondensator sig‘imi qoplamalar yuzasiga (S) to‘g‘ri, ular orasidagi masofaga (d) esa teskari proporsional. ϵ – muhitning dielektrik singdiruvchanligi."
  },
  
  {
    "q": "Katta sig‘imga erishish uchun kondensatorlar qanday ulanadi?",
    "options": [
      "Ketma-ket",
      "Aralash",
      "Birin-ketin",
      "Parallel"
    ],
    "a": "Parallel",
    "hint": "💡 Parallel ulanganda barcha kondensatorlarning sig‘imlari qo‘shiladi (C = C₁ + C₂ + ...), natijada umumiy sig‘im ortadi."
  },
  {
    "q": "Aralash ulash qanday ulash?",
    "options": [
      "Faqat ketma-ket",
      "Faqat parallel",
      "Ketma-ket va parallel",
      "Birin-ketin"
    ],
    "a": "Ketma-ket va parallel",
    "hint": "💡 Zanjirning bir qismida kondensatorlar (yoki qarshiliklar) ham parallel, ham ketma-ket ulangan bo‘lsa, bu aralash ulash hisoblanadi."
  },
  {
    "q": "Tok kuchini o‘lchovchi asbob nomi qaysi?",
    "options": [
      "Voltmetr",
      "Ampermetr",
      "Ommetr",
      "Akselerometr"
    ],
    "a": "Ampermetr",
    "hint": "💡 Tok kuchi 'Amper' birligida o‘lchanadi, shuning uchun asbob nomi ham 'Ampermetr' deb ataladi. U zanjirga har doim ketma-ket ulanadi."
  },
  {
    "q": "Joul–Lens qonuni ifodasini ko‘rsating.",
    "options": [
      "I = dq/dt",
      "j = dI/dS",
      "Q = I²Rt",
      "N = q/e"
    ],
    "a": "Q = I²Rt",
    "hint": "💡 Bu qonun o‘tkazgichdan tok o‘tganda ajraladigan issiqlik miqdorini aniqlaydi. Issiqlik tok kuchining kvadratiga, qarshilikka va vaqtga bog‘liq."
  },
  {
    "q": "Elektr qarshiligining birligi qaysi?",
    "options": [
      "V",
      "Ω",
      "W",
      "A"
    ],
    "a": "Ω",
    "hint": "💡 Elektr qarshiligi buyuk fizik Georg Om sharafiga 'Om' (Ω) birligida o‘lchanadi."
  },
  {
    "q": "I = ε / (R + r) formulasi nimani ifodalaydi?",
    "options": [
      "Joul–Lens qonuni",
      "Zanjirning bir qismi uchun Om qonuni",
      "Butun zanjir uchun Om qonuni",
      "Kirxgof qoidasi"
    ],
    "a": "Butun zanjir uchun Om qonuni",
    "hint": "💡 Bu yerda ε – elektr yurituvchi kuch, R – tashqi qarshilik, r – manbaning ichki qarshiligi. Bu butun zanjirdagi tok kuchini hisoblaydi."
  },
  {
    "q": "Magnit maydonning tokli o‘tkazgichga ta’sir kuchi qanday ataladi?",
    "options": [
      "Lorens kuchi",
      "Amper kuchi",
      "Og‘irlik kuchi",
      "Ishqalanish kuchi"
    ],
    "a": "Amper kuchi",
    "hint": "💡 Magnit maydoni tokli simni (o‘tkazgichni) itaradi yoki tortadi. Bu kuch Amper kuchi deb ataladi. F = BIl sinα."
  },
  {
    "q": "Magnit maydonning zaryadli zarrachaga ta’sir kuchi nima?",
    "options": [
      "Og‘irlik kuchi",
      "Elastiklik kuchi",
      "Lorens kuchi",
      "Ishqalanish kuchi"
    ],
    "a": "Lorens kuchi",
    "hint": "💡 Magnit maydonda harakatlanayotgan elektron yoki proton kabi zaryadlangan zarrachalarga ta’sir qiluvchi kuch Lorens kuchi deyiladi."
  },
  
  {
    "q": "Magnit induksiya oqimining birligi qaysi?",
    "options": [
      "Tesla",
      "Nyuton",
      "Veber",
      "Vatt"
    ],
    "a": "Veber",
    "hint": "💡 Magnit induksiya (B) birligi Tesla, lekin magnit oqimi (Φ) birligi Veber (Wb) hisoblanadi."
  },
  {
    "q": "Magnit maydon kuchlanganligi qaysi harf bilan belgilanadi?",
    "options": [
      "B",
      "H",
      "I",
      "F"
    ],
    "a": "H",
    "hint": "💡 Magnit induksiyasi 'B', magnit maydon kuchlanganligi esa 'H' harfi bilan belgilanadi."
  },
  {
    "q": "Eng katta magnit xossaga ega modda qaysi?",
    "options": [
      "Diamagnit",
      "Paramagnit",
      "To‘g‘ri javob yo‘q",
      "Ferromagnit"
    ],
    "a": "Ferromagnit",
    "hint": "💡 Temir, nikel va kobalt kabi moddalar kuchli magnit xossaga ega bo‘lib, ular ferromagnitlar guruhiga kiradi."
  },
  {
    "q": "Matematik mayatnikning tebranish davri formulasi qaysi?",
    "options": [
      "T = 2π√(g/l)",
      "T = √(l/g)",
      "T = 2π√(l/g)",
      "T = l/g"
    ],
    "a": "T = 2π√(l/g)",
    "hint": "💡 Matematik mayatnik davri ip uzunligi (l) ortishi bilan ortadi, erkin tushish tezlanishi (g) ortishi bilan esa kamayadi."
  },
  
  {
    "q": "Tashqi muhit bilan issiqlik almashinmaydigan jarayon qanday ataladi?",
    "options": [
      "izotermik",
      "izobarik",
      "adiabatik",
      "izoxorik"
    ],
    "a": "adiabatik",
    "hint": "💡 Agar gaz siqilganda yoki kengayganda tashqi muhitga issiqlik bermasa va olmasa (Q=0), bu jarayon adiabatik jarayon deyiladi."
  },
  {
    "q": "Prujinali mayatnikning tebranish davri formulasini ko‘rsating?",
    "options": [
      "T = 2π√(m/k)",
      "T = 2π√(k/m)",
      "T = √(m/k)",
      "T = 1/(2π)√(m/k)"
    ],
    "a": "T = 2π√(m/k)",
    "hint": "💡 Prujinali mayatnikning davri (T) yukning massasi (m) va prujinaning bikrligiga (k) bog‘liq. Massasi katta yuk sekinroq, bikrligi yuqori (qattiq) prujina esa tezroq tebranadi."
  },
  
  {
    "q": "1 kg gaz temperaturasi 1 K ga oshishi uchun kerak bo‘ladigan issiqlik miqdori bilan aniqlanuvchi kattalik nima?",
    "options": [
      "gazning adiabatik issiqlik sig‘imi",
      "gazning molyar issiqlik sig‘imi",
      "gazning solishtirma issiqlik sig‘imi",
      "gazning politropik issiqlik sig‘imi"
    ],
    "a": "gazning solishtirma issiqlik sig‘imi",
    "hint": "💡 Solishtirma issiqlik sig‘imi har bir moddaning o‘ziga xos xususiyatidir. U modda qanchalik tez isishi yoki sovishini belgilaydi. Suv uchun bu ko‘rsatkich juda yuqori."
  },
  {
    "q": "Proton va elektron zaryadlari kattaligi va ishorasi jihatdan qanday?",
    "options": [
      "Protonniki kichik, elektronniki katta",
      "Zaryadlari teng, ishoralari qarama-qarshi",
      "Protonniki katta, elektronniki kichik",
      "Ikkalasi ham musbat"
    ],
    "a": "Zaryadlari teng, ishoralari qarama-qarshi",
    "hint": "💡 Proton (+) va Elektron (-) zaryad miqdori (e = 1.6·10⁻¹⁹ C) bo‘yicha aynan teng, lekin ularning tabiati qarama-qarshi. Shu sababli atom umuman olganda neytral hisoblanadi."
  },
  {
    "q": "Kelvin va Selsiy shkalalari orasidagi bog‘lanish formulasini ko‘rsating?",
    "options": [
      "T = t − 273",
      "T = t / 273",
      "T = t + 273",
      "T = 273 / t"
    ],
    "a": "T = t + 273",
    "hint": "💡 Kelvin (absolyut) shkalasi Selsiy shkalasidan 273 daraja yuqoridan boshlanadi. Masalan, muzning erish nuqtasi 0°C yoki 273 K ga teng."
  },
  
  {
    "q": "O‘tkazgichdan o‘zgarmas tok o‘tganda uning atrofida qanday maydon hosil bo‘ladi?",
    "options": [
      "elektr maydon",
      "gravitatsion maydon",
      "elektromagnit maydon",
      "magnit maydon"
    ],
    "a": "magnit maydon",
    "hint": "💡 Har qanday harakatlanayotgan zaryad (tok) o‘z atrofida magnit maydonini yaratadi. Buni 1820-yilda Ersted o‘zining mashhur tajribasi bilan isbotlagan."
  },
  {
    "q": "Zaryadlarning saqlanish qonuni ta’rifini ko‘rsating?",
    "options": [
      "Izolyatsiyalangan sistemada zaryadlar soni ortib boradi",
      "Izolyatsiyalangan sistemada elektr zaryadlarining algebraik yig‘indisi o‘zgarmaydi",
      "Zaryadlar faqat kamayadi",
      "Zaryadlar faqat ortadi"
    ],
    "a": "Izolyatsiyalangan sistemada elektr zaryadlarining algebraik yig‘indisi o‘zgarmaydi",
    "hint": "💡 Zaryadlar yo‘qdan paydo bo‘lmaydi va yo‘qolmaydi, ular faqat bir jismdan ikkinchisiga o‘tishi mumkin. Umumiy yig‘indi har doim doimiy (const) qoladi."
  },
  {
    "q": "Molekulyar-kinetik nazariyaning asosiy tenglamasini ko‘rsating?",
    "options": [
      "p = 3n m₀ v²",
      "p = 1/3 n m₀ v²",
      "p = n k T",
      "p = m v²"
    ],
    "a": "p = 1/3 n m₀ v²",
    "hint": "💡 Bu tenglama gaz bosimini (p) molekulalarning massasi (m₀), konsentratsiyasi (n) va o‘rtacha kvadratik tezligi (v²) bilan bog‘laydi. 1/3 koeffitsienti molekulalarning 3 xil o‘qda harakatlanishini anglatadi."
  },
  {
    "q": "Qo‘zg‘almas elektr zaryad atrofidagi elektr kuchlar ta’siri seziladigan fazo qanday ataladi?",
    "options": [
      "gravitatsiya maydoni",
      "tortishish",
      "itarishish",
      "elektr maydoni"
    ],
    "a": "elektr maydoni",
    "hint": "💡 Maydon — bu moddaning maxsus shakli bo‘lib, u orqali zaryadlar bir-biriga masofadan turib ta’sir o‘tkazadi."
  },
  {
    "q": "Chap qo‘l qoidasiga ko‘ra qaysi kuchlarning yo‘nalishi aniqlanadi?",
    "options": [
      "Ampyer kuchi",
      "Induksiya toki",
      "Lorens kuchi",
      "Ampyer va Lorens kuchlari"
    ],
    "a": "Ampyer va Lorens kuchlari",
    "hint": "💡 Chap qo‘l qoidasida: kaftga magnit chiziqlari kiradi, to‘rtta barmoq tokni (yoki zaryad tezligini) ko‘rsatadi, ochilgan bosh barmoq esa ta’sir etuvchi kuch yo‘nalishini beradi."
  },
  
  {
    "q": "Elektr maydonning ixtiyoriy nuqtasida birlik zaryadga ta’sir etuvchi kuch bilan aniqlanadigan kattalik nima?",
    "options": [
      "maydon potensiali",
      "maydon kuchlanganligi",
      "maydon superpozitsiyasi",
      "maydon kuchlanishi"
    ],
    "a": "maydon kuchlanganligi",
    "hint": "💡 Kuchlanganlik (E) — maydonning 'quvvati'. U maydonning biror nuqtasida turgan zaryadga qanchalik kuch bilan ta’sir qilishini ko‘rsatadi. E = F / q."
  },
  {
    "q": "Lorens kuchi zaryadli zarra tezligiga qanday ta’sir qiladi?",
    "options": [
      "Tezligini oshiradi",
      "Tezligini kamaytiradi",
      "Tezligini o‘zgartirmaydi",
      "Tezlik yo‘nalishini o‘zgartiradi"
    ],
    "a": "Tezlik yo‘nalishini o‘zgartiradi",
    "hint": "💡 Lorens kuchi har doim tezlik yo‘nalishiga perpendikulyar bo‘ladi. Shuning uchun u ish bajarmaydi va tezlikning qiymatini o‘zgartirmaydi, faqat zarrachani aylanma trayektoriya bo‘ylab buradi."
  },
  {
    "q": "O‘tkazgich bilan dielektrikning asosiy farqi nimada?",
    "options": [
      "Dielektrikda erkin protonlar mavjud",
      "O‘tkazgichda erkin elektronlar mavjud",
      "Dielektrikda erkin neytronlar mavjud",
      "O‘tkazgichda zaryad bo‘lmaydi"
    ],
    "a": "O‘tkazgichda erkin elektronlar mavjud",
    "hint": "💡 O‘tkazgichlarda (masalan, metallarda) elektronlar atomdan ajralgan bo‘lib, butun jism bo‘ylab erkin harakatlanadi. Dielektriklarda (rezina, shisha) esa elektronlar 'band' bo‘ladi."
  },
  {
    "q": "Elektromagnit induksiya hodisasini kim kashf etgan?",
    "options": [
      "Amper",
      "Faradey",
      "Ersted",
      "Lens"
    ],
    "a": "Faradey",
    "hint": "💡 Maykl Faradey 1831-yilda o‘zgaruvchan magnit maydoni orqali elektr toki olish mumkinligini kashf qilgan. Bu kashfiyot bugungi barcha elektr stansiyalari (generatorlar) asosidir."
  },
  {
    "q": "Gaz bosimining konsentratsiya va absolut temperaturaga bog‘lanish formulasi qaysi?",
    "options": [
      "p = nkT",
      "p = n/T",
      "p = kT/n",
      "p = n/kT"
    ],
    "a": "p = nkT",
    "hint": "💡 Bu tenglamaga ko‘ra, gaz molekulalari qanchalik ko‘p bo‘lsa (n) va ular qanchalik issiq bo‘lsa (T), bosim shunchalik yuqori bo‘ladi. k — Bolsman doimiysi."
  },
  {
    "q": "Elektr tokning magnit ta’siri qachon va kim tomonidan aniqlangan?",
    "options": [
      "1831 y. Faradey",
      "1820 y. Ersted",
      "1620 y. Nyuton",
      "1920 y. Eynshteyn"
    ],
    "a": "1820 y. Ersted",
    "hint": "💡 1820-yilda daniyalik fizik Xans Kristian Ersted tasodifan tok o'tayotgan sim yaqinidagi magnit mili (kompas) og'ishini payqagan va bu bilan elektr va magnetizm orasidagi bog'liqlikni isbotlagan."
  },
  {
    "q": "Magnit induksiya EYuK ning birligi qaysi?",
    "options": [
      "A/s",
      "H",
      "Wb/s",
      "T/s"
    ],
    "a": "Wb/s",
    "hint": "💡 Faradey qonuniga ko‘ra, induksiya EYuK magnit oqimining o‘zgarish tezligiga teng. Shuning uchun uning birligi Veber bo‘lingan sekund (Wb/s) yoki Volt hisoblanadi."
  },
  {
    "q": "Magnit maydon induksiyasining o‘lchov birligi qaysi?",
    "options": [
      "Vb",
      "Genri",
      "Amper",
      "Tesla"
    ],
    "a": "Tesla",
    "hint": "💡 Magnit maydonining kuchi (induksiyasi) buyuk ixtirochi Nikola Tesla sharafiga Tesla (Tl) birligida o‘lchanadi."
  },
  {
    "q": "Magnit oqimi 0,3 s davomida 15 Wb dan 12 Wb gacha kamaygan bo‘lsa, induksiya EYuK necha volt?",
    "options": [
      "5",
      "9",
      "10",
      "4.5"
    ],
    "a": "10",
    "hint": "💡 Formula: E = |ΔΦ / Δt|. Magnit oqimi o‘zgarishi: 15 - 12 = 3 Wb. Vaqt: 0.3 s. Hisoblaymiz: 3 / 0.3 = 10 V."
  },
  {
    "q": "Quyidagi keltirilgan kuchlarning qaysi biri ish bajarmaydi?",
    "options": [
      "Ishqalanish kuchi",
      "Kulon kuchi",
      "Lorens kuchi",
      "Amper kuchi"
    ],
    "a": "Lorens kuchi",
    "hint": "💡 Lorens kuchi har doim zarracha tezligiga perpendikulyar yo‘nalgan bo‘ladi. Shuning uchun u ish bajarmaydi va zarracha energiyasini o‘zgartirmaydi."
  },
  
  {
    "q": "Lorens kuchi harakatdagi zaryadli zarraning tezligini qanday o‘zgartiradi?",
    "options": [
      "Tezligini kamaytiradi",
      "Tezligini oshiradi",
      "Tezlik yo‘nalishini o‘zgartiradi",
      "Tezligini o‘zgartirmaydi"
    ],
    "a": "Tezlik yo‘nalishini o‘zgartiradi",
    "hint": "💡 Lorens kuchi zarrachaning tezlik qiymatini (modulini) o‘zgartira olmaydi, u faqat zarrachani egri chiziq bo‘ylab burib, yo‘nalishini o‘zgartiradi."
  },
  {
    "q": "O‘tkazgichlarning dielektriklardan asosiy farqi nimada?",
    "options": [
      "Erkin protonlarning mavjudligida",
      "Erkin neytronlarning mavjudligida",
      "Erkin elektronlarning mavjudligida",
      "Zaryad tashuvchilarning yo‘qligida"
    ],
    "a": "Erkin elektronlarning mavjudligida",
    "hint": "💡 Metallar (o‘tkazgichlar) elektrni yaxshi o‘tkazishiga sabab, ularning ichida kristall panjara bo‘ylab bemalol harakatlanuvchi 'erkin elektronlar' ko‘pligidir."
  },
  {
    "q": "Elektromagnit induksiya hodisasini kim kashf qilgan?",
    "options": [
      "Ampere",
      "Faradey",
      "Ersted",
      "Lens"
    ],
    "a": "Faradey",
    "hint": "💡 1831-yilda Maykl Faradey o‘zgaruvchan magnit maydoni orqali elektr toki olish mumkinligini isbotlagan va bu bilan energetika inqilobini boshlab bergan."
  },
  {
    "q": "Gaz bosimining uning konsentratsiyasi va absolyut temperaturaga bog‘liqlik formulasini ko‘rsating?",
    "options": [
      "p = nkT",
      "p = n / kT",
      "p = nk / T",
      "p = kT / n"
    ],
    "a": "p = nkT",
    "hint": "💡 Bu tenglamaga ko‘ra, gaz molekulalari qanchalik ko‘p (n) va issiq (T) bo‘lsa, idish devoriga urilishlar soni va kuchi ortadi, natijada bosim ham ko‘tariladi."
  },
  {
    "q": "Elektr tokining magnit ta’siri qachon va kim tomonidan aniqlangan?",
    "options": [
      "1831 y. Faradey",
      "1820 y. Ersted",
      "1620 y. Nyuton",
      "1920 y. Eynshteyn"
    ],
    "a": "1820 y. Ersted",
    "hint": "💡 Xans Kristian Ersted 1820-yilda tasodifan tok o‘tayotgan sim yaqinida turgan kompas milining og‘ishini payqab, elektr va magnetizm bog‘liqligini kashf qilgan."
  },
  
  {
    "q": "Induksiya EYuK ning birligini ko‘rsating?",
    "options": [
      "H",
      "A/s",
      "T/s",
      "Wb/s"
    ],
    "a": "Wb/s",
    "hint": "💡 Induksiya EYuK (Elektr Yurituvchi Kuch) — aslida kuchlanishdir. Volt = Veber / sekund."
  },
  {
    "q": "Magnit maydon induksiyasining o‘lchov birligini ko‘rsating?",
    "options": [
      "Veber (Wb)",
      "Amper (A)",
      "Genri (Gn)",
      "Tesla (Tl)"
    ],
    "a": "Tesla (Tl)",
    "hint": "💡 Eslatma: Magnit oqimi - Veber, Magnit induksiyasi (zichligi) - Tesla."
  },
  {
    "q": "Konturdan o‘tayotgan magnit oqimi 0,3 s davomida 15 Wb dan 12 Wb gacha tekis kamaygan bo‘lsa, konturda hosil bo‘lgan EYuK ning qiymati (V)?",
    "options": [
      "10",
      "9",
      "4.5",
      "5"
    ],
    "a": "10",
    "hint": "💡 ΔΦ = 15 - 12 = 3. E = ΔΦ / Δt = 3 / 0.3 = 10."
  },
  {
    "q": "G‘altakka kiritilgan ferromagnit o‘zak qanday vazifani bajaradi?",
    "options": [
      "Elektr maydonni kuchaytiradi",
      "Magnit maydonni susaytiradi",
      "Magnit maydonni kuchaytiradi",
      "Elektr maydonni susaytiradi"
    ],
    "a": "Magnit maydonni kuchaytiradi",
    "hint": "💡 Temir kabi ferromagnitlar magnit maydon chiziqlarini o‘ziga tortib, zichlashtiradi. Bu esa g‘altak ichidagi umumiy magnit maydonni bir necha barobar kuchaytiradi."
  },
  
  {
    "q": "Induktivligi 30 mH bo‘lgan g‘altakdan 0,8 A tok o‘tganda g‘altak magnit maydonining energiyasi nechaga teng (mJ)?",
    "options": [
      "2",
      "3",
      "9.6",
      "4"
    ],
    "a": "9.6",
    "hint": "💡 Formula: W = (L * I²) / 2. Hisoblaymiz: (30 * 0.8 * 0.8) / 2 = (30 * 0.64) / 2 = 19.2 / 2 = 9.6 mJ."
  },
  {
    "q": "Agar o‘ng vint dastasini aylanish tok yo‘nalishida aylantirsak, vintning ilgarilanma harakati aylanish o‘qi ichidagi qaysi chiziqlarning yo‘nalishini ko‘rsatadi?",
    "options": [
      "Elektr maydon kuch chizig‘i",
      "Magnit induksiya chizig‘i",
      "To‘lqin chizig‘i",
      "Elektr va magnit kuch chizig‘i"
    ],
    "a": "Magnit induksiya chizig‘i",
    "hint": "💡 Bu 'O‘ng vint qoidasi' yoki 'Parma qoidasi' deb ataladi. U tokli o‘tkazgich atrofida hosil bo‘lgan magnit maydonining yo‘nalishini aniqlash uchun ishlatiladi."
  },
  {
    "q": "Tebranish konturidagi kondensatorda elektr zaryadi q = 10⁻³ cos(1000t) (C) qonuniyat bo‘yicha o‘zgarsa, konturda hosil bo‘layotgan tok kuchining amplitudasi nechaga teng?",
    "options": [
      "10 A",
      "1 A",
      "28 A",
      "10⁻³ A"
    ],
    "a": "1 A",
    "hint": "💡 Tok kuchi zaryadning vaqt bo'yicha hosilasiga teng ($I = q'$). Hosila olsak: $I = -10^{-3} \cdot 1000 \cdot \sin(1000t)$. Amplituda esa sinus oldidagi koeffitsient: $10^{-3} \cdot 1000 = 1$ A."
  },
  {
    "q": "Ideal tebranish konturida kondensator sig‘imi 9 marta kamaytirilsa, konturning tebranish chastotasi qanday o‘zgaradi?",
    "options": [
      "3 marta kamayadi",
      "9 marta kamayadi",
      "3 marta ortadi",
      "9 marta ortadi"
    ],
    "a": "3 marta ortadi",
    "hint": "💡 Tomson formulasiga ko'ra, chastota sig'imning ($C$) kvadrat ildiziga teskari proporsional ($\nu \sim 1/\sqrt{C}$). Sig'im 9 marta kamaysa, ildizdan 3 chiqadi va chastota 3 marta ortadi."
  },
  
  {
    "q": "Magnit induksiya chiziqlari magnit maydonni vujudga keltiruvchi tokli o‘tkazgichlarning shaklidan qat’i nazar qanday chiziqlardir?",
    "options": [
      "ochiq",
      "to‘g‘ri",
      "egri",
      "berk"
    ],
    "a": "berk",
    "hint": "💡 Magnit maydon chiziqlari har doim berk bo'ladi (boshi va oxiri yo'q). Bu magnit zaryadlarining tabiatda alohida holda (monopol) mavjud emasligini bildiradi."
  },
  {
    "q": "Kulon qonuni formulasini ko‘rsating?",
    "options": [
      "F = q / 4πr²",
      "F = q₁q₂ / r²",
      "F = q₁q₂ / (4πϵ₀r²)",
      "F = q / r²"
    ],
    "a": "F = q₁q₂ / (4πϵ₀r²)",
    "hint": "💡 Bu ikki nuqtaviy zaryad orasidagi o'zaro ta'sir kuchini belgilaydi. Bu yerda $1/(4\pi\epsilon_0)$ koeffitsienti biz bilgan $k$ o'zgarmasiga teng."
  },
  
  {
    "q": "Magnit oqimining xalqaro birliklar sistemasidagi (XBS) o‘lchov birligi qaysi?",
    "options": [
      "Tesla (Tl)",
      "Amper (A)",
      "Veber (Wb)",
      "Genri (Gn)"
    ],
    "a": "Veber (Wb)",
    "hint": "💡 Magnit induksiyasi ($B$) - Tesla, lekin magnit oqimi ($\Phi$) - Veber ($Wb$) birligida o'lchanadi. $1 Wb = 1 Tl \cdot 1 m^2$."
  },
  {
    "q": "Nuqtaviy zaryadning undan r masofadagi maydon nuqtasining kuchlanganligi formulasini ko‘rsating?",
    "options": [
      "E = q / 4πϵ₀r³",
      "E = q·r / 4πϵ₀",
      "E = q / 4πϵ₀r²",
      "E = q / r"
    ],
    "a": "E = q / 4πϵ₀r²",
    "hint": "💡 Kuchlanganlik — bu maydonning kuch xarakteristikasi bo'lib, u masofaning kvadratiga teskari proporsional ravishda kamayib boradi."
  },
  {
    "q": "Elektr maydon kuchlanganligi va potensialining o‘lchov birliklarini ko‘rsating?",
    "options": [
      "V/m ; V",
      "V·m ; J",
      "V/m² ; Pa",
      "V·m² ; N"
    ],
    "a": "V/m ; V",
    "hint": "💡 Kuchlanganlik birligi Volt bo'lingan metr ($V/m$), potensial birligi esa Volt ($V$) hisoblanadi."
  },
  {
    "q": "Maydonlar superpozitsiyasi prinsipining formulasini ko‘rsating?",
    "options": [
      "E = q / r",
      "E = ΣEᵢ",
      "E = −grad φ",
      "E = q / t"
    ],
    "a": "E = ΣEᵢ",
    "hint": "💡 Superpozitsiya prinsipi — bir nechta zaryadlar yaratgan natijaviy maydon har bir zaryad yaratgan maydonlarning vektor yig'indisiga tengligini anglatadi."
  },
  {
    "q": "Kondensatorning elektr sig‘imi formulasini ko‘rsating?",
    "options": [
      "C = q·U",
      "C = q / U",
      "C = ε₀εS",
      "C = U / q"
    ],
    "a": "C = q / U",
    "hint": "💡 Sig'im kondensatordagi zaryadning ($q$) undagi kuchlanishga ($U$) nisbatiga teng. Birligi — Farada ($F$)."
  },
  {
    "q": "Yassi kondensatorning elektr sig‘imi formulasini ko‘rsating?",
    "options": [
      "C = ε₀εS / d",
      "C = ε₀ + S·d",
      "C = ε₀S·d",
      "C = d / ε₀εS"
    ],
    "a": "C = ε₀εS / d",
    "hint": "💡 Sig'im plastinalar yuzasiga ($S$) to'g'ri proporsional va ular orasidagi masofaga ($d$) teskari proporsionaldir."
  },
  
  {
    "q": "Kirxgofning ikkinchi qoidasi formulasini ko‘rsating?",
    "options": [
      "ΣIᵢ = 0",
      "ΣIᵢRᵢ = Σεᵢ",
      "ΣIᵢ = Σεᵢ",
      "ΣIᵢRᵢ = 0"
    ],
    "a": "ΣIᵢRᵢ = Σεᵢ",
    "hint": "💡 Kirxgofning 2-qoidasi (kontur qoidasi): berk konturdagi kuchlanishlar tushuvining yig'indisi o'sha konturdagi EYuKlar yig'indisiga teng."
  },
  {
    "q": "Magnit maydon induksiyasi va kuchlanganligi orasidagi bog‘lanish formulasini ko‘rsating?",
    "options": [
      "B = μ₀ + μH",
      "B = μ₀·μ·H",
      "B = μ₀ − H",
      "B = μ + μ₀H"
    ],
    "a": "B = μ₀·μ·H",
    "hint": "💡 Magnit induksiyasi ($B$) va kuchlanganligi ($H$) muhitning magnit singdiruvchanligi ($\mu$) orqali bog'langan."
  },
  {
    "q": "Yarim o‘tkazgichning solishtirma qarshiligi temperaturaga qanday bog‘liq?",
    "options": [
      "Temperatura ortishi bilan kamayadi",
      "Temperaturaga bog‘liq bo‘lmaydi",
      "Temperatura kvadratiga bog‘liq",
      "Temperatura ortishi bilan ortadi"
    ],
    "a": "Temperatura ortishi bilan kamayadi",
    "hint": "💡 Metallardan farqli o'laroq, yarim o'tkazgichlar qiziganda ulardagi erkin zaryad tashuvchilar soni keskin ortadi, natijada qarshilik kamayadi."
  },
  {
    "q": "Amper qonunining ifodasini toping?",
    "options": [
      "dF = I·dl × B",
      "dF = qE",
      "F = μ₀ I₁I₂ / 2πr",
      "F = qvB"
    ],
    "a": "dF = I·dl × B",
    "hint": "💡 Amper kuchi magnit maydonining tokli o'tkazgichga ko'rsatadigan ta'sir kuchidir."
  },
  {
    "q": "Ikki parallel cheksiz to‘g‘ri toklar orasidagi o‘zaro ta’sir kuchi formulasi qaysi?",
    "options": [
      "F = μ₀(I₁ + I₂) / 2πr",
      "F = μ₀ I₁ I₂ / 2πr",
      "F = k q₁ q₂ / r²",
      "F = qvB"
    ],
    "a": "F = μ₀ I₁ I₂ / 2πr",
    "hint": "💡 Agar ikki simdan bir xil yo'nalishda tok o'tsa, ular bir-birini tortadi, qarama-qarshi yo'nalishda bo'lsa — itaradi."
  },
  {
    "q": "Atom yadrosi qanday zarrachalardan tuzilgan?",
    "options": [
      "Elektronlar va protonlardan",
      "Protonlar va neytronlardan",
      "Neytronlar va elektronlardan",
      "Faqat protonlardan"
    ],
    "a": "Protonlar va neytronlardan",
    "hint": "💡 Atomning markazida yadro joylashgan bo'lib, u musbat zaryadli protonlar va zaryadsiz neytronlardan (birgalikda nuklonlar deb ataladi) tashkil topgan. Elektronlar esa yadro atrofida aylanadi."
  },
  
  {
    "q": "β-zarralar qanday xossaga ega?",
    "options": [
      "Musbat zaryadlangan protonlar",
      "Magnit maydonda og‘maydi",
      "Manfiy zaryadlangan elektronlar",
      "Zaryadsiz neytronlar"
    ],
    "a": "Manfiy zaryadlangan elektronlar",
    "hint": "💡 Beta-nurlanish — bu yadrodan juda katta tezlikda uchib chiqadigan elektronlar oqimidir. Ular manfiy zaryadga ega bo'lgani uchun elektr va magnit maydonlarida og'adi."
  },
  {
    "q": "O‘rtacha tezlik formulasini ko‘rsating?",
    "options": [
      "v = ds/dt",
      "v̄ = Δr / Δt",
      "v = at",
      "v = lim a/t"
    ],
    "a": "v̄ = Δr / Δt",
    "hint": "💡 O'rtacha tezlik jismning ma'lum vaqt oralig'idagi (Δt) umumiy ko'chishining (Δr) shu vaqtga nisbatiga teng."
  },
  {
    "q": "Markazga intilma (normal) tezlanish formulasi qaysi?",
    "options": [
      "aₙ = v² / R",
      "a = dv/dt",
      "a = v/t",
      "a = R/v²"
    ],
    "a": "aₙ = v² / R",
    "hint": "💡 Jism aylana bo'ylab harakatlanganda, uning tezlik yo'nalishini o'zgartiruvchi tezlanish markazga yo'nalgan bo'ladi. U tezlik kvadratining aylana radiusiga nisbatiga teng."
  },
  
  {
    "q": "Bosib o‘tilgan yo‘l deb nimaga aytiladi?",
    "options": [
      "Traektoriyaning uzunligi",
      "Ko‘chish vektori moduli",
      "Boshlang‘ich va oxirgi nuqta orasidagi masofa",
      "Tezlikning vaqtga ko‘paytmasi"
    ],
    "a": "Traektoriyaning uzunligi",
    "hint": "💡 Yo'l — bu skalyar kattalik bo'lib, u jism harakati davomida chizgan trayektoriyasining umumiy uzunligini ifodalaydi. Uni ko'chish (to'g'ri chiziq) bilan adashtirmang."
  },
  {
    "q": "Tezlik qanday kattalik?",
    "options": [
      "Skalyar kattalik",
      "O‘zgarmas kattalik",
      "Vektor kattalik",
      "Faqat modulga ega kattalik"
    ],
    "a": "Vektor kattalik",
    "hint": "💡 Tezlik nafaqat son qiymatga, balki yo'nalishga ham ega bo'lgan kattalikdir, shuning uchun u vektor kattalik hisoblanadi."
  },
  {
    "q": "Markazga intilma kuch formulasini ko‘rsating?",
    "options": [
      "F = ma",
      "F = mv² / R",
      "F = mg",
      "F = kx"
    ],
    "a": "F = mv² / R",
    "hint": "💡 Jismni aylana bo'ylab harakatlanishga majbur qiluvchi kuch markazga intilma kuchdir. U Nyutonning ikkinchi qonuniga ko'ra $F = m \cdot a_n$ ko'rinishida topiladi."
  },
  {
    "q": "Jismning impulsi formulasini ko‘rsating?",
    "options": [
      "p = mv",
      "p = ma",
      "p = Ft",
      "p = m/v"
    ],
    "a": "p = mv",
    "hint": "💡 Jismning impulsi (harakat miqdori) uning massasi va tezligi ko'paytmasiga teng vektor kattalikdir."
  },
  {
    "q": "Gravitatsiya doimiysining qiymati va o‘lchov birligini ko‘rsating?",
    "options": [
      "G = 6,67·10⁻¹¹ N·m²/kg²",
      "G = 9,8 m/s²",
      "G = 1,6·10⁻¹⁹ C",
      "G = 3·10⁸ m/s"
    ],
    "a": "G = 6,67·10⁻¹¹ N·m²/kg²",
    "hint": "💡 Butun olam tortishish qonunidagi bu o'zgarmas qiymat ikki dona 1 kg massali jismlarning 1 metr masofadagi tortishish kuchini ifodalaydi."
  },
  {
    "q": "Ishning asosiy o‘lchov birligi — joul (J) ga to‘g‘ri ta’rif qaysi?",
    "options": [
      "1 J = 1 kg·m²/s²",
      "1 J = 1 N/s",
      "1 J = 1 V·A",
      "1 J = 1 W·s"
    ],
    "a": "1 J = 1 kg·m²/s²",
    "hint": "💡 Ish kuchi va ko'chish ko'paytmasiga teng ($A = F \cdot s$). Nyutonni metrga ko'paytirib, birliklar tarkibini yozsak, aynan $kg \cdot m^2/s^2$ hosil bo'ladi."
  },
  {
    "q": "Kinetik energiyaga berilgan to‘g‘ri ta’rifni ko‘rsating?",
    "options": [
      "Jismning o‘zaro ta’sir energiyasi",
      "Jism massasining tezlik kvadratiga ko‘paytmasining yarmiga teng energiya",
      "Jismning balandlikka bog‘liq energiyasi",
      "Zaryadlar orasidagi energiya"
    ],
    "a": "Jism massasining tezlik kvadratiga ko‘paytmasining yarmiga teng energiya",
    "hint": "💡 Kinetik energiya — jismning harakati natijasida yuzaga keladigan energiya turi. Formulasi: $E_k = mv^2 / 2$."
  },
        ]
  },
  english: {
        title: "English",
        questions: [
  {
    "q": "What does manufacturing mean?",
    "options": [
      "Selling products",
      "Transporting goods",
      "Making products in factories",
      "Advertising products"
    ],
    "a": "Making products in factories"
  },
  {
    "q": "Which business activity is connected with hospitals and doctors?",
    "options": [
      "Agriculture",
      "Health care",
      "Transport",
      "Software"
    ],
    "a": "Health care"
  },
  {
    "q": "Software developers usually work in the:",
    "options": [
      "Manufacturing sector",
      "Mining sector",
      "IT / software sector",
      "Agriculture sector"
    ],
    "a": "IT / software sector"
  },
  {
    "q": "Factories are most closely connected with:",
    "options": [
      "Advertising",
      "Transport",
      "Manufacturing",
      "Agriculture"
    ],
    "a": "Manufacturing"
  },
  {
    "q": "Which collocation is correct?",
    "options": [
      "buy from a customer",
      "buy from a profit",
      "buy from a supplier",
      "buy from a market"
    ],
    "a": "buy from a supplier"
  },
  {
    "q": "Choose the correct collocation:",
    "options": [
      "make a market",
      "make services",
      "make goods",
      "make a supplier"
    ],
    "a": "make goods"
  },
  {
    "q": "What can a company face?",
    "options": [
      "goods",
      "value",
      "competition",
      "a customer"
    ],
    "a": "competition"
  },
  {
    "q": "Which phrase is correct?",
    "options": [
      "sell a profit",
      "make a market",
      "make a profit",
      "provide a profit"
    ],
    "a": "make a profit"
  },
  {
    "q": "What do most employers think is the most important information in a CV?",
    "options": [
      "Grades",
      "School or university",
      "Work experience and skills",
      "Degree subject"
    ],
    "a": "Work experience and skills"
  },
  {
    "q": "Why do many students choose internships in China?",
    "options": [
      "It is cheaper than Europe",
      "Employers only accept Chinese experience",
      "China offers many opportunities and experience",
      "It is easy to find a job"
    ],
    "a": "China offers many opportunities and experience"
  },
  {
    "q": "What skills can students develop during internships in China?",
    "options": [
      "Only technical skills",
      "Sports skills",
      "Intercultural and working skills",
      "Only language skills"
    ],
    "a": "Intercultural and working skills"
  },
  {
    "q": "How did Shaun Duggan feel after his year in China?",
    "options": [
      "Tired of working",
      "Less confident",
      "More independent and confident",
      "More stressed"
    ],
    "a": "More independent and confident"
  },
  {
    "q": "What happened when Shaun returned to London?",
    "options": [
      "He continued studying",
      "He found one interview",
      "He changed his profession",
      "He was offered three jobs"
    ],
    "a": "He was offered three jobs"
  },
  {
    "q": "What is the first essential skill for working across cultures?",
    "options": [
      "Managing people",
      "Speaking many languages",
      "Intercultural sensitivity",
      "Making fast decisions"
    ],
    "a": "Intercultural sensitivity"
  },
  {
    "q": "What do Asians usually prefer when making decisions, according to the text?",
    "options": [
      "Making quick decisions",
      "Letting the boss decide",
      "Taking more time to avoid mistakes",
      "Avoiding decisions"
    ],
    "a": "Taking more time to avoid mistakes"
  },
  {
    "q": "What is important in Chinese organizations?",
    "options": [
      "Working alone",
      "Equality in all positions",
      "Informal communication",
      "Respecting hierarchy and the boss"
    ],
    "a": "Respecting hierarchy and the boss"
  },
  {
    "q": "What comes next when you count in twos? 2, 4, 6, 8, …",
    "options": [
      "11",
      "12",
      "10",
      "9"
    ],
    "a": "10"
  },
  {
    "q": "Which number is correct for “one thousand five hundred”?",
    "options": [
      "150",
      "1,500",
      "105",
      "15,000"
    ],
    "a": "1,500"
  },
  {
    "q": "How do we say 7,777?",
    "options": [
      "seven hundred seventy-seven",
      "seven thousand seven hundred",
      "seven million seven hundred",
      "seven thousand seven hundred and seventy-seven"
    ],
    "a": "seven thousand seven hundred and seventy-seven"
  },
  {
    "q": "What does 2.5bn mean?",
    "options": [
      "two thousand five hundred",
      "two point five million",
      "two point five billion",
      "twenty-five billion"
    ],
    "a": "two point five billion"
  },
  {
    "q": "How do we read €15.99?",
    "options": [
      "fifteen euros ninety",
      "fifteen euro nine nine",
      "fifteen point ninety-nine euros",
      "fifteen euros ninety-nine"
    ],
    "a": "fifteen euros ninety-nine"
  },
  {
    "q": "What is the correct name of this symbol: @ ?",
    "options": [
      "hash",
      "dot",
      "slash",
      "at"
    ],
    "a": "at"
  },
  {
    "q": "Which symbol is called hash?",
    "options": [
      "@",
      "/",
      "#",
      "\\"
    ],
    "a": "#"
  },
  {
    "q": "What does 20.15 mean?",
    "options": [
      "quarter to eight in the evening",
      "eight o’clock in the morning",
      "quarter past two in the afternoon",
      "quarter past eight in the evening"
    ],
    "a": "quarter past eight in the evening"
  },
  {
    "q": "What is the digital form of half past two in the afternoon?",
    "options": [
      "02.30",
      "12.30",
      "14.00",
      "14.30"
    ],
    "a": "14.30"
  },
  {
    "q": "What does eleven o’clock at night mean in digital time?",
    "options": [
      "21.00",
      "11.00",
      "00.00",
      "23.00"
    ],
    "a": "23.00"
  },
  {
    "q": "Which expression means 08:00 exactly?",
    "options": [
      "about eight o’clock",
      "eight o’clock at night",
      "eight o’clock sharp",
      "half past eight"
    ],
    "a": "eight o’clock sharp"
  },
  {
    "q": "What time is twenty-five to one?",
    "options": [
      "12.15",
      "12.45",
      "01.25",
      "12.35"
    ],
    "a": "12.35"
  },
  {
    "q": "Which one is an analogue time expression?",
    "options": [
      "13.45",
      "20.15",
      "11.01",
      "quarter past eight in the evening"
    ],
    "a": "quarter past eight in the evening"
  },
  {
    "q": "What does oh eight hundred hours mean?",
    "options": [
      "18.00",
      "midnight",
      "8 p.m.",
      "8 a.m."
    ],
    "a": "8 a.m."
  },
  {
    "q": "Do the British really love drinking tea?",
    "options": [
      "Sometimes",
      "Only in the evening",
      "Yes, they do",
      "No, they don’t"
    ],
    "a": "Yes, they do"
  },
  {
    "q": "Germans ___ big fast cars.",
    "options": [
      "driving",
      "drives",
      "drove",
      "drive"
    ],
    "a": "drive"
  },
  {
    "q": "___ Italians talk with their hands?",
    "options": [
      "Does",
      "Is",
      "Are",
      "Do"
    ],
    "a": "Do"
  },
  {
    "q": "___ a German call his boss by his first name?",
    "options": [
      "Do",
      "Is",
      "Are",
      "Does"
    ],
    "a": "Does"
  },
  {
    "q": "Choose the correct negative sentence.",
    "options": [
      "Americans doesn’t eat burgers every day.",
      "Americans aren’t eat burgers every day.",
      "Americans don’t eats burgers every day.",
      "Americans don’t eat burgers every day."
    ],
    "a": "Americans don’t eat burgers every day."
  },
  {
    "q": "Choose the correct rule. In Indonesia, you should use your ___.",
    "options": [
      "left hand",
      "both hands",
      "finger",
      "right hand / thumb"
    ],
    "a": "right hand / thumb"
  },
  {
    "q": "Where ___ you staying?",
    "options": [
      "do",
      "does",
      "is",
      "are"
    ],
    "a": "are"
  },
  {
    "q": "What ___ you do?",
    "options": [
      "does",
      "is",
      "are",
      "do"
    ],
    "a": "do"
  },
  {
    "q": "___ you religious?",
    "options": [
      "Do",
      "Does",
      "Is",
      "Are"
    ],
    "a": "Are"
  },
  {
    "q": "___ this your first visit to Serbia?",
    "options": [
      "Do",
      "Does",
      "Are",
      "Is"
    ],
    "a": "Is"
  },
  {
    "q": "Cross out the one incorrect option. Hello, my name’s Felipe Conti.",
    "options": [
      "Pleased to meet you.",
      "Nice to meet you.",
      "Good to meet you.",
      "How are you doing?"
    ],
    "a": "How are you doing?"
  },
  {
    "q": "Cross out the one incorrect option. Sorry to keep you waiting.",
    "options": [
      "That’s all right.",
      "No problem.",
      "It’s OK.",
      "Please."
    ],
    "a": "Please."
  },
  {
    "q": "Cross out the one incorrect option. Can I see your ticket?",
    "options": [
      "I have an online booking.",
      "I booked online.",
      "I booked on my computer.",
      "I like travelling."
    ],
    "a": "I like travelling."
  },
  {
    "q": "Choose the correct response. Is this your first visit to Greece?",
    "options": [
      "I stay at a hotel.",
      "Yes, I work here.",
      "I’m from Ireland.",
      "No, I live here. On one of the islands, actually."
    ],
    "a": "No, I live here. On one of the islands, actually."
  },
  {
    "q": "Choose the correct response. Oh, really? Lucky you! What do you do?",
    "options": [
      "I live on an island.",
      "I’m staying here.",
      "I’m a hotel manager.",
      "I have two children."
    ],
    "a": "I’m a hotel manager."
  },
  {
    "q": "Choose the correct response. What sector do you work in?",
    "options": [
      "I work in London.",
      "I’m from Greece.",
      "I stay at a hotel.",
      "I’m in the holiday business. I’m a travel agent."
    ],
    "a": "I’m in the holiday business. I’m a travel agent."
  },
  {
    "q": "Choose the correct response. Can you recommend a good restaurant in town?",
    "options": [
      "I don’t like food.",
      "I work here.",
      "Sure. If you like fish, the Marina is very good.",
      "I have children."
    ],
    "a": "Sure. If you like fish, the Marina is very good."
  },
  {
    "q": "Which greeting is best for a close friend or family member?",
    "options": [
      "Dear Mr Jackson,",
      "Hello Mr Jackson,",
      "Dear Sir or Madam,",
      "Hi John,"
    ],
    "a": "Hi John,"
  },
  {
    "q": "Which greeting is appropriate for a teacher or work colleague you know?",
    "options": [
      "Hi!",
      "Love,",
      "John,",
      "Dear Sam,"
    ],
    "a": "Dear Sam,"
  },
  {
    "q": "Which greeting is best for a manager or customer you don’t know?",
    "options": [
      "Hi Sam,",
      "Hello John,",
      "Hi,",
      "Dear Mr Jackson,"
    ],
    "a": "Dear Mr Jackson,"
  },
  {
    "q": "Which ending is appropriate for a formal or semi-formal email?",
    "options": [
      "Thanks!",
      "Love,",
      "See you soon,",
      "Kind regards,"
    ],
    "a": "Kind regards,"
  },
  {
    "q": "Which ending is best for an email to a close friend?",
    "options": [
      "Best regards,",
      "Kind regards,",
      "Regards,",
      "Love,"
    ],
    "a": "Love,"
  },
  {
    "q": "Which ending is suitable for a work email to a colleague you know?",
    "options": [
      "Yours faithfully,",
      "Dear,",
      "Love,",
      "All the best,"
    ],
    "a": "All the best,"
  },
  {
    "q": "Which greeting is NOT appropriate for a professional email?",
    "options": [
      "Hello Sam,",
      "Hi Sam,",
      "Dear Sam,",
      "John,"
    ],
    "a": "John,"
  },
  {
    "q": "Which ending is NOT appropriate for an email to a customer?",
    "options": [
      "Best regards,",
      "Kind regards,",
      "Regards,",
      "Love,"
    ],
    "a": "Love,"
  },
  {
    "q": "What do customers want today, besides a good product?",
    "options": [
      "Only advertising",
      "Good customer support and service",
      "Only low prices",
      "More competitors"
    ],
    "a": "Good customer support and service"
  },
  {
    "q": "Why is customer support important for a company?",
    "options": [
      "It replaces marketing",
      "It makes products cheaper",
      "It helps keep customers and save money",
      "It stops complaints"
    ],
    "a": "It helps keep customers and save money"
  },
  {
    "q": "What should a company do first to understand its customers?",
    "options": [
      "Advertise more",
      "Change staff",
      "Listen carefully to customers",
      "Increase prices"
    ],
    "a": "Listen carefully to customers"
  },
  {
    "q": "How should companies talk to customers?",
    "options": [
      "Only by phone",
      "Only face to face",
      "In the way customers like best",
      "Only by email"
    ],
    "a": "In the way customers like best"
  },
  {
    "q": "What does “Give customers what they want, when they want it” include?",
    "options": [
      "Advertising campaigns",
      "Right product, right place, right time, right price",
      "Free products",
      "Long explanations"
    ],
    "a": "Right product, right place, right time, right price"
  },
  {
    "q": "Why do people prefer to buy from people they like?",
    "options": [
      "Because it is cheaper",
      "Because of rules",
      "Because people trust people like themselves",
      "Because it is faster"
    ],
    "a": "Because people trust people like themselves"
  },
  {
    "q": "What is good customer service mainly about?",
    "options": [
      "Selling more products",
      "Working faster",
      "Understanding and respecting customers",
      "Giving discounts"
    ],
    "a": "Understanding and respecting customers"
  },
  {
    "q": "What is important to agree on that fits the customer's schedule?",
    "options": [
      "repeat business",
      "customer referral",
      "delivery date",
      "deal with complaints"
    ],
    "a": "delivery date"
  },
  {
    "q": "If there are delivery problems, what must the company do?",
    "options": [
      "repeat business",
      "customer referral",
      "returning customers",
      "deal with complaints"
    ],
    "a": "deal with complaints"
  },
  {
    "q": "How should complaints be handled if necessary?",
    "options": [
      "secretly",
      "politely",
      "aggressively",
      "impolitely"
    ],
    "a": "politely"
  },
  {
    "q": "What does “put you in contact with another person” mean?",
    "options": [
      "leave a message",
      "connect",
      "call back",
      "hang up"
    ],
    "a": "connect"
  },
  {
    "q": "What does “press the right keys to contact someone by telephone” mean?",
    "options": [
      "listen",
      "greet",
      "dial",
      "prepare"
    ],
    "a": "dial"
  },
  {
    "q": "What does “agree to speak on the telephone” mean?",
    "options": [
      "wait",
      "answer",
      "record",
      "smile"
    ],
    "a": "answer"
  },
  {
    "q": "What does “reach the person you want to speak to” mean?",
    "options": [
      "hang up",
      "put on hold",
      "call back",
      "get through"
    ],
    "a": "get through"
  },
  {
    "q": "What does “contact someone again with more information” mean?",
    "options": [
      "connect",
      "leave a message",
      "prepare",
      "call back"
    ],
    "a": "call back"
  },
  {
    "q": "What does “respond to a message from someone who wants to speak to you” mean?",
    "options": [
      "dial",
      "greet",
      "record",
      "answer"
    ],
    "a": "answer"
  },
  {
    "q": "What does “finish a telephone call” mean?",
    "options": [
      "call back",
      "put on hold",
      "get through",
      "hang up"
    ],
    "a": "hang up"
  },
  {
    "q": "What does “try again to reach the person you want to speak to” mean?",
    "options": [
      "dial",
      "smile",
      "leave a message",
      "call back"
    ],
    "a": "call back"
  },
  {
    "q": "What does “record details of what your call is about” mean?",
    "options": [
      "smile",
      "greet",
      "put on hold",
      "make a checklist"
    ],
    "a": "make a checklist"
  },
  {
    "q": "What does “make someone wait and listen to music” mean?",
    "options": [
      "dial",
      "answer",
      "hang up",
      "put on hold"
    ],
    "a": "put on hold"
  },
  {
    "q": "Which request matches “confirm/my order/by email”?",
    "options": [
      "Could you please check my order via Internet?",
      "Could I use your phone?",
      "I’m afraid I’m waiting for an important call.",
      "Can you help me with the email?"
    ],
    "a": "Could you please check my order via Internet?"
  },
  {
    "q": "Which request matches “speak to/salesperson”?",
    "options": [
      "I’m afraid I’m writing an urgent report.",
      "Can you help me with this email?",
      "Could I speak to the salesperson, please?",
      "I need to ask your colleague."
    ],
    "a": "Could I speak to the salesperson, please?"
  },
  {
    "q": "Which request matches “ask you/new software”?",
    "options": [
      "Can I use your phone?",
      "Could you show me the new software?",
      "Could you confirm my order?",
      "I’m sorry, but I’m writing an urgent report."
    ],
    "a": "Could you show me the new software?"
  },
  {
    "q": "Which request matches “call my customer back”?",
    "options": [
      "I need to speak to the salesperson.",
      "Can you help me with this email?",
      "I’m afraid I can’t call now.",
      "Could you call my customer back?"
    ],
    "a": "Could you call my customer back?"
  },
  {
    "q": "Which request matches “talk to you/at 5 o’clock”?",
    "options": [
      "Could you confirm my order?",
      "I’m writing an urgent report.",
      "Could I use your phone?",
      "Can we talk at 5 o’clock?"
    ],
    "a": "Can we talk at 5 o’clock?"
  },
  {
    "q": "Which request matches “come in/early/tomorrow morning”?",
    "options": [
      "Sorry, I can’t fly to Colombia.",
      "Can you come in early tomorrow morning?",
      "I’m afraid I’m waiting for an important call.",
      "Could you confirm my order?"
    ],
    "a": "Can you come in early tomorrow morning?"
  },
  {
    "q": "Choose the correct sentence (Present Continuous):",
    "options": [
      "She goes to the shop now.",
      "She is going to the shop now.",
      "She is go to the shop now.",
      "She going to the shop now."
    ],
    "a": "She is going to the shop now."
  },
  {
    "q": "Which question is correct (Present Continuous)?",
    "options": [
      "You are reading a book at the moment?",
      "Are you read a book at the moment?",
      "Are you reading a book at the moment?",
      "Do you reading a book at the moment?"
    ],
    "a": "Are you reading a book at the moment?"
  },
  {
    "q": "Complete the sentence: “Look! The children _______ in the garden.”",
    "options": [
      "play",
      "plays",
      "are playing",
      "is playing"
    ],
    "a": "are playing"
  },
  {
    "q": "Choose the correct negative form (Present Continuous):",
    "options": [
      "He not listening to music.",
      "He are not listening to music.",
      "He not is listening to music.",
      "He is not listening to music."
    ],
    "a": "He is not listening to music."
  },
  {
    "q": "Complete the sentence: “I _______ my homework right now.”",
    "options": [
      "do",
      "are doing",
      "am doing",
      "doing"
    ],
    "a": "am doing"
  },
  {
    "q": "Which sentence shows a temporary action?",
    "options": [
      "She lived in London last year.",
      "She lives in London.",
      "She will live in London next year.",
      "She is living with her parents for a few weeks."
    ],
    "a": "She is living with her parents for a few weeks."
  },
  {
    "q": "Complete the question: “What _______ you _______ at the moment?”",
    "options": [
      "do / do",
      "are / do",
      "is / doing",
      "are / doing"
    ],
    "a": "are / doing"
  },
  {
    "q": "Choose the correct sentence:",
    "options": [
      "They is watching TV now.",
      "They watching TV now.",
      "They watch TV now.",
      "They are watching TV now."
    ],
    "a": "They are watching TV now."
  },
  {
    "q": "Which sentence is an offer of help?",
    "options": [
      "I leave a message.",
      "Can you leave a message?",
      "Would you like to leave a message?",
      "Do you want to leave a message?"
    ],
    "a": "Would you like to leave a message?"
  },
  {
    "q": "Which sentence is an invitation?",
    "options": [
      "I write down the message.",
      "Would you like me to take a message?",
      "I can take a message.",
      "Will I take a message?"
    ],
    "a": "Would you like me to take a message?"
  },
  {
    "q": "How would you politely ask someone to call back later?",
    "options": [
      "Call me back.",
      "Call later.",
      "Can you call me later?",
      "Could you call you back later?"
    ],
    "a": "Can you call me later?"
  },
  {
    "q": "Which is a correct way to offer to send something by post?",
    "options": [
      "I send it to you.",
      "Post it to you?",
      "Can I post it to you today?",
      "Can you post it?"
    ],
    "a": "Can I post it to you today?"
  },
  {
    "q": "How do you politely offer to connect someone to another person?",
    "options": [
      "I connect you now.",
      "Connect you to the manager?",
      "You go to sales manager.",
      "Shall I connect you to the sales manager?"
    ],
    "a": "Shall I connect you to the sales manager?"
  },
  {
    "q": "Which sentence is a polite way to suggest thinking before deciding?",
    "options": [
      "Think before.",
      "Can you think?",
      "Think about that before you decide.",
      "Shall I think about that before you decide?"
    ],
    "a": "Think about that before you decide."
  },
  {
    "q": "How can you offer to confirm information by email?",
    "options": [
      "I confirm by email.",
      "Confirm email.",
      "Can email?",
      "Shall I confirm that for you by email?"
    ],
    "a": "Shall I confirm that for you by email?"
  },
  {
    "q": "Which is a correct way to invite someone to speak tomorrow?",
    "options": [
      "Speak to me tomorrow about that?",
      "Can you speak to me tomorrow?",
      "Shall we speak to me tomorrow about that?",
      "Shall I speak to you tomorrow about that?"
    ],
    "a": "Shall I speak to you tomorrow about that?"
  },
  {
    "q": "How do you say this email address in English? Email: info@myworld.biz/news",
    "options": [
      "info my world at dot biz news",
      "info at my world slash biz dot news",
      "info dot my world at biz slash news",
      "info at my world dot biz slash news"
    ],
    "a": "info at my world dot biz slash news"
  },
  {
    "q": "How do you say this email address in English? Email: maria@bt.com",
    "options": [
      "maria b t at dot com",
      "maria at b t slash com",
      "maria at b t dot com",
      "maria dot b t at com"
    ],
    "a": "maria at b t dot com"
  },
  {
    "q": "How do you say this date in English? Date: 4 June 2004",
    "options": [
      "Four June, two hundred four",
      "Fourteenth of June, two thousand and four",
      "June four, two thousand six",
      "June fourth, two thousand four"
    ],
    "a": "June fourth, two thousand four"
  },







        ]
    }
};
}

let tournament = {
    isActive: false,       // Musobaqa ochiqmi?
    participants: [],      // To'lov qilgan foydalanuvchilar ID-lari
    results: {},           // { userId: { score: 0, time: 0 } }
    subject: null          // Musobaqa qaysi fandan bo'ladi?
};

const TOURNAMENT_FILE = path.join(DATA_DIR, 'tournament_data.json');
// Eskidan saqlangan musobaqa bo'lsa, yuklaymiz
if (fs.existsSync(TOURNAMENT_FILE)) {
    try { tournament = JSON.parse(fs.readFileSync(TOURNAMENT_FILE)); } catch(e) {}
}

if (fs.existsSync(QUESTIONS_FILE)) {
    try {
        SUBJECTS = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
    } catch (e) { console.error("Savollarni o'qishda xato"); }
}

const timers = {};
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function getProgressBar(current, total) {
    const size = 10;
    const progress = Math.min(Math.round((current / total) * size), size);
    return "█".repeat(progress) + "░".repeat(size - progress);
}

function updateGlobalScore(userId, name, username, score) {
    try {
        let db = getDb();
        if (!db.users[userId]) {
            db.users[userId] = { 
                name: name || "Foydalanuvchi", 
                username: username ? `@${username}` : "Lichka yopiq",
                score: 0, 
                totalTests: 0 
            };
        }
        db.users[userId].totalTests = (db.users[userId].totalTests || 0) + 1;
        
        // Ballarni shunchaki qo'shish (Eski kodingizda faqat eng yuqorisini saqlardi)
        db.users[userId].score = (db.users[userId].score || 0) + score;
        
        db.users[userId].name = name;
        db.users[userId].username = username ? `@${username}` : "Lichka yopiq";
        
        saveDb(db); // Biz yangilagan saveDb ni chaqiramiz
    } catch (error) { console.error("Bazaga yozishda xato:", error); }
}

function getLeaderboard(ctx) {
    const db = getDb();
    if (!db.users) return "Hozircha hech kim test topshirmadi.";
    
    const usersArray = Object.values(db.users);
    if (usersArray.length === 0) return "Hozircha hech kim test topshirmadi.";
    
    // BU YERGA O'ZINGIZNING ID RAQAMINGIZNI YOZING
    const ADMIN_ID = 123456789; 
    const isRequesterAdmin = ctx && ctx.from && ctx.from.id === ADMIN_ID;

    // Saralash (ballar bo'yicha)
    const sorted = usersArray.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
    
    let res = "🏆 <b>TOP 10 REYTING</b>\n\n";
    sorted.forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🔹";
        const name = u.name || "Noma'lum";
        
        // NIK (username) FAQAT ADMIN UCHUN SHAKLLANTIRILADI
        let userLink = "";
        if (isRequesterAdmin && u.username && u.username !== "Lichka yopiq") {
            userLink = ` (@${u.username})`;
        }

        res += `${medal} <b>${name}</b>${userLink} — ${(u.score || 0).toFixed(1)} ball\n`;
    });
    return res;
}

function showSubjectMenu(ctx) {
    const db = getDb(); // Bazani o'qiymiz
    
    // Tugmalarni English (Ingliz tili) qo'shilgan holati
    let keyboard = [
        ["📝 Akademik yozuv", "📜 Tarix"],
        ["➕ Matematika", "🧲 Fizika"],
        ["💻 Dasturlash 1", "🇬🇧 Perfect English"] // Dasturlashning yoniga qo'shildi
    ];

    // AGAR ADMIN TURBO REJIMNI YOQQAN BO'LSA
    if (db.settings?.turboMode) {
        keyboard.unshift(["🚀 TURBO YODLASH (16:30)"]);
    }

    // Musobaqa holati
    if (tournament.isActive) {
        keyboard.push(["🏆 Musobaqada qatnashish"]);
    }

    // Pastki menyu
    keyboard.push(["📊 Reyting", "👤 Profil"]);

    return ctx.reply("Fanni tanlang:", Markup.keyboard(keyboard).resize());
}

function makeUserVip(userId) {
    const db = getDb();
    if (db.users[userId]) {
        db.users[userId].isVip = true;
        saveDb(db);
        return true;
    }
    return false;
}

async function sendQuestion(ctx, isNew = false) {
    const s = ctx.session;
    const userId = ctx.from.id;
    if (timers[userId]) clearTimeout(timers[userId]);

    // ==========================================
    // 🏁 1. TEST YAKUNLANISHI VA TAHLIL QISMI
    // ==========================================
    if (s.index >= s.activeList.length) {
        if (!s.isTurbo) {
            updateGlobalScore(userId, s.userName, ctx.from.username, s.score);
        }
        
        // Asosiy natija sarlavhasi
        let resultMsg = s.isTurbo 
            ? `🏁 <b>Turbo yodlash yakunlandi!</b>`
            : `🏁 <b>Test yakunlandi, ${s.userName}!</b>\n\n` +
              `✅ To'g'ri javob: <b>${s.score} ta</b>\n` +
              `❌ Xato javob: <b>${s.wrongs.length} ta</b>\n` +
              `📊 Natija: <b>${((s.score / s.activeList.length) * 100).toFixed(1)}%</b>\n` +
              `_________________________\n\n`;

        // 📝 XATOLAR TAHLILINI QO'SHAMIZ
        if (s.wrongs.length > 0 && !s.isTurbo) {
            resultMsg += `⚠️ <b>Xatolar tahlili:</b>\n\n`;
            
            s.wrongs.forEach((xato, i) => {
                 resultMsg += `<b>${i + 1}.</b> ${escapeHTML(xato.q)}\n` +
                 `❌ Siz tanladingiz: <s>${escapeHTML(xato.userAnswer || "Vaqt tugadi")}</s>\n` +
                 `✅ To'g'ri javob: <u>${escapeHTML(xato.a)}</u>\n` +
                 `_________________________\n\n`;
});
        } else if (!s.isTurbo) {
            resultMsg += `🌟 <b>Ajoyib! Hech qanday xato qilmadingiz!</b>\n`;
        }

        // Telegram xabari limiti (4096 belgi) oshib ketmasligi uchun tekshiruv
        if (resultMsg.length > 4000) {
            resultMsg = resultMsg.substring(0, 3950) + "\n\n...(Xatolar ko'p, hammasi sig'madi)";
        }

        s.isTurbo = false;
        return ctx.replyWithHTML(resultMsg, Markup.keyboard([
            ["⚡️ Blitz (25)", "📝 To'liq test"], 
            ["⬅️ Orqaga (Fanlar)"]
        ]).resize());
    }

    // 🛑 XATOLIKDAN HIMOYA
    const qData = s.activeList[s.index];
    if (!qData || !qData.q) {
        s.index++;
        return sendQuestion(ctx, true);
    }

    const safeQuestion = escapeHTML(qData.q);
    const progress = getProgressBar(s.index + 1, s.activeList.length);
    const imagePath = qData.image ? `./images/${qData.image}` : null;
    const hasImage = imagePath && fs.existsSync(imagePath);

    // ==========================================
    // 🚀 TURBO YODLASH REJIMI
    // ==========================================
    if (s.isTurbo) {
        let turboText = `🚀 <b>TURBO YODLASH</b>\n📊 [${progress}]\n🔢 Savol: <b>${s.index + 1} / ${s.activeList.length}</b>\n` +
                        `_________________________\n\n❓ <b>${safeQuestion}</b>\n\n` +
                        `✅ <b>TO'G'RI JAVOB:</b>\n<code>${escapeHTML(qData.a)}</code>\n` +
                        `_________________________\n👇 Keyingi savol:`;

        const turboButtons = Markup.inlineKeyboard([
            [Markup.button.callback("Keyingi savol ➡️", "next_turbo_q")],
            [Markup.button.callback("🛑 To'xtatish", "stop_test")]
        ]);

        if (hasImage) {
            return await ctx.replyWithPhoto({ source: imagePath }, { caption: turboText, parse_mode: 'HTML', ...turboButtons });
        }
        try {
            if (isNew) return await ctx.replyWithHTML(turboText, turboButtons);
            return await ctx.editMessageText(turboText, { parse_mode: 'HTML', ...turboButtons });
        } catch (e) {
            return await ctx.replyWithHTML(turboText, turboButtons);
        }
    }

    // ==========================================
    // 📝 ODDIY TEST REJIMI
    // ==========================================
    const currentTimeLimit = s.userTimeLimit || botSettings.timeLimit || 30;
    s.currentOptions = shuffle([...qData.options]);
    const labels = ['A', 'B', 'C', 'D'];

    let text = `📊 Progress: [${progress}]\n🔢 Savol: <b>${s.index + 1} / ${s.activeList.length}</b>\n` +
               `⏱ <b>VAQT: ${currentTimeLimit}s</b>\n\n❓ <b>${safeQuestion}</b>\n\n`;

    s.currentOptions.forEach((opt, i) => { text += `<b>${labels[i]})</b> ${escapeHTML(opt)}\n\n`; });

    const inlineButtons = Markup.inlineKeyboard([
        s.currentOptions.map((_, i) => Markup.button.callback(labels[i], `ans_${i}`)),
        [Markup.button.callback("💡 Tushuntirish", "show_explanation")], 
        [Markup.button.callback("🛑 Testni to'xtatish", "stop_test")]
    ]);

    if (hasImage) {
        await ctx.replyWithPhoto({ source: imagePath }, { caption: text, parse_mode: 'HTML', ...inlineButtons });
    } else {
        try {
            if (isNew) await ctx.replyWithHTML(text, inlineButtons);
            else await ctx.editMessageText(text, { parse_mode: 'HTML', ...inlineButtons });
        } catch (e) {
            await ctx.replyWithHTML(text, inlineButtons);
        }
    }

    // Taymer
    timers[userId] = setTimeout(async () => {
        if (ctx.session && ctx.session.index === s.index && !ctx.session.isTurbo) {
            // Vaqt tugaganda xatolarga qo'shish
            ctx.session.wrongs.push({ ...qData, userAnswer: "Vaqt tugadi ⏰" });
            ctx.session.index++; 
            await ctx.replyWithHTML(`⏰ <b>VAQT TUGADI!</b>`);
            sendQuestion(ctx, true);
        }
    }, currentTimeLimit * 1000);
}

async function checkSubscription(ctx) {
    try {
        // Kanal yuzernami yoki ID orqali tekshirish
        const member = await ctx.telegram.getChatMember(REQUIRED_CHANNEL, ctx.from.id);
        const status = member.status;
        
        // Agar foydalanuvchi kanalda bo'lsa: member, administrator yoki creator bo'ladi
        return ['member', 'administrator', 'creator'].includes(status);
    } catch (error) {
        console.error("Obunani tekshirishda xato:", error);
        return false; // Xatolik bo'lsa (masalan bot kanalda admin emas), xavfsizlik uchun false qaytaramiz
    }
}

async function showProfile(ctx) {
    const db = getDb();
    const userId = ctx.from.id;
    const user = db.users[userId];

    if (!user) {
        return ctx.reply("Siz hali test topshirmagansiz. Avval test yechib ko'ring!");
    }

    // Reytingdagi o'rnini aniqlash
    const usersArray = Object.values(db.users);
    const sortedUsers = usersArray.sort((a, b) => (b.score || 0) - (a.score || 0));
    const rank = sortedUsers.findIndex(u => u.id === userId) + 1;

    let profileMsg = `👤 <b>SIZNING PROFILINGIZ</b>\n\n`;
    profileMsg += `🆔 <b>ID:</b> <code>${userId}</code>\n`;
    profileMsg += `👤 <b>Ism:</b> ${user.name || "Kiritilmagan"}\n`;
    profileMsg += `🏆 <b>Umumiy ball:</b> ${user.score.toFixed(1)} ball\n`;
    profileMsg += `📈 <b>Reytingdagi o'rningiz:</b> ${rank}-o'rin (jami ${usersArray.length} tadan)\n\n`;
    
    // Foydalanuvchiga qo'shimcha motivatsiya
    if (rank <= 10) {
        profileMsg += `🌟 Siz TOP-10 talikdasiz! Baraka bering!`;
    } else {
        profileMsg += `🚀 TOP-10 ga kirish uchun yana biroz harakat qiling!`;
    }

    return ctx.replyWithHTML(profileMsg);
}

// BU FUNKSIYANI KODINGIZNING OXIRIGA QO'SHIB QO'YING
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}



bot.use(async (ctx, next) => {
    const db = getDb();
    // Agar bot to'xtatilgan bo'lsa va foydalanuvchi admin bo'lmasa
    if (db.settings?.isMaintenance && ctx.from?.id !== ADMIN_ID) {
        return ctx.reply("🛠 Botimizda hozirda texnik ishlar olib borilmoqda. Tez orada qaytamiz! Sabringiz uchun rahmat.");
    }
    return next();
});

// --- ADMIN KOMANDALARI ---
bot.command('admin', (ctx) => {
    if (ctx.from.id === ADMIN_ID) {
        const db = getDb();
        const statusEmoji = db.settings?.isMaintenance ? "🟢 Botni Yoqish" : "🛑 Botni To'xtatish";
        const turboEmoji = db.settings?.turboMode ? "🚀 Turbo (O'chirish)" : "🚀 Turbo (Yoqish)";
        
        return ctx.reply(`🛠 **Admin Panel**`, 
            Markup.keyboard([
                ['💰 Pullik versiya', '🆓 Bepul versiya'],
                [statusEmoji, turboEmoji],
                ['🏆 Musobaqa boshqarish', '📊 Statistika'],
                ['🗑 Foydalanuvchini o\'chirish', '🧹 Reytingni tozalash'], // Yangi tugma
                ['📣 Xabar tarqatish', '⬅️ Orqaga (Fanlar)']
            ]).resize());
    }
});


bot.use(async (ctx, next) => {
    // Agar bu start komandasi bo'lsa, o'tkazib yuboramiz (ism kiritish uchun)
    if (ctx.message && ctx.message.text === '/start') return next();
    
    // Obunani tekshiramiz
    const isSubscribed = await checkSubscription(ctx);
    
    if (!isSubscribed) {
        return ctx.reply(
            "⚠️ Botdan foydalanish uchun rasmiy kanalimizga obuna bo'lishingiz shart!",
            Markup.inlineKeyboard([
                [Markup.button.url("📢 Kanalga o'tish", `https://t.me/${REQUIRED_CHANNEL.replace('@', '')}`)],
                [Markup.button.callback("✅ Tekshirish", "check_sub")]
            ])
        );
    }
    
    return next(); // Obuna bo'lgan bo'lsa, keyingi ishlarga o'tadi
});

// "✅ Tekshirish" tugmasi bosilganda
bot.action('check_sub', async (ctx) => {
    const isSubscribed = await checkSubscription(ctx);
    if (isSubscribed) {
        await ctx.answerCbQuery("✅ Rahmat! Endi botdan foydalanishingiz mumkin.");
        await ctx.deleteMessage();
        return showSubjectMenu(ctx);
    } else {
        return ctx.answerCbQuery("❌ Siz hali ham kanalga obuna emassiz!", { show_alert: true });
    }
});


bot.action("next_turbo_q", async (ctx) => {
    if (ctx.session && ctx.session.isTurbo) {
        ctx.session.index++;
        // Har doim true yuboramiz, chunki rasm bo'lsa editMessageText xato beradi
        return sendQuestion(ctx, true); 
    }
    await ctx.answerCbQuery();
});

bot.action("show_explanation", async (ctx) => {
    const s = ctx.session;
    const userId = ctx.from.id;
    const db = getDb();
    
    const user = db.users[userId] || {};
    const isUserVip = user.isVip;
    const isUserAdmin = (userId === Number(ADMIN_ID));

    // 1. VIP tekshiruvi
    if (!isUserVip && !isUserAdmin) {
        await ctx.answerCbQuery("🔒 Faqat VIP a'zolar uchun!", { show_alert: true });
        return ctx.replyWithHTML(
            `⭐ <b>DIQQAT: Tushuntirishlar faqat VIP a'zolar uchun!</b>\n\n` +
            `Yechimlarni ko'rish uchun VIP statusini sotib oling.`,
            Markup.inlineKeyboard([[Markup.button.callback("💎 VIP sotib olish", "buy_vip")]])
        );
    }

    // 2. Savolni olish
    const qData = s.activeList && s.activeList[s.index];
    if (!qData) return ctx.answerCbQuery("Xatolik: Savol topilmadi.");

    // 3. Tushuntirish borligini tekshirish
    if (qData.hint && qData.hint.trim() !== "") {
        await ctx.answerCbQuery("🔍 Tushuntirish qo'shildi");

        const progress = getProgressBar(s.index + 1, s.activeList.length);
        const safeQuestion = escapeHTML(qData.q);
        
        // Asosiy matnni yig'amiz
        let updatedText = `📊 Progress: [${progress}]\n` +
                          `🔢 Savol: <b>${s.index + 1} / ${s.activeList.length}</b>\n\n` +
                          `❓ <b>${safeQuestion}</b>\n\n` +
                          `━━━━━━━━━━━━━━\n` +
                          `💡 <b>TUSHUNTIRISH:</b>\n${escapeHTML(qData.hint)}\n` +
                          `━━━━━━━━━━━━━━\n\n`;

        // Agar test rejimida bo'lsa variantlarni ham qayta yozamiz
        if (!s.isTurbo) {
            const labels = ['A', 'B', 'C', 'D'];
            const options = s.currentOptions || [];
            options.forEach((opt, i) => {
                updatedText += `<b>${labels[i]})</b> ${escapeHTML(opt)}\n\n`;
            });
        } else {
            // Turbo rejimda to'g'ri javobni ko'rsatamiz
            updatedText += `✅ <b>TO'G'RI JAVOB:</b>\n<code>${escapeHTML(qData.a)}</code>\n`;
        }

        // Tugmalarni o'zgarishsiz qoldirish uchun xabardan olamiz
        const keyboard = ctx.callbackQuery.message.reply_markup;

        try {
            // Agar rasm bo'lsa editMessageCaption, matn bo'lsa editMessageText ishlatiladi
            if (ctx.callbackQuery.message.photo) {
                await ctx.editMessageCaption(updatedText, { parse_mode: 'HTML', reply_markup: keyboard });
            } else {
                await ctx.editMessageText(updatedText, { parse_mode: 'HTML', reply_markup: keyboard });
            }
        } catch (e) {
            // Agar foydalanuvchi tugmani 2 marta bossa va matn o'zgarmasa xato bermasligi uchun
            console.log("Xabarni tahrirlashda xatolik yoki matn o'zgarmagan.");
        }
    } else {
        return ctx.answerCbQuery("⚠️ Bu savolga tushuntirish hali qo'shilmagan.", { show_alert: true });
    }
});

// Tushuntirish xabarini o'chirish uchun (ixtiyoriy)
bot.action("close_explanation", (ctx) => ctx.deleteMessage());

bot.action("confirm_clear_rank", async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery("Ruxsat yo'q!");
    
    const db = getDb();
    
    // Foydalanuvchilarning ballarini 0 qilish
    Object.keys(db.users).forEach(userId => {
        db.users[userId].score = 0;
    });

    // Agar alohida scores massivi bo'lsa uni bo'shatish
    if (db.scores) db.scores = [];

    saveDb(db);
    
    await ctx.editMessageText("✅ Reyting va barcha foydalanuvchilar ballari muvaffaqiyatli tozalandi.");
    return ctx.answerCbQuery();
});

bot.use(async (ctx, next) => {
    const db = getDb();
    const userId = ctx.from?.id;

    // Agar bot "Maintenance" holatida bo'lsa va yozayotgan odam Admin bo'lmasa
    if (db.settings?.isMaintenance && userId !== ADMIN_ID) {
        return ctx.reply("⚠️ Botda texnik ishlar olib borilmoqda. Tez orada qaytamiz!");
    }

    return next();
});


bot.hears("🗑 Foydalanuvchini o'chirish", (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.session.adminStep = 'wait_delete_id';
    return ctx.reply("🗑 O'chirmoqchi bo'lgan foydalanuvchining ID raqamini kiriting (yoki profilidan nusxa olib tashlang):");
});


bot.hears(["🚀 Turbo (Yoqish)", "🚀 Turbo (O'chirish)"], async (ctx) => {
  const db = getDb();
    if (ctx.from.id !== ADMIN_ID) return;
    if (!db.settings) db.settings = {};

    const isTurningOn = ctx.message.text.includes("Yoqish");
    db.settings.turboMode = isTurningOn;
    saveDb(db);

    const msg = isTurningOn ? "🚀 TURBO REJIM YOQILDI!" : "🚀 Turbo rejim o'chirildi.";
    
    // Xabar yuboramiz va avtomatik Admin panelni qayta chiqaramiz
    await ctx.reply(msg);
    
    // Bu yerda admin panel funksiyasini qayta chaqiramiz (o'zingizni kodingizdagi admin menyusi)
    const statusEmoji = db.settings?.isMaintenance ? "🟢 Botni Yoqish" : "🛑 Botni To'xtatish";
    const turboEmoji = db.settings?.turboMode ? "🚀 Turbo (O'chirish)" : "🚀 Turbo (Yoqish)";
    
    return ctx.reply(`🛠 **Admin Panel** qaytadan yuklandi`, 
        Markup.keyboard([
            ['💰 Pullik versiya', '🆓 Bepul versiya'],
            [statusEmoji, turboEmoji],
            ['🏆 Musobaqa boshqarish', '➕ Yangi fan qoshish'],
            ['⏱ Vaqtni o\'zgartirish', '📊 Statistika'],
            ['📣 Xabar tarqatish', '⬅️ Orqaga (Fanlar)']
        ]).resize());
});

// To'xtatish tugmasi bosilganda
// Botni to'xtatish (Mantiqiy qismi)
bot.hears(["🛑 Botni To'xtatish", "🟢 Botni Yoqish"], async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;

    const db = getDb(); // Fayldan bazani oqish
    if (!db.settings) db.settings = {};

    const isStopping = ctx.message.text === "🛑 Botni To'xtatish";
    db.settings.isMaintenance = isStopping;
    
    saveDb(db); // Bazaga saqlash

    const text = isStopping ? "🔴 Bot hamma uchun to'xtatildi!" : "🟢 Bot qayta yoqildi!";
    const buttonText = isStopping ? "🟢 Botni Yoqish" : "🛑 Botni To'xtatish";

    return ctx.reply(text, Markup.keyboard([
        ['🏆 Musobaqa boshqarish', buttonText],
        ['➕ Yangi fan qoshish', '📊 Statistika'],
        ['⬅️ Orqaga (Fanlar)']
    ]).resize());
});











bot.hears("👤 Profil", async (ctx) => {
    return showProfile(ctx);
});

// 1. Musobaqa boshqaruv menyusini ochish
bot.hears('🏆 Musobaqa boshqarish', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    // Hozirgi holatni aniqlash
    const status = tournament.isActive ? "✅ YOQILGAN" : "❌ O'CHIRILGAN";
   
    return ctx.reply(`🏆 Musobaqa boshqaruv paneli\nHozirgi holat: ${status}`, 
        Markup.keyboard([
            ['🟢 Yoqish', '🔴 O\'chirish'],
            ['📢 Boshlash haqida xabar', '📊 Natijalar'],
            ['⬅️ Orqaga (Admin)']
        ]).resize());
        
});

// 2. Musobaqani yoqish mantiqi
bot.hears('🟢 Yoqish', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    tournament.isActive = true;
    tournament.results = {}; // Yangi musobaqa uchun natijalarni nolga tushiramiz
    
    // Ma'lumotni faylga saqlash (Bot o'chib yonsa ham o'zgarmaydi)
    fs.writeFileSync(TOURNAMENT_FILE, JSON.stringify(tournament));
    
    return ctx.reply("✅ Musobaqa rejimi yoqildi! Foydalanuvchilar endi musobaqa testiga kira oladilar.");
});

// 3. Musobaqani o'chirish mantiqi
bot.hears('🔴 O\'chirish', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    
    tournament.isActive = false;
    fs.writeFileSync(TOURNAMENT_FILE, JSON.stringify(tournament));
    
    return ctx.reply("🛑 Musobaqa rejimi o'chirildi. Foydalanuvchilar endi testga kira olmaydi.");
});



bot.hears('➕ Yangi fan qoshish', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.session.waitingForSubjectName = true;
    return ctx.reply("Yangi fan nomini kiriting (Masalan: Fizika):", 
        Markup.keyboard([['🚫 Bekor qilish']]).resize());
});

// Statistika tugmasini eshitish (Admin uchun)
bot.hears('📊 Statistika', (ctx) => {
  const db = getDb();
    if (ctx.from.id !== ADMIN_ID) return;

    const users = Object.values(db.users || {});
    const totalUsers = users.length;
    const totalTests = users.reduce((sum, u) => sum + (u.totalTests || 0), 0);
    
    let report = `📊 **BOT STATISTIKASI**\n\n`;
    report += `👥 Jami foydalanuvchilar: ${totalUsers} ta\n`;
    report += `📝 Jami topshirilgan testlar: ${totalTests} ta\n`;
    
    return ctx.reply(report);
});
// Musobaqa menyusidan Admin paneliga qaytish
bot.hears('⬅️ Orqaga (Admin)', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    return ctx.reply("Admin paneli:", Markup.keyboard([
        ['💰 Pullik versiya', '🆓 Bepul versiya'],
        ['🏆 Musobaqa boshqarish', '➕ Yangi fan qoshish'],
        ['⏱ Vaqtni o\'zgartirish', '📊 Statistika'],
        ['📣 Xabar tarqatish', '⬅️ Orqaga (Fanlar)']
    ]).resize());
});

// 1. Admin xabar yuborish tugmasini bosganda
bot.hears('📣 Xabar tarqatish', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.session.waitingForForward = true; // Xabar kutish holatiga o'tamiz
    return ctx.reply("Yubormoqchi bo'lgan xabaringizni (matn, rasm, video) yuboring yoki forward qiling:", 
        Markup.keyboard([['🚫 Bekor qilish']]).resize());
});

// 1. Pullik versiyani yoqish
bot.hears('💰 Pullik versiya', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    isBotPaidMode = true; // Botni pullik rejimga o'tkazamiz
    return ctx.reply("✅ Bot PULLIK REJIMGA o'tkazildi. Endi faqat VIP foydalanuvchilar test topshira oladi.");
});

// 2. Bepul versiyani yoqish
bot.hears('🆓 Bepul versiya', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    isBotPaidMode = false; // Botni bepul rejimga o'tkazamiz
    return ctx.reply("✅ Bot BEPUL REJIMGA o'tkazildi. Hamma test topshirishi mumkin.");
});

// 1. Tugma bosilganda
bot.hears("🗑 Foydalanuvchini o'chirish", (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.session.adminStep = 'wait_delete_id';
    return ctx.reply("🗑 O'chirmoqchi bo'lgan foydalanuvchining ID raqamini kiriting (yoki profilidan nusxa olib tashlang):");
});


// 1. Tugma bosilganda so'rash
bot.hears("🧹 Reytingni tozalash", (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    return ctx.reply("⚠️ Siz rostdan ham barcha foydalanuvchilar ballarini va reytingni butunlay tozalamoqchimisiz?", 
        Markup.inlineKeyboard([
            [Markup.button.callback("✅ Ha, tozalash", "confirm_clear_rank")],
            [Markup.button.callback("❌ Yo'q, bekor qilish", "cancel_clear")]
        ]));
});

bot.action("cancel_clear", (ctx) => ctx.deleteMessage());

// 2. ID raqami yozilganda ishlaydigan logika
bot.on('text', async (ctx, next) => {
    const s = ctx.session;
    
    if (ctx.from.id === ADMIN_ID && s.adminStep === 'wait_delete_id') {
        let input = ctx.message.text.trim();
        const db = getDb();
        let targetId = null;

        // 1. Agar username kiritilgan bo'lsa (@ belgi bilan yoki belgisiz)
        if (input.startsWith('@') || isNaN(input)) {
            const searchName = input.replace('@', '').toLowerCase();
            
            // Bazadan shu usernameli odamni qidiramiz
            targetId = Object.keys(db.users).find(id => {
                const user = db.users[id];
                return user.username && user.username.toLowerCase() === searchName;
            });
        } else {
            // 2. Agar to'g'ridan-to'g'ri ID kiritilgan bo'lsa
            targetId = input;
        }

        // O'chirish jarayoni
        if (targetId && db.users[targetId]) {
            const userName = db.users[targetId].name || "Noma'lum";
            const userTag = db.users[targetId].username ? `@${db.users[targetId].username}` : "Nik yo'q";

            // Asosiy bazadan o'chirish
            delete db.users[targetId];
            
            // Reytingdan o'chirish
            if (db.scores) {
                db.scores = db.scores.filter(u => String(u.id) !== String(targetId));
            }

            saveDb(db);
            s.adminStep = null;

            return ctx.reply(`✅ Foydalanuvchi topildi va o'chirildi:\n👤 Ism: ${userName}\nℹ️ Nik: ${userTag}\n🆔 ID: ${targetId}`);
        } else {
            return ctx.reply("❌ Bunday foydalanuvchi topilmadi.\n\nEslatma: Foydalanuvchi botni kamida bir marta ishlatgan va bazaga tushgan bo'lishi kerak.");
        }
    }
    return next();
});
bot.on(['text', 'photo', 'video', 'animation', 'document'], async (ctx, next) => {
    // Agar matn bo'lsa matnni, rasm ostida yozilgan bo'lsa captionni oladi
    const text = ctx.message.text || ctx.message.caption; 
    const userId = ctx.from.id;
    const username = ctx.from.username || "Lichka yopiq";

    // Komandalar bo'lsa o'tkazib yuboramiz
    if (text && text.startsWith('/')) return next();

    // 1. HAR QANDAY HOLATDA BEKOR QILISH (ENG TEPADA TURISHI SHART)
    if (text === '🚫 Bekor qilish') {
        ctx.session.waitingForForward = false;
        ctx.session.waitingForTime = false;
        ctx.session.waitingForSubjectName = false;
        ctx.session.waitingForSubjectQuestions = false;
        ctx.session.waitingForName = false;
        return showSubjectMenu(ctx);
    }

    
    if (ctx.session.waitingForReceipt && ctx.message.photo) {
        ctx.session.waitingForReceipt = false;
        const userId = ctx.from.id;
        
        await ctx.telegram.sendPhoto(ADMIN_ID, ctx.message.photo[0].file_id, {
            caption: `🔔 <b>Yangi to'lov!</b>\n👤 Foydalanuvchi: ${ctx.from.first_name}\n🆔 ID: <code>${userId}</code>`,
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback("✅ Tasdiqlash", `approve_${userId}`)],
                [Markup.button.callback("❌ Rad etish", `reject_${userId}`)]
            ])
        });
        return ctx.reply("✅ Chekingiz adminga yuborildi. Tasdiqlangach sizga xabar boradi.");
    }

    // 2. ADMIN: Xabar tarqatish (Media va Matn uchun)
    if (userId === ADMIN_ID && ctx.session.waitingForForward) {
        ctx.session.waitingForForward = false;
        const db = getDb();
        const users = Object.keys(db.users || {});
        let successCount = 0;

        await ctx.reply(`📣 Xabar ${users.length} kishiga yuborilmoqda...`);

        for (const uId of users) {
            try {
                // copyMessage — har qanday formatni (rasm, video, text) aslidek yuboradi
                await ctx.telegram.copyMessage(uId, ctx.chat.id, ctx.message.message_id);
                successCount++;
                if (successCount % 25 === 0) await new Promise(r => setTimeout(r, 500)); 
            } catch (e) {
                console.log(`Bloklangan foydalanuvchi: ${uId}`);
            }
        }
        await ctx.reply(`✅ Xabar yakunlandi!\n\nJami: ${users.length}\nYuborildi: ${successCount}`);
        return showSubjectMenu(ctx);
    }

    // 3. ADMIN: Vaqtni o'zgartirish
    if (userId === ADMIN_ID && ctx.session.waitingForTime) {
        const newTime = parseInt(text);
        if (isNaN(newTime) || newTime < 5) return ctx.reply("❌ Xato raqam! Kamida 5 kiriting:");
        botSettings.timeLimit = newTime;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(botSettings));
        ctx.session.waitingForTime = false;
        await ctx.reply(`✅ Savol vaqti ${newTime} soniyaga yangilandi.`);
        return showSubjectMenu(ctx);
    }

    // 4. ADMIN: Yangi fan qo'shish (Ismi)
    if (userId === ADMIN_ID && ctx.session.waitingForSubjectName) {
        ctx.session.newSubName = text;
        ctx.session.waitingForSubjectName = false;
        ctx.session.waitingForSubjectQuestions = true;
        return ctx.reply(`"${text}" fani uchun savollarni JSON formatida yuboring:`, 
            Markup.keyboard([['🚫 Bekor qilish']]).resize());
    }

    // 5. ADMIN: Fan savollari (JSON)
    if (userId === ADMIN_ID && ctx.session.waitingForSubjectQuestions) {
        try {
            const qs = JSON.parse(text);
            const key = ctx.session.newSubName.toLowerCase().replace(/ /g, '_');
            SUBJECTS[key] = { title: ctx.session.newSubName, questions: qs };
            ctx.session.waitingForSubjectQuestions = false;
            await ctx.reply("✅ Yangi fan muvaffaqiyatli qo'shildi!");
            return showSubjectMenu(ctx);
        } catch (e) {
            return ctx.reply("❌ JSON xatosi! Formatni tekshirib qaytadan yuboring:");
        }
    }

    
    // 6. FOYDALANUVCHI: Ism kiritish (TO'G'IRLANGAN VARIANT)
    if (ctx.session.waitingForName) {
        const input = text.trim();

        // Ism o'rniga menyu tugmalarini bosishdan himoya
        const menuButtons = [
            "📝 Akademik yozuv", "📜 Tarix", "➕ Matematika", 
            "💻 Dasturlash 1", "🧲 Fizika", "🇬🇧 English",
            "📊 Reyting", "👤 Profil", "🚀 TURBO YODLASH (16:30)"
        ];

        if (menuButtons.includes(input)) {
            return ctx.reply("⚠️ Iltimos, ism o'rniga fan tugmalarini bosmang!\nAvval ismingizni yozib yuboring:");
        }

        if (!input || input.length < 3) {
            return ctx.reply("❌ Ism juda qisqa! Kamida 3 ta harfdan iborat ism yozing:");
        }

        ctx.session.userName = input;
        ctx.session.waitingForName = false;
        
        let db = getDb();
        if(!db.users) db.users = {};

        // Foydalanuvchi ma'lumotlarini yangilaymiz (eski ma'lumotlarni ochirmasdan)
        db.users[userId] = { 
            ...db.users[userId], // Eskidan bor ma'lumotlar (score, isVip va h.k.)
            name: input, 
            username: username !== "Lichka yopiq" ? `@${username}` : username,
            date: new Date().toISOString() 
        };

        saveDb(db); // Bazaga saqlaymiz
        await ctx.reply(`✅ Rahmat, ${input}! Ismingiz muvaffaqiyatli saqlandi.`);
        return showSubjectMenu(ctx);
    }

    return next();
});


// bot.on('text', async (ctx, next) => {
//     const s = ctx.session;
//     const db = getDb();
//     const userId = ctx.from.id;
//     const user = db.users[userId];

//     // 1. AGAR BOT ISM KUTAYOTGAN BO'LSA VA FOYDALANUVCHI ISM YOZSA
//     if (s.waitingForName) {
//         const inputName = ctx.message.text.trim();
        
//         if (inputName.length < 3) {
//             return ctx.reply("Ism juda qisqa. Iltimos, ismingizni kiriting:");
//         }

//         // Bazada foydalanuvchi bormi?
//         if (db.users[userId]) {
//             db.users[userId].name = inputName; // Faqat ismni yangilaymiz
//         } else {
//             db.users[userId] = { 
//                 id: userId, 
//                 name: inputName, 
//                 score: 0, 
//                 isVip: false 
//             };
//         }

//         saveDb(db); // Faylga saqlaymiz
//         s.waitingForName = false; // Ism kutishni to'xtatamiz
//         s.userName = inputName;

//         await ctx.reply(`Rahmat, ${inputName}! Endi testlarni yechishingiz mumkin. ✅`);
//         return showSubjectMenu(ctx);
//     }

//     // 2. MUHIM QISMI: AGAR FOYDALANUVCHI ISMI BAZADA BO'LSA, UNGA TUGMALARNI ISHLATISHGA RUXSAT BERISH
//     if (user && user.name) {
//         s.waitingForName = false; // Xavfsizlik uchun sessiyani ham to'g'irlab qo'yamiz
//         return next(); // Keyingi tugma buyruqlariga o'tkazib yuboramiz
//     }

//     // 3. AGAR ISMI YO'Q BO'LSA, FAQAT SHUNDA ISM SO'RAYMIZ
//     s.waitingForName = true;
//     return ctx.reply("Davom etish uchun avval ismingizni kiriting:");
// });






// 2. Kelgan xabarni hamma foydalanuvchilarga tarqatish

bot.hears('⏱ Vaqtni o\'zgartirish', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.session.waitingForTime = true;
    return ctx.reply("Vaqtni soniyalarda kiriting:", Markup.keyboard([['🚫 Bekor qilish']]).resize());
});


// --- TEST BOSHLASH ---
bot.hears(["📝 Akademik yozuv", "📜 Tarix", "➕ Matematika", "💻 Dasturlash 1", "🧲 Fizika", "🇬🇧 Perfect English"], async (ctx) => {
    const text = ctx.message.text;
    const s = ctx.session;

    // 1. Fanni aniqlash (Yangi fanni qo'shdik)
    if (text.includes("Akademik")) s.currentSubject = "academic";
    else if (text.includes("Tarix")) s.currentSubject = "history";
    else if (text.includes("Matematika")) s.currentSubject = "math";
    else if (text.includes("Dasturlash")) s.currentSubject = "dasturlash";
    else if (text.includes("Fizika")) s.currentSubject = "physics";
    else if (text.includes("English")) s.currentSubject = "english"; // English uchun mantiq

    // 2. Agar Turbo rejim bo'lsa
    if (s.isTurbo) {
        // Savollar bazada borligini tekshiramiz
        if (!SUBJECTS[s.currentSubject] || !SUBJECTS[s.currentSubject].questions) {
            return ctx.reply("Bu fanda savollar hali qo'shilmagan.");
        }
        
        const questions = SUBJECTS[s.currentSubject].questions;
        if (questions.length === 0) return ctx.reply("Bu fanda savollar yo'q.");
        
        s.activeList = shuffle([...questions]); 
        s.index = 0;
        s.score = 0;
        s.wrongs = [];
        return sendQuestion(ctx, true);
    }

    // 3. Oddiy rejim (Blitz/To'liq test)
    return ctx.reply(`Tayyormisiz?`, Markup.keyboard([
        ["⚡️ Blitz (25)", "📝 To'liq test"], 
        ["⬅️ Orqaga (Fanlar)"]
    ]).resize());
});

bot.hears(["⚡️ Blitz (25)", "📝 To'liq test"], async (ctx) => {
    const s = ctx.session;
    const userId = ctx.from.id;

    // 🚀 MUHIM: Oddiy test boshlanganda Turbo rejimni o'chiramiz
    s.isTurbo = false;

    // 1. PULLIK REJIM TEKSHIRUVI
    if (isBotPaidMode && !vipUsers.includes(userId) && userId !== ADMIN_ID) {
        return ctx.reply(
            "⚠️ Kechirasiz, bot hozirda pullik rejimda.\nTest topshirish uchun VIP statusini sotib olishingiz kerak.", 
            Markup.inlineKeyboard([
                [Markup.button.callback("💎 VIP sotib olish", "buy_vip")]
            ])
        );
    }

    // 2. FAN VA SAVOLLAR TEKSHIRUVI
    if (!s.currentSubject || !SUBJECTS[s.currentSubject]) return showSubjectMenu(ctx);
    
    const questions = SUBJECTS[s.currentSubject].questions;
    if (!questions || questions.length === 0) return ctx.reply("Bu fanda savollar yo'q.");
    
    // 3. TESTNI BOSHLASH
    s.activeList = ctx.message.text.includes("25") ? shuffle(questions).slice(0, 25) : shuffle(questions);
    s.index = 0; 
    s.score = 0; 
    s.wrongs = [];
    
    // Savol berishni boshlash (isTurbo false bo'lgani uchun oddiy variantlar chiqadi)
    sendQuestion(ctx, true);
});
bot.hears("📊 Reyting", async (ctx) => {
    const db = getDb(); // Fayldan yangi ma'lumotlarni o'qish
    const users = Object.values(db.users);

    // Ballar bo'yicha saralash va 0 balli odamlarni chiqarmaslik (ixtiyoriy)
    const sortedUsers = users
        .filter(u => u.score > 0) 
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    if (sortedUsers.length === 0) {
        return ctx.reply("Hozircha reyting bo'sh. Birinchi bo'lib test yeching!");
    }

    let report = "🏆 <b>TOP 10 REYTING</b>\n\n";
    sortedUsers.forEach((user, index) => {
        report += `${index + 1}. ${user.name} — <b>${user.score}</b> ball\n`;
    });

    return ctx.replyWithHTML(report);
});
bot.hears("⬅️ Orqaga (Fanlar)", (ctx) => showSubjectMenu(ctx));

bot.start((ctx) => {
    const db = getDb();
    const userId = ctx.from.id;
    const user = db.users[userId];

    // 1. Agar foydalanuvchi bazada bo'lsa VA ismi bo'lsa - UNI O'TKAZIB YUBORAMIZ
    if (user && user.name) {
        ctx.session.waitingForName = false; // Ism so'rashni to'xtatamiz
        ctx.session.userName = user.name;
        return showSubjectMenu(ctx); // Fanlar menyusini ko'rsatamiz
    }

    // 2. Agar ismi bo'lmasa - FAQAT SHUNDA ISM SO'RAYMIZ
    ctx.session.waitingForName = true;
    return ctx.reply("Assalomu alaykum! Botimiz yangilandi.\n\nReytingda ballaringiz saqlanib qolishi uchun, iltimos, ismingizni kiriting:");
});

// --- CALLBACKLAR ---
bot.action(/^ans_(\d+)$/, async (ctx) => {
    const s = ctx.session;
    const userId = ctx.from.id;

    if (!s || !s.activeList || s.index === undefined || !s.activeList[s.index]) {
        if (timers[userId]) clearTimeout(timers[userId]);
        await ctx.answerCbQuery("⚠️ Sessiya muddati tugagan.").catch(() => {});
        return ctx.reply("⚠️ Sessiya muddati tugagan. Iltimos, /start bosing.");
    }

    if (timers[userId]) clearTimeout(timers[userId]);

    const selIdx = parseInt(ctx.match[1]);
    const currentQ = s.activeList[s.index];
    const labels = ['A', 'B', 'C', 'D']; 

    try {
        const userAnswer = s.currentOptions[selIdx]; // User tanlagan variant matni

        if (userAnswer === currentQ.a) {
            s.score++;
            await ctx.answerCbQuery("✅ To'g'ri!");
        } else {
            // ❌ Xatolar massiviga user tanlagan javobni ham qo'shib saqlaymiz
            s.wrongs.push({
                ...currentQ,
                userAnswer: userAnswer // Tahlil uchun kerak
            });
            
            const correctIdx = s.currentOptions.indexOf(currentQ.a);
            const correctLetter = labels[correctIdx] || "";

            await ctx.answerCbQuery(`❌ Noto'g'ri!\nTo'g'ri javob: ${correctLetter}) ${currentQ.a}`, { show_alert: true });
        }

        s.index++;
        
        // Keyingi savolga yoki natijaga o'tish
        return sendQuestion(ctx, false);

    } catch (error) {
        console.error("Action error:", error);
        await ctx.answerCbQuery("Xatolik yuz berdi.").catch(() => {});
        return ctx.reply("⚠️ Xatolik yuz berdi. Qaytadan /start bosing.");
    }
});

bot.action('stop_test', (ctx) => {
    if (timers[ctx.from.id]) clearTimeout(timers[ctx.from.id]);
    ctx.session.index = 999;
    showSubjectMenu(ctx);
});

bot.action('buy_vip', (ctx) => {
    ctx.session.waitingForReceipt = true; // Bot chek kutish rejimiga o'tadi
    return ctx.replyWithHTML(
        `💎 <b>VIP STATUS SOTIB OLISH</b>\n\n` +
        `💳 Karta: <code>4073420058363577</code>\n` +
        `👤 Egasi: M.M\n` +
        `💰 Summa: 3,199 so'm\n\n` +
        `📸 To'lovni amalga oshirgach, <b>chekni (rasm ko'rinishida)</b> shu yerga yuboring.`
    );
});



// Admin "Tasdiqlash" tugmasini bosganda
bot.action(/^approve_(\d+)$/, async (ctx) => {
    const targetId = parseInt(ctx.match[1]);
    const db = getDb(); // Asosiy bazani olamiz

    // 1. Asosiy bazada (db.json) VIP statusini yoqamiz
    if (db.users[targetId]) {
        db.users[targetId].isVip = true;
        saveDb(db); // Bazani faylga saqlaymiz
    }

    // 2. VIP ro'yxatiga (alohida fayl bo'lsa) qo'shish
    if (typeof vipUsers !== 'undefined' && !vipUsers.includes(targetId)) {
        vipUsers.push(targetId);
        fs.writeFileSync(VIP_FILE, JSON.stringify(vipUsers));
    }
    
    // 3. MUSOBAQA ro'yxatiga qo'shish
    if (typeof tournament !== 'undefined' && !tournament.participants.includes(targetId)) {
        tournament.participants.push(targetId);
        fs.writeFileSync(TOURNAMENT_FILE, JSON.stringify(tournament));
    }
    
    // 4. Foydalanuvchiga bildirishnoma yuborish
    try {
        await ctx.telegram.sendMessage(targetId, 
            "🎉 <b>Xushxabar!</b>\n\nTo'lovingiz tasdiqlandi! Endi barcha testlarning 💡 <b>tushuntirishlarini</b> ko'rishingiz va 🏆 <b>Musobaqada</b> qatnashishingiz mumkin.", 
            { parse_mode: 'HTML' }
        );
    } catch (e) {
        console.log("Foydalanuvchiga xabar yuborishda xatolik.");
    }

    // 5. Admin xabarini yangilash
    return ctx.editMessageCaption("✅ <b>Tasdiqlandi:</b> Foydalanuvchi VIP bo'ldi va Musobaqaga qo'shildi.", { parse_mode: 'HTML' });
});
// Admin "Rad etish" tugmasini bosganda
bot.action(/^reject_(\d+)$/, async (ctx) => {
    const targetId = parseInt(ctx.match[1]);
    await ctx.telegram.sendMessage(targetId, "❌ Kechirasiz, siz yuborgan chek tasdiqlanmadi. Muammo bo'lsa adminga yozing.");
    return ctx.editMessageCaption("❌ To'lov rad etildi.");
});

bot.launch().then(() => console.log("Bot running..."));

// Portni Railway talab qilgani uchun ochamiz
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.end('Bot is running'); }).listen(PORT);


function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

