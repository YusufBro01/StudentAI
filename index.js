const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const http = require('http');

// 1. O'zgaruvchilarni tartib bilan e'lon qilish
const ADMIN_ID = parseInt(process.env.ADMIN_ID); 
const bot = new Telegraf(process.env.BOT_TOKEN);

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

// 2. Bazalarni tekshirish va funksiyalar
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));

function getDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Baza o'qishda xato:", e);
    }
    return { users: {} };
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
let SUBJECTS = {
    "academic": {
        "name": "📝 Akademik yozuv",
        "questions": [
  {
    "q": "Yozuvchilar, shoirlar, olimlar tomonidan ishlangan, qat’iy me’yorlarga ega bo‘lgan nutq ko‘rinishini to‘g‘ri toping.",
    "options": ["Publitsistik nutq", "Ilmiy nutq", "Badiiy nutq", "Adabiy nutq"],
    "a": "Ilmiy nutq"
  },
  {
    "q": "Ommaviy axborot vositalarida va anjumanlarda qo‘llaniladigan nutq uslubi qanday?",
    "options": ["Badiiy uslub", "Ommabop-publitsistik uslub", "Rasmiy-idoraviy uslub", "Ilmiy uslub"],
    "a": "Ommabop-publitsistik uslub"
  },
  {
    "q": "Daliliy munosabatlarga tayanuvchi, aniq va mantiqiy uslub qaysi?",
    "options": ["So‘zlashuv uslubi", "Ilmiy uslub", "Badiiy uslub", "Rasmiy-idoraviy uslub"],
    "a": "Ilmiy uslub"
  },
  {
    "q": "Akustik hodisalar haqida berilgan matn qaysi uslubga tegishli?",
    "options": ["Publitsistik uslub", "Ilmiy uslub", "Badiiy uslub", "Rasmiy-idoraviy uslub"],
    "a": "Ilmiy uslub"
  },
  {
    "q": "Kishilar o‘rtasidagi faoliyat ehtiyojlaridan kelib chiqadigan bog‘lanishlar jarayoni nima?",
    "options": ["Dialog", "Kommunikatsiya", "Muloqot", "Suhbat"],
    "a": "Muloqot"
  },
  {
    "q": "“Kommunikatsiya” so‘zi qanday ma’noni bildiradi?",
    "options": ["Bo‘lishmoq", "Xabar bermoq", "Aloqa", "Qatnashmoq"],
    "a": "Aloqa"
  },
  {
    "q": "O‘zaro tushunishni rivojlantiradigan jarayon nima?",
    "options": ["Individual suhbat", "Kommunikativ muloqot", "Kommunikativ aloqa", "Muloqot jarayoni"],
    "a": "Kommunikativ muloqot"
  },
  {
    "q": "Muloqot texnikasining zaruriy sharti nima?",
    "options": [
      "Doimiy izlanish",
      "E’tiborni boshqara olish",
      "Fahm-farosat",
      "To‘g‘ri javob yo‘q"
    ],
    "a": "E’tiborni boshqara olish"
  },
  {
    "q": "Muloqot texnikasida nechta kamchilik mavjud?",
    "options": ["4 ta", "8 ta", "7 ta", "3 ta"],
    "a": "7 ta"
  },
  {
    "q": "Muloqot madaniyati, mimik pantomima va hissiy holat bu nima?",
    "options": [
      "Talablar",
      "Muloqot texnikasining tarkibiy qismlari",
      "Kamchiliklar",
      "To‘g‘ri javob yo‘q"
    ],
    "a": "Muloqot texnikasining tarkibiy qismlari"
  },
  {
    "q": "Savodli gapirish va fikrni ta’sirchan ifodalash nima?",
    "options": ["Hissiy holat", "Muloqot madaniyati", "Mimik pantomima", "To‘g‘ri javob yo‘q"],
    "a": "Muloqot madaniyati"
  },
  {
    "q": "Aniq imo-ishora va ma’noli qarash nima?",
    "options": ["Muloqot madaniyati", "Hissiy holat", "Mimik pantomima", "To‘g‘ri javob yo‘q"],
    "a": "Mimik pantomima"
  },
  {
    "q": "Akademik yozuv bu nima?",
    "options": [
      "Ilmiy aloqalar",
      "Ilmiy matn orqali fikrni asoslash",
      "Ta’lim jarayoni",
      "To‘g‘ri javob yo‘q"
    ],
    "a": "Ilmiy matn orqali fikrni asoslash"
  },
  {
    "q": "Akademik yozuv tizimini rivojlantirgan mamlakatlar qaysi?",
    "options": ["Italiya", "Ingliz tilida so‘zlashuvchi mamlakatlar", "Germaniya", "Fransiya"],
    "a": "Ingliz tilida so‘zlashuvchi mamlakatlar"
  },
  {
    "q": "Akademik yozuv qanday janrlarga bo‘linadi?",
    "options": ["Ilmiy", "Publitsistik", "Birlamchi va ikkilamchi", "Adabiy"],
    "a": "Birlamchi va ikkilamchi"
  },
  {
    "q": "Akademik yozuvning birlamchi janriga nimalar kiradi?",
    "options": [
      "Ilmiy diskussiya, loyiha tavsifi",
      "Ilmiy maqola, dissertatsiya, taqriz, monografiya",
      "Annotatsiya va tezislar",
      "Ensiklopedik maqola"
    ],
    "a": "Ilmiy maqola, dissertatsiya, taqriz, monografiya"
  },
  {
    "q": "Akademik yozuvning ikkilamchi janriga qaysilar kiradi?",
    "options": [
      "Ilmiy maqola va dissertatsiya",
      "Ilmiy diskussiya, tezis, avtoreferat, annotatsiya",
      "Monografiya va taqriz",
      "Ilmiy maqola va ilmiy loyiha"
    ],
    "a": "Ilmiy diskussiya, tezis, avtoreferat, annotatsiya"
  },
  {
    "q": "Ilmiy maqolada nima amalga oshiriladi?",
    "options": [
      "Ilmiy matn tanqidiy baholanadi",
      "Muallif tadqiqot natijalarini taqdim etadi",
      "Magistratura uchun tayyorgarlik ko‘riladi",
      "Ilmiy materiallar yig‘iladi"
    ],
    "a": "Muallif tadqiqot natijalarini taqdim etadi"
  },
  {
    "q": "Dissertatsiya bu nima?",
    "options": [
      "Ilmiy matn tahlili",
      "Magistratura yoki ilmiy darajani olishga tayyorgarlik",
      "Tadqiqot natijalarini qisqa bayon qilish",
      "Tanqidiy baho berish"
    ],
    "a": "Magistratura yoki ilmiy darajani olishga tayyorgarlik"
  },
  {
    "q": "Taqriz bu nima?",
    "options": [
      "Ilmiy matn tahlili va tanqidiy bahosi",
      "Tadqiqot natijalarini taqdim etish",
      "Ilmiy loyiha tavsifi",
      "Ilmiy materiallar yig‘indisi"
    ],
    "a": "Ilmiy matn tahlili va tanqidiy bahosi"
  },
  {
    "q": "Monografiya bu nima?",
    "options": [
      "Tanqidiy baho berilgan ilmiy ish",
      "Muallif natijalarini taqdim etuvchi maqola",
      "Bir mavzuga bag‘ishlangan ilmiy tadqiqot",
      "Ilmiy diskussiya shakli"
    ],
    "a": "Bir mavzuga bag‘ishlangan ilmiy tadqiqot"
  },
  {
    "q": "Annotatsiya bu nima?",
    "options": [
      "Tadqiqot natijalarining batafsil tahlili",
      "Asosiy manbaning qisqacha mazmuni",
      "Ilmiy ishni tanqid qilish",
      "Muallif fikrlarini keng yoritish"
    ],
    "a": "Asosiy manbaning qisqacha mazmuni"
  },
  {
    "q": "Referat bu nima?",
    "options": [
      "Ilmiy baholash matni",
      "Asosiy matnning qayta ishlangan taqdimoti",
      "Dissertatsiya rejasi",
      "Ilmiy loyiha bayoni"
    ],
    "a": "Asosiy matnning qayta ishlangan taqdimoti"
  },
  {
    "q": "Ilmiy munozara nima?",
    "options": [
      "Tadqiqot natijalarini e’lon qilish",
      "Ilmiy muammolarni muhokama qilish",
      "Matnni qisqartirish",
      "Annotatsiya tuzish"
    ],
    "a": "Ilmiy muammolarni muhokama qilish"
  },
  {
    "q": "Akademik yozuv uslubining asosiy xususiyati qaysi?",
    "options": [
      "Faqat hissiylik",
      "Oddiy tuzilma: kirish, asosiy qism, xulosa",
      "Badiiy tasvirlarga boylik",
      "Dialog shaklida yozish"
    ],
    "a": "Oddiy tuzilma: kirish, asosiy qism, xulosa"
  },
  {
    "q": "Kirish qismi nima vazifani bajaradi?",
    "options": [
      "Xulosalar chiqaradi",
      "Mavzuni qisqacha ochib beradi",
      "Natijalarni tahlil qiladi",
      "Bahs-munozara olib boradi"
    ],
    "a": "Mavzuni qisqacha ochib beradi"
  },
  {
    "q": "Asosiy qismda nima amalga oshiriladi?",
    "options": [
      "Xulosalar beriladi",
      "Mavzu bo‘yicha ilmiy qarashlar bayon etiladi",
      "Mavzu qisqacha tanishtiriladi",
      "Sarlavha aniqlanadi"
    ],
    "a": "Mavzu bo‘yicha ilmiy qarashlar bayon etiladi"
  },
  {
    "q": "Xulosa qismi nima uchun xizmat qiladi?",
    "options": [
      "Muammo qo‘yish uchun",
      "Xulosalar va istiqbollarni ko‘rsatish uchun",
      "Manbalarni sanab o‘tish uchun",
      "Asosiy qismni kengaytirish uchun"
    ],
    "a": "Xulosalar va istiqbollarni ko‘rsatish uchun"
  },
  {
    "q": "Akademik yozuvda muhim bo‘lgan jihat qaysi?",
    "options": [
      "Hissiy bo‘yoqlar",
      "Aniqlik va lo‘ndalik",
      "Og‘zaki uslub",
      "Shevaga xos so‘zlar"
    ],
    "a": "Aniqlik va lo‘ndalik"
  },
  {
    "q": "Akademik yozish nimani o‘z ichiga oladi?",
    "options": [
      "Faqat kirish va xulosa",
      "Kirish, asosiy qism va xulosa",
      "Faqat asosiy qism",
      "Dialog va bahs"
    ],
    "a": "Kirish, asosiy qism va xulosa"
  },
  {
    "q": "Akademik yozuvni to‘g‘ri yozish uchun nima talab etiladi?",
    "options": [
      "So‘zlashuv uslubi",
      "Ilmiy uslubga rioya qilish va manbalarga havola",
      "Hissiy ifodalar",
      "Jargonlardan foydalanish"
    ],
    "a": "Ilmiy uslubga rioya qilish va manbalarga havola"
  },
  {
    "q": "Akademik yozuv nima uchun kerak?",
    "options": [
      "Badiiy ijod uchun",
      "Ilmiy fikrni aniq ifodalash uchun",
      "Og‘zaki nutqni rivojlantirish uchun",
      "She’riyatni rivojlantirish uchun"
    ],
    "a": "Ilmiy fikrni aniq ifodalash uchun"
  },
  {
    "q": "Akademik matnlar haqida qaysi fikr to‘g‘ri?",
    "options": [
      "Faqat olimlar yozadi",
      "Talabalar va olimlar tomonidan yoziladi",
      "Faqat publitsistik bo‘ladi",
      "Faqat badiiy bo‘ladi"
    ],
    "a": "Talabalar va olimlar tomonidan yoziladi"
  },
  {
    "q": "Nutq madaniyati nima?",
    "options": [
      "Badiiy ijod",
      "Til me’yorlari va qoidalariga rioya qilish",
      "She’r yozish san’ati",
      "Akademik fan"
    ],
    "a": "Til me’yorlari va qoidalariga rioya qilish"
  },
  {
    "q": "Til qoidalariga oid qaysi fikr to‘g‘ri?",
    "options": [
      "Ilmiy matnda qoidalar muhim emas",
      "Akademik yozishda qoidalar muhim",
      "Qoidalar faqat jurnalistlarga kerak",
      "Qoidalar faqat og‘zaki nutqda ishlatiladi"
    ],
    "a": "Akademik yozishda qoidalar muhim"
  },
  {
    "q": "Publitsistik va ilmiy matn o‘rtasidagi farq nima?",
    "options": [
      "Publitsistik matn bibliografiyani talab qilmaydi",
      "Publitsistik matn keng ommaga, ilmiy matn esa mutaxassislarga mo‘ljallangan",
      "Ilmiy matn hissiy ifodalarni o‘z ichiga oladi",
      "Publitsistik matn faqat faktlarga asoslanadi"
    ],
    "a": "Publitsistik matn keng ommaga, ilmiy matn esa mutaxassislarga mo‘ljallangan"
  },
  {
    "q": "Publitsistikada ilmiy matnga nisbatan qaysi usul qo‘llaniladi?",
    "options": [
      "Faqat bibliografik asoslar",
      "Subyektiv tajribalardan foydalanish",
      "Faqat statistik ma’lumotlar",
      "Manbalarni umuman keltirmaslik"
    ],
    "a": "Subyektiv tajribalardan foydalanish"
  },
  {
    "q": "Ilmiy matnning maqsadiga oid qaysi gap to‘g‘ri?",
    "options": [
      "Matnning adabiy qiymatini oshirish",
      "Aniq va tasdiqlangan ma’lumotlarni taqdim etish",
      "Hissiy fon yaratish",
      "Keng omma uchun soddalashtirish"
    ],
    "a": "Aniq va tasdiqlangan ma’lumotlarni taqdim etish"
  },
  {
    "q": "Ilmiy matnda ma’lumotlarga ko‘ra nima ko‘rsatilishi kerak?",
    "options": [
      "Shiorlar va e’tiqodlar",
      "Emotsional bahslar",
      "Ishonchli va obyektiv manbalarga havolalar",
      "Subyektiv fikrlar"
    ],
    "a": "Ishonchli va obyektiv manbalarga havolalar"
  },
  {
    "q": "Ilmiy matnda axborot qanday rol o‘ynaydi?",
    "options": [
      "Faqat batafsil bo‘lishi kerak",
      "Qimmatli, to‘liq va ishonchli bo‘lishi kerak",
      "Faqat raqamli shaklda bo‘lishi kerak",
      "Analog shaklda taqdim etiladi"
    ],
    "a": "Qimmatli, to‘liq va ishonchli bo‘lishi kerak"
  },
  {
    "q": "Matnga ko‘ra ma’lumotlarning qaysi turlari ko‘proq tarqalgan?",
    "options": [
      "Hissiy va mantiqiy",
      "Foydali va foydasiz",
      "Sifat va miqdoriy",
      "Analog va diskret"
    ],
    "a": "Sifat va miqdoriy"
  },
  {
    "q": "Akademik yozuvda triadani tashkil etishning o‘ziga xos xususiyati nimada?",
    "options": [
      "Emotsional argumentlar yaratish",
      "Signalli so‘zlardan foydalanish",
      "Shaxsiy e’tiqodni ifodalash",
      "Subyektiv tajriba hosil qilish"
    ],
    "a": "Signalli so‘zlardan foydalanish"
  },
  {
    "q": "Ilmiy matn muallifi o‘quvchini qanday ishontiradi?",
    "options": [
      "Shaxsiy qarashlarni singdirish orqali",
      "Emotsional murojaatlar bilan",
      "Dalilning mantiqiyligi va izchilligi orqali",
      "Manipulyatsiya yordamida"
    ],
    "a": "Dalilning mantiqiyligi va izchilligi orqali"
  },
  {
    "q": "Matnga ko‘ra nutq madaniyati nima?",
    "options": [
      "Yangi nutq standartlarini yaratish",
      "Til me’yor va qoidalarini saqlash",
      "Shevalarni o‘rganish",
      "Chet tillarni moslashtirish"
    ],
    "a": "Til me’yor va qoidalarini saqlash"
  },
  {
    "q": "Matnga ko‘ra akademik yozishda muhokama qanday rol o‘ynaydi?",
    "options": [
      "Muallif va muharrir o‘rtasida ziddiyat keltiradi",
      "Emotsional bo‘yoq hosil qiladi",
      "Ilmiy aloqa uchun asos bo‘lib xizmat qiladi",
      "Muallif fikrini cheklaydi"
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
      "Faqat ilmiy atamalardan foydalaniladi"
    ],
    "a": "Unda subyektiv kechinmalar va xayoliy g‘oyalar bo‘lishi mumkin"
  },
  {
    "q": "Muallifning badiiy adabiyot o‘qishga munosabati qanday?",
    "options": [
      "Matnlar qat’iy nazorat qilinishi kerak",
      "O‘qishda tanlash erkinligi va individual didni qo‘llab-quvvatlaydi",
      "Faqat klassik asarlar o‘qilishi lozim",
      "Mazmun qat’iy baholanadi"
    ],
    "a": "O‘qishda tanlash erkinligi va individual didni qo‘llab-quvvatlaydi"
  },
  {
    "q": "Ilmiy matnni qaysi xususiyatlar xarakterlaydi?",
    "options": [
      "O‘qish vaqti minimal bo‘lishi",
      "Tuyg‘ularning yetishmasligi",
      "Axborot mazmuni va xolisligi",
      "Faqat mutaxassislar uchun yozilishi"
    ],
    "a": "Axborot mazmuni va xolisligi"
  },
  {
    "q": "Matnga ko‘ra akademik yozuvdan maqsad nima?",
    "options": [
      "Til me’yorlarini asrash",
      "O‘z fikrlarini ifoda etish va asoslashni o‘rganish",
      "Ijtimoiy muammolarga e’tibor qaratish",
      "Badiiy nutqni rivojlantirish"
    ],
    "a": "O‘z fikrlarini ifoda etish va asoslashni o‘rganish"
  },
  {
    "q": "Publitsistik matn ilmiy matndan qanday farq qiladi?",
    "options": [
      "Faqat faktlarga asoslanadi",
      "Mutaxassislar uchun yoziladi",
      "Umumiy o‘quvchiga qaratilgan va muallifning emotsional pozitsiyasini ifodalaydi",
      "Bibliografiyani talab qiladi"
    ],
    "a": "Umumiy o‘quvchiga qaratilgan va muallifning emotsional pozitsiyasini ifodalaydi"
  },
  {
    "q": "Badiiy adabiyotga xos bo‘lgan xususiyat qaysi?",
    "options": [
      "Mutaxassislar uchun axborot berish",
      "Estetik ehtiyojlarni qondirish",
      "Ish uchun ma’lumot taqdim etish",
      "Faqat faktlarga asoslanish"
    ],
    "a": "Estetik ehtiyojlarni qondirish"
  },
  {
    "q": "Ilmiy matnda ma’lumotlarga ko‘ra nima ko‘rsatilishi kerak?",
    "options": [
      "Emotsional bahslar",
      "Shiorlar va e’tiqodlar",
      "Ishonchli va obyektiv manbalarga havolalar",
      "Subyektiv fikrlar"
    ],
    "a": "Ishonchli va obyektiv manbalarga havolalar"
  },
  {
    "q": "Ilmiy matnda axborot qanday bo‘lishi kerak?",
    "options": [
      "Faqat batafsil",
      "Raqamli shaklda",
      "Qimmatli, to‘liq va ishonchli",
      "Analog shaklda"
    ],
    "a": "Qimmatli, to‘liq va ishonchli"
  },
  {
    "q": "Matnga ko‘ra axborotning qaysi turlari ko‘proq uchraydi?",
    "options": [
      "Foydali va foydasiz",
      "Analog va diskret",
      "Hissiy va mantiqiy",
      "Sifat va miqdoriy"
    ],
    "a": "Sifat va miqdoriy"
  },
  {
    "q": "Akademik yozuvda triadani tashkil etishning o‘ziga xos xususiyati nimada?",
    "options": [
      "Emotsional argumentlar yaratish",
      "Muallifning shaxsiy e’tiqodini ifodalash",
      "Matnga yangi elementlarni kiritish uchun signalli so‘zlardan foydalanish",
      "Subyektiv tajriba hosil qilish"
    ],
    "a": "Matnga yangi elementlarni kiritish uchun signalli so‘zlardan foydalanish"
  },
  {
    "q": "Qaysi turdagi matn maksimal hajmga ega va yozma nutqning shakli hisoblanadi?",
    "options": [
      "Argumentativ matn",
      "Mikromatn",
      "Makromatn",
      "Texnik tavsiflovchi matn"
    ],
    "a": "Makromatn"
  },
  {
    "q": "Qaysi turdagi matn obyektlarni tavsiflaydi va texnik yoki badiiy bo‘lishi mumkin?",
    "options": [
      "Hikoya matni",
      "Izohlovchi matn",
      "Ta’riflovchi matn",
      "Argumentativ matn"
    ],
    "a": "Ta’riflovchi matn"
  },
  {
    "q": "Muallifning shaxsiy fikrini bildirmasdan tushuntirishni maqsad qilgan matn turi qaysi?",
    "options": [
      "Makromatn",
      "Texnik tavsiflovchi matn",
      "Izohlovchi matn",
      "Mikromatn"
    ],
    "a": "Izohlovchi matn"
  },
  {
    "q": "O‘quvchini ma’lum bir pozitsiya tarafdori yoki unga qarshi ko‘ndirish uchun mo‘ljallangan matn turi qaysi?",
    "options": [
      "Hikoya matni",
      "Ta’riflovchi matn",
      "Izohlovchi matn",
      "Argumentativ matn"
    ],
    "a": "Argumentativ matn"
  },
  {
    "q": "Voqea va faktlar dinamik fe’llar yordamida tasvirlangan matn turi qaysi?",
    "options": [
      "Izohlovchi matn",
      "Texnik tavsiflovchi matn",
      "Hikoya matni",
      "Ta’riflovchi matn"
    ],
    "a": "Hikoya matni"
  },
  {
    "q": "Faoliyatni rivojlantirish yoki maqsadga erishish yo‘llarini tushuntiruvchi matn qaysi?",
    "options": [
      "Ilmiy matn",
      "Huquqiy matn",
      "Ma’muriy matn",
      "Direktiv matn"
    ],
    "a": "Direktiv matn"
  },
  {
    "q": "Juda ko‘p texnik detallar va rasmiy tilga ega bo‘lgan matnlar qaysi?",
    "options": [
      "Gumanistik matnlar",
      "Badiiy matnlar",
      "Direktiv matnlar",
      "Huquqiy matnlar"
    ],
    "a": "Huquqiy matnlar"
  },
  {
    "q": "Katta adabiy estetika, majoziy til va boy hissiyotlar qaysi matn turiga xos?",
    "options": [
      "Gazeta matnlari",
      "Badiiy matnlar",
      "Raqamli matnlar",
      "Reklama matnlari"
    ],
    "a": "Badiiy matnlar"
  },
  {
    "q": "O‘quvchini mahsulot sotib olishga yoki xizmatdan foydalanishga undovchi matnlar qaysi?",
    "options": [
      "Gazeta matnlari",
      "Gumanistik matnlar",
      "Raqamli matnlar",
      "Reklama matnlari"
    ],
    "a": "Reklama matnlari"
  },
  {
    "q": "Raqamli texnologiyalar ta’sirida paydo bo‘lgan matn turi qaysi?",
    "options": [
      "Gazeta matni",
      "Raqamli matn",
      "Badiiy matn",
      "Huquqiy matn"
    ],
    "a": "Raqamli matn"
  },
  {
    "q": "Gazeta va jurnallarda chop etiladigan matnlar qaysi turga kiradi?",
    "options": [
      "Badiiy matnlar",
      "Ilmiy matnlar",
      "Gazeta matnlari",
      "Direktiv matnlar"
    ],
    "a": "Gazeta matnlari"
  },
  {
    "q": "Internet va ijtimoiy tarmoqlarda tarqaladigan qisqa matnlar qanday ataladi?",
    "options": [
      "Makromatn",
      "Texnik matn",
      "Mikromatn",
      "Ilmiy matn"
    ],
    "a": "Mikromatn"
  },
  {
    "q": "Mikromatnning asosiy xususiyati nima?",
    "options": [
      "Katta hajmga egaligi",
      "Mavzuni keng tahlil qilishi",
      "Qisqa va lo‘nda bo‘lishi",
      "Rasmiy uslubda yozilishi"
    ],
    "a": "Qisqa va lo‘nda bo‘lishi"
  },
  {
    "q": "Mikromatnlarga qaysi misol mos keladi?",
    "options": [
      "Dissertatsiya",
      "Ilmiy maqola",
      "Reklama shiori",
      "Monografiya"
    ],
    "a": "Reklama shiori"
  },
  {
    "q": "Raqamli matnlarga qaysi misol kiradi?",
    "options": [
      "Ilmiy dissertatsiya",
      "Qonun hujjati",
      "Blog posti yoki tvit",
      "Darslik"
    ],
    "a": "Blog posti yoki tvit"
  },
  {
    "q": "Gazeta matnlarining asosiy vazifasi nima?",
    "options": [
      "Estetik zavq berish",
      "O‘quvchini ko‘ndirish",
      "Axborot yetkazish",
      "Ilmiy xulosa chiqarish"
    ],
    "a": "Axborot yetkazish"
  },
  {
    "q": "Reklama matnlarida ko‘proq qaysi usul qo‘llaniladi?",
    "options": [
      "Mantiqiy tahlil",
      "Hissiy ta’sir",
      "Statistik dalillar",
      "Ilmiy isbot"
    ],
    "a": "Hissiy ta’sir"
  },
  {
    "q": "Direktiv matnlarning asosiy vazifasi nima?",
    "options": [
      "Axborot berish",
      "Ko‘rsatma va buyruq berish",
      "Bahs yuritish",
      "Estetik ta’sir ko‘rsatish"
    ],
    "a": "Ko‘rsatma va buyruq berish"
  },
  {
    "q": "Huquqiy matnlar qanday til bilan ajralib turadi?",
    "options": [
      "Badiiy va obrazli",
      "Oddiy va so‘zlashuv",
      "Rasmiy va qat’iy",
      "Emotsional va ta’sirchan"
    ],
    "a": "Rasmiy va qat’iy"
  },
  {
    "q": "Akademik yozuvda bibliografiya nima uchun kerak?",
    "options": [
      "Matn hajmini oshirish uchun",
      "Manbalarni ko‘rsatish va ishonchlilikni ta’minlash uchun",
      "O‘quvchini chalg‘itish uchun",
      "Faqat rasmiy talab sifatida"
    ],
    "a": "Manbalarni ko‘rsatish va ishonchlilikni ta’minlash uchun"
  },
  {
    "q": "Plagiat nima?",
    "options": [
      "Ilmiy manbani to‘g‘ri keltirish",
      "Boshqa muallif fikrini o‘zlashtirib, manba ko‘rsatmaslik",
      "O‘z fikrini qayta yozish",
      "Manbani qisqartirib berish"
    ],
    "a": "Boshqa muallif fikrini o‘zlashtirib, manba ko‘rsatmaslik"
  },
  {
    "q": "Akademik halollik nimani anglatadi?",
    "options": [
      "Faqat yuqori baho olish",
      "Manbalarga to‘g‘ri havola berish va plagiatdan qochish",
      "Ko‘p matn yozish",
      "Faqat o‘qituvchi fikriga tayanish"
    ],
    "a": "Manbalarga to‘g‘ri havola berish va plagiatdan qochish"
  },
  {
    "q": "Parafraz qilish nima?",
    "options": [
      "Matnni so‘zma-so‘z ko‘chirish",
      "Matnni o‘zgartirmasdan tarjima qilish",
      "Asl ma’noni saqlagan holda qayta ifodalash",
      "Matnni qisqartirib tashlash"
    ],
    "a": "Asl ma’noni saqlagan holda qayta ifodalash"
  },
  {
    "q": "Iqtibos (quote) qanday hollarda ishlatiladi?",
    "options": [
      "Har doim, manbasiz",
      "Faqat badiiy matnda",
      "Muallif fikrini aynan keltirish zarur bo‘lganda",
      "Faqat uzun matnlarda"
    ],
    "a": "Muallif fikrini aynan keltirish zarur bo‘lganda"
  },
  {
    "q": "Akademik yozuvda iqtibos berilganda nima qilish shart?",
    "options": [
      "Iqtibosni o‘zgartirish",
      "Manbani ko‘rsatish",
      "Faqat kurs nomini yozish",
      "Iqtibosni qisqartirish"
    ],
    "a": "Manbani ko‘rsatish"
  },
  {
    "q": "Akademik yozuvda xulosa qismida nima bo‘lishi kerak?",
    "options": [
      "Yangi dalillar",
      "Asosiy fikrlarning umumlashtirilishi",
      "Batafsil statistika",
      "Muallif tarjimai holi"
    ],
    "a": "Asosiy fikrlarning umumlashtirilishi"
  },
  {
    "q": "Ilmiy matnda shaxsiy his-tuyg‘ular qanday baholanadi?",
    "options": [
      "Asosiy omil hisoblanadi",
      "Qisman ruxsat etiladi",
      "Imkon qadar cheklanishi kerak",
      "Majburiy bo‘lishi kerak"
    ],
    "a": "Imkon qadar cheklanishi kerak"
  },
  {
    "q": "Akademik yozuvda qaysi shaxs shakli ko‘proq qo‘llaniladi?",
    "options": [
      "Ikkinchi shaxs",
      "Birinchi shaxs ko‘plik yoki passiv shakl",
      "Faqat birinchi shaxs birlik",
      "Uchinchi shaxs og‘zaki shakl"
    ],
    "a": "Birinchi shaxs ko‘plik yoki passiv shakl"
  },
  {
    "q": "Akademik matnda til qanday bo‘lishi kerak?",
    "options": [
      "Oddiy va so‘zlashuv",
      "Badiiy va obrazli",
      "Aniq, rasmiy va xolis",
      "Emotsional va ta’sirchan"
    ],
    "a": "Aniq, rasmiy va xolis"
  },
  {
    "q": "Akademik yozuvda reja tuzish nima uchun muhim?",
    "options": [
      "Faqat vaqtni to‘ldirish uchun",
      "Matnni mantiqiy va izchil qurish uchun",
      "So‘z sonini oshirish uchun",
      "Faqat rasmiy talab sifatida"
    ],
    "a": "Matnni mantiqiy va izchil qurish uchun"
  },
  {
    "q": "Ilmiy ishda kirish qismi nimani o‘z ichiga oladi?",
    "options": [
      "Natijalar va jadval",
      "Mavzuning dolzarbligi va maqsadi",
      "Xulosa va tavsiyalar",
      "Bibliografiya"
    ],
    "a": "Mavzuning dolzarbligi va maqsadi"
  },
  {
    "q": "Asosiy qismning vazifasi nima?",
    "options": [
      "Muammoni chuqur tahlil qilish",
      "Faqat mavzuni tanishtirish",
      "Qisqa xulosa berish",
      "Manbalarni sanab o‘tish"
    ],
    "a": "Muammoni chuqur tahlil qilish"
  },
  {
    "q": "Ilmiy ishda natijalar qayerda beriladi?",
    "options": [
      "Kirish qismida",
      "Xulosa qismida",
      "Asosiy qismda",
      "Bibliografiyada"
    ],
    "a": "Asosiy qismda"
  },
  {
    "q": "Xulosa qismida qaysi ma’lumot bo‘lmasligi kerak?",
    "options": [
      "Umumlashtirilgan fikrlar",
      "Yangi tadqiqot ma’lumotlari",
      "Asosiy natijalar",
      "Tavsiyalar"
    ],
    "a": "Yangi tadqiqot ma’lumotlari"
  },
  {
    "q": "Akademik yozuvda jadval va diagrammalar nima uchun ishlatiladi?",
    "options": [
      "Matnni bezash uchun",
      "Ma’lumotni aniq va tushunarli ko‘rsatish uchun",
      "Faqat sahifani to‘ldirish uchun",
      "O‘quvchini chalg‘itish uchun"
    ],
    "a": "Ma’lumotni aniq va tushunarli ko‘rsatish uchun"
  },
  {
    "q": "Ilmiy ishda manbalar ro‘yxati qayerda beriladi?",
    "options": [
      "Kirish qismida",
      "Asosiy qismda",
      "Xulosa oldidan",
      "Oxirida"
    ],
    "a": "Oxirida"
  },
  {
    "q": "Akademik yozuvda tahrirlash nima uchun zarur?",
    "options": [
      "So‘z sonini kamaytirish uchun",
      "Grammatik va mantiqiy xatolarni tuzatish uchun",
      "Faqat dizaynni o‘zgartirish uchun",
      "Faqat rasmiy talab sifatida"
    ],
    "a": "Grammatik va mantiqiy xatolarni tuzatish uchun"
  },
  {
    "q": "Akademik yozuvda qayta ko‘rib chiqish (revision) nimani anglatadi?",
    "options": [
      "Faqat imlo xatolarini tuzatish",
      "Matn mazmunini, tuzilishini va dalillarni yaxshilash",
      "Matnni qisqartirish",
      "Manbalarni olib tashlash"
    ],
    "a": "Matn mazmunini, tuzilishini va dalillarni yaxshilash"
  },
  {
    "q": "Akademik yozuvni baholashda qaysi mezon muhim?",
    "options": [
      "Matn uzunligi",
      "Aniqlik, mantiqiylik va manbalarga tayanish",
      "Faqat dizayn",
      "Muallif yoshi"
    ],
    "a": "Aniqlik, mantiqiylik va manbalarga tayanish"
  },
  {
    "q": "Akademik yozuvda muammo bayoni nimani anglatadi?",
    "options": [
      "Natijalarni taqdim etish",
      "Tadqiqot savolini aniq qo‘yish",
      "Manbalarni sanab o‘tish",
      "Xulosani yozish"
    ],
    "a": "Tadqiqot savolini aniq qo‘yish"
  },
  {
    "q": "Tadqiqot savoli qanday bo‘lishi kerak?",
    "options": [
      "Noaniq va keng",
      "Aniq, o‘lchanadigan va tekshiriladigan",
      "Faqat taxminiy",
      "Javobsiz"
    ],
    "a": "Aniq, o‘lchanadigan va tekshiriladigan"
  },
  {
    "q": "Akademik yozuvda gipoteza nima?",
    "options": [
      "Tadqiqot natijalari",
      "Oldindan ilgari surilgan taxmin",
      "Bibliografiya qismi",
      "Xulosa"
    ],
    "a": "Oldindan ilgari surilgan taxmin"
  },
  {
    "q": "Gipoteza qachon tekshiriladi?",
    "options": [
      "Kirish qismida",
      "Tadqiqot jarayonida",
      "Bibliografiyada",
      "Xulosadan oldin"
    ],
    "a": "Tadqiqot jarayonida"
  },
  {
    "q": "Akademik yozuvda metodologiya nimani bildiradi?",
    "options": [
      "Tadqiqotda qo‘llanilgan usullar majmui",
      "Natijalar ro‘yxati",
      "Mavzuning dolzarbligi",
      "Muallif xulosasi"
    ],
    "a": "Tadqiqotda qo‘llanilgan usullar majmui"
  },
  {
    "q": "Ilmiy tadqiqotda empirik ma’lumotlar nima?",
    "options": [
      "Nazariy taxminlar",
      "Amaliy kuzatuv va tajriba natijalari",
      "Adabiy tahlil",
      "Shaxsiy fikrlar"
    ],
    "a": "Amaliy kuzatuv va tajriba natijalari"
  },
  {
    "q": "Nazariy ma’lumotlar nimaga asoslanadi?",
    "options": [
      "Kuzatuv va tajribaga",
      "Oldingi tadqiqotlar va konsepsiyalarga",
      "Shaxsiy tajribaga",
      "Intervyularga"
    ],
    "a": "Oldingi tadqiqotlar va konsepsiyalarga"
  },
  {
    "q": "Akademik yozuvda adabiyotlar tahlili nima uchun kerak?",
    "options": [
      "Mavzuni bezash uchun",
      "Oldingi tadqiqotlarni tahlil qilish va bo‘shliqlarni aniqlash uchun",
      "Faqat manbalarni sanash uchun",
      "Natijalarni qisqartirish uchun"
    ],
    "a": "Oldingi tadqiqotlarni tahlil qilish va bo‘shliqlarni aniqlash uchun"
  },
  {
    "q": "Ilmiy ishda dalil nima bilan mustahkamlanadi?",
    "options": [
      "Hissiy ifodalar bilan",
      "Statistik ma’lumotlar va manbalar bilan",
      "Taxminlar bilan",
      "Reklama misollari bilan"
    ],
    "a": "Statistik ma’lumotlar va manbalar bilan"
  },
  {
    "q": "Akademik yozuvda izchillik nimani anglatadi?",
    "options": [
      "Mavzudan chetga chiqish",
      "Fikrlarning mantiqiy ketma-ketligi",
      "Matnni qisqartirish",
      "So‘zlarni ko‘paytirish"
    ],
    "a": "Fikrlarning mantiqiy ketma-ketligi"
  },
  {
    "q": "Akademik yozuvda bog‘lovchi (linking) so‘zlar nima uchun ishlatiladi?",
    "options": [
      "Matnni bezash uchun",
      "Fikrlar orasidagi mantiqiy aloqani ko‘rsatish uchun",
      "Hissiy ta’sir berish uchun",
      "Matn hajmini oshirish uchun"
    ],
    "a": "Fikrlar orasidagi mantiqiy aloqani ko‘rsatish uchun"
  },
  {
    "q": "Quyidagilardan qaysi biri akademik bog‘lovchi so‘zlarga misol?",
    "options": [
      "Lekin",
      "Biroq",
      "Shuningdek",
      "Yuqoridagilarning barchasi"
    ],
    "a": "Yuqoridagilarning barchasi"
  },
  {
    "q": "Akademik yozuvda ob’ektivlik nimani bildiradi?",
    "options": [
      "Shaxsiy fikrni ustun qo‘yish",
      "Dalil va faktlarga tayanish",
      "Emotsional yondashuv",
      "Subyektiv baholash"
    ],
    "a": "Dalil va faktlarga tayanish"
  },
  {
    "q": "Akademik yozuvda subyektivlik qachon cheklanadi?",
    "options": [
      "Ilmiy dalillar berilganda",
      "Badiiy matn yozilganda",
      "Reklama matnida",
      "Og‘zaki nutqda"
    ],
    "a": "Ilmiy dalillar berilganda"
  },
  {
    "q": "Akademik yozuvda terminlar qanday qo‘llanilishi kerak?",
    "options": [
      "Tasodifiy",
      "Aniq va izchil",
      "Faqat sinonimlar bilan",
      "Qisqartirib"
    ],
    "a": "Aniq va izchil"
  },
  {
    "q": "Akademik matnda qisqartmalar qanday beriladi?",
    "options": [
      "Izohsiz",
      "Birinchi marta to‘liq yozilib, keyin qisqartma bilan",
      "Faqat jadvalda",
      "Xulosada"
    ],
    "a": "Birinchi marta to‘liq yozilib, keyin qisqartma bilan"
  },
  {
    "q": "Akademik yozuvda grafik va jadvalga qanday talab qo‘yiladi?",
    "options": [
      "Faqat bezak bo‘lishi",
      "Izoh va sarlavhaga ega bo‘lishi",
      "Faqat rangli bo‘lishi",
      "Manbasiz berilishi"
    ],
    "a": "Izoh va sarlavhaga ega bo‘lishi"
  },
  {
    "q": "Ilmiy ishda muhokama (discussion) qismi nimani bajaradi?",
    "options": [
      "Natijalarni sharhlash va talqin qilish",
      "Kirishni yozish",
      "Manbalarni sanash",
      "Metodlarni tavsiflash"
    ],
    "a": "Natijalarni sharhlash va talqin qilish"
  },
  {
    "q": "Akademik yozuvda cheklovlar (limitations) nima uchun ko‘rsatiladi?",
    "options": [
      "Tadqiqotni tanqid qilish uchun",
      "Tadqiqot doirasini va chegaralarini aniqlash uchun",
      "Natijalarni inkor etish uchun",
      "Xulosani cho‘zish uchun"
    ],
    "a": "Tadqiqot doirasini va chegaralarini aniqlash uchun"
  },
  {
    "q": "Akademik yozuvda tavsiyalar qayerda beriladi?",
    "options": [
      "Kirish qismida",
      "Asosiy qismda",
      "Xulosa yoki muhokama qismida",
      "Bibliografiyada"
    ],
    "a": "Xulosa yoki muhokama qismida"
  },
  {
    "q": "Akademik yozuvda etik talablar nimani o‘z ichiga oladi?",
    "options": [
      "Plagiatdan qochish va halollik",
      "Faqat dizayn talablarini",
      "Matn hajmini",
      "Faqat manbalar sonini"
    ],
    "a": "Plagiatdan qochish va halollik"
  },
  {
    "q": "Ilmiy ishni topshirishdan oldin qaysi bosqich muhim?",
    "options": [
      "Faqat chop etish",
      "Tahrirlash va tekshirish",
      "Faqat sarlavha qo‘yish",
      "Manbalarni olib tashlash"
    ],
    "a": "Tahrirlash va tekshirish"
  },
  {
    "q": "Akademik yozuvda formatlash nimani anglatadi?",
    "options": [
      "Matn mazmunini o‘zgartirish",
      "Shrift, interval va sahifa talablariga rioya qilish",
      "Faqat rasm qo‘shish",
      "So‘zlarni ko‘paytirish"
    ],
    "a": "Shrift, interval va sahifa talablariga rioya qilish"
  },
  {
    "q": "Akademik yozuvda sarlavha qanday bo‘lishi kerak?",
    "options": [
      "Juda uzun va murakkab",
      "Aniq, qisqa va mazmunni aks ettiruvchi",
      "Hissiy va obrazli",
      "Savolsiz"
    ],
    "a": "Aniq, qisqa va mazmunni aks ettiruvchi"
  },
  {
    "q": "Ilmiy ishda annotatsiya nima vazifani bajaradi?",
    "options": [
      "Butun ishni batafsil tushuntiradi",
      "Ish mazmunini qisqacha bayon qiladi",
      "Faqat xulosani beradi",
      "Manbalarni sanaydi"
    ],
    "a": "Ish mazmunini qisqacha bayon qiladi"
  },
  {
    "q": "Akademik yozuvda kalit so‘zlar (keywords) nima uchun beriladi?",
    "options": [
      "Matnni bezash uchun",
      "Qidirish va mavzuni aniqlashni osonlashtirish uchun",
      "So‘z sonini oshirish uchun",
      "Faqat rasmiy talab sifatida"
    ],
    "a": "Qidirish va mavzuni aniqlashni osonlashtirish uchun"
  },
  {
    "q": "Akademik yozuvda abstrakt til nimani bildiradi?",
    "options": [
      "Badiiy ifodalar",
      "Umumlashtirilgan va nazariy tushunchalar",
      "So‘zlashuv iboralari",
      "Reklama shiorlari"
    ],
    "a": "Umumlashtirilgan va nazariy tushunchalar"
  },
  {
    "q": "Akademik yozuvda aniq misollar nima uchun keltiriladi?",
    "options": [
      "Matnni cho‘zish uchun",
      "Nazariy fikrlarni tushuntirish va isbotlash uchun",
      "Faqat bezak uchun",
      "Hissiy ta’sir berish uchun"
    ],
    "a": "Nazariy fikrlarni tushuntirish va isbotlash uchun"
  },
  {
    "q": "Akademik yozuvda izoh (footnote/endnote) qachon qo‘llaniladi?",
    "options": [
      "Har doim",
      "Qo‘shimcha tushuntirish yoki manba berish zarur bo‘lganda",
      "Faqat xulosada",
      "Faqat kirishda"
    ],
    "a": "Qo‘shimcha tushuntirish yoki manba berish zarur bo‘lganda"
  },
  {
    "q": "Akademik yozuvda mantiqiy bog‘lanish nima uchun muhim?",
    "options": [
      "Matnni bezash uchun",
      "Fikrlarning tushunarli va izchil bo‘lishi uchun",
      "So‘z sonini oshirish uchun",
      "Faqat rasmiy talab sifatida"
    ],
    "a": "Fikrlarning tushunarli va izchil bo‘lishi uchun"
  },
  {
    "q": "Akademik yozuvda paragrafning asosiy vazifasi nima?",
    "options": [
      "Bir nechta mavzuni aralashtirish",
      "Bitta asosiy fikrni rivojlantirish",
      "Faqat misollar berish",
      "Matnni cho‘zish"
    ],
    "a": "Bitta asosiy fikrni rivojlantirish"
  },
  {
    "q": "Paragrafning topic sentence qaysi vazifani bajaradi?",
    "options": [
      "Paragrafni yakunlaydi",
      "Asosiy fikrni bildiradi",
      "Misollarni sanaydi",
      "Xulosani beradi"
    ],
    "a": "Asosiy fikrni bildiradi"
  },
  {
    "q": "Akademik yozuvda supporting sentence nima?",
    "options": [
      "Asosiy fikrni isbotlovchi dalillar",
      "Xulosa jumlasi",
      "Sarlavha",
      "Kirish jumlasi"
    ],
    "a": "Asosiy fikrni isbotlovchi dalillar"
  },
  {
    "q": "Paragrafda concluding sentence nima vazifani bajaradi?",
    "options": [
      "Yangi mavzu ochadi",
      "Asosiy fikrni umumlashtiradi",
      "Dalillar keltiradi",
      "Misollar beradi"
    ],
    "a": "Asosiy fikrni umumlashtiradi"
  },
  {
    "q": "Akademik yozuvda coherence nimani anglatadi?",
    "options": [
      "Matn uzunligini",
      "Fikrlarning o‘zaro bog‘liqligini",
      "So‘z boyligini",
      "Hissiy ta’sirni"
    ],
    "a": "Fikrlarning o‘zaro bog‘liqligini"
  },
  {
    "q": "Akademik yozuvda cohesion nimani bildiradi?",
    "options": [
      "Bog‘lovchi vositalar orqali matnni birlashtirish",
      "Matnni qisqartirish",
      "Faqat grammatikani tekshirish",
      "Badiiy ifodalarni ko‘paytirish"
    ],
    "a": "Bog‘lovchi vositalar orqali matnni birlashtirish"
  },
  {
    "q": "Akademik yozuvda qayta yozish (rewriting) nima uchun kerak?",
    "options": [
      "Plagiat qilish uchun",
      "Matnni tushunarli va mukammal qilish uchun",
      "So‘zlarni ko‘paytirish uchun",
      "Faqat vaqtni o‘tkazish uchun"
    ],
    "a": "Matnni tushunarli va mukammal qilish uchun"
  },
  {
    "q": "Akademik yozuvda proofreading nimani anglatadi?",
    "options": [
      "Mazmunni o‘zgartirish",
      "Grammatik va imlo xatolarini tekshirish",
      "Manbalarni olib tashlash",
      "Matnni qisqartirish"
    ],
    "a": "Grammatik va imlo xatolarini tekshirish"
  },
  {
    "q": "Akademik yozuvda peer review nima?",
    "options": [
      "Muallifning o‘zini baholashi",
      "Hamkasblar tomonidan ilmiy ishni baholash",
      "Faqat o‘qituvchi tekshiruvi",
      "Avtomatik tekshiruv"
    ],
    "a": "Hamkasblar tomonidan ilmiy ishni baholash"
  },
  {
    "q": "Akademik yozuvda feedback nima uchun muhim?",
    "options": [
      "Muallifni tanqid qilish uchun",
      "Ish sifatini yaxshilash uchun",
      "Bahoni pasaytirish uchun",
      "Faqat rasmiy talab sifatida"
    ],
    "a": "Ish sifatini yaxshilash uchun"
  },
  {
    "q": "Akademik yozuvda argument kuchli bo‘lishi uchun nima zarur?",
    "options": [
      "Hissiy murojaatlar",
      "Dalillar va mantiqiy asos",
      "Ko‘p so‘z ishlatish",
      "Reklama misollari"
    ],
    "a": "Dalillar va mantiqiy asos"
  },
  {
    "q": "Akademik yozuvda qarama-qarshi fikrlar (counterargument) nima uchun keltiriladi?",
    "options": [
      "Muallif fikrini inkor etish uchun",
      "Bahsni murakkablashtirish uchun",
      "Asosiy argumentni kuchaytirish uchun",
      "Mavzudan chetga chiqish uchun"
    ],
    "a": "Asosiy argumentni kuchaytirish uchun"
  },
  {
    "q": "Akademik yozuvda xolis ohang nimani anglatadi?",
    "options": [
      "Shaxsiy fikrni ustun qo‘yish",
      "Dalillarga asoslangan betaraf uslub",
      "Hissiy yondashuv",
      "Reklama ohangi"
    ],
    "a": "Dalillarga asoslangan betaraf uslub"
  },
  {
    "q": "Akademik yozuvda yakuniy baholash nima uchun kerak?",
    "options": [
      "Faqat baho qo‘yish uchun",
      "Ishning umumiy sifatini aniqlash uchun",
      "Manbalarni kamaytirish uchun",
      "So‘z sonini hisoblash uchun"
    ],
    "a": "Ishning umumiy sifatini aniqlash uchun"
  },
  {
    "q": "Akademik yozuvni rivojlantirish uchun eng muhim omil qaysi?",
    "options": [
      "Doimiy mashq va tahlil",
      "Faqat nazariya o‘rganish",
      "Ko‘p nusxa ko‘chirish",
      "Faqat texnik talablar"
    ],
    "a": "Doimiy mashq va tahlil"
  },
  {
    "q": "Akademik yozuvda mustaqil fikrlash nimani anglatadi?",
    "options": [
      "Faqat manbalardan nusxa olish",
      "O‘z xulosasini dalillar asosida chiqarish",
      "Faqat o‘qituvchi fikriga tayanish",
      "Bahsdan qochish"
    ],
    "a": "O‘z xulosasini dalillar asosida chiqarish"
  },
  {
    "q": "Akademik yozuvda muvaffaqiyatga erishish nimaga bog‘liq?",
    "options": [
      "Faqat bahoga",
      "Tuzilma, mantiq va halollikka",
      "Matn uzunligiga",
      "Dizayniga"
    ],
    "a": "Tuzilma, mantiq va halollikka"
  },
  {
    "q": "Akademik yozuvni o‘rganishning yakuniy maqsadi nima?",
    "options": [
      "Ko‘p matn yozish",
      "Ilmiy fikrni aniq va asosli ifodalash",
      "Faqat imtihondan o‘tish",
      "Badiiy ijod qilish"
    ],
    "a": "Ilmiy fikrni aniq va asosli ifodalash"
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
        q: "Algoritm deganda nima tushuniladi?",
        options: ["Ma'lum natijaga erishishga qaratilgan amallar ketma-ketligi", "Kompyuterning texnik qurilmalari", "Faqat matematik formulalar to'plami", "Dasturlash tillarining lug'ati"],
        a: "Ma'lum natijaga erishishga qaratilgan amallar ketma-ketligi"
    },
    {
        q: "“Algoritm” so‘zi qanday ma’noni anglatadi?",
        options: ["O'rta osiyolik olim Al-Xorazmiy nomining lotincha aytilishi", "Grecha 'tartib' degan ma'noni", "Lotincha 'hisoblash' ma'nosini", "Arabcha 'qoida' degan ma'noni"],
        a: "O'rta osiyolik olim Al-Xorazmiy nomining lotincha aytilishi"
    },
    {
        q: "Algoritm cheklanganlik xossasi nimani bildiradi?",
        options: ["Algoritm chekli qadamlardan keyin albatta to'xtashi kerak", "Algoritm faqat cheklangan xotirada ishlashi", "Algoritm qadamlari soni 100 tadan oshmasligi", "Algoritm faqat bitta odamga tushunarli bo'lishi"],
        a: "Algoritm chekli qadamlardan keyin albatta to'xtashi kerak"
    },
    {
        q: "Algoritm kamida nechta natija berishi kerak?",
        options: ["1 ta", "0 ta", "2 ta", "Natija berishi shart emas"],
        a: "1 ta"
    },
    {
        q: "Algoritm dasturlash tiliga bog‘liq bo‘lmasligi nimani anglatadi?",
        options: ["Algoritm har qanday dasturlash tilida bir xil mantiqda amalga oshirilishi", "Algoritm faqat qog'ozda yozilishi", "Algoritm kompyutersiz ham ishlashi", "Algoritm faqat bitta tilda ishlashi"],
        a: "Algoritm har qanday dasturlash tilida bir xil mantiqda amalga oshirilishi"
    },
    {
        q: "Algoritm murakkabligi qaysi omillar bilan belgilanadi?",
        options: ["Vaqt va xotira sarfi bilan", "Dastur kodi qatorlari soni bilan", "Dasturchining tajribasi bilan", "Kompyuterning monitor o'lchami bilan"],
        a: "Vaqt va xotira sarfi bilan"
    },
    {
        q: "Algoritmni ishlab chiqishda birinchi navbatda nima aniqlanadi?",
        options: ["Masalaning qo'yilishi va kiruvchi ma'lumotlar", "Dasturlash tili turi", "Kompyuter quvvati", "Dastur narxi"],
        a: "Masalaning qo'yilishi va kiruvchi ma'lumotlar"
    },
    {
        q: "Chiziqli algoritmning asosiy xususiyati qaysi?",
        options: ["Amallar qat'iy ketma-ketlikda bir marta bajariladi", "Amallar shartga ko'ra shoxlanadi", "Amallar cheksiz takrorlanadi", "Amallar teskari tartibda bajariladi"],
        a: "Amallar qat'iy ketma-ketlikda bir marta bajariladi"
    },
    {
        q: "Tarmoqlanuvchi algoritm qachon qo‘llaniladi?",
        options: ["Jarayon ma'lum bir shartga bog'liq bo'lganda", "Faqat matematik qo'shish amali bo'lganda", "Hech qanday shart bo'lmaganda", "Dastur juda uzun bo'lib ketganda"],
        a: "Jarayon ma'lum bir shartga bog'liq bo'lganda"
    },
    {
        q: "Quyidagilardan qaysi biri takrorlanuvchi algoritmga misol bo‘ladi?",
        options: ["1 dan 100 gacha bo'lgan sonlarni chiqarish", "Ikki sonning kattasini topish", "Ismni ekranga bir marta chiqarish", "Doira yuzini hisoblash"],
        a: "1 dan 100 gacha bo'lgan sonlarni chiqarish"
    },
    {
        q: "Tarmoqlanuvchi algoritmlarda asosan qaysi konstruksiya ishlatiladi?",
        options: ["If - Else", "For - In", "While - Do", "Def - Return"],
        a: "If - Else"
    },
    {
        q: "Takrorlanuvchi algoritmning asosiy vazifasi nimadan iborat?",
        options: ["Bir xil turdagi amallarni ko'p marta bajarish", "Dasturni to'xtatish", "Xatolarni qidirish", "Faqat bir marta hisoblash"],
        a: "Bir xil turdagi amallarni ko'p marta bajarish"
    },
    {
        q: "Chiziqli algoritm qanday algoritm hisoblanadi?",
        options: ["Eng sodda, hech qanday shart va takrorlashsiz algoritm", "Murakkab tuzilmali algoritm", "Faqat grafiklar bilan ishlovchi algoritm", "Natijasi doim nol bo'ladigan algoritm"],
        a: "Eng sodda, hech qanday shart va takrorlashsiz algoritm"
    },
    {
        q: "Tarmoqlanuvchi algoritmning asosiy belgisi nima?",
        options: ["Mantiqiy shartning mavjudligi", "Amallarning cheksizligi", "Hech qanday natija bermasligi", "Faqat raqamlar bilan ishlashi"],
        a: "Mantiqiy shartning mavjudligi"
    },
    {
        q: "Takrorlanuvchi algoritm qaysi holatda ishlatiladi?",
        options: ["Ma'lum qadamlar guruhi bir necha bor bajarilishi kerak bo'lganda", "Shart faqat bir marta tekshirilishi kerak bo'lganda", "Dasturda xatolik bo'lganda", "Faqat matnli ma'lumotlar bilan ishlashda"],
        a: "Ma'lum qadamlar guruhi bir necha bor bajarilishi kerak bo'lganda"
    },
    {
        q: "Python’da o‘zgaruvchi nima?",
        options: ["Ma'lumotlarni saqlash uchun xotiradan ajratilgan nomlangan joy", "Faqat raqamlar to'plami", "Dasturning xatolar ro'yxati", "Kompyuter protsessori"],
        a: "Ma'lumotlarni saqlash uchun xotiradan ajratilgan nomlangan joy"
    },
    {
        q: "Python’da o‘zgaruvchi nomi nimadan boshlanishi mumkin?",
        options: ["Harf yoki pastki chiziq (_) bilan", "Istalgan raqam bilan", "Maxsus belgilar bilan (&, %, $)", "Bo'sh joy (probel) bilan"],
        a: "Harf yoki pastki chiziq (_) bilan"
    },
    {
        q: "Quyidagilardan qaysi biri o‘zgaruvchi nomi bo‘la oladi?",
        options: ["my_variable", "2nd_value", "class", "my-variable"],
        a: "my_variable"
    },
    {
        q: "Python’da butun sonlar qaysi turga mansub?",
        options: ["int", "float", "string", "boolean"],
        a: "int"
    },
    {
        q: "Haqiqiy (o‘nli) sonlar qaysi turda saqlanadi?",
        options: ["float", "int", "char", "complex"],
        a: "float"
    },
    {
        q: "Haqiqiy (o‘nli) sonlar Python-da qaysi turda saqlanadi?",
        options: ["float", "int", "str", "double"],
        a: "float"
    },
    {
        q: "Mantiqiy qiymatlar (True, False) qaysi turga tegishli?",
        options: ["bool", "logic", "binary", "int"],
        a: "bool"
    },
    {
        q: "Python-da o'zgaruvchi turi qachon aniqlanadi?",
        options: ["Qiymat berilganda (dinamik)", "Dastur boshida", "Kompilyatsiya vaqtida", "Hech qachon"],
        a: "Qiymat berilganda (dinamik)"
    },
    {
        q: "x = 'Python' ifodasida x ning turi qanday?",
        options: ["str", "int", "text", "char"],
        a: "str"
    },
    {
        q: "input() funksiyasi orqali kiritilgan ma'lumotning boshlang'ich turi qanday bo'ladi?",
        options: ["str", "int", "float", "list"],
        a: "str"
    },
    {
        q: "Butun son kiritish uchun qaysi ko'rinish to'g'ri?",
        options: ["int(input())", "float(input())", "input(int)", "str(input())"],
        a: "int(input())"
    },
    {
        q: "x, y = map(int, input().split()) kodi nima qiladi?",
        options: ["Bir qatorda ikkita butun sonni kiritadi", "Sonni ikkiga ko'paytiradi", "Xatoni tekshiradi", "Massiv yaratadi"],
        a: "Bir qatorda ikkita butun sonni kiritadi"
    },
    {
        q: "if x > 0: print('Musbat') else: print('Manfiy') - Bu kod nima qiladi?",
        options: ["Sonning ishorasini aniqlaydi", "Sonni kvadratga oshiradi", "Xatolik beradi", "Faqat musbat sonni chiqaradi"],
        a: "Sonning ishorasini aniqlaydi"
    },
    {
        q: "a % 2 == 0 sharti nimani tekshiradi?",
        options: ["Sonning juftligini", "Sonning toqligini", "Sonning nolligini", "Sonning musbatligini"],
        a: "Sonning juftligini"
    },
    {
        q: "a, b = b, a ifodasi nima bajaradi?",
        options: ["Ikkita o'zgaruvchi qiymatini almashtiradi", "Xatolik beradi", "Qiymatlarni o'chiradi", "Qiymatlarni qo'shadi"],
        a: "Ikkita o'zgaruvchi qiymatini almashtiradi"
    },
    {
        q: "while i <= 5: print(i); i += 1 - Bu sikl nechta son chiqaradi?",
        options: ["5 ta (1 dan 5 gacha)", "4 ta", "6 ta", "Cheksiz"],
        a: "5 ta (1 dan 5 gacha)"
    },
    {
        q: "Python-da 'va' (and) mantiqiy operatori qachon True beradi?",
        options: ["Har ikkala shart to'g'ri bo'lsa", "Bitta shart to'g'ri bo'lsa", "Har ikkala shart xato bo'lsa", "Hech qachon"],
        a: "Har ikkala shart to'g'ri bo'lsa"
    },
    {
        q: "print(not (5 > 3)) natijasi nima?",
        options: ["False", "True", "None", "Error"],
        a: "False"
    },
    {
        q: "Python-da bir qatorda bir nechta buyruq yozish uchun qaysi belgi ishlatiladi?",
        options: ["; (nuqtali vergul)", ": (ikki nuqta)", ", (vergul)", "/ (slash)"],
        a: "; (nuqtali vergul)"
    },
    {
        q: "range(5) qanday ketma-ketlikni beradi?",
        options: ["0, 1, 2, 3, 4", "1, 2, 3, 4, 5", "0, 1, 2, 3, 4, 5", "5, 4, 3, 2, 1"],
        a: "0, 1, 2, 3, 4"
    },
    {
        q: "range(2, 5) qaysi sonlarni o'z ichiga oladi?",
        options: ["2, 3, 4", "2, 3, 4, 5", "3, 4, 5", "2, 5"],
        a: "2, 3, 4"
    },
    {
        q: "x sonining oxirgi raqamini aniqlash formulasi qaysi?",
        options: ["x % 10", "x // 10", "x / 10", "x ** 10"],
        a: "x % 10"
    },
    {
        q: "Sikldan darhol chiqib ketish uchun qaysi operator ishlatiladi?",
        options: ["break", "continue", "stop", "exit"],
        a: "break"
    },
    {
        q: "Siklni keyingi qadamiga o'tib yuborish uchun qaysi operator ishlatiladi?",
        options: ["continue", "break", "pass", "next"],
        a: "continue"
    },
    {
        q: "Python-da funksiya qaysi kalit so'zi bilan boshlanadi?",
        options: ["def", "function", "func", "define"],
        a: "def"
    },
    {
        q: "def kvadrat(x): return x * x - kvadrat(4) nimani qaytaradi?",
        options: ["16", "8", "4", "12"],
        a: "16"
    },
    {
        q: "Funksiyada natijani qaytarish uchun qaysi operator ishlatiladi?",
        options: ["return", "print", "send", "get"],
        a: "return"
    },
    {
        q: "def f(a, b=5): return a + b - f(3) natijasi nima?",
        options: ["8", "3", "5", "Xatolik"],
        a: "8"
    },
    {
        q: "Funksiya chaqirilganda unga uzatiladigan qiymat nima deyiladi?",
        options: ["Argument", "Parametr", "O'zgaruvchi", "Natija"],
        a: "Argument"
    },
    {
        q: "Python-da modulning kengaytmasi qanday bo'ladi?",
        options: [".py", ".mod", ".exe", ".txt"],
        a: ".py"
    },
    {
        q: "Modulni dasturga ulash uchun qaysi kalit so'z ishlatiladi?",
        options: ["import", "include", "using", "require"],
        a: "import"
    },
    {
        q: "Barcha funksiyalarni moduldan birdaniga import qilish qaysi ko'rinishda?",
        options: ["from modul import *", "import all from modul", "include modul", "import modul.all"],
        a: "from modul import *"
    },
    {
        q: "Python-da 2D massiv (matritsa) qanday ifodalanadi?",
        options: ["Ro'yxat ichidagi ro'yxat: [[1,2],[3,4]]", "{1,2,3,4}", "(1,2,3,4)", "[1,2,3,4]"],
        a: "Ro'yxat ichidagi ro'yxat: [[1,2],[3,4]]"
    },
    {
        q: "matrix = [[1,2],[3,4]] kodi berilgan. matrix[0][1] nimaga teng?",
        options: ["2", "1", "3", "4"],
        a: "2"
    },
    {
        q: "Ro'yxatga yangi element qo'shish uchun qaysi metod ishlatiladi?",
        options: ["append()", "add()", "push()", "insert()"],
        a: "append()"
    },
    {
        q: "len(matrix) funksiyasi 2D massivda nimani qaytaradi?",
        options: ["Qatorlar sonini", "Barcha elementlar sonini", "Ustunlar sonini", "Xatolik"],
        a: "Qatorlar sonini"
    },
    {
        q: "NumPy kutubxonasi nima uchun ishlatiladi?",
        options: ["Katta hajmli massivlar va matematik hisoblar uchun", "Grafik interfeys yaratish uchun", "Sayt yaratish uchun", "Telegram bot yaratish uchun"],
        a: "Katta hajmli massivlar va matematik hisoblar uchun"
    },
    {
        q: "NumPy-ni import qilishning eng keng tarqalgan usuli qaysi?",
        options: ["import numpy as np", "import np", "from numpy import all", "include numpy"],
        a: "import numpy as np"
    },
    {
        q: "np.array([1, 2, 3, 4]) kodi nima yaratadi?",
        options: ["NumPy massivini", "Oddiy listni", "Tupleni", "Lug'atni"],
        a: "NumPy massivini"
    },
    {
        q: "3x3 birlik (identity) matritsa yaratish buyrug'i qaysi?",
        options: ["np.eye(3)", "np.ones(3)", "np.zeros(3)", "np.unit(3)"],
        a: "np.eye(3)"
    },
    {
        q: "Massiv elementlarining umumiy sonini qaysi xususiyat aniqlaydi?",
        options: ["arr.size", "arr.length", "arr.shape", "arr.dim"],
        a: "arr.size"
    },
    {
        q: "Massiv o'lchamini (masalan: 2x3) ko'rsatuvchi xususiyat qaysi?",
        options: ["arr.shape", "arr.size", "arr.ndim", "arr.type"],
        a: "arr.shape"
    },
    {
        q: "np.zeros(5) kodi nimani qaytaradi?",
        options: ["5 ta noldan iborat massiv", "5 raqamini", "Bo'sh massiv", "5 ta birdan iborat massiv"],
        a: "5 ta noldan iborat massiv"
    },
    {
        q: "arr[2:5] kesmasi qaysi elementlarni oladi?",
        options: ["2, 3 va 4-indeksdagi elementlarni", "2 dan 5 gacha bo'lgan barcha sonlarni", "Faqat 2 va 5-elementni", "Xatolik beradi"],
        a: "2, 3 va 4-indeksdagi elementlarni"
    },
    {
        q: "NumPy-da o'rtacha qiymatni hisoblaydigan funksiya qaysi?",
        options: ["np.mean()", "np.average()", "np.mid()", "np.sum()"],
        a: "np.mean()"
    },
    {
        q: "a=1; b=2; c=3; a, b, c = b, c, a - print(a, b, c) natijasi nima?",
        options: ["2 3 1", "1 2 3", "3 2 1", "2 1 3"],
        a: "2 3 1"
    },
    {
        q: "while x != 0: x -= 2 (agar x=10 bo'lsa) sikl necha marta aylanadi?",
        options: ["5 marta", "10 marta", "Cheksiz", "4 marta"],
        a: "5 marta"
    },
    {
        q: "i = 1; while i < 5: print(i) - Bu yerda cheksiz sikl nima uchun yuzaga keladi?",
        options: ["i ning qiymati o'zgarmayotgani uchun", "Shart xato yozilgani uchun", "i ning qiymati 5 dan katta bo'lgani uchun", "Print funksiyasi xato"],
        a: "i ning qiymati o'zgarmayotgani uchun"
    },
    {
        q: "a=4; b=3; c=5; t=(a*a+b*b==c*c) natijasi nima?",
        options: ["True", "False", "None", "Error"],
        a: "True"
    },
    {
        q: "a=8; b=3; print(a > 5 and b < 5) natijasi nima?",
        options: ["True", "False", "8 3", "Error"],
        a: "True"
    },
    {
        q: "x = 10; y = 0; print(x and y) natijasi nima?",
        options: ["0", "10", "True", "False"],
        a: "0"
    },
    {
        q: "x = 5; print(not (x > 3 and x < 10)) natijasi nima?",
        options: ["False", "True", "5", "None"],
        a: "False"
    },
    {
        q: "x = 0; y = 7; print(x or y) natijasi nima?",
        options: ["7", "0", "True", "False"],
        a: "7"
    },
    {
        q: "a = 3; print(a and not a) natijasi nima?",
        options: ["False", "True", "3", "0"],
        a: "False"
    },
    {
        q: "Python’da katta-kichik harflar (case sensitivity) qanday ahamiyatga ega?",
        options: ["Katta va kichik harflar turli o'zgaruvchilar hisoblanadi", "Hech qanday farqi yo'q", "Faqat funksiyalarda farq qiladi", "Faqat satrlarda farq qiladi"],
        a: "Katta va kichik harflar turli o'zgaruvchilar hisoblanadi"
    },
    {
        q: "print(1, 2, 3, sep='') natijasi nima bo'ladi?",
        options: ["123", "1 2 3", "1,2,3", "1;2;3"],
        a: "123"
    },
    {
        q: "s = 0; for i in range(4): s += i - print(s) natijasi?",
        options: ["6", "10", "4", "3"],
        a: "6"
    },
    {
        q: "for i in range(2, 6): print(i) - qaysi sonlar chiqadi?",
        options: ["2, 3, 4, 5", "2, 3, 4, 5, 6", "2, 6", "1, 2, 3, 4, 5"],
        a: "2, 3, 4, 5"
    },
    {
        q: "s = 1; for i in range(3): s *= 2 - print(s) natijasi?",
        options: ["8", "6", "4", "16"],
        a: "8"
    },
    {
        q: "for i in range(1, 6, 2): print(i) - qaysi sonlar chiqadi?",
        options: ["1, 3, 5", "1, 2, 3, 4, 5", "1, 6, 2", "2, 4, 6"],
        a: "1, 3, 5"
    },
    {
        q: "for i in range(5, 0, -1): print(i) - qaysi tartibda chiqadi?",
        options: ["5, 4, 3, 2, 1", "0, 1, 2, 3, 4, 5", "5, 0, -1", "4, 3, 2, 1, 0"],
        a: "5, 4, 3, 2, 1"
    },
    {
        q: "s = 1; for i in range(4): s += s - print(s) natijasi?",
        options: ["16", "8", "4", "32"],
        a: "16"
    },
    {
        q: "k = 0; for i in range(1, 10): if i % 3 == 0: k += 1 - k nechaga teng?",
        options: ["3", "2", "4", "9"],
        a: "3"
    },
    {
        q: "def chiqar(): return 5; print(chiqar()) natijasi?",
        options: ["5", "None", "chiqar", "Xatolik"],
        a: "5"
    },
    {
        q: "def f(a, b=4): return a*b; print(f(2)) natijasi?",
        options: ["8", "6", "2", "Xatolik"],
        a: "8"
    },
    {
        q: "def salom(ism): print('Salom', ism) - salom('Ali') natijasi nima?",
        options: ["Salom Ali", "Ali", "Salom ism", "Xatolik"],
        a: "Salom Ali"
    },
    {
        q: "Funksiya nima uchun ishlatiladi?",
        options: ["Kodni qayta ishlatish va tizimlashtirish uchun", "Faqat matematik hisoblar uchun", "Dasturni tezlashtirish uchun", "Xotirani tozalash uchun"],
        a: "Kodni qayta ishlatish va tizimlashtirish uchun"
    },
    {
        q: "def f(): return 10 - print(f()) natijasi nima?",
        options: ["10", "None", "f", "0"],
        a: "10"
    },
    {
        q: "return operatorining vazifasi nima?",
        options: ["Funksiya natijasini qaytarish va funksiyani tugatish", "Ma'lumotni ekranga chiqarish", "Siklni to'xtatish", "O'zgaruvchini o'chirish"],
        a: "Funksiya natijasini qaytarish va funksiyani tugatish"
    },
    {
        q: "Funksiya ichida boshqa funksiyani chaqirish mumkinmi?",
        options: ["Ha, mumkin", "Yo'q, mumkin emas", "Faqat bir marta mumkin", "Faqat matematik funksiyalarni"],
        a: "Ha, mumkin"
    },
    {
        q: "def f(x): return x % 2 == 0 - f(4) nimani qaytaradi?",
        options: ["True", "False", "0", "2"],
        a: "True"
    },
    {
        q: "Python-da modul nima?",
        options: ["Funksiya va o'zgaruvchilar saqlangan alohida .py fayl", "Dasturning xatolar ro'yxati", "Kompyuterning qattiq diski", "Faqat tayyor kutubxonalar"],
        a: "Funksiya va o'zgaruvchilar saqlangan alohida .py fayl"
    },
    {
        q: "Moduldan funksiyani global nomlar maydoniga import qilish buyrug'i qaysi?",
        options: ["from modul import *", "import modul", "include modul", "get modul"],
        a: "from modul import *"
    },
    {
        q: "Massiv (list) nima?",
        options: ["Bir nechta qiymatlarni bitta o'zgaruvchida saqlaydigan tartiblangan to'plam", "Faqat bitta son saqlaydigan joy", "Dastur kodi", "Faqat matnli ma'lumot"],
        a: "Bir nechta qiymatlarni bitta o'zgaruvchida saqlaydigan tartiblangan to'plam"
    },
    {
        q: "matrix = [[1,2],[3,4]] - matrix[1][0] nimaga teng?",
        options: ["3", "1", "2", "4"],
        a: "3"
    },
    {
        q: "2D massivda (matritsa) birinchi indeks nimani bildiradi?",
        options: ["Qatorni", "Ustunni", "Element qiymatini", "Massiv uzunligini"],
        a: "Qatorni"
    },
    {
        q: "Massivdan oxirgi elementni olish uchun qaysi indeks ishlatiladi?",
        options: ["-1", "0", "len(arr)", "last"],
        a: "-1"
    },
    {
        q: "Massiv elementini o'zgartirish qaysi ko'rinishda bo'ladi?",
        options: ["arr[indeks] = yangi_qiymat", "arr = yangi_qiymat", "arr.change(indeks)", "arr[indeks] == qiymat"],
        a: "arr[indeks] = yangi_qiymat"
    },
    {
        q: "Massivni to'liq o'qish uchun odatda nima ishlatiladi?",
        options: ["for sikli", "if operatori", "print funksiyasi", "while True"],
        a: "for sikli"
    },
    {
        q: "NumPy kutubxonasidagi asosiy obyekt nomi nima?",
        options: ["ndarray", "list", "array2d", "numpy_obj"],
        a: "ndarray"
    },
    {
        q: "Massivni transponirlash nimani bildiradi?",
        options: ["Qator va ustunlarning o'rnini almashtirish", "Elementlarni o'chirish", "Elementlarni ko'paytirish", "Massivni teskari tartibda yozish"],
        a: "Qator va ustunlarning o'rnini almashtirish"
    },
    {
        q: "SciPy kutubxonasi qaysi sohada ishlatiladi?",
        options: ["Ilmiy va muhandislik hisob-kitoblarida", "Sayt yaratishda", "Grafik dizaynda", "Telegram botlarda"],
        a: "Ilmiy va muhandislik hisob-kitoblarida"
    },
    {
        q: "np.mean(arr) funksiyasi nimani hisoblaydi?",
        options: ["O'rtacha arifmetik qiymatni", "Eng katta qiymatni", "Yig'indini", "Elementlar sonini"],
        a: "O'rtacha arifmetik qiymatni"
    },
    {
        q: "NumPy va Pandas birgalikda nima beradi?",
        options: ["Ma'lumotlar tahlili (Data Science) uchun kuchli asbob", "Faqat chiroyli grafiklar", "Dasturning xavfsizligi", "Internet tezligi"],
        a: "Ma'lumotlar tahlili (Data Science) uchun kuchli asbob"
    },
    {
        q: "NumPy kutubxonasini o‘rnatish buyrug‘i qaysi?",
        options: ["pip install numpy", "get numpy", "install numpy", "python numpy"],
        a: "pip install numpy"
    },
    {
        q: "NumPy massivlari Python listlaridan nimasi bilan farq qiladi?",
        options: ["Tezroq ishlaydi va xotirani kamroq sarflaydi", "Farqi yo'q", "Faqat sonlarni saqlaydi", "Sekinroq ishlaydi"],
        a: "Tezroq ishlaydi va xotirani kamroq sarflaydi"
    },
    {
        q: "np.eye(3) funksiyasi nimani yaratadi?",
        options: ["3x3 birlik matritsa", "Nollardan iborat massiv", "Bo'sh massiv", "3 ta elementli list"],
        a: "3x3 birlik matritsa"
    },
    {
        q: "arr.ndim xususiyati nimani aniqlaydi?",
        options: ["Massiv o'lchovlar sonini (necha o'lchamli ekanini)", "Elementlar sonini", "Ma'lumot turini", "Xotira hajmini"],
        a: "Massiv o'lchovlar sonini (necha o'lchamli ekanini)"
    },
    {
        q: "np.arange(1, 5) natijasi qaysi?",
        options: ["[1, 2, 3, 4]", "[1, 2, 3, 4, 5]", "[0, 1, 2, 3, 4]", "[1, 5]"],
        a: "[1, 2, 3, 4]"
    },
    {
        q: "def f(a): return a + 2 - print(f(1) + f(2)) natijasi?",
        options: ["7", "3", "4", "5"],
        a: "7"
    },
    {
        q: "Python-da massiv (list) elementlari har xil turda bo'lishi mumkinmi?",
        options: ["Ha, bo'lishi mumkin", "Yo'q, faqat bir xil turda", "Faqat son va matn bo'lishi mumkin", "Faqat NumPy massivlarida"],
        a: "Ha, bo'lishi mumkin"
    },
    {
        q: "if __name__ == '__main__': sharti nima uchun ishlatiladi?",
        options: ["Fayl bevosita ishga tushirilganini yoki import qilinganini tekshirish uchun", "Dasturni tugatish uchun", "Xatoni topish uchun", "Admin panelni ochish uchun"],
        a: "Fayl bevosita ishga tushirilganini yoki import qilinganini tekshirish uchun"
    },
    {
        q: "arr.shape xususiyati (2, 3) natija bersa, bu nima degani?",
        options: ["2 ta qator va 3 ta ustun", "3 ta qator va 2 ta ustun", "Jami 6 ta element", "2 o'lchamli 3 ta massiv"],
        a: "2 ta qator va 3 ta ustun"
    },
    {
        q: "del matrix[0] buyrug'i nima qiladi?",
        options: ["Birinchi qatorni o'chiradi", "Birinchi ustunni o'chiradi", "Butun massivni o'chiradi", "Xatolik beradi"],
        a: "Birinchi qatorni o'chiradi"
    },
    {
        q: "def f(x=4): return x + 1 - f() nimaga teng?",
        options: ["5", "4", "Xatolik", "None"],
        a: "5"
    },
    {
        q: "NumPy massivining o‘lchamini ko‘rsatuvchi xususiyat qaysi?",
        options: ["arr.shape", "arr.size", "arr.length", "arr.dim"],
        a: "arr.shape"
    },
    {
        q: "arr.size NumPy-da nimani bildiradi?",
        options: ["Massivdagi barcha elementlarning umumiy sonini", "Massiv o'lchamini", "Faqat qatorlar sonini", "Xotira hajmini"],
        a: "Massivdagi barcha elementlarning umumiy sonini"
    },
    {
        q: "2D massivda elementga murojaat qilish qaysi ko‘rinishda bo'ladi?",
        options: ["arr[qator, ustun]", "arr(qator;ustun)", "arr{qator}{ustun}", "arr[qator + ustun]"],
        a: "arr[qator, ustun]"
    },
    {
        q: "arr[::2] NumPy-da nimani bildiradi?",
        options: ["Massivni 2 qadam bilan qirqib olish", "Faqat birinchi 2 ta elementni olish", "Massivni 2 ga ko'paytirish", "Oxirgi 2 ta elementni o'chirish"],
        a: "Massivni 2 qadam bilan qirqib olish"
    },
    {
        q: "NumPy-da barcha elementlari 1 ga teng 3x3 massiv qanday yaratiladi?",
        options: ["np.ones((3, 3))", "np.eye(3)", "np.single(3, 3)", "np.full(1)"],
        a: "np.ones((3, 3))"
    },
    {
        q: "arr.dtype xususiyati nimani bildiradi?",
        options: ["Massiv elementlarining ma'lumot turini", "Massiv nomini", "Massiv hajmini", "Massiv yo'nalishini"],
        a: "Massiv elementlarining ma'lumot turini"
    },
    {
        q: "NumPy-da massiv shaklini o'zgartirish (masalan, 1D dan 2D ga) uchun qaysi metod ishlatiladi?",
        options: ["reshape()", "resize()", "change()", "format()"],
        a: "reshape()"
    },
    {
        q: "np.sqrt(arr) funksiyasi nima qiladi?",
        options: ["Har bir elementdan kvadrat ildiz oladi", "Massiv kvadratini hisoblaydi", "Faqat birinchi element ildizini oladi", "Xatolik beradi"],
        a: "Har bir elementdan kvadrat ildiz oladi"
    },
    {
        q: "Juft sonni aniqlash sharti qaysi?",
        options: ["n % 2 == 0", "n / 2 == 0", "n // 2 == 1", "n % 2 != 0"],
        a: "n % 2 == 0"
    },
    {
        q: "2D massivdagi elementlar yig‘indisi NumPy-da qanday topiladi?",
        options: ["np.sum(matrix)", "matrix.total()", "sumAll(matrix)", "np.add(matrix)"],
        a: "np.sum(matrix)"
    },
    {
        q: "NumPy-da ixtiyoriy (random) sonlardan iborat massiv yaratish funksiyasi qaysi?",
        options: ["np.random.rand()", "np.get_random()", "np.any()", "np.create_random()"],
        a: "np.random.rand()"
    },
    {
        q: "Massivdagi eng katta elementni topish funksiyasi qaysi?",
        options: ["np.max()", "np.high()", "np.big()", "np.top()"],
        a: "np.max()"
    },
    {
        q: "Massivdagi eng kichik elementning indeksini topish funksiyasi qaysi?",
        options: ["np.argmin()", "np.min_index()", "np.find_min()", "np.low()"],
        a: "np.argmin()"
    },
    {
        q: "np.dot(a, b) amali nima uchun ishlatiladi?",
        options: ["Matritsalarni ko'paytirish uchun", "Matritsalarni qo'shish uchun", "Elementlarni bo'lish uchun", "Nolga tekshirish uchun"],
        a: "Matritsalarni ko'paytirish uchun"
    },
    {
        q: "NumPy-da 'Broadcasting' nima?",
        options: ["Turli o'lchamdagi massivlar ustida amallar bajarish imkoniyati", "Massivni internetga yuklash", "Elementlarni o'chirish", "Xatolarni tuzatish"],
        a: "Turli o'lchamdagi massivlar ustida amallar bajarish imkoniyati"
    },
    {
        q: "np.linspace(0, 10, 5) nima qaytaradi?",
        options: ["0 dan 10 gacha 5 ta bir xil masofadagi sonlar", "0 va 10 orasidagi barcha butun sonlar", "5 ta tasodifiy son", "10 gacha bo'lgan 5 ning karralilari"],
        a: "0 dan 10 gacha 5 ta bir xil masofadagi sonlar"
    },
    {
        q: "arr.T NumPy-da nimani bildiradi?",
        options: ["Massivni transponirlash (qator va ustun o'rnini almashtirish)", "Massivni o'chirish", "Massiv turini ko'rish", "Massivni test qilish"],
        a: "Massivni transponirlash (qator va ustun o'rnini almashtirish)"
    },
    {
        q: "Pandas kutubxonasi asosan nima bilan ishlashga mo'ljallangan?",
        options: ["Ma'lumotlar jadvallari (DataFrame) bilan", "Faqat murakkab o'yinlar yaratish bilan", "Telegram botlar bilan", "Faqat ovozli fayllar bilan"],
        a: "Ma'lumotlar jadvallari (DataFrame) bilan"
    },
    {
        q: "NumPy-da mantiqiy filtrlash qanday bo'ladi?",
        options: ["arr[arr > 5]", "arr(if > 5)", "filter(arr, 5)", "arr.select(5)"],
        a: "arr[arr > 5]"
    },
    {
        q: "Python-da 'None' nima?",
        options: ["Qiymat mavjud emasligini bildiruvchi maxsus obyekt", "Nol soni", "Bo'sh satr", "Xatolik turi"],
        a: "Qiymat mavjud emasligini bildiruvchi maxsus obyekt"
    },
    {
        q: "np.zeros((2, 3)) funksiyasi qanday massiv yaratadi?",
        options: ["2 qator va 3 ustunli nollar matritsasi", "3 qator va 2 ustunli nollar matritsasi", "6 ta noldan iborat qator", "Xatolik beradi"],
        a: "2 qator va 3 ustunli nollar matritsasi"
    },
    {
        q: "NumPy-da massiv o‘lchovlar sonini aniqlovchi xususiyat qaysi?",
        options: ["arr.ndim", "arr.size", "arr.shape", "arr.length"],
        a: "arr.ndim"
    },
    {
        q: "3×3 birlik (identity) matritsa qaysi funksiya bilan yaratiladi?",
        options: ["np.eye(3)", "np.ones(3)", "np.identity_matrix(3)", "np.zeros(3)"],
        a: "np.eye(3)"
    },
    {
        q: "arr = np.array([1, 2, 3]); print(arr * 2) natijasi nima?",
        options: ["[2, 4, 6]", "[1, 2, 3, 1, 2, 3]", "[2, 2, 2]", "Xatolik"],
        a: "[2, 4, 6]"
    },
    {
        q: "NumPy-da ikki massivni vertikal birlashtirish funksiyasi qaysi?",
        options: ["np.vstack()", "np.hstack()", "np.concatenate()", "np.append()"],
        a: "np.vstack()"
    },
    {
        q: "NumPy-da ikki massivni gorizontal birlashtirish funksiyasi qaysi?",
        options: ["np.hstack()", "np.vstack()", "np.join()", "np.combine()"],
        a: "np.hstack()"
    },
    {
        q: "arr.flatten() metodi nima vazifani bajaradi?",
        options: ["Ko'p o'lchamli massivni bir o'lchamli (tekis) massivga aylantiradi", "Massivni o'chiradi", "Elementlarni saralaydi", "Nollarni olib tashlaydi"],
        a: "Ko'p o'lchamli massivni bir o'lchamli (tekis) massivga aylantiradi"
    },
    {
        q: "np.full((2, 2), 7) kodi nimani qaytaradi?",
        options: ["Barcha elementlari 7 ga teng 2x2 matritsa", "2 ta 7 raqamini", "7x7 o'lchamli matritsa", "Xatolik"],
        a: "Barcha elementlari 7 ga teng 2x2 matritsa"
    },
    {
        q: "Massiv elementlarining ko'paytmasini hisoblovchi funksiya qaysi?",
        options: ["np.prod()", "np.multiply()", "np.sum()", "np.dot()"],
        a: "np.prod()"
    },
    {
        q: "arr[arr % 2 != 0] kodi massivdan qaysi elementlarni tanlab oladi?",
        options: ["Barcha toq sonlarni", "Barcha juft sonlarni", "Faqat nollarni", "Faqat musbat sonlarni"],
        a: "Barcha toq sonlarni"
    },
    {
        q: "NumPy-da massivning ma'lumot turini o'zgartirish metodi qaysi?",
        options: ["astype()", "dtype()", "convert()", "type()"],
        a: "astype()"
    },
    {
        q: "np.linspace(0, 1, 4) natijasi qanday bo'ladi?",
        options: ["[0. , 0.33333333, 0.66666667, 1.]", "[0, 1, 2, 3, 4]", "[0, 0.25, 0.5, 1]", "Xatolik"],
        a: "[0. , 0.33333333, 0.66666667, 1.]"
    },
    {
        q: "arr.nbytes xususiyati nimani ko'rsatadi?",
        options: ["Massiv elementlari egallagan xotira hajmini (baytlarda)", "Elementlar sonini", "Ma'lumot turini", "Massiv nomini"],
        a: "Massiv elementlari egallagan xotira hajmini (baytlarda)"
    },
    {
        q: "np.unique(arr) funksiyasi nima qiladi?",
        options: ["Massivdagi takrorlanmas elementlarni qaytaradi", "Massivni tartiblaydi", "Barcha elementlarni birlashtiradi", "Xatolarni o'chiradi"],
        a: "Massivdagi takrorlanmas elementlarni qaytaradi"
    },
    {
        q: "NumPy-da massiv elementlarini saralash funksiyasi qaysi?",
        options: ["np.sort()", "np.order()", "np.arrange()", "np.split()"],
        a: "np.sort()"
    },
    {
        q: "arr.min() va np.min(arr) o'rtasida farq bormi?",
        options: ["Farqi yo'q, ikkalasi ham eng kichik elementni topadi", "Biri indeksni, biri qiymatni topadi", "Faqat biri 2D massivda ishlaydi", "Ha, biri xatolik beradi"],
        a: "Farqi yo'q, ikkalasi ham eng kichik elementni topadi"
    },
    {
        q: "np.argpartition() funksiyasi nima uchun ishlatiladi?",
        options: ["Massivni qisman saralash uchun", "Massivni ikkiga bo'lish uchun", "O'rtacha qiymatni topish uchun", "Elementni o'chirish uchun"],
        a: "Massivni qisman saralash uchun"
    },
    {
        q: "Python-da 'is' va '==' operatorlari o'rtasidagi farq nima?",
        options: ["'==' qiymatni, 'is' esa xotiradagi manzilni tekshiradi", "Farqi yo'q", "Biri faqat sonlar uchun", "Biri faqat satrlar uchun"],
        a: "'==' qiymatni, 'is' esa xotiradagi manzilni tekshiradi"
    },
    {
        q: "NumPy massivlarida 'fancy indexing' nima?",
        options: ["Indekslar ro'yxati orqali elementlarga murojaat qilish", "Faqat juft indekslarni olish", "Matnli indekslar bilan ishlash", "Xatolik turi"],
        a: "Indekslar ro'yxati orqali elementlarga murojaat qilish"
    },
    {
        q: "Bot yaratishda ishlatilayotgan Telegraf kutubxonasi qaysi tilga tegishli?",
        options: ["JavaScript (Node.js)", "Python", "PHP", "Java"],
        a: "JavaScript (Node.js)"
    }

    ] 
  }
};

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
                username: username ? `@${username}` : "Lichka yopiq", // Username saqlash
                score: 0, 
                totalTests: 0, 
                date: new Date().toISOString() 
            };
        }
        db.users[userId].totalTests = (db.users[userId].totalTests || 0) + 1;
        if (score > (db.users[userId].score || 0)) {
            db.users[userId].score = score;
            db.users[userId].date = new Date().toISOString();
        }
        db.users[userId].name = name;
        db.users[userId].username = username ? `@${username}` : "Lichka yopiq";
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (error) { console.error("Bazaga yozishda xato:", error); }
}

