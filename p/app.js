/**
 * پاساژگردی
 * امتیاز از data/ratings.json + localStorage
 * هر مرورگر یک‌بار رأی (با fingerprint ساده)
 * مرتب‌سازی فروشگاه‌ها بر اساس امتیاز
 */

(function () {
  'use strict';

  var RATINGS_KEY = 'passazh_ratings_v2';
  var VOTED_KEY = 'passazh_voted_v2';
  var FINGERPRINT_KEY = 'passazh_fp';
  var baseRatings = {};
  var html = document.documentElement;

  // ===== Fingerprint ساده برای یک‌بار رأی در هر مرورگر =====
  function getFingerprint() {
    var fp = localStorage.getItem(FINGERPRINT_KEY);
    if (fp) return fp;
    fp = 'fp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(FINGERPRINT_KEY, fp);
    return fp;
  }

  // ===== تم =====
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
    document.getElementById('nav-drawer') && document.getElementById('nav-drawer').classList.add('open');
    document.getElementById('nav-overlay') && document.getElementById('nav-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNavFn() {
    document.getElementById('nav-drawer') && document.getElementById('nav-drawer').classList.remove('open');
    document.getElementById('nav-overlay') && document.getElementById('nav-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  // ===== Ratings =====
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
    return true;
  }

  function starSvg() {
    return '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }

  function renderStars(storeId) {
    var info = getRatingInfo(storeId);
    var starsHtml = [1, 2, 3, 4, 5].map(function (n) {
      var cls = 'star-btn' + (info.voted && n <= Math.round(info.avg) ? ' active' : '');
      return '<button type="button" class="' + cls + '" data-score="' + n + '" aria-label="' + n + ' ستاره">' + starSvg() + '</button>';
    }).join('');
    var text = info.count > 0
      ? '<span class="avg">' + info.avg + '</span> (' + info.count + ')'
      : 'رأی دهید';
    if (info.voted) text += ' ✓';
    return '<div class="rating-box' + (info.voted ? ' voted' : '') + '" data-store-id="' + storeId + '">' +
      '<div class="stars">' + starsHtml + '</div>' +
      '<div class="rating-text">' + text + '</div></div>';
  }

  function createSocialIcons(store) {
    var icons = [];
    if (store.phone) {
      icons.push('<a href="tel:' + store.phone.replace(/[^0-9+]/g, '') + '" class="phone" title="' + store.phone + '" aria-label="تماس"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>');
    }
    if (store.fax) {
      icons.push('<a href="tel:' + store.fax.replace(/[^0-9+]/g, '') + '" class="fax" title="فکس ' + store.fax + '" aria-label="فکس"><svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="7" rx="1.5"/><path d="M7 13h10v7a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-7z"/><line x1="7" y1="9" x2="7" y2="13"/><line x1="17" y1="9" x2="17" y2="13"/></svg></a>');
    }
    if (store.whatsapp) {
      icons.push('<a href="https://wa.me/' + store.whatsapp + '" target="_blank" rel="noopener" class="wa" title="واتساپ" aria-label="واتساپ"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>');
    }
    if (store.telegram) {
      icons.push('<a href="https://t.me/' + store.telegram + '" target="_blank" rel="noopener" class="tg" title="تلگرام" aria-label="تلگرام"><svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></a>');
    }
    if (store.instagram) {
      icons.push('<a href="https://instagram.com/' + store.instagram + '" target="_blank" rel="noopener" class="ig" title="اینستاگرام" aria-label="اینستاگرام"><svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>');
    }
    if (store.website) {
      icons.push('<a href="' + store.website + '" target="_blank" rel="noopener" class="web" title="وب‌سایت" aria-label="وب‌سایت"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></a>');
    }
    return icons.join('');
  }

  function createChevron() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  }

  // مرتب‌سازی فروشگاه‌ها بر اساس امتیاز (بیشترین اول)
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

  function setupEvents() {
    var root = document.getElementById('provinces-accordion');

    document.getElementById('theme-toggle') && document.getElementById('theme-toggle').addEventListener('click', function () {
      var cur = html.getAttribute('data-theme') || 'light';
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('menu-btn') && document.getElementById('menu-btn').addEventListener('click', openNav);
    document.getElementById('close-nav') && document.getElementById('close-nav').addEventListener('click', closeNavFn);
    document.getElementById('nav-overlay') && document.getElementById('nav-overlay').addEventListener('click', closeNavFn);

    root && root.addEventListener('click', function (e) {
      var starBtn = e.target.closest('.star-btn');
      if (starBtn) {
        var box = starBtn.closest('.rating-box');
        if (!box || box.classList.contains('voted')) return;
        var storeId = box.dataset.storeId;
        var score = parseInt(starBtn.dataset.score, 10);
        if (saveRating(storeId, score)) {
          // بازسازی لیست فروشگاه‌ها برای مرتب‌سازی مجدد
          var area = box.closest('.mall-details-area');
          var activeMall = area && area.dataset.activeMall;
          if (activeMall) {
            var mall = findMall(activeMall);
            if (mall) {
              area.innerHTML = renderMallInfo(mall) + renderStores(mall.stores || []);
            }
          } else {
            box.outerHTML = renderStars(storeId);
          }
        }
        return;
      }

      var header = e.target.closest('.acc-header');
      if (header) {
        var item = header.closest('.acc-item');
        if (!item) return;
        var isOpen = item.classList.contains('open');
        item.classList.toggle('open', !isOpen);
        header.setAttribute('aria-expanded', String(!isOpen));
        return;
      }

      var mallCard = e.target.closest('.mall-card');
      if (mallCard) {
        var mallId = mallCard.dataset.mallId;
        var grid = mallCard.closest('.malls-grid');
        var area = mallCard.closest('.acc-inner') && mallCard.closest('.acc-inner').querySelector('.mall-details-area');
        if (!area) return;

        // حذف active از بقیه
        if (grid) {
          grid.querySelectorAll('.mall-card.active').forEach(function (c) { c.classList.remove('active'); });
        }

        if (area.dataset.activeMall === mallId) {
          area.innerHTML = '';
          area.dataset.activeMall = '';
          mallCard.classList.remove('active');
          return;
        }

        mallCard.classList.add('active');
        var mall = findMall(mallId);
        area.innerHTML = renderMallInfo(mall) + renderStores(mall && mall.stores ? mall.stores : []);
        area.dataset.activeMall = mallId;
        // پنل دقیقاً زیر گرید و نزدیک به کارت انتخاب‌شده
        area.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    root && root.addEventListener('mouseover', function (e) {
      var btn = e.target.closest('.star-btn');
      if (!btn) return;
      var box = btn.closest('.rating-box');
      if (!box || box.classList.contains('voted')) return;
      var score = parseInt(btn.dataset.score, 10);
      box.querySelectorAll('.star-btn').forEach(function (b) {
        b.classList.toggle('hovered', parseInt(b.dataset.score, 10) <= score);
      });
    });
    root && root.addEventListener('mouseout', function (e) {
      var box = e.target.closest('.rating-box');
      if (box) box.querySelectorAll('.star-btn').forEach(function (b) { b.classList.remove('hovered'); });
    });

    root && root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var mc = e.target.closest('.mall-card');
        if (mc) { e.preventDefault(); mc.click(); }
      }
    });
  }

  function normalize(text) {
    return (text || '').toString().toLowerCase()
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); });
  }

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
      return;
    }
    var anyMatch = false;
    document.querySelectorAll('.province-item').forEach(function (provEl) {
      var provMatch = false;
      var provName = normalize(provEl.querySelector('.acc-header span') && provEl.querySelector('.acc-header span').textContent);
      provEl.querySelectorAll('.city-item').forEach(function (cityEl) {
        var cityMatch = false;
        var cityName = normalize(cityEl.querySelector('.acc-header span') && cityEl.querySelector('.acc-header span').textContent);
        cityEl.querySelectorAll('.cat-item').forEach(function (catEl) {
          var catMatch = false;
          var catName = normalize(catEl.querySelector('.acc-header span') && catEl.querySelector('.acc-header span').textContent);
          catEl.querySelectorAll('.mall-card').forEach(function (mallEl) {
            var mallName = normalize(mallEl.querySelector('.mall-name') && mallEl.querySelector('.mall-name').textContent);
            var match = mallName.indexOf(q) !== -1 || catName.indexOf(q) !== -1 || cityName.indexOf(q) !== -1 || provName.indexOf(q) !== -1;
            mallEl.classList.toggle('hidden', !match);
            if (match) { catMatch = true; anyMatch = true; }
          });
          catEl.querySelectorAll('.store-card').forEach(function (storeEl) {
            var storeName = normalize(storeEl.querySelector('.store-name') && storeEl.querySelector('.store-name').textContent);
            var phone = normalize(storeEl.querySelector('.phone-text') && storeEl.querySelector('.phone-text').textContent);
            var match = storeName.indexOf(q) !== -1 || phone.indexOf(q) !== -1;
            storeEl.classList.toggle('hidden', !match);
            if (match) { catMatch = true; anyMatch = true; }
          });
          catEl.classList.toggle('hidden', !catMatch);
          if (catMatch) { catEl.classList.add('open'); cityMatch = true; }
        });
        cityEl.classList.toggle('hidden', !cityMatch);
        if (cityMatch) { cityEl.classList.add('open'); provMatch = true; }
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
    renderProvinces();
    setupEvents();
    var searchInput = document.getElementById('search-input');
    var t;
    searchInput && searchInput.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () { performSearch(searchInput.value); }, 240);
    });
  }

  // بارگذاری ratings.json سپس شروع
  fetch('ratings.json')
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (data) {
      baseRatings = data || {};
    })
    .catch(function () { baseRatings = {}; })
    .finally(function () {
      if (document.getElementById('menu-btn')) {
        init();
      } else {
        var obs = new MutationObserver(function () {
          if (document.getElementById('menu-btn')) {
            obs.disconnect();
            init();
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(init, 700);
      }
    });
})();
