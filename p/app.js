/**
 * ============================================================
 * پاساژگردی — منطق اصلی (app.js)
 * ------------------------------------------------------------
 * ساختار کلی:
 *  1) تم شب/روز + منوی همبرگری
 *  2) امتیاز (ستاره‌ها) با localStorage + ratings.json
 *  3) رندر آبشاری: استان ← شهر ← دسته ← پاساژ ← فروشگاه
 *  4) کاروسل دسته/برند داخل کارت فروشگاه
 *  5) جستجو با پشتیبانی مخفف انگلیسی/فارسی (searchAliases در data.js)
 *  6) لیبل کوچک روی آیکون‌های سوشال
 *
 * فایل‌های مرتبط:
 *  - data.js       → provincesData + searchAliases
 *  - ratings.json  → امتیازهای پایه
 *  - header.html / footer.html → هدر و فوتر جدا
 * ============================================================
 */

(function () {
  'use strict';

  var RATINGS_KEY = 'passazh_ratings_v2';
  var VOTED_KEY = 'passazh_voted_v2';
  var FINGERPRINT_KEY = 'passazh_fp';
  var baseRatings = {};
  var html = document.documentElement;
  var pendingScores = {};

  /* ----- ادغام داده‌های پنل ادمین (localStorage) ----- */
  var CUSTOM_KEY = 'passazh_custom_v1';
  var ALIAS_KEY = 'passazh_aliases_v1';
  var searchIndex = []; // [{type, text, storeId, mallId, provinceId, ...}]

  function loadCustomData() {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{"malls":[],"stores":[]}'); }
    catch (e) { return { malls: [], stores: [] }; }
  }

  function loadExtraAliases() {
    try { return JSON.parse(localStorage.getItem(ALIAS_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  /** ادغام پاساژ/فروشگاه ادمین داخل provincesData */
  function mergeCustomIntoData() {
    if (typeof provincesData === 'undefined') return;
    var custom = loadCustomData();
    var extra = loadExtraAliases();
    // aliases
    if (typeof searchAliases !== 'undefined') {
      Object.keys(extra).forEach(function (k) {
        if (!searchAliases[k]) searchAliases[k] = [];
        (extra[k] || []).forEach(function (a) {
          if (searchAliases[k].indexOf(a) === -1) searchAliases[k].push(a);
        });
      });
    }
    custom.malls.forEach(function (m) {
      var prov = null;
      for (var i = 0; i < provincesData.length; i++) {
        if (provincesData[i].id === m.provinceId) { prov = provincesData[i]; break; }
      }
      if (!prov) return;
      var city = null;
      for (var j = 0; j < (prov.cities || []).length; j++) {
        if (prov.cities[j].id === m.cityId) { city = prov.cities[j]; break; }
      }
      if (!city) return;
      if (!city.categories) city.categories = [];
      var cat = null;
      for (var k = 0; k < city.categories.length; k++) {
        if (city.categories[k].id === m.categoryId) { cat = city.categories[k]; break; }
      }
      if (!cat) {
        cat = { id: m.categoryId, name: m.categoryName || m.categoryId, malls: [] };
        city.categories.push(cat);
      }
      if (!cat.malls) cat.malls = [];
      var exists = cat.malls.some(function (x) { return x.id === m.id; });
      if (!exists) {
        cat.malls.push({
          id: m.id, name: m.name, image: m.image, address: m.address,
          phone: m.phone, fax: m.fax, website: m.website, stores: []
        });
      }
    });
    custom.stores.forEach(function (s) {
      for (var i = 0; i < provincesData.length; i++) {
        var cities = provincesData[i].cities || [];
        for (var j = 0; j < cities.length; j++) {
          var cats = cities[j].categories || [];
          for (var k = 0; k < cats.length; k++) {
            var malls = cats[k].malls || [];
            for (var m = 0; m < malls.length; m++) {
              if (malls[m].id === s.mallId) {
                if (!malls[m].stores) malls[m].stores = [];
                if (!malls[m].stores.some(function (x) { return x.id === s.id; })) {
                  malls[m].stores.push({
                    id: s.id, name: s.name, floor: s.floor, unit: s.unit,
                    phone: s.phone, fax: s.fax, whatsapp: s.whatsapp,
                    telegram: s.telegram, instagram: s.instagram, website: s.website,
                    shopCategories: s.shopCategories || [], brands: s.brands || []
                  });
                }
                return;
              }
            }
          }
        }
      }
    });
  }

  /** ایندکس یک‌باره برای سرچ سریع */
  function buildSearchIndex() {
    searchIndex = [];
    if (typeof provincesData === 'undefined') return;
    provincesData.forEach(function (p) {
      searchIndex.push({ t: 'prov', n: p.name, pid: p.id });
      (p.cities || []).forEach(function (c) {
        searchIndex.push({ t: 'city', n: c.name, pid: p.id, cid: c.id });
        (c.categories || []).forEach(function (cat) {
          searchIndex.push({ t: 'cat', n: cat.name, pid: p.id, cid: c.id, catid: cat.id });
          (cat.malls || []).forEach(function (mall) {
            searchIndex.push({ t: 'mall', n: mall.name, pid: p.id, cid: c.id, catid: cat.id, mid: mall.id });
            (mall.stores || []).forEach(function (s) {
              searchIndex.push({
                t: 'store', n: s.name, phone: s.phone || '',
                pid: p.id, cid: c.id, catid: cat.id, mid: mall.id, sid: s.id,
                brands: s.brands || [], cats: s.shopCategories || []
              });
            });
          });
        });
      });
    });
  }



  function getFingerprint() {
    var fp = localStorage.getItem(FINGERPRINT_KEY);
    if (fp) return fp;
    fp = 'fp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(FINGERPRINT_KEY, fp);
    return fp;
  }

  function getPreferredTheme() {
    var saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    var sun = document.getElementById('icon-sun');
    var moon = document.getElementById('icon-moon');
    if (!sun || !moon) return;
    if (theme === 'dark') {
      sun.classList.remove('hidden');
      moon.classList.add('hidden');
    } else {
      sun.classList.add('hidden');
      moon.classList.remove('hidden');
    }
  }

  setTheme(getPreferredTheme());

  function openNav() {
    var d = document.getElementById('nav-drawer');
    var o = document.getElementById('nav-overlay');
    if (d) d.classList.add('open');
    if (o) o.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNavFn() {
    var d = document.getElementById('nav-drawer');
    var o = document.getElementById('nav-overlay');
    if (d) d.classList.remove('open');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
  }

  function loadLocalRatings() {
    try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); } catch (e) { return {}; }
  }

  function loadVoted() {
    try { return JSON.parse(localStorage.getItem(VOTED_KEY) || '{}'); } catch (e) { return {}; }
  }

  function mergeRatings() {
    var local = loadLocalRatings();
    var merged = {};
    var keys = {};
    Object.keys(baseRatings).forEach(function (k) { keys[k] = true; });
    Object.keys(local).forEach(function (k) { keys[k] = true; });
    Object.keys(keys).forEach(function (id) {
      var b = baseRatings[id] || { sum: 0, count: 0 };
      var l = local[id] || { sum: 0, count: 0 };
      merged[id] = { sum: b.sum + l.sum, count: b.count + l.count };
    });
    return merged;
  }

  function getRatingInfo(storeId) {
    var all = mergeRatings();
    var voted = loadVoted();
    var r = all[storeId];
    var avg = r && r.count ? r.sum / r.count : 0;
    return {
      avg: Math.round(avg * 10) / 10,
      count: r ? r.count : 0,
      voted: !!voted[storeId]
    };
  }

  function saveRating(storeId, score) {
    var voted = loadVoted();
    if (voted[storeId]) return false;
    var local = loadLocalRatings();
    if (!local[storeId]) local[storeId] = { sum: 0, count: 0 };
    local[storeId].sum += score;
    local[storeId].count += 1;
    voted[storeId] = getFingerprint();
    localStorage.setItem(RATINGS_KEY, JSON.stringify(local));
    localStorage.setItem(VOTED_KEY, JSON.stringify(voted));
    delete pendingScores[storeId];
    return true;
  }

  function starSvg() {
    return '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }

  function checkSvg() {
    return '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  }

  function renderStars(storeId) {
    var info = getRatingInfo(storeId);
    var pending = pendingScores[storeId] || 0;
    var starsHtml = [1, 2, 3, 4, 5].map(function (n) {
      var cls = 'star-btn';
      if (info.voted && n <= Math.round(info.avg)) cls += ' selected';
      else if (!info.voted && pending && n <= pending) cls += ' selected';
      return '<button type="button" class="' + cls + '" data-score="' + n + '" aria-label="' + n + ' ستاره">' + starSvg() + '</button>';
    }).join('');

    var submitHtml = '';
    if (info.voted) {
      submitHtml = '<button type="button" class="rate-submit done" disabled title="ثبت شد">' + checkSvg() + '</button>';
    } else {
      submitHtml = '<button type="button" class="rate-submit" data-store-id="' + storeId + '"' + (pending ? '' : ' disabled') + '>ثبت</button>';
    }

    var text = info.count > 0
      ? '<span class="avg">' + info.avg + '</span> (' + info.count + ')'
      : '';

    return '<div class="rating-box' + (info.voted ? ' voted' : '') + '" data-store-id="' + storeId + '">' +
      '<div class="stars">' + starsHtml + '</div>' +
      submitHtml +
      (text ? '<div class="rating-text">' + text + '</div>' : '') +
      '</div>';
  }

  function tipLabel(text) {
    return '<span class="icon-tip">' + text + '</span>';
  }

  function createSocialIcons(store) {
    var icons = [];
    if (store.phone) {
      icons.push('<span class="icon-wrap"><a href="tel:' + store.phone.replace(/[^0-9+]/g, '') + '" class="phone" aria-label="تماس"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>' + tipLabel('تماس') + '</span>');
    }
    if (store.fax) {
      icons.push('<span class="icon-wrap"><a href="tel:' + store.fax.replace(/[^0-9+]/g, '') + '" class="fax" aria-label="فکس"><svg viewBox="0 0 24 24"><path d="M4 6h16v3H4z"/><path d="M6 9v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9"/><path d="M8 13h2M12 13h2M8 16h2"/><rect x="6" y="2" width="12" height="4" rx="1"/></svg></a>' + tipLabel('فکس') + '</span>');
    }
    if (store.whatsapp) {
      icons.push('<span class="icon-wrap"><a href="https://wa.me/' + store.whatsapp + '" target="_blank" rel="noopener" class="wa" aria-label="واتساپ"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>' + tipLabel('واتساپ') + '</span>');
    }
    if (store.telegram) {
      icons.push('<span class="icon-wrap"><a href="https://t.me/' + store.telegram + '" target="_blank" rel="noopener" class="tg" aria-label="تلگرام"><svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>' + tipLabel('تلگرام') + '</span>');
    }
    if (store.instagram) {
      icons.push('<span class="icon-wrap"><a href="https://instagram.com/' + store.instagram + '" target="_blank" rel="noopener" class="ig" aria-label="اینستاگرام"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>' + tipLabel('اینستا') + '</span>');
    }
    if (store.website) {
      icons.push('<span class="icon-wrap"><a href="' + store.website + '" target="_blank" rel="noopener" class="web" aria-label="سایت"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></a>' + tipLabel('سایت') + '</span>');
    }
    return icons.join('');
  }

  function createChevron() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  }

  function renderCarousel(items, brandMode) {
    if (!items || !items.length) return '';
    return '<div class="carousel">' + items.map(function (t) {
      return '<span class="chip' + (brandMode ? ' brand' : '') + '">' + t + '</span>';
    }).join('') + '</div>';
  }

  function renderStoreExtras(store) {
    var cats = store.shopCategories || [];
    var brands = store.brands || [];
    if (!cats.length && !brands.length) return '';
    var h = '<div class="store-extras">';
    if (cats.length) {
      h += '<div class="carousel-label">دسته‌بندی‌ها</div>';
      h += renderCarousel(cats, false);
    }
    if (brands.length) {
      h += '<div class="carousel-label">برندها</div>';
      h += renderCarousel(brands, true);
    }
    h += '</div>';
    return h;
  }

  function sortStoresByRating(stores) {
    if (!stores || !stores.length) return stores || [];
    return stores.slice().sort(function (a, b) {
      var ra = getRatingInfo(a.id);
      var rb = getRatingInfo(b.id);
      if (rb.avg !== ra.avg) return rb.avg - ra.avg;
      return rb.count - ra.count;
    });
  }

  function renderStores(stores) {
    var sorted = sortStoresByRating(stores);
    if (!sorted.length) return '<p class="no-results">فروشگاهی ثبت نشده است.</p>';
    return '<div class="stores-list">' + sorted.map(function (s) {
      var hasExtras = (s.shopCategories && s.shopCategories.length) || (s.brands && s.brands.length);
      return '<div class="store-card glass-thin" data-store-id="' + s.id + '">' +
        '<div class="store-name">' + s.name + '</div>' +
        '<div class="store-meta">' +
          '<span>طبقه ' + s.floor + '</span>' +
          '<span>واحد ' + s.unit + '</span>' +
          (s.phone ? '<span class="phone-text">' + s.phone + '</span>' : '') +
          (s.fax ? '<span class="fax-text">فکس ' + s.fax + '</span>' : '') +
        '</div>' +
        '<div class="store-mid">' +
          renderStars(s.id) +
          '<div class="store-links">' + createSocialIcons(s) + '</div>' +
        '</div>' +
        (hasExtras
          ? '<button type="button" class="store-expand" aria-label="دسته‌بندی و برندها">' + createChevron() + '</button>' + renderStoreExtras(s)
          : '') +
      '</div>';
    }).join('') + '</div>';
  }

  function renderMallInfo(mall) {
    if (!mall) return '';
    var h = '<div class="mall-info-panel glass-thin">';
    h += '<div class="info-row"><strong>آدرس:</strong> ' + (mall.address || '—') + '</div>';
    h += '<div class="info-row">';
    if (mall.phone) h += '<span><strong>تلفن:</strong> <a href="tel:' + mall.phone.replace(/[^0-9+]/g, '') + '">' + mall.phone + '</a></span>';
    if (mall.fax) h += '<span><strong>فکس:</strong> ' + mall.fax + '</span>';
    h += '</div>';
    if (mall.website) {
      h += '<div class="info-row"><strong>سایت:</strong> <a href="' + mall.website + '" target="_blank" rel="noopener">' + mall.website.replace(/^https?:\/\//, '') + '</a></div>';
    }
    h += '</div>';
    return h;
  }

  function renderMalls(malls) {
    if (!malls || !malls.length) return '<p class="no-results">پاساژی ثبت نشده است.</p>';
    return '<div class="malls-grid">' + malls.map(function (m) {
      return '<div class="mall-card glass" style="background-image:url(\'' + m.image + '\')" data-mall-id="' + m.id + '" role="button" tabindex="0">' +
        '<div class="mall-name">' + m.name + '</div></div>';
    }).join('') + '</div><div class="mall-details-area"></div>';
  }

  function renderCategories(categories) {
    if (!categories || !categories.length) return '<p class="no-results">دسته‌بندی‌ای ثبت نشده است.</p>';
    return categories.map(function (cat) {
      return '<div class="acc-item cat-item glass-thin" data-cat-id="' + cat.id + '">' +
        '<button class="acc-header" type="button" aria-expanded="false"><span>' + cat.name + '</span>' + createChevron() + '</button>' +
        '<div class="acc-body"><div class="acc-inner">' + renderMalls(cat.malls) + '</div></div></div>';
    }).join('');
  }

  function renderCities(cities) {
    return cities.map(function (city) {
      return '<div class="acc-item city-item glass-thin" data-city-id="' + city.id + '">' +
        '<button class="acc-header" type="button" aria-expanded="false"><span>' + city.name + '</span>' + createChevron() + '</button>' +
        '<div class="acc-body"><div class="acc-inner">' + renderCategories(city.categories) + '</div></div></div>';
    }).join('');
  }

  function renderProvinces() {
    var root = document.getElementById('provinces-accordion');
    if (!root || typeof provincesData === 'undefined') return;
    root.innerHTML = provincesData.map(function (prov) {
      return '<div class="acc-item province-item glass" data-province-id="' + prov.id + '">' +
        '<button class="acc-header" type="button" aria-expanded="false"><span>' + prov.name + '</span>' + createChevron() + '</button>' +
        '<div class="acc-body"><div class="acc-inner">' + renderCities(prov.cities) + '</div></div></div>';
    }).join('');
  }

  function findMall(mallId) {
    for (var i = 0; i < provincesData.length; i++) {
      var cities = provincesData[i].cities || [];
      for (var j = 0; j < cities.length; j++) {
        var cats = cities[j].categories || [];
        for (var k = 0; k < cats.length; k++) {
          var malls = cats[k].malls || [];
          for (var m = 0; m < malls.length; m++) {
            if (malls[m].id === mallId) return malls[m];
          }
        }
      }
    }
    return null;
  }

  function hideAllTips() {
    document.querySelectorAll('.icon-wrap.show-tip').forEach(function (el) {
      el.classList.remove('show-tip');
    });
  }

  function setupEvents() {
    var root = document.getElementById('provinces-accordion');

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var cur = html.getAttribute('data-theme') || 'light';
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
    var menuBtn = document.getElementById('menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', openNav);
    var closeBtn = document.getElementById('close-nav');
    if (closeBtn) closeBtn.addEventListener('click', closeNavFn);
    var overlay = document.getElementById('nav-overlay');
    if (overlay) overlay.addEventListener('click', closeNavFn);

    // Hide tips on scroll / outside touch
    window.addEventListener('scroll', hideAllTips, { passive: true });
    document.addEventListener('touchstart', function (e) {
      if (!e.target.closest('.icon-wrap')) hideAllTips();
    }, { passive: true });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.icon-wrap')) hideAllTips();
    });

    if (root) root.addEventListener('click', function (e) {
      // Icon tip toggle (mobile long-press alternative: click)
      var iconWrap = e.target.closest('.icon-wrap');
      if (iconWrap && e.target.closest('a')) {
        // allow navigation; tip shown via touchstart/mouseenter
      }

      // Star select (pending)
      var starBtn = e.target.closest('.star-btn');
      if (starBtn) {
        var box = starBtn.closest('.rating-box');
        if (!box || box.classList.contains('voted')) return;
        var storeId = box.dataset.storeId;
        var score = parseInt(starBtn.dataset.score, 10);
        pendingScores[storeId] = score;
        box.querySelectorAll('.star-btn').forEach(function (b) {
          b.classList.toggle('selected', parseInt(b.dataset.score, 10) <= score);
        });
        var submit = box.querySelector('.rate-submit');
        if (submit) submit.disabled = false;
        return;
      }

      // Submit rating
      var submitBtn = e.target.closest('.rate-submit');
      if (submitBtn && !submitBtn.classList.contains('done') && !submitBtn.disabled) {
        var sid = submitBtn.dataset.storeId;
        var sc = pendingScores[sid];
        if (!sc) return;
        if (saveRating(sid, sc)) {
          var area = submitBtn.closest('.mall-details-area');
          var activeMall = area && area.dataset.activeMall;
          if (activeMall) {
            var mall = findMall(activeMall);
            if (mall) area.innerHTML = renderMallInfo(mall) + renderStores(mall.stores || []);
          } else {
            var parentBox = submitBtn.closest('.rating-box');
            if (parentBox) parentBox.outerHTML = renderStars(sid);
          }
        }
        return;
      }

      // Expand categories/brands
      var expandBtn = e.target.closest('.store-expand');
      if (expandBtn) {
        var card = expandBtn.closest('.store-card');
        if (card) card.classList.toggle('expanded');
        return;
      }

      // Accordion
      var header = e.target.closest('.acc-header');
      if (header) {
        var item = header.closest('.acc-item');
        if (!item) return;
        var isOpen = item.classList.contains('open');
        item.classList.toggle('open', !isOpen);
        header.setAttribute('aria-expanded', String(!isOpen));
        return;
      }

      // Mall card
      var mallCard = e.target.closest('.mall-card');
      if (mallCard) {
        var mallId = mallCard.dataset.mallId;
        var grid = mallCard.closest('.malls-grid');
        var inner = mallCard.closest('.acc-inner');
        var area = inner && inner.querySelector('.mall-details-area');
        if (!area) return;
        if (grid) grid.querySelectorAll('.mall-card.active').forEach(function (c) { c.classList.remove('active'); });
        if (area.dataset.activeMall === mallId) {
          area.innerHTML = '';
          area.dataset.activeMall = '';
          mallCard.classList.remove('active');
          return;
        }
        mallCard.classList.add('active');
        var m = findMall(mallId);
        area.innerHTML = renderMallInfo(m) + renderStores(m && m.stores ? m.stores : []);
        area.dataset.activeMall = mallId;
        area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    // Tooltips: mouse enter / leave + touch
    if (root) {
      root.addEventListener('mouseover', function (e) {
        var wrap = e.target.closest('.icon-wrap');
        if (wrap) {
          hideAllTips();
          wrap.classList.add('show-tip');
        }
        var btn = e.target.closest('.star-btn');
        if (btn) {
          var box = btn.closest('.rating-box');
          if (!box || box.classList.contains('voted')) return;
          var score = parseInt(btn.dataset.score, 10);
          var pending = pendingScores[box.dataset.storeId] || 0;
          box.querySelectorAll('.star-btn').forEach(function (b) {
            var n = parseInt(b.dataset.score, 10);
            b.classList.toggle('hovered', n <= score);
            if (pending) b.classList.toggle('selected', n <= pending);
          });
        }
      });
      root.addEventListener('mouseout', function (e) {
        var wrap = e.target.closest('.icon-wrap');
        if (wrap && !wrap.contains(e.relatedTarget)) wrap.classList.remove('show-tip');
        var box = e.target.closest('.rating-box');
        if (box) box.querySelectorAll('.star-btn').forEach(function (b) { b.classList.remove('hovered'); });
      });
      root.addEventListener('touchstart', function (e) {
        var wrap = e.target.closest('.icon-wrap');
        if (wrap) {
          hideAllTips();
          wrap.classList.add('show-tip');
        }
      }, { passive: true });
    }

    if (root) root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var mc = e.target.closest('.mall-card');
        if (mc) { e.preventDefault(); mc.click(); }
      }
    });
  }

  /* نرمال‌سازی متن فارسی/انگلیسی برای مقایسه جستجو */
  function normalize(text) {
    return (text || '').toString().toLowerCase()
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/\s+/g, ' ')
      .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .trim();
  }

  /* آیا query با یک نام (یا aliases آن) match می‌شود؟ */
  function matchesAlias(label, q) {
    var nLabel = normalize(label);
    if (!nLabel) return false;
    if (nLabel.indexOf(q) !== -1 || q.indexOf(nLabel) !== -1) return true;
    // دیکشنری searchAliases از data.js
    if (typeof searchAliases === 'undefined') return false;
    var aliases = searchAliases[label] || searchAliases[nLabel];
    // جستجو در همه کلیدها
    if (!aliases) {
      for (var key in searchAliases) {
        if (!Object.prototype.hasOwnProperty.call(searchAliases, key)) continue;
        var nKey = normalize(key);
        if (nKey === nLabel || nKey.indexOf(nLabel) !== -1 || nLabel.indexOf(nKey) !== -1) {
          aliases = searchAliases[key];
          break;
        }
      }
    }
    if (!aliases) return false;
    for (var i = 0; i < aliases.length; i++) {
      var a = normalize(aliases[i]);
      if (a && (a.indexOf(q) !== -1 || q.indexOf(a) !== -1)) return true;
    }
    return false;
  }

  /* آیا فروشگاه با query (نام، تلفن، دسته، برند + aliases) match می‌شود؟ */
  function storeMatchesQuery(store, q) {
    if (!store) return false;
    if (normalize(store.name).indexOf(q) !== -1) return true;
    if (store.phone && normalize(store.phone).indexOf(q) !== -1) return true;
    var cats = store.shopCategories || [];
    for (var i = 0; i < cats.length; i++) {
      if (matchesAlias(cats[i], q)) return true;
    }
    var brands = store.brands || [];
    for (var j = 0; j < brands.length; j++) {
      if (matchesAlias(brands[j], q)) return true;
    }
    return false;
  }

  /* جستجو روی استان/شهر/دسته/پاساژ/فروشگاه/برند/دسته فروشگاه + aliases */
  function performSearch(query) {
    var q = normalize(query.trim());
    var root = document.getElementById('provinces-accordion');
    if (!q) {
      document.querySelectorAll('.acc-item').forEach(function (el) {
        el.classList.remove('hidden');
        el.classList.remove('open');
      });
      document.querySelectorAll('.mall-card, .store-card').forEach(function (el) { el.classList.remove('hidden'); });
      var nr = document.getElementById('no-search-results');
      if (nr) nr.remove();
      // بستن پنل‌های پاساژ باز
      document.querySelectorAll('.mall-details-area').forEach(function (a) {
        a.innerHTML = '';
        a.dataset.activeMall = '';
      });
      document.querySelectorAll('.mall-card.active').forEach(function (c) { c.classList.remove('active'); });
      return;
    }

    var anyMatch = false;

    document.querySelectorAll('.province-item').forEach(function (provEl) {
      var provId = provEl.dataset.provinceId;
      var provData = null;
      for (var pi = 0; pi < provincesData.length; pi++) {
        if (provincesData[pi].id === provId) { provData = provincesData[pi]; break; }
      }
      var provName = normalize(provData ? provData.name : '');
      var provMatch = provName.indexOf(q) !== -1;

      provEl.querySelectorAll('.city-item').forEach(function (cityEl) {
        var cityId = cityEl.dataset.cityId;
        var cityData = null;
        if (provData) {
          for (var ci = 0; ci < (provData.cities || []).length; ci++) {
            if (provData.cities[ci].id === cityId) { cityData = provData.cities[ci]; break; }
          }
        }
        var cityName = normalize(cityData ? cityData.name : '');
        var cityMatch = cityName.indexOf(q) !== -1;

        cityEl.querySelectorAll('.cat-item').forEach(function (catEl) {
          var catId = catEl.dataset.catId;
          var catData = null;
          if (cityData) {
            for (var ki = 0; ki < (cityData.categories || []).length; ki++) {
              if (cityData.categories[ki].id === catId) { catData = cityData.categories[ki]; break; }
            }
          }
          var catName = catData ? catData.name : '';
          var catMatch = matchesAlias(catName, q) || normalize(catName).indexOf(q) !== -1;

          // پاساژها
          var malls = (catData && catData.malls) ? catData.malls : [];
          catEl.querySelectorAll('.mall-card').forEach(function (mallEl) {
            var mallId = mallEl.dataset.mallId;
            var mall = null;
            for (var mi = 0; mi < malls.length; mi++) {
              if (malls[mi].id === mallId) { mall = malls[mi]; break; }
            }
            var mallName = normalize(mall ? mall.name : '');
            var mallHit = mallName.indexOf(q) !== -1 || catMatch || cityMatch || provMatch;

            // اگر برند/دسته فروشگاه match شد، پاساژ را نشان بده و فروشگاه‌ها را باز کن
            var storeHit = false;
            var matchedStores = [];
            if (mall && mall.stores) {
              for (var si = 0; si < mall.stores.length; si++) {
                if (storeMatchesQuery(mall.stores[si], q)) {
                  storeHit = true;
                  matchedStores.push(mall.stores[si]);
                }
              }
            }

            var show = mallHit || storeHit;
            mallEl.classList.toggle('hidden', !show);
            if (show) {
              catMatch = true;
              anyMatch = true;
            }

            // اگر فقط از طریق برند/دسته فروشگاه پیدا شد، پنل را باز کن
            if (storeHit && !mallHit) {
              var area = catEl.querySelector('.mall-details-area');
              if (area && area.dataset.activeMall !== mallId) {
                mallEl.classList.add('active');
                area.innerHTML = renderMallInfo(mall) + renderStores(mall.stores || []);
                area.dataset.activeMall = mallId;
              }
            }
          });

          catEl.classList.toggle('hidden', !catMatch);
          if (catMatch) {
            catEl.classList.add('open');
            cityMatch = true;
            anyMatch = true;
          }
        });

        cityEl.classList.toggle('hidden', !cityMatch);
        if (cityMatch) {
          cityEl.classList.add('open');
          provMatch = true;
        }
      });

      provEl.classList.toggle('hidden', !provMatch);
      if (provMatch) provEl.classList.add('open');
    });

    var noRes = document.getElementById('no-search-results');
    if (!anyMatch) {
      if (!noRes) {
        noRes = document.createElement('p');
        noRes.id = 'no-search-results';
        noRes.className = 'no-results';
        noRes.textContent = 'نتیجه‌ای یافت نشد.';
        if (root && root.parentNode) root.parentNode.insertBefore(noRes, root.nextSibling);
      }
    } else if (noRes) noRes.remove();
  }

  function init() {
    mergeCustomIntoData();
    buildSearchIndex();
    renderProvinces();
    setupEvents();
    var searchInput = document.getElementById('search-input');
    var t;
    if (searchInput) searchInput.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { performSearch(searchInput.value); }, 220);
    });
  }

  fetch('ratings.json')
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (data) { baseRatings = data || {}; })
    .catch(function () { baseRatings = {}; })
    .finally(function () {
      if (document.getElementById('menu-btn')) init();
      else {
        var obs = new MutationObserver(function () {
          if (document.getElementById('menu-btn')) { obs.disconnect(); init(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(init, 600);
      }
    });
})();