function getLeaderboard() {
    const db = getDb();
    if (!db.users) return "Hozircha hech kim test topshirmadi.";
    
    const usersArray = Object.values(db.users);
    if (usersArray.length === 0) return "Hozircha hech kim test topshirmadi.";
    
    // Saralash
    const sorted = usersArray.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
    
    let res = "🏆 **TOP 10 REYTING**\n\n";
    sorted.forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "👤";
        const name = u.name || "Noma'lum";
        // Username undefined bo'lsa, bo'sh joy chiqaradi
        const userLink = (u.username && u.username !== "Lichka yopiq") ? ` (${u.username})` : "";
        res += `${medal} ${name}${userLink} — ${(u.score || 0).toFixed(1)} ball\n`;
    });
    return res;
}

function showSubjectMenu(ctx) {
    return ctx.reply("Fanni tanlang:", Markup.keyboard([
        ["📝 Akademik yozuv", "📜 Tarix"],
        ["➕ Matematika", "💻 Dasturlash 1"],
        ["📊 Reyting", "👤 Profil"]
    ]).resize());
}

async function sendQuestion(ctx, isNew = false) {
    const s = ctx.session;
    const userId = ctx.from.id;
    if (timers[userId]) clearTimeout(timers[userId]);

    if (s.index >= s.activeList.length) {
        // Bu yerda ctx.from.username ni ham qo'shib yuboramiz (avvalgi kelishuvga ko'ra)
        updateGlobalScore(userId, s.userName, ctx.from.username, s.score);
        let finishMsg = `🏁 <b>Test yakunlandi, ${s.userName}!</b>\n\n✅ Natija: <b>${s.score.toFixed(1)} ball</b>\n❌ Xatolar: <b>${s.wrongs.length} ta</b>.`;
        return ctx.replyWithHTML(finishMsg, Markup.keyboard([["⚡️ Blitz (25)", "📝 To'liq test"], ["⬅️ Orqaga (Fanlar)"]]).resize());
    }

    const qData = s.activeList[s.index];
    s.currentOptions = shuffle([...qData.options]);
    const buttons = s.currentOptions.map((opt, i) => [Markup.button.callback(opt, `ans_${i}`)]);
    buttons.push([Markup.button.callback("🛑 Testni to'xtatish", "stop_test")]);

    const progress = getProgressBar(s.index + 1, s.activeList.length);
    
    // Markdown o'rniga HTML ishlatamiz (<b> va <i> xavfsizroq)
    // escapeHTML funksiyasi savol ichidagi < va > belgilarini zararsizlantiradi
    const safeQuestion = escapeHTML(qData.q);
    
    const text = `📊 Progress: [${progress}]\n` +
                 `🔢 Savol: <b>${s.index + 1} / ${s.activeList.length}</b>\n` +
                 `⏱ <b>VAQT: ${botSettings.timeLimit} soniya!</b>\n\n` +
                 `❓ <b>${safeQuestion}</b>`;

    try {
        if (isNew) {
            await ctx.replyWithHTML(text, Markup.inlineKeyboard(buttons));
        } else {
            await ctx.editMessageText(text, { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) });
        }
    } catch (e) {
        // Agar editMessage xato bersa (masalan, matn o'zgarmagan bo'lsa), yangi xabar yuboradi
        await ctx.replyWithHTML(text, Markup.inlineKeyboard(buttons));
    }

    timers[userId] = setTimeout(async () => {
        if (ctx.session && ctx.session.index === s.index) {
            ctx.session.wrongs.push(qData);
            ctx.session.index++; 
            await ctx.replyWithHTML(`⏰ <b>VAQT TUGADI!</b>`);
            sendQuestion(ctx, true);
        }
    }, botSettings.timeLimit * 1000);
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

