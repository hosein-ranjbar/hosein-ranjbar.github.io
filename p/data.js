// داده‌های نمونه سایت پاساژگردی
const provincesData = [
  {
    id: "tehran",
    name: "تهران",
    cities: [
      {
        id: "tehran-city",
        name: "تهران",
        categories: [
          {
            id: "mobile",
            name: "موبایل و کامپیوتر",
            malls: [
              {
                id: "mall1",
                name: "پاساژ علاءالدین",
                image: "https://picsum.photos/seed/alaeddin/400/400",
                address: "تهران، خیابان جمهوری، پاساژ علاءالدین",
                phone: "۰۲۱۶۶۷۰۱۲۳۴",
                fax: "۰۲۱۶۶۷۰۱۲۳۵",
                website: "https://example.com/alaeddin",
                stores: [
                  {
                    id: "s1",
                    name: "فروشگاه موبایل پارس",
                    floor: "۳",
                    unit: "۱۲",
                    phone: "۰۲۱۸۸۸۸۱۲۳۴",
                    fax: "۰۲۱۸۸۸۸۱۲۳۵",
                    whatsapp: "989121234567",
                    telegram: "pars_mobile",
                    instagram: "pars_mobile_shop",
                    website: "https://example.com",
                    shopCategories: ["موبایل", "لوازم جانبی", "اسپیکر", "هدفون", "پاوربانک"],
                    brands: ["سامسونگ", "اپل", "شیائومی", "جی‌بی‌ال", "انکر", "هارمن کاردن"]
                  },
                  {
                    id: "s2",
                    name: "کامپیوتر تک",
                    floor: "۲",
                    unit: "۸",
                    phone: "۰۲۱۸۸۸۸۵۶۷۸",
                    fax: "۰۲۱۸۸۸۸۵۶۷۹",
                    whatsapp: "989123456789",
                    telegram: "tech_pc",
                    instagram: "tech_pc_store",
                    website: "https://example.com",
                    shopCategories: ["لپ‌تاپ", "قطعات کامپیوتر", "مانیتور", "کیبورد"],
                    brands: ["ایسوس", "لنوو", "اچ‌پی", "ام‌اس‌آی", "لاوجی"]
                  }
                ]
              },
              {
                id: "mall2",
                name: "مرکز خرید ایران‌مال",
                image: "https://picsum.photos/seed/iranmall/400/400",
                address: "تهران، اتوبان تهران-کرج، ایران‌مال",
                phone: "۰۲۱۹۱۰۰۲۰۰۰",
                fax: "۰۲۱۹۱۰۰۲۰۰۱",
                website: "https://www.iranmall.com",
                stores: [
                  {
                    id: "s3",
                    name: "دیجی‌کالا استور",
                    floor: "۱",
                    unit: "۵۰",
                    phone: "۰۲۱۹۱۰۰۰۰۰۰",
                    fax: "۰۲۱۹۱۰۰۰۰۰۱",
                    whatsapp: "989100000000",
                    telegram: "digikala",
                    instagram: "digikala",
                    website: "https://www.digikala.com",
                    shopCategories: ["موبایل", "لوازم خانگی", "لوازم جانبی", "گیمینگ"],
                    brands: ["سامسونگ", "ال‌جی", "سونی", "اپل", "شیائومی"]
                  }
                ]
              }
            ]
          },
          {
            id: "home",
            name: "لوازم خانگی",
            malls: [
              {
                id: "mall3",
                name: "پاساژ کامپیوتر پایتخت",
                image: "https://picsum.photos/seed/paytakht/400/400",
                address: "تهران، خیابان ولیعصر، پاساژ پایتخت",
                phone: "۰۲۱۸۸۷۷۰۰۰۰",
                fax: "۰۲۱۸۸۷۷۰۰۰۱",
                website: "https://example.com/paytakht",
                stores: [
                  {
                    id: "s4",
                    name: "لوازم خانگی سامسونگ",
                    floor: "۴",
                    unit: "۲۲",
                    phone: "۰۲۱۸۸۷۷۶۶۵۵",
                    fax: "۰۲۱۸۸۷۷۶۶۵۶",
                    whatsapp: "989187766554",
                    telegram: "samsung_home",
                    instagram: "samsung_ir",
                    website: "https://example.com",
                    shopCategories: ["یخچال", "ماشین لباسشویی", "تلویزیون", "مایکروویو"],
                    brands: ["سامسونگ", "ال‌جی", "بوش", "اسنوا"]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "karaj",
        name: "کرج",
        categories: [
          {
            id: "mobile-karaj",
            name: "موبایل و کامپیوتر",
            malls: [
              {
                id: "mall4",
                name: "مرکز خرید مهستان",
                image: "https://picsum.photos/seed/mahestan/400/400",
                address: "کرج، میدان شهدا، مرکز خرید مهستان",
                phone: "۰۲۶۳۴۰۰۰۰۰۰",
                fax: "۰۲۶۳۴۰۰۰۰۰۱",
                website: "https://example.com/mahestan",
                stores: [
                  {
                    id: "s5",
                    name: "موبایل کرج",
                    floor: "۱",
                    unit: "۳",
                    phone: "۰۲۶۳۴۵۶۷۸۹۰",
                    fax: "۰۲۶۳۴۵۶۷۸۹۱",
                    whatsapp: "989263456789",
                    telegram: "mobile_karaj",
                    instagram: "mobile_karaj",
                    website: "https://example.com",
                    shopCategories: ["موبایل", "لوازم جانبی", "گارد و گلس"],
                    brands: ["شیائومی", "سامسونگ", "ریلمی", "انکر"]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "isfahan",
    name: "اصفهان",
    cities: [
      {
        id: "isfahan-city",
        name: "اصفهان",
        categories: [
          {
            id: "mobile-isf",
            name: "موبایل و کامپیوتر",
            malls: [
              {
                id: "mall5",
                name: "پاساژ شهرکرد اصفهان",
                image: "https://picsum.photos/seed/isfahanmall/400/400",
                address: "اصفهان، خیابان چهارباغ، پاساژ شهرکرد",
                phone: "۰۳۱۳۲۲۲۰۰۰۰",
                fax: "۰۳۱۳۲۲۲۰۰۰۱",
                website: "https://example.com/isf",
                stores: [
                  {
                    id: "s6",
                    name: "فروشگاه دیجیتال اصفهان",
                    floor: "۲",
                    unit: "۱۵",
                    phone: "۰۳۱۳۲۲۲۳۳۳۳",
                    fax: "۰۳۱۳۲۲۲۳۳۳۴",
                    whatsapp: "989313222333",
                    telegram: "digital_isf",
                    instagram: "digital_isfahan",
                    website: "https://example.com",
                    shopCategories: ["موبایل", "اسپیکر", "هدفون", "لوازم جانبی"],
                    brands: ["جی‌بی‌ال", "هارمن کاردن", "سونی", "انکر", "بیتس"]
                  }
                ]
              }
            ]
          },
          {
            id: "home-isf",
            name: "لوازم خانگی",
            malls: [
              {
                id: "mall6",
                name: "مرکز خرید سیتی‌سنتر",
                image: "https://picsum.photos/seed/citycenter/400/400",
                address: "اصفهان، اتوبان خرازی، سیتی‌سنتر",
                phone: "۰۳۱۳۴۴۴۰۰۰۰",
                fax: "۰۳۱۳۴۴۴۰۰۰۱",
                website: "https://example.com/citycenter",
                stores: [
                  {
                    id: "s7",
                    name: "لوازم خانگی ال‌جی",
                    floor: "۳",
                    unit: "۴۰",
                    phone: "۰۳۱۳۴۴۴۵۵۵۵",
                    fax: "۰۳۱۳۴۴۴۵۵۵۶",
                    whatsapp: "989313444555",
                    telegram: "lg_isf",
                    instagram: "lg_iran",
                    website: "https://example.com",
                    shopCategories: ["تلویزیون", "یخچال", "کولر گازی"],
                    brands: ["ال‌جی", "سامسونگ", "دوو"]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "fars",
    name: "فارس",
    cities: [
      {
        id: "shiraz",
        name: "شیراز",
        categories: [
          {
            id: "mobile-shz",
            name: "موبایل و کامپیوتر",
            malls: [
              {
                id: "mall7",
                name: "پاساژ ستاره فارس",
                image: "https://picsum.photos/seed/setare/400/400",
                address: "شیراز، خیابان زند، پاساژ ستاره فارس",
                phone: "۰۷۱۳۶۶۶۰۰۰۰",
                fax: "۰۷۱۳۶۶۶۰۰۰۱",
                website: "https://example.com/setare",
                stores: [
                  {
                    id: "s8",
                    name: "موبایل شیراز",
                    floor: "۱",
                    unit: "۷",
                    phone: "۰۷۱۳۶۶۶۷۷۷۷",
                    fax: "۰۷۱۳۶۶۶۷۷۷۸",
                    whatsapp: "989713666777",
                    telegram: "mobile_shz",
                    instagram: "mobile_shiraz",
                    website: "https://example.com",
                    shopCategories: ["موبایل", "لوازم جانبی", "گارد"],
                    brands: ["سامسونگ", "شیائومی", "اپل"]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "khorasan-razavi",
    name: "خراسان رضوی",
    cities: [
      {
        id: "mashhad",
        name: "مشهد",
        categories: [
          {
            id: "mobile-msh",
            name: "موبایل و کامپیوتر",
            malls: [
              {
                id: "mall8",
                name: "پاساژ پروما",
                image: "https://picsum.photos/seed/proma/400/400",
                address: "مشهد، بلوار وکیل‌آباد، پاساژ پروما",
                phone: "۰۵۱۳۸۸۸۰۰۰۰",
                fax: "۰۵۱۳۸۸۸۰۰۰۱",
                website: "https://example.com/proma",
                stores: [
                  {
                    id: "s9",
                    name: "دیجی‌لند مشهد",
                    floor: "۲",
                    unit: "۲۰",
                    phone: "۰۵۱۳۸۸۸۹۹۹۹",
                    fax: "۰۵۱۳۸۸۸۹۹۹۸",
                    whatsapp: "989513888999",
                    telegram: "digiland_msh",
                    instagram: "digiland_mashhad",
                    website: "https://example.com",
                    shopCategories: ["موبایل", "لپ‌تاپ", "اسپیکر", "گیمینگ"],
                    brands: ["اپل", "سامسونگ", "جی‌بی‌ال", "ریزر", "انکر"]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
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
