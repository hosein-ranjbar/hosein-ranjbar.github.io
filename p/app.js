/**
 * app.js — پاساژگردی
 * سرچ: inverted index (Map + Set) برای حجم زیاد
 * داده ادمین از localStorage ادغام می‌شود
 */
(function () {
  'use strict';

  var CUSTOM_KEY = 'passazh_custom_v1';
  var ALIAS_KEY = 'passazh_aliases_v1';
  var RATE_KEY = 'passazh_votes_v1';
  var baseRatings = {};
  var pendingScores = {};
  var searchIndex = [];
  var tokenMap = new Map();

  function loadCustomData() {
    try {
      var d = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}');
      if (!d.provinces) d.provinces = [];
      if (!d.cities) d.cities = [];
      if (!d.malls) d.malls = [];
      if (!d.stores) d.stores = [];
      return d;
    } catch (e) {
      return { provinces: [], cities: [], malls: [], stores: [] };
    }
  }

  function loadExtraAliases() {
    try { return JSON.parse(localStorage.getItem(ALIAS_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function mergeCustomIntoData() {
    if (typeof provincesData === 'undefined') return;
    var custom = loadCustomData();
    var extra = loadExtraAliases();
    if (typeof searchAliases !== 'undefined') {
      Object.keys(extra).forEach(function (k) {
        if (!searchAliases[k]) searchAliases[k] = [];
        (extra[k] || []).forEach(function (a) {
          if (searchAliases[k].indexOf(a) === -1) searchAliases[k].push(a);
        });
      });
    }
    custom.provinces.forEach(function (p) {
      if (!provincesData.some(function (x) { return x.id === p.id; })) {
        provincesData.push({ id: p.id, name: p.name, cities: [] });
      }
    });
    custom.cities.forEach(function (c) {
      var prov = provincesData.find(function (x) { return x.id === c.provinceId; });
      if (!prov) return;
      if (!prov.cities) prov.cities = [];
      if (!prov.cities.some(function (x) { return x.id === c.id; })) {
        prov.cities.push({ id: c.id, name: c.name, categories: [] });
      }
    });
    custom.malls.forEach(function (m) {
      var prov = provincesData.find(function (x) { return x.id === m.provinceId; });
      if (!prov) return;
      var city = (prov.cities || []).find(function (x) { return x.id === m.cityId; });
      if (!city) return;
      if (!city.categories) city.categories = [];
      var cat = city.categories.find(function (x) { return x.id === m.categoryId; });
      if (!cat) {
        cat = { id: m.categoryId, name: m.categoryName || m.categoryId, malls: [] };
        city.categories.push(cat);
      }
      if (!cat.malls) cat.malls = [];
      if (!cat.malls.some(function (x) { return x.id === m.id; })) {
        cat.malls.push({
          id: m.id, name: m.name, image: m.image || '', address: m.address || '',
          phone: m.phone || '', fax: m.fax || '', website: m.website || '', stores: []
        });
      }
    });
    custom.stores.forEach(function (s) {
      provincesData.forEach(function (p) {
        (p.cities || []).forEach(function (c) {
          (c.categories || []).forEach(function (cat) {
            (cat.malls || []).forEach(function (mall) {
              if (mall.id === s.mallId) {
                if (!mall.stores) mall.stores = [];
                if (!mall.stores.some(function (x) { return x.id === s.id; })) {
                  mall.stores.push({
                    id: s.id, name: s.name, floor: s.floor, unit: s.unit,
                    phone: s.phone, fax: s.fax, whatsapp: s.whatsapp,
                    telegram: s.telegram, instagram: s.instagram, website: s.website,
                    shopCategories: s.shopCategories || [], brands: s.brands || []
                  });
                }
              }
            });
          });
        });
      });
    });
  }

  function normalize(text) {
    return (text || '').toString().toLowerCase()
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
      .replace(/\s+/g, ' ')
      .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .trim();
  }

  function addTokens(str, recIdx) {
    var n = normalize(str);
    if (!n) return;
    var parts = n.split(/[\s\-_./]+/).filter(Boolean);
    parts.push(n);
    parts.push(n.replace(/\s/g, ''));
    for (var i = 0; i < parts.length; i++) {
      var t = parts[i];
      if (!t) continue;
      var max = Math.min(t.length, 16);
      for (var L = 1; L <= max; L++) {
        var pref = t.slice(0, L);
        var set = tokenMap.get(pref);
        if (!set) { set = new Set(); tokenMap.set(pref, set); }
        set.add(recIdx);
      }
    }
  }

  function buildSearchIndex() {
    searchIndex = [];
    tokenMap = new Map();
    if (typeof provincesData === 'undefined') return;
    provincesData.forEach(function (p) {
      var pi = searchIndex.length;
      searchIndex.push({ t: 'prov', n: p.name, pid: p.id });
      addTokens(p.name, pi);
      (p.cities || []).forEach(function (c) {
        var ci = searchIndex.length;
        searchIndex.push({ t: 'city', n: c.name, pid: p.id, cid: c.id });
        addTokens(c.name, ci);
        (c.categories || []).forEach(function (cat) {
          var ki = searchIndex.length;
          searchIndex.push({ t: 'cat', n: cat.name, pid: p.id, cid: c.id, catid: cat.id });
          addTokens(cat.name, ki);
          if (typeof searchAliases !== 'undefined' && searchAliases[cat.name]) {
            searchAliases[cat.name].forEach(function (al) { addTokens(al, ki); });
          }
          (cat.malls || []).forEach(function (mall) {
            var mi = searchIndex.length;
            searchIndex.push({ t: 'mall', n: mall.name, pid: p.id, cid: c.id, catid: cat.id, mid: mall.id });
            addTokens(mall.name, mi);
            (mall.stores || []).forEach(function (s) {
              var si = searchIndex.length;
              searchIndex.push({
                t: 'store', n: s.name, phone: s.phone || '',
                pid: p.id, cid: c.id, catid: cat.id, mid: mall.id, sid: s.id,
                brands: s.brands || [], cats: s.shopCategories || []
              });
              addTokens(s.name, si);
              addTokens(s.phone, si);
              (s.brands || []).forEach(function (b) {
                addTokens(b, si);
                if (typeof searchAliases !== 'undefined' && searchAliases[b]) {
                  searchAliases[b].forEach(function (al) { addTokens(al, si); });
                }
              });
              (s.shopCategories || []).forEach(function (bc) {
                addTokens(bc, si);
                if (typeof searchAliases !== 'undefined' && searchAliases[bc]) {
                  searchAliases[bc].forEach(function (al) { addTokens(al, si); });
                }
              });
            });
          });
        });
      });
    });
  }

  function lookupQuery(q) {
    var nq = normalize(q);
    if (!nq) return null;
    return tokenMap.get(nq) || new Set();
  }

  /* ---------- Ratings ---------- */
  function getVotes() {
    try { return JSON.parse(localStorage.getItem(RATE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function setVotes(v) { localStorage.setItem(RATE_KEY, JSON.stringify(v)); }

  function getRating(storeId) {
    var b = baseRatings[storeId] || { sum: 0, count: 0 };
    var votes = getVotes();
    var extra = votes._sums && votes._sums[storeId] ? votes._sums[storeId] : { sum: 0, count: 0 };
    var sum = b.sum + extra.sum;
    var count = b.count + extra.count;
    return { avg: count ? (sum / count) : 0, count: count, voted: !!votes[storeId] };
  }

  function submitRating(storeId, score) {
    var votes = getVotes();
    if (votes[storeId]) return false;
    votes[storeId] = score;
    if (!votes._sums) votes._sums = {};
    if (!votes._sums[storeId]) votes._sums[storeId] = { sum: 0, count: 0 };
    votes._sums[storeId].sum += score;
    votes._sums[storeId].count += 1;
    setVotes(votes);
    return true;
  }

  /* ---------- SVG icons ---------- */
  var SVG = {
    chev: '<svg viewBox="0 0 24 24" fill="none"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    tg: '<svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
    ig: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    web: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    fax: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="12" y2="13"/><line x1="8" y1="17" x2="10" y2="17"/></svg>'
  };

  function iconLink(cls, href, label, svg) {
    if (!href) return '';
    return '<span class="icon-wrap"><a class="' + cls + '" href="' + href + '" target="_blank" rel="noopener" aria-label="' + label + '">' + svg + '</a><span class="icon-tip">' + label + '</span></span>';
  }

  function renderMallInfo(mall) {
    if (!mall) return '';
    var rows = '';
    if (mall.address) rows += '<div class="info-row"><strong>آدرس:</strong> ' + mall.address + '</div>';
    if (mall.phone) rows += '<div class="info-row"><strong>تلفن:</strong> <span class="phone-text">' + mall.phone + '</span></div>';
    if (mall.fax) rows += '<div class="info-row"><strong>فکس:</strong> <span class="fax-text">' + mall.fax + '</span></div>';
    if (mall.website) rows += '<div class="info-row"><strong>سایت:</strong> <a href="' + mall.website + '" target="_blank" rel="noopener">' + mall.website + '</a></div>';
    if (!rows) return '';
    return '<div class="mall-info-panel glass-thin">' + rows + '</div>';
  }

  function renderStars(storeId, rating) {
    var html = '<div class="rating-box' + (rating.voted ? ' voted' : '') + '" data-store="' + storeId + '"><div class="stars">';
    for (var i = 1; i <= 5; i++) {
      var sel = rating.avg >= i - 0.25 ? ' selected' : '';
      html += '<button type="button" class="star-btn' + sel + '" data-score="' + i + '" ' + (rating.voted ? 'disabled' : '') + '>' + SVG.star + '</button>';
    }
    html += '</div>';
    if (!rating.voted) {
      html += '<button type="button" class="rate-submit" data-store="' + storeId + '" disabled>ثبت</button>';
    } else {
      html += '<button type="button" class="rate-submit done" disabled>' + SVG.check + '</button>';
    }
    html += '<span class="rating-text"><span class="avg">' + (rating.count ? rating.avg.toFixed(1) : '—') + '</span> (' + rating.count + ')</span></div>';
    return html;
  }

  function renderStores(stores) {
    if (!stores || !stores.length) return '<p class="no-results">فروشگاهی ثبت نشده.</p>';
    // sort by rating desc
    var list = stores.slice().sort(function (a, b) {
      return getRating(b.id).avg - getRating(a.id).avg;
    });
    var html = '<div class="stores-list">';
    list.forEach(function (s) {
      var r = getRating(s.id);
      var links = '';
      if (s.phone) links += iconLink('phone', 'tel:' + s.phone.replace(/\s/g, ''), 'تماس', SVG.phone);
      if (s.fax) links += iconLink('fax', 'tel:' + s.fax.replace(/\s/g, ''), 'فکس', SVG.fax);
      if (s.whatsapp) links += iconLink('wa', 'https://wa.me/' + s.whatsapp, 'واتساپ', SVG.wa);
      if (s.telegram) links += iconLink('tg', 'https://t.me/' + s.telegram, 'تلگرام', SVG.tg);
      if (s.instagram) links += iconLink('ig', 'https://instagram.com/' + s.instagram, 'اینستاگرام', SVG.ig);
      if (s.website) links += iconLink('web', s.website, 'سایت', SVG.web);

      var cats = (s.shopCategories || []).map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('');
      var brands = (s.brands || []).map(function (b) { return '<span class="chip brand">' + b + '</span>'; }).join('');

      html += '<div class="store-card glass" data-store-id="' + s.id + '">';
      html += '<div class="store-name">' + s.name + '</div>';
      html += '<div class="store-meta"><span>طبقه ' + (s.floor || '—') + '</span><span>واحد ' + (s.unit || '—') + '</span>';
      if (s.phone) html += '<span class="phone-text">' + s.phone + '</span>';
      if (s.fax) html += '<span class="fax-text">فکس ' + s.fax + '</span>';
      html += '</div>';
      html += '<div class="store-mid">' + renderStars(s.id, r) + '<div class="store-links">' + links + '</div></div>';
      html += '<button type="button" class="store-expand" aria-label="دسته و برند">' + SVG.chev + '</button>';
      html += '<div class="store-extras">';
      if (cats) html += '<div class="carousel-label">دسته‌بندی</div><div class="carousel">' + cats + '</div>';
      if (brands) html += '<div class="carousel-label">برندها</div><div class="carousel">' + brands + '</div>';
      if (!cats && !brands) html += '<span style="color:var(--muted);font-size:0.75rem">موردی نیست</span>';
      html += '</div></div>';
    });
    html += '</div>';
    return html;
  }

  function findMall(provinceId, cityId, catId, mallId) {
    var p = provincesData.find(function (x) { return x.id === provinceId; });
    if (!p) return null;
    var c = (p.cities || []).find(function (x) { return x.id === cityId; });
    if (!c) return null;
    var cat = (c.categories || []).find(function (x) { return x.id === catId; });
    if (!cat) return null;
    return (cat.malls || []).find(function (x) { return x.id === mallId; }) || null;
  }

  function renderProvinces() {
    var root = document.getElementById('provinces-accordion');
    if (!root || typeof provincesData === 'undefined') return;
    var html = '';
    provincesData.forEach(function (p) {
      html += '<div class="acc-item province-item glass" data-province-id="' + p.id + '">';
      html += '<button type="button" class="acc-header"><span>' + p.name + '</span>' + SVG.chev + '</button>';
      html += '<div class="acc-body"><div class="acc-inner">';
      (p.cities || []).forEach(function (c) {
        html += '<div class="acc-item city-item glass-thin" data-city-id="' + c.id + '">';
        html += '<button type="button" class="acc-header"><span>' + c.name + '</span>' + SVG.chev + '</button>';
        html += '<div class="acc-body"><div class="acc-inner">';
        (c.categories || []).forEach(function (cat) {
          html += '<div class="acc-item cat-item glass-thin" data-cat-id="' + cat.id + '">';
          html += '<button type="button" class="acc-header"><span>' + cat.name + '</span>' + SVG.chev + '</button>';
          html += '<div class="acc-body">';
          html += '<div class="malls-grid">';
          (cat.malls || []).forEach(function (m) {
            var img = m.image ? 'background-image:url(\'' + m.image.replace(/'/g, "\\'") + '\')' : '';
            html += '<div class="mall-card" data-mall-id="' + m.id + '" data-province-id="' + p.id + '" data-city-id="' + c.id + '" data-cat-id="' + cat.id + '" style="' + img + '">';
            html += '<div class="mall-name">' + m.name + '</div></div>';
          });
          html += '</div><div class="mall-details-area"></div>';
          html += '</div></div>';
        });
        if (!(c.categories || []).length) {
          html += '<p class="no-results" style="padding:8px;font-size:0.8rem">دسته‌ای نیست — از ادمین اضافه کنید</p>';
        }
        html += '</div></div></div>';
      });
      html += '</div></div></div>';
    });
    root.innerHTML = html;
  }

  function performSearch(query) {
    var q = normalize(query);
    var root = document.getElementById('provinces-accordion');
    if (!q) {
      document.querySelectorAll('.acc-item, .mall-card, .store-card').forEach(function (el) {
        el.classList.remove('hidden');
      });
      document.querySelectorAll('.acc-item.open').forEach(function (el) { el.classList.remove('open'); });
      var nr = document.getElementById('no-search-results');
      if (nr) nr.remove();
      return;
    }

    var hits = lookupQuery(q);
    var matchProv = {}, matchCity = {}, matchCat = {}, matchMall = {}, matchStoreMall = {};

    if (hits && hits.size) {
      hits.forEach(function (idx) {
        var r = searchIndex[idx];
        if (!r) return;
        matchProv[r.pid] = true;
        if (r.cid) matchCity[r.pid + '|' + r.cid] = true;
        if (r.catid) matchCat[r.pid + '|' + r.cid + '|' + r.catid] = true;
        if (r.mid) matchMall[r.mid] = true;
        if (r.t === 'store' && r.mid) matchStoreMall[r.mid] = r;
      });
    }

    // fallback partial if no token hit
    if (!hits || !hits.size) {
      searchIndex.forEach(function (r) {
        var blob = normalize(r.n + ' ' + (r.phone || '') + ' ' + (r.brands || []).join(' ') + ' ' + (r.cats || []).join(' '));
        if (blob.indexOf(q) === -1) return;
        matchProv[r.pid] = true;
        if (r.cid) matchCity[r.pid + '|' + r.cid] = true;
        if (r.catid) matchCat[r.pid + '|' + r.cid + '|' + r.catid] = true;
        if (r.mid) matchMall[r.mid] = true;
        if (r.t === 'store') matchStoreMall[r.mid] = r;
      });
    }

    var any = false;
    document.querySelectorAll('.province-item').forEach(function (provEl) {
      var pid = provEl.dataset.provinceId;
      var pOk = !!matchProv[pid];
      provEl.querySelectorAll('.city-item').forEach(function (cityEl) {
        var cid = cityEl.dataset.cityId;
        var cOk = !!matchCity[pid + '|' + cid];
        cityEl.querySelectorAll('.cat-item').forEach(function (catEl) {
          var catid = catEl.dataset.catId;
          var kOk = !!matchCat[pid + '|' + cid + '|' + catid];
          catEl.querySelectorAll('.mall-card').forEach(function (mallEl) {
            var mid = mallEl.dataset.mallId;
            var show = !!matchMall[mid] || kOk;
            mallEl.classList.toggle('hidden', !show);
            if (show) { kOk = true; cOk = true; pOk = true; any = true; }
            if (matchStoreMall[mid] && show) {
              var area = catEl.querySelector('.mall-details-area');
              var mall = findMall(pid, cid, catid, mid);
              if (area && mall && area.dataset.activeMall !== mid) {
                mallEl.classList.add('active');
                area.innerHTML = renderMallInfo(mall) + renderStores(mall.stores || []);
                area.dataset.activeMall = mid;
              }
            }
          });
          catEl.classList.toggle('hidden', !kOk);
          if (kOk) { catEl.classList.add('open'); cOk = true; }
        });
        cityEl.classList.toggle('hidden', !cOk);
        if (cOk) { cityEl.classList.add('open'); pOk = true; }
      });
      provEl.classList.toggle('hidden', !pOk);
      if (pOk) provEl.classList.add('open');
    });

    var noRes = document.getElementById('no-search-results');
    if (!any) {
      if (!noRes && root) {
        noRes = document.createElement('p');
        noRes.id = 'no-search-results';
        noRes.className = 'no-results';
        noRes.textContent = 'نتیجه‌ای یافت نشد.';
        root.parentNode.insertBefore(noRes, root.nextSibling);
      }
    } else if (noRes) noRes.remove();
  }

  function setupEvents() {
    var root = document.getElementById('provinces-accordion');
    if (root) {
      root.addEventListener('click', function (e) {
        var header = e.target.closest('.acc-header');
        if (header) {
          var item = header.closest('.acc-item');
          if (item) item.classList.toggle('open');
          return;
        }
        var mallCard = e.target.closest('.mall-card');
        if (mallCard) {
          var catEl = mallCard.closest('.cat-item');
          var area = catEl ? catEl.querySelector('.mall-details-area') : null;
          var mid = mallCard.dataset.mallId;
          var mall = findMall(mallCard.dataset.provinceId, mallCard.dataset.cityId, mallCard.dataset.catId, mid);
          if (!area || !mall) return;
          if (area.dataset.activeMall === mid) {
            area.innerHTML = '';
            area.dataset.activeMall = '';
            mallCard.classList.remove('active');
          } else {
            catEl.querySelectorAll('.mall-card.active').forEach(function (c) { c.classList.remove('active'); });
            mallCard.classList.add('active');
            area.innerHTML = renderMallInfo(mall) + renderStores(mall.stores || []);
            area.dataset.activeMall = mid;
          }
          return;
        }
        var expand = e.target.closest('.store-expand');
        if (expand) {
          expand.closest('.store-card').classList.toggle('expanded');
          return;
        }
        var star = e.target.closest('.star-btn');
        if (star && !star.disabled) {
          var box = star.closest('.rating-box');
          var score = +star.dataset.score;
          pendingScores[box.dataset.store] = score;
          box.querySelectorAll('.star-btn').forEach(function (b) {
            b.classList.toggle('selected', +b.dataset.score <= score);
          });
          var btn = box.querySelector('.rate-submit');
          if (btn) btn.disabled = false;
          return;
        }
        var submit = e.target.closest('.rate-submit');
        if (submit && !submit.disabled && !submit.classList.contains('done')) {
          var sid = submit.dataset.store;
          var sc = pendingScores[sid];
          if (!sc) return;
          if (submitRating(sid, sc)) {
            submit.classList.add('done');
            submit.innerHTML = SVG.check;
            submit.disabled = true;
            var box = submit.closest('.rating-box');
            box.classList.add('voted');
            box.querySelectorAll('.star-btn').forEach(function (b) { b.disabled = true; });
            var r = getRating(sid);
            var rt = box.querySelector('.rating-text');
            if (rt) rt.innerHTML = '<span class="avg">' + r.avg.toFixed(1) + '</span> (' + r.count + ')';
          }
          return;
        }
        var wrap = e.target.closest('.icon-wrap');
        if (wrap) {
          document.querySelectorAll('.icon-wrap.show-tip').forEach(function (w) { w.classList.remove('show-tip'); });
          wrap.classList.add('show-tip');
        }
      });
    }

    document.addEventListener('scroll', function () {
      document.querySelectorAll('.icon-wrap.show-tip').forEach(function (w) { w.classList.remove('show-tip'); });
    }, { passive: true });

    // menu + theme
    var menuBtn = document.getElementById('menu-btn');
    var closeNav = document.getElementById('close-nav');
    var drawer = document.getElementById('nav-drawer');
    var overlay = document.getElementById('nav-overlay');
    function openNav() { if (drawer) drawer.classList.add('open'); if (overlay) overlay.classList.add('open'); }
    function closeNavFn() { if (drawer) drawer.classList.remove('open'); if (overlay) overlay.classList.remove('open'); }
    if (menuBtn) menuBtn.addEventListener('click', openNav);
    if (closeNav) closeNav.addEventListener('click', closeNavFn);
    if (overlay) overlay.addEventListener('click', closeNavFn);

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      var moon = document.getElementById('icon-moon');
      var sun = document.getElementById('icon-sun');
      var saved = localStorage.getItem('passazh_theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
      if (saved === 'dark') { if (moon) moon.classList.add('hidden'); if (sun) sun.classList.remove('hidden'); }
      themeBtn.addEventListener('click', function () {
        var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', cur);
        localStorage.setItem('passazh_theme', cur);
        if (cur === 'dark') { if (moon) moon.classList.add('hidden'); if (sun) sun.classList.remove('hidden'); }
        else { if (moon) moon.classList.remove('hidden'); if (sun) sun.classList.add('hidden'); }
      });
    }
  }

  function loadHeroBanner() {
    var url = localStorage.getItem('passazh_banner_url') || '';
    var wrap = document.getElementById('hero-banner');
    var img = document.getElementById('hero-banner-img');
    if (!wrap || !img) return;
    if (url) {
      img.src = url;
      img.hidden = false;
      wrap.classList.add('has-img');
    }
  }

  var listExpanded = false;
  var arrowColorTimer = null;

  function closeAllAccordions() {
    document.querySelectorAll('.acc-item.open').forEach(function (el) {
      el.classList.remove('open');
    });
  }

  function setStickySearchVisible(on) {
    var wrap = document.getElementById('sticky-search-wrap');
    if (wrap) {
      if (on) wrap.removeAttribute('hidden');
      else wrap.setAttribute('hidden', '');
    }
  }

  function syncSearchInputs(source) {
    var a = document.getElementById('search-input');
    var b = document.getElementById('search-input-sticky');
    if (!a || !b) return;
    if (source === a) b.value = a.value;
    else if (source === b) a.value = b.value;
  }

  /** باز کردن لیست استان‌ها — منوها بسته؛ فقط نام استان */
  function expandProvincesList() {
    var landing = document.getElementById('landing');
    var main = document.getElementById('provinces');
    var btn = document.getElementById('expand-arrow');
    if (landing) landing.classList.add('is-compact');
    if (main) {
      main.classList.remove('is-collapsed');
      main.classList.add('is-open');
    }
    closeAllAccordions();
    setStickySearchVisible(true);
    listExpanded = true;
    if (btn) {
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.remove('c-orange', 'c-white', 'c-black');
      if (arrowColorTimer) { clearInterval(arrowColorTimer); arrowColorTimer = null; }
    }
    if (main) main.scrollIntoView({ block: 'start' });
  }

  /** بستن لیست و برگشت به لندینگ */
  function collapseProvincesList() {
    var landing = document.getElementById('landing');
    var main = document.getElementById('provinces');
    var btn = document.getElementById('expand-arrow');
    if (landing) landing.classList.remove('is-compact');
    if (main) {
      main.classList.add('is-collapsed');
      main.classList.remove('is-open');
    }
    closeAllAccordions();
    setStickySearchVisible(false);
    listExpanded = false;
    if (btn) {
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      startArrowColors(btn);
    }
    window.scrollTo(0, 0);
  }

  function startArrowColors(btn) {
    if (arrowColorTimer) clearInterval(arrowColorTimer);
    var colors = ['c-orange', 'c-white', 'c-black'];
    var i = 0;
    colors.forEach(function (c) { btn.classList.remove(c); });
    btn.classList.add(colors[0]);
    arrowColorTimer = setInterval(function () {
      if (btn.classList.contains('is-open')) return;
      btn.classList.remove(colors[i]);
      i = (i + 1) % colors.length;
      btn.classList.add(colors[i]);
    }, 2200);
  }

  function setupExpandArrow() {
    var btn = document.getElementById('expand-arrow');
    if (!btn) return;
    startArrowColors(btn);
    btn.addEventListener('click', function () {
      if (listExpanded) collapseProvincesList();
      else expandProvincesList();
    });
  }

  function bindSearchInput(el) {
    if (!el) return;
    var t;
    el.addEventListener('input', function () {
      syncSearchInputs(el);
      clearTimeout(t);
      t = setTimeout(function () {
        var v = el.value;
        if (v.trim()) {
          if (!listExpanded) expandProvincesList();
          performSearch(v);
        } else {
          performSearch('');
          closeAllAccordions();
        }
      }, 180);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        syncSearchInputs(el);
        if (!listExpanded) expandProvincesList();
        performSearch(el.value);
      }
    });
  }

  function init() {
    mergeCustomIntoData();
    buildSearchIndex();
    renderProvinces();
    setupEvents();
    setupExpandArrow();
    bindSearchInput(document.getElementById('search-input'));
    bindSearchInput(document.getElementById('search-input-sticky'));
    try {
      var params = new URLSearchParams(location.search);
      var q = params.get('q');
      if (q) {
        var si = document.getElementById('search-input');
        var ss = document.getElementById('search-input-sticky');
        if (si) si.value = q;
        if (ss) ss.value = q;
        expandProvincesList();
        performSearch(q);
      }
    } catch (err) {}
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
        setTimeout(init, 500);
      }
    });
})();