// --- ADMIN KOMANDALARI ---
bot.command('admin', (ctx) => {
    if (ctx.from.id === ADMIN_ID) {
        const currentMin = (botSettings.timeLimit / 60).toFixed(1);
        return ctx.reply(`🛠 **Admin Panel**\n⏱ Vaqt: ${botSettings.timeLimit}s (${currentMin}m)`, 
            Markup.keyboard([
                ['💰 Pullik versiya', '🆓 Bepul versiya'],
                ['➕ Yangi fan qoshish', '⏱ Vaqtni o\'zgartirish'],
                ['📊 Statistika', '📣 Xabar tarqatish'],
                ['⬅️ Orqaga (Fanlar)']
            ]).resize());
    }
});

// Statistika tugmasini eshitish (Admin uchun)
bot.hears('📊 Statistika', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;

    const db = getDb();
    const users = Object.values(db.users || {});
    const totalUsers = users.length;
    const totalTests = users.reduce((sum, u) => sum + (u.totalTests || 0), 0);
    
    let report = `📊 **BOT STATISTIKASI**\n\n`;
    report += `👥 Jami foydalanuvchilar: ${totalUsers} ta\n`;
    report += `📝 Jami topshirilgan testlar: ${totalTests} ta\n`;
    
    return ctx.reply(report);
});

