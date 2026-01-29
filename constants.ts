
import { QuestionBank } from './types';

export const UNIVERSITIES = [
  "Alfraganus Universiteti",
  "Perfect Universiteti",
  "TATU",
  "Westminster Universiteti",
  "Inha Universiteti",
];

export const COURSE_MAJORS: { [key: string]: string[] } = {
  "1": ["Dasturiy Injiniring", "Sun'iy intellekt", "Iqtisodiyot", "Grafik Dizayn"],
  "2": ["Kiberxavfsizlik", "Data Science", "Logistika", "Biznes Boshqaruvi"],
  "3": ["Mobil Dasturlash", "O'yin Ishlab Chiqish", "Marketing", "Moliya"],
  "4": ["Blokcheyn Texnologiyalari", "Robototexnika", "Xalqaro Munosabatlar", "Turizm"],
};

export const SUBJECTS = [
    { name: 'Fizika', emoji: '🧲' },
    { name: 'Matematika', emoji: '➕' },
    { name: 'English', emoji: '🇬🇧' },
    { name: 'Tarix', emoji: '📜' },
    { name: 'Akademik', emoji: '📝' },
    { name: 'Dasturlash', emoji: '💻' }
];

export const ALL_QUESTIONS: QuestionBank = {
  "Fizika": [
    { q: "Statika nimani o‘rganadi?", o: ["Tezlikni", "Jismlarning muvozanat shartlarini", "Kuchni", "Harakatni"], a: 1 },
    { q: "Erkin tushish tezlanishi (g) ning o'rtacha qiymati qancha?", o: ["9.8 m/s²", "10.5 m/s²", "8.9 m/s²", "11.2 m/s²"], a: 0 },
    { q: "Nyutonning ikkinchi qonuni formulasi qanday?", o: ["F = ma", "P = IV", "E = mc²", "V = IR"], a: 0 },
    { q: "Quvvatning o'lchov birligi nima?", o: ["Joul", "Nyuton", "Vatt", "Paskal"], a: 2 },
    { q: "Qaysi olim nisbiylik nazariyasini yaratgan?", o: ["Isaac Newton", "Galileo Galilei", "Albert Einstein", "Nikola Tesla"], a: 2 },
  ],
  "Matematika": [
    { q: "To'g'ri burchakli uchburchakda gipotenuza kvadratining yig'indisi nimaga teng?", o: ["Katetlar yig'indisiga", "Katetlar kvadratlari yig'indisiga", "Perimetrga", "Yuzaga"], a: 1 },
    { q: "PI (π) sonining taxminiy qiymati qancha?", o: ["3.14", "2.71", "1.61", "4.20"], a: 0 },
    { q: "x² - 4 = 0 tenglamaning yechimlari qaysi?", o: ["2", "-2", "2 va -2", "4"], a: 2 },
    { q: "Doiraning yuzini topish formulasi qanday?", o: ["2πr", "πr²", "πd", "2πd"], a: 1 },
    { q: "Eng kichik tub son qaysi?", o: ["0", "1", "2", "3"], a: 2 },
  ],
  "English": [
    { q: "Which word is a synonym for 'happy'?", o: ["Sad", "Joyful", "Angry", "Tired"], a: 1 },
    { q: "What is the past tense of 'go'?", o: ["Goed", "Gone", "Went", "Going"], a: 2 },
    { q: "'I ___ a student.' Choose the correct verb.", o: ["is", "are", "am", "be"], a: 2 },
    { q: "What is the opposite of 'big'?", o: ["Large", "Huge", "Small", "Tall"], a: 2 },
    { q: "Which of these is a preposition?", o: ["Run", "Quickly", "Under", "Beautiful"], a: 2 },
  ],
  "Tarix": [
    { q: "Amir Temur qachon tug'ilgan?", o: ["1336-yil", "1405-yil", "1227-yil", "1501-yil"], a: 0 },
    { q: "Ikkinchi jahon urushi qaysi yillarda bo'lib o'tgan?", o: ["1914-1918", "1939-1945", "1950-1953", "1900-1905"], a: 1 },
    { q: "Buyuk ipak yo'li asosan nima uchun xizmat qilgan?", o: ["Harbiy yurishlar", "Savdo-sotiq", "Diniy ziyoratlar", "Pochta xizmati"], a: 1 },
    { q: "Misr ehromlari kimlar uchun qurilgan?", o: ["Xudolar", "Fir'avnlar", "Qullar", "Harbiylar"], a: 1 },
    { q: "O'zbekiston Respublikasi mustaqilligi qachon e'lon qilingan?", o: ["1990-yil 20-iyun", "1991-yil 31-avgust", "1992-yil 8-dekabr", "1989-yil 21-oktyabr"], a: 1 },
  ],
  "Akademik": [
    { q: "Plagiat nima?", o: ["Boshqa manbadan iqtibos keltirish", "O'zga muallif ishini ko'chirish va o'ziniki qilib ko'rsatish", "Ma'lumotlarni tahlil qilish", "Ilmiy maqola yozish"], a: 1 },
    { q: "Tadqiqot gipotezasi nima?", o: ["Muammoning yechimi", "Tekshirilishi kerak bo'lgan taxminiy fikr", "Tadqiqot xulosasi", "Adabiyotlar tahlili"], a: 1 },
    { q: "APA uslubi qayerda keng qo'llaniladi?", o: ["Adabiyotda", "Tibbiyotda", "Ijtimoiy fanlarda", "Musiqada"], a: 2 },
    { q: "Annotatsiya (abstract) nima?", o: ["Maqolaning qisqacha mazmuni", "Foydalanilgan adabiyotlar ro'yxati", "Maqolaning kirish qismi", "Rasm va jadvallar"], a: 0 },
    { q: "Peer review (ekspert baholash) nima?", o: ["Talabalar baholashi", "O'qituvchi baholashi", "Shu sohadagi boshqa olimlar tomonidan ilmiy ishni baholash", "Ota-onalar baholashi"], a: 2 },
  ],
  "Dasturlash": [
    { q: "O'zgaruvchi (variable) nima?", o: ["Ma'lumot saqlash uchun nomlangan xotira qismi", "Takrorlanuvchi kod bloki", "Amallar ketma-ketligi", "Dastur xatoligi"], a: 0 },
    { q: "HTML qanday til?", o: ["Dasturlash tili", "Belgilash tili", "Skript tili", "So'rovlar tili"], a: 1 },
    { q: "Git nima uchun ishlatiladi?", o: ["Kod yozish uchun", "Versiyalarni boshqarish uchun", "Dasturni ishga tushirish uchun", "Ma'lumotlar bazasi uchun"], a: 1 },
    { q: "Massiv (array) nima?", o: ["Bitta o'zgaruvchi", "Bir turdagi elementlar to'plami", "Funksiya", "Shart operatori"], a: 1 },
    { q: "API qisqartmasi nimani anglatadi?", o: ["Advanced Programming Interface", "Application Programming Interface", "Application Protocol Instance", "Advanced Protocol Interaction"], a: 1 },
  ]
};
