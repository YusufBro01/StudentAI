const { Telegraf, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const fs = require('fs');

const bot = new Telegraf('8577708732:AAGkqZmmLk4bsqI_U71DLLCQHXuywSTsLPk');
bot.use((new LocalSession({ database: 'session.json' })).middleware());

// 1. FANLAR VA SAVOLLAR BAZASI
const SUBJECTS = {
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

    }
};

const DB_FILE = 'ranking_db.json';
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }));

const TIME_LIMIT = 20;
const timers = {};

// YORDAMCHI FUNKSIYALAR
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function getProgressBar(current, total) {
    const size = 10;
    const progress = Math.min(Math.round((current / total) * size), size);
    return "█".repeat(progress) + "░".repeat(size - progress);
}

function updateGlobalScore(userId, name, score) {
    const db = JSON.parse(fs.readFileSync(DB_FILE));
    if (!db.users[userId] || score > db.users[userId].score) {
        db.users[userId] = { name: name, score: score, date: new Date().toLocaleDateString() };
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    }
}

function getLeaderboard() {
    const db = JSON.parse(fs.readFileSync(DB_FILE));
    const sorted = Object.values(db.users).sort((a, b) => b.score - a.score).slice(0, 10);
    if (sorted.length === 0) return "Hozircha hech kim test topshirmadi.";
    return sorted.map((u, i) => `${i + 1}. 🏆 ${u.name} — ${u.score.toFixed(1)} ball`).join('\n');
}

function showSubjectMenu(ctx) {
    ctx.reply("Fanni tanlang:", Markup.keyboard([
        ["📝 Akademik yozuv", "📜 Tarix"],
        ["📊 Reyting", "👤 Profil"]
    ]).resize());
}

// SAVOL YUBORISH
async function sendQuestion(ctx, isNew = false) {
    const s = ctx.session;
    const userId = ctx.from.id;

    if (timers[userId]) clearTimeout(timers[userId]);

    if (s.index >= s.activeList.length) {
        updateGlobalScore(userId, s.userName, s.score);
        let finishMsg = `🏁 **Test yakunlandi, ${s.userName}!**\n\n✅ Natija: ${s.score.toFixed(1)} ball\n❌ Xatolar: ${s.wrongs.length} ta.`;
        return ctx.reply(finishMsg, Markup.keyboard([["⚡️ Blitz (25)", "📝 To'liq test"], ["⬅️ Orqaga (Fanlar)"]]).resize());
    }

    const qData = s.activeList[s.index];
    s.currentOptions = shuffle([...qData.options]);
    
    const buttons = s.currentOptions.map((opt, i) => [Markup.button.callback(opt, `ans_${i}`)]);
    buttons.push([Markup.button.callback("🛑 Testni to'xtatish", "stop_test")]);

    const progress = getProgressBar(s.index + 1, s.activeList.length);
    const text = `📊 Progress: [${progress}]\n🔢 Savol: ${s.index + 1} / ${s.activeList.length}\n⏱ **VAQT: ${TIME_LIMIT} soniya!**\n\n❓ ${qData.q}`;

    try {
        if (isNew) await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
        else await ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
    } catch (e) {
        await ctx.reply(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
    }

    timers[userId] = setTimeout(async () => {
        if (ctx.session.index === s.index) {
            ctx.session.wrongs.push(qData);
            ctx.session.activeList.push(qData);
            ctx.session.index++;
            await ctx.reply(`⏰ **VAQT TUGADI!**\nSavol oxiriga o'tkazildi.`);
            sendQuestion(ctx, true);
        }
    }, TIME_LIMIT * 1000);
}

// BOT BUYRUQLARI
bot.start(async (ctx) => {
    if (!ctx.session.userName) {
        return ctx.reply("Assalomu alaykum! Imtihon botiga xush kelibsiz.\n\nIltimos, ismingizni kiriting:");
    }
    showSubjectMenu(ctx);
});

bot.on('text', async (ctx, next) => {
    const s = ctx.session;
    // Ism kiritish mantiqi
    if (!s.userName && !ctx.message.text.startsWith('/')) {
        s.userName = ctx.message.text;
        return showSubjectMenu(ctx);
    }
    return next();
});

// Fan tanlash
bot.hears(["📝 Akademik yozuv", "📜 Tarix"], async (ctx) => {
    ctx.session.currentSubject = ctx.message.text.includes("Akademik") ? "academic" : "history";
    ctx.reply(`${ctx.message.text} tanlandi. Rejimni tanlang:`, 
        Markup.keyboard([
            ["⚡️ Blitz (25)", "📝 To'liq test"],
            ["⬅️ Orqaga (Fanlar)"]
        ]).resize()
    );
});

bot.hears("⬅️ Orqaga (Fanlar)", (ctx) => showSubjectMenu(ctx));

bot.hears("📊 Reyting", (ctx) => {
    ctx.reply(`🏆 **LIDERLAR JADVALI (TOP 10)**\n\n${getLeaderboard()}`, { parse_mode: 'Markdown' });
});

bot.hears(["⚡️ Blitz (25)", "📝 To'liq test"], async (ctx) => {
    const s = ctx.session;
    if (!s.currentSubject) return showSubjectMenu(ctx);

    const userId = ctx.from.id;
    if (timers[userId]) clearTimeout(timers[userId]);

    const subjectData = SUBJECTS[s.currentSubject];
    s.activeList = ctx.message.text.includes("25") 
        ? shuffle(subjectData.questions).slice(0, 25) 
        : [...subjectData.questions];
    
    s.index = 0;
    s.score = 0;
    s.wrongs = [];
    
    await ctx.reply(`${subjectData.name} fanidan test boshlandi! Omad!`);
    sendQuestion(ctx, true);
});

// ACTIONLAR
bot.action(/^ans_(\d+)$/, async (ctx) => {
    const s = ctx.session;
    if (timers[ctx.from.id]) clearTimeout(timers[ctx.from.id]);

    const selIdx = parseInt(ctx.match[1]);
    const currentQ = s.activeList[s.index];

    if (s.currentOptions[selIdx] === currentQ.a) {
        s.score++;
        await ctx.answerCbQuery("✅ To'g'ri!");
    } else {
        s.wrongs.push(currentQ);
        s.activeList.push(currentQ);
        await ctx.answerCbQuery(`❌ Xato! To'g'ri javob: ${currentQ.a}`, { show_alert: true });
    }

    s.index++;
    sendQuestion(ctx);
});

bot.action('stop_test', async (ctx) => {
    if (timers[ctx.from.id]) clearTimeout(timers[ctx.from.id]);
    ctx.session.index = 9999;
    await ctx.answerCbQuery("Test to'xtatildi");
    showSubjectMenu(ctx);
});

bot.launch();



const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot ishlayapti!');
}).listen(process.env.PORT || 3000);