bot.hears('⏱ Vaqtni o\'zgartirish', (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    ctx.session.waitingForTime = true;
    return ctx.reply("Vaqtni soniyalarda kiriting:", Markup.keyboard([['🚫 Bekor qilish']]).resize());
});

bot.on('text', async (ctx, next) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    const username = ctx.from.username || "Lichka yopiq"; // Username'ni olamiz

    if (text.startsWith('/')) return next();

    // ADMIN uchun vaqtni o'zgartirish qismi (o'zgarishsiz qoldi)
    if (userId === ADMIN_ID && ctx.session.waitingForTime) {
        if (text === '🚫 Bekor qilish') {
            ctx.session.waitingForTime = false;
            return showSubjectMenu(ctx);
        }
        const newTime = parseInt(text);
        if (isNaN(newTime) || newTime < 5) return ctx.reply("❌ Xato raqam!");
        botSettings.timeLimit = newTime;
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(botSettings));
        ctx.session.waitingForTime = false;
        return ctx.reply(`✅ Yangilandi: ${newTime} soniya.`);
    }

    // Ism qabul qilish (YANGILANGAN)
    if (ctx.session.waitingForName) {
        if (text.length < 3) return ctx.reply("❌ Ism juda qisqa! Iltimos, to'liq ismingizni yozing:");

        ctx.session.userName = text;
        ctx.session.waitingForName = false;
        
        let db = getDb();
        // Foydalanuvchi ma'lumotlarini to'liqroq saqlaymiz
        db.users[userId] = { 
            name: text, 
            username: username !== "Lichka yopiq" ? `@${username}` : username,
            score: db.users[userId]?.score || 0, // Agar eski skori bo'lsa saqlab qolamiz
            totalTests: db.users[userId]?.totalTests || 0,
            date: new Date().toISOString() 
        };
        
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        
        await ctx.reply(`✅ Rahmat, ${text}! Ma'lumotlaringiz saqlandi.`);
        return showSubjectMenu(ctx);
    }

    return next();
});

