/** data.js — خروجی پنل ادمین */
const searchAliases = {
  "جی‌بی‌ال": [
    "jbl",
    "جی بی ال",
    "جیبیال"
  ],
  "انکر": [
    "anker"
  ],
  "هارمن کاردن": [
    "harman",
    "kardon",
    "harman kardon",
    "هارمن"
  ],
  "سامسونگ": [
    "samsung",
    "lg",
    "LG"
  ],
  "اپل": [
    "apple",
    "iphone",
    "آیفون"
  ],
  "شیائومی": [
    "xiaomi",
    "mi"
  ],
  "سونی": [
    "sony"
  ],
  "ال‌جی": [
    "lg",
    "ال جی"
  ],
  "موبایل": [
    "mobile",
    "phone",
    "گوشی"
  ],
  "لوازم جانبی": [
    "accessory",
    "accessories",
    "جانبی"
  ],
  "اسپیکر": [
    "speaker",
    "بلندگو"
  ],
  "هدفون": [
    "headphone",
    "headset"
  ],
  "لپ‌تاپ": [
    "laptop",
    "notebook",
    "لپ تاپ"
  ],
  "ال جی": [
    "lg",
    "samsung",
    "LG"
  ]
};

const standardCategories = [
  {
    "id": "mobile",
    "name": "موبایل و کامپیوتر"
  },
  {
    "id": "home",
    "name": "لوازم خانگی"
  },
  {
    "id": "clothing",
    "name": "پوشاک"
  },
  {
    "id": "gold",
    "name": "طلا و جواهر"
  },
  {
    "id": "food",
    "name": "مواد غذایی"
  },
  {
    "id": "other",
    "name": "سایر"
  }
];

