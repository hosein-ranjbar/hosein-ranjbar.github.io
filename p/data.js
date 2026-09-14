/**
 * data.js — داده پایه
 * دیتابیس خالی است: فقط استان + شهر مرکز.
 * پاساژ و فروشگاه را از پنل ادمین (admin.html) اضافه کنید.
 * بعد از افزودن، «دانلود data.js به‌روز» را بزنید تا در گیت‌هاب ذخیره شود.
 */

// دیکشنری جستجو (فارسی ↔ انگلیسی). از ادمین هم قابل گسترش است.
const searchAliases = {
  "جی‌بی‌ال": ["jbl", "جی بی ال", "جیبیال"],
  "انکر": ["anker"],
  "هارمن کاردن": ["harman", "kardon", "harman kardon", "هارمن"],
  "سامسونگ": ["samsung"],
  "اپل": ["apple", "iphone", "آیفون"],
  "شیائومی": ["xiaomi", "mi"],
  "سونی": ["sony"],
  "ال‌جی": ["lg", "ال جی"],
  "موبایل": ["mobile", "phone", "گوشی"],
  "لوازم جانبی": ["accessory", "accessories", "جانبی"],
  "اسپیکر": ["speaker", "بلندگو"],
  "هدفون": ["headphone", "headset"],
  "لپ‌تاپ": ["laptop", "notebook", "لپ تاپ"]
};

// دسته‌های شغلی استاندارد کل پروژه (id ثابت تا تکراری ساخته نشود)
const standardCategories = [
  { id: "mobile", name: "موبایل و کامپیوتر" },
  { id: "home", name: "لوازم خانگی" },
  { id: "clothing", name: "پوشاک" },
  { id: "gold", name: "طلا و جواهر" },
  { id: "food", name: "مواد غذایی" },
  { id: "other", name: "سایر" }
];

const provincesData = [
  { id: "tehran", name: "تهران", cities: [{ id: "tehran-city", name: "تهران", categories: [] }, { id: "karaj", name: "کرج", categories: [] }] },
  { id: "isfahan", name: "اصفهان", cities: [{ id: "isfahan-city", name: "اصفهان", categories: [] }] },
  { id: "fars", name: "فارس", cities: [{ id: "shiraz", name: "شیراز", categories: [] }] },
  { id: "khorasan-razavi", name: "خراسان رضوی", cities: [{ id: "mashhad", name: "مشهد", categories: [] }] },
  { id: "azarbaijan-sharghi", name: "آذربایجان شرقی", cities: [{ id: "tabriz", name: "تبریز", categories: [] }] },
  { id: "azarbaijan-gharbi", name: "آذربایجان غربی", cities: [{ id: "urmia", name: "ارومیه", categories: [] }] },
  { id: "ardabil", name: "اردبیل", cities: [{ id: "ardabil-city", name: "اردبیل", categories: [] }] },
  { id: "alborz", name: "البرز", cities: [{ id: "karaj-alborz", name: "کرج", categories: [] }] },
  { id: "ilam", name: "ایلام", cities: [{ id: "ilam-city", name: "ایلام", categories: [] }] },
  { id: "bushehr", name: "بوشهر", cities: [{ id: "bushehr-city", name: "بوشهر", categories: [] }] },
  { id: "chaharmahal", name: "چهارمحال و بختیاری", cities: [{ id: "shahrekord", name: "شهرکرد", categories: [] }] },
  { id: "khorasan-jonubi", name: "خراسان جنوبی", cities: [{ id: "birjand", name: "بیرجند", categories: [] }] },
  { id: "khorasan-shomali", name: "خراسان شمالی", cities: [{ id: "bojnurd", name: "بجنورد", categories: [] }] },
  { id: "khuzestan", name: "خوزستان", cities: [{ id: "ahvaz", name: "اهواز", categories: [] }] },
  { id: "zanjan", name: "زنجان", cities: [{ id: "zanjan-city", name: "زنجان", categories: [] }] },
  { id: "semnan", name: "سمنان", cities: [{ id: "semnan-city", name: "سمنان", categories: [] }] },
  { id: "sistan", name: "سیستان و بلوچستان", cities: [{ id: "zahedan", name: "زاهدان", categories: [] }] },
  { id: "qazvin", name: "قزوین", cities: [{ id: "qazvin-city", name: "قزوین", categories: [] }] },
  { id: "qom", name: "قم", cities: [{ id: "qom-city", name: "قم", categories: [] }] },
  { id: "kurdistan", name: "کردستان", cities: [{ id: "sanandaj", name: "سنندج", categories: [] }] },
  { id: "kerman", name: "کرمان", cities: [{ id: "kerman-city", name: "کرمان", categories: [] }] },
  { id: "kermanshah", name: "کرمانشاه", cities: [{ id: "kermanshah-city", name: "کرمانشاه", categories: [] }] },
  { id: "kohgiluyeh", name: "کهگیلویه و بویراحمد", cities: [{ id: "yasuj", name: "یاسوج", categories: [] }] },
  { id: "golestan", name: "گلستان", cities: [{ id: "gorgan", name: "گرگان", categories: [] }] },
  { id: "gilan", name: "گیلان", cities: [{ id: "rasht", name: "رشت", categories: [] }] },
  { id: "lorestan", name: "لرستان", cities: [{ id: "khorramabad", name: "خرم‌آباد", categories: [] }] },
  { id: "mazandaran", name: "مازندران", cities: [{ id: "sari", name: "ساری", categories: [] }] },
  { id: "markazi", name: "مرکزی", cities: [{ id: "arak", name: "اراک", categories: [] }] },
  { id: "hormozgan", name: "هرمزگان", cities: [{ id: "bandarabbas", name: "بندرعباس", categories: [] }] },
  { id: "hamedan", name: "همدان", cities: [{ id: "hamedan-city", name: "همدان", categories: [] }] },
  { id: "yazd", name: "یزد", cities: [{ id: "yazd-city", name: "یزد", categories: [] }] }
];