// --- TEST BOSHLASH ---
bot.hears(["📝 Akademik yozuv", "📜 Tarix", "➕ Matematika", "💻 Dasturlash 1"], async (ctx) => {
    const text = ctx.message.text;
    if (text.includes("Akademik")) ctx.session.currentSubject = "academic";
    else if (text.includes("Tarix")) ctx.session.currentSubject = "history";
    else if (text.includes("Matematika")) ctx.session.currentSubject = "math";
    else if (text.includes("Dasturlash")) ctx.session.currentSubject = "dasturlash"; // Shu joyi aniq bo'lishi kerak
    ctx.reply(`Tayyormisiz?`, Markup.keyboard([["⚡️ Blitz (25)", "📝 To'liq test"], ["⬅️ Orqaga (Fanlar)"]]).resize());
});

bot.hears(["⚡️ Blitz (25)", "📝 To'liq test"], async (ctx) => {
    const s = ctx.session;
    if (!s.currentSubject || !SUBJECTS[s.currentSubject]) return showSubjectMenu(ctx);
    const questions = SUBJECTS[s.currentSubject].questions;
    if (!questions || questions.length === 0) return ctx.reply("Bu fanda savollar yo'q.");
    
    s.activeList = ctx.message.text.includes("25") ? shuffle(questions).slice(0, 25) : shuffle(questions);
    s.index = 0; s.score = 0; s.wrongs = [];
    sendQuestion(ctx, true);
});