const provincesData = [
  {
    "id": "tehran",
    "name": "تهران",
    "cities": [
      {
        "id": "tehran-city",
        "name": "تهران",
        "categories": []
      },
      {
        "id": "karaj",
        "name": "کرج",
        "categories": []
      }
    ]
  },
  {
    "id": "isfahan",
    "name": "اصفهان",
    "cities": [
      {
        "id": "isfahan-city",
        "name": "اصفهان",
        "categories": []
      }
    ]
  },
  {
    "id": "fars",
    "name": "فارس",
    "cities": [
      {
        "id": "shiraz",
        "name": "شیراز",
        "categories": [
          {
            "id": "mobile",
            "name": "موبایل و کامپیوتر",
            "malls": [
              {
                "id": "mall_mu0d6ftfxhm",
                "name": "پی سی سنتر",
                "image": "data:image/jpeg;base64,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",
                "address": "ملاصدرا کوچه 2",
                "phone": "0712365",
                "fax": "07126354",
                "website": "https://pccenter.ir",
                "stores": [
                  {
                    "id": "s_mu0d8r955ne",
                    "name": "هدیش",
                    "floor": "2",
                    "unit": "211",
                    "phone": "0711",
                    "fax": "0715454",
                    "whatsapp": "09126549878",
                    "telegram": "sdfsdf",
                    "instagram": "sdfsdf",
                    "website": "ehadish.com",
                    "shopCategories": [
                      "موبایل",
                      "لوازم جانبی"
                    ],
                    "brands": [
                      "سامسونگ",
                      "ال جی"
                    ]
                  },
                  {
                    "id": "s_mu0dd8dodxr",
                    "name": "کارنو",
                    "floor": "2",
                    "unit": "211",
                    "phone": "0711",
                    "fax": "0715454",
                    "whatsapp": "09126549878",
                    "telegram": "sdfsdf",
                    "instagram": "sdfsdf",
                    "website": "ehadish.com",
                    "shopCategories": [
                      "موبایل",
                      "لوازم جانبی"
                    ],
                    "brands": [
                      "سامسونگ",
                      "ال جی"
                    ]
                  }
                ]
              },
              {
                "id": "mall_mu0dajxktq3",
                "name": "ملاصدرا",
                "image": "data:image/jpeg;base64,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",
                "address": "ملاصدرا کوچه 2",
                "phone": "0712365",
                "fax": "07126354",
                "website": "https://pccenter.ir",
                "stores": [
                  {
                    "id": "s_mu0dawqc01t",
                    "name": "کامپیوتر مرکزی",
                    "floor": "2",
                    "unit": "211",
                    "phone": "0711",
                    "fax": "0715454",
                    "whatsapp": "09126549878",
                    "telegram": "sdfsdf",
                    "instagram": "sdfsdf",
                    "website": "ehadish.com",
                    "shopCategories": [
                      "موبایل",
                      "لوازم جانبی"
                    ],
                    "brands": [
                      "سامسونگ",
                      "ال جی"
                    ]
                  }
                ]
              },
              {
                "id": "mall_mu0df6f3h50",
                "name": "صوت و تصویر",
                "image": "data:image/jpeg;base64,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",
                "address": "ملاصدرا کوچه 2",
                "phone": "0712365",
                "fax": "07126354",
                "website": "https://pccenter.ir",
                "stores": [
                  {
                    "id": "s_mu0dgbtuf2v",
                    "name": "ای زی",
                    "floor": "2",
                    "unit": "211",
                    "phone": "0711",
                    "fax": "0715454",
                    "whatsapp": "09126549878",
                    "telegram": "sdfsdf",
                    "instagram": "sdfsdf",
                    "website": "ehadish.com",
                    "shopCategories": [
                      "موبایل",
                      "لوازم جانبی"
                    ],
                    "brands": [
                      "سامسونگ",
                      "ال جی"
                    ]
                  }
                ]
              }
            ]
          },
          {
            "id": "other",
            "name": "سایر",
            "malls": [
              {
                "id": "mall_mu0dczgp19b",
                "name": "مهستان",
                "image": "data:image/jpeg;base64,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",
                "address": "ملاصدرا کوچه 2",
                "phone": "0712365",
                "fax": "07126354",
                "website": "https://pccenter.ir",
                "stores": [
                  {
                    "id": "s_mu0dds33mxi",
                    "name": "فقیهی تک",
                    "floor": "2",
                    "unit": "211",
                    "phone": "0711",
                    "fax": "0715454",
                    "whatsapp": "09126549878",
                    "telegram": "sdfsdf",
                    "instagram": "sdfsdf",
                    "website": "ehadish.com",
                    "shopCategories": [
                      "موبایل",
                      "لوازم جانبی"
                    ],
                    "brands": [
                      "سامسونگ",
                      "ال جی"
                    ]
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
    "id": "khorasan-razavi",
    "name": "خراسان رضوی",
    "cities": [
      {
        "id": "mashhad",
        "name": "مشهد",
        "categories": []
      }
    ]
  },
  {
    "id": "azarbaijan-sharghi",
    "name": "آذربایجان شرقی",
    "cities": [
      {
        "id": "tabriz",
        "name": "تبریز",
        "categories": []
      }
    ]
  },
  {
    "id": "azarbaijan-gharbi",
    "name": "آذربایجان غربی",
    "cities": [
      {
        "id": "urmia",
        "name": "ارومیه",
        "categories": []
      }
    ]
  },
  {
    "id": "ardabil",
    "name": "اردبیل",
    "cities": [
      {
        "id": "ardabil-city",
        "name": "اردبیل",
        "categories": []
      }
    ]
  },
  {
    "id": "alborz",
    "name": "البرز",
    "cities": [
      {
        "id": "karaj-alborz",
        "name": "کرج",
        "categories": []
      }
    ]
  },
  {
    "id": "ilam",
    "name": "ایلام",
    "cities": [
      {
        "id": "ilam-city",
        "name": "ایلام",
        "categories": []
      }
    ]
  },
  {
    "id": "bushehr",
    "name": "بوشهر",
    "cities": [
      {
        "id": "bushehr-city",
        "name": "بوشهر",
        "categories": []
      }
    ]
  },
  {
    "id": "chaharmahal",
    "name": "چهارمحال و بختیاری",
    "cities": [
      {
        "id": "shahrekord",
        "name": "شهرکرد",
        "categories": []
      }
    ]
  },
  {
    "id": "khorasan-jonubi",
    "name": "خراسان جنوبی",
    "cities": [
      {
        "id": "birjand",
        "name": "بیرجند",
        "categories": []
      }
    ]
  },
  {
    "id": "khorasan-shomali",
    "name": "خراسان شمالی",
    "cities": [
      {
        "id": "bojnurd",
        "name": "بجنورد",
        "categories": []
      }
    ]
  },
  {
    "id": "khuzestan",
    "name": "خوزستان",
    "cities": [
      {
        "id": "ahvaz",
        "name": "اهواز",
        "categories": []
      }
    ]
  },
  {
    "id": "zanjan",
    "name": "زنجان",
    "cities": [
      {
        "id": "zanjan-city",
        "name": "زنجان",
        "categories": []
      }
    ]
  },
  {
    "id": "semnan",
    "name": "سمنان",
    "cities": [
      {
        "id": "semnan-city",
        "name": "سمنان",
        "categories": []
      }
    ]
  },
  {
    "id": "sistan",
    "name": "سیستان و بلوچستان",
    "cities": [
      {
        "id": "zahedan",
        "name": "زاهدان",
        "categories": []
      }
    ]
  },
  {
    "id": "qazvin",
    "name": "قزوین",
    "cities": [
      {
        "id": "qazvin-city",
        "name": "قزوین",
        "categories": []
      }
    ]
  },
  {
    "id": "qom",
    "name": "قم",
    "cities": [
      {
        "id": "qom-city",
        "name": "قم",
        "categories": []
      }
    ]
  },
  {
    "id": "kurdistan",
    "name": "کردستان",
    "cities": [
      {
        "id": "sanandaj",
        "name": "سنندج",
        "categories": []
      }
    ]
  },
  {
    "id": "kerman",
    "name": "کرمان",
    "cities": [
      {
        "id": "kerman-city",
        "name": "کرمان",
        "categories": []
      }
    ]
  },
  {
    "id": "kermanshah",
    "name": "کرمانشاه",
    "cities": [
      {
        "id": "kermanshah-city",
        "name": "کرمانشاه",
        "categories": []
      }
    ]
  },
  {
    "id": "kohgiluyeh",
    "name": "کهگیلویه و بویراحمد",
    "cities": [
      {
        "id": "yasuj",
        "name": "یاسوج",
        "categories": []
      }
    ]
  },
  {
    "id": "golestan",
    "name": "گلستان",
    "cities": [
      {
        "id": "gorgan",
        "name": "گرگان",
        "categories": []
      }
    ]
  },
  {
    "id": "gilan",
    "name": "گیلان",
    "cities": [
      {
        "id": "rasht",
        "name": "رشت",
        "categories": []
      }
    ]
  },
  {
    "id": "lorestan",
    "name": "لرستان",
    "cities": [
      {
        "id": "khorramabad",
        "name": "خرم‌آباد",
        "categories": []
      }
    ]
  },
  {
    "id": "mazandaran",
    "name": "مازندران",
    "cities": [
      {
        "id": "sari",
        "name": "ساری",
        "categories": []
      }
    ]
  },
  {
    "id": "markazi",
    "name": "مرکزی",
    "cities": [
      {
        "id": "arak",
        "name": "اراک",
        "categories": []
      }
    ]
  },
  {
    "id": "hormozgan",
    "name": "هرمزگان",
    "cities": [
      {
        "id": "bandarabbas",
        "name": "بندرعباس",
        "categories": []
      }
    ]
  },
  {
    "id": "hamedan",
    "name": "همدان",
    "cities": [
      {
        "id": "hamedan-city",
        "name": "همدان",
        "categories": []
      }
    ]
  },
  {
    "id": "yazd",
    "name": "یزد",
    "cities": [
      {
        "id": "yazd-city",
        "name": "یزد",
        "categories": []
      }
    ]
  }
];