bot.hears("📊 Reyting", (ctx) => ctx.reply(getLeaderboard()));
bot.hears("⬅️ Orqaga (Fanlar)", (ctx) => showSubjectMenu(ctx));

bot.start((ctx) => {
    const db = getDb();
    const userId = ctx.from.id;

    if (db.users[userId] && db.users[userId].name) {
        ctx.session.userName = db.users[userId].name;
        return showSubjectMenu(ctx);
    }

    ctx.session.waitingForName = true;
    return ctx.reply("Assalomu alaykum! Test simulyatoriga xush kelibsiz.\n\nIltimos, ismingizni kiriting (Reyting uchun):");
});

// --- CALLBACKLAR ---
bot.action(/^ans_(\d+)$/, async (ctx) => {
    const s = ctx.session;
    if (!s.activeList) return;
    if (timers[ctx.from.id]) clearTimeout(timers[ctx.from.id]);

    const selIdx = parseInt(ctx.match[1]);
    const currentQ = s.activeList[s.index];

    if (s.currentOptions[selIdx] === currentQ.a) {
        s.score++;
        await ctx.answerCbQuery("✅");
    } else {
        s.wrongs.push(currentQ);
        await ctx.answerCbQuery(`❌ To'g'ri: ${currentQ.a}`, { show_alert: true });
    }
    s.index++;
    sendQuestion(ctx);
});

bot.action('stop_test', (ctx) => {
    if (timers[ctx.from.id]) clearTimeout(timers[ctx.from.id]);
    ctx.session.index = 999;
    showSubjectMenu(ctx);
});

bot.launch().then(() => console.log("Bot running..."));

// Portni Railway talab qilgani uchun ochamiz
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.end('Bot is running'); }).listen(PORT);