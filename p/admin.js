/**
 * admin.js — افزودن/حذف: استان، شهر، پاساژ، فروشگاه + درخت
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'passazh_custom_v1';
  var ALIAS_KEY = 'passazh_aliases_v1';

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function loadCustom() {
    try {
      var d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!d.provinces) d.provinces = [];
      if (!d.cities) d.cities = [];
      if (!d.malls) d.malls = [];
      if (!d.stores) d.stores = [];
      return d;
    } catch (e) {
      return { provinces: [], cities: [], malls: [], stores: [] };
    }
  }

  function saveCustom(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadExtraAliases() {
    try { return JSON.parse(localStorage.getItem(ALIAS_KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function saveExtraAliases(obj) {
    localStorage.setItem(ALIAS_KEY, JSON.stringify(obj));
  }

  function showMsg(text, ok) {
    var el = document.getElementById('msg');
    if (!el) return;
    el.textContent = text;
    el.className = 'msg show ' + (ok ? 'ok' : 'err');
    setTimeout(function () { el.className = 'msg'; }, 4000);
  }

  function splitList(str) {
    return (str || '').split(/[,،]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /** لیست استان‌ها = data.js + سفارشی ادمین */
  function allProvinces() {
    var list = provincesData.map(function (p) {
      return { id: p.id, name: p.name, custom: false };
    });
    loadCustom().provinces.forEach(function (p) {
      if (!list.some(function (x) { return x.id === p.id; })) {
        list.push({ id: p.id, name: p.name, custom: true });
      }
    });
    return list;
  }

  /** لیست شهرهای یک استان = data.js + سفارشی */
  function allCities(provinceId) {
    var list = [];
    var prov = provincesData.find(function (p) { return p.id === provinceId; });
    if (prov) {
      (prov.cities || []).forEach(function (c) {
        list.push({ id: c.id, name: c.name, custom: false });
      });
    }
    loadCustom().cities.forEach(function (c) {
      if (c.provinceId === provinceId && !list.some(function (x) { return x.id === c.id; })) {
        list.push({ id: c.id, name: c.name, custom: true });
      }
    });
    return list;
  }

  function resolveCategory(selectId, customInputId) {
    var customName = document.getElementById(customInputId).value.trim();
    if (customName) {
      return { id: 'cat_' + customName.replace(/\s+/g, '-'), name: customName };
    }
    var sel = document.getElementById(selectId);
    var id = sel.value;
    var name = sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : id;
    if (typeof standardCategories !== 'undefined') {
      for (var i = 0; i < standardCategories.length; i++) {
        if (standardCategories[i].id === id) {
          return { id: standardCategories[i].id, name: standardCategories[i].name };
        }
      }
    }
    return { id: id, name: name };
  }

  function fillProvinceSelects() {
    ['m-province', 's-province', 'c-province', 'city-province'].forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      var cur = sel.value;
      sel.innerHTML = '';
      allProvinces().forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.name + (p.custom ? ' (جدید)' : '');
        sel.appendChild(o);
      });
      if (cur) sel.value = cur;
    });
  }

  function fillCities(provinceSelectId, citySelectId) {
    var pSel = document.getElementById(provinceSelectId);
    var cSel = document.getElementById(citySelectId);
    if (!pSel || !cSel) return;
    var pid = pSel.value;
    var cur = cSel.value;
    cSel.innerHTML = '';
    allCities(pid).forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name + (c.custom ? ' (جدید)' : '');
      cSel.appendChild(o);
    });
    if (cur) cSel.value = cur;
  }

  function fillCategories(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';
    var list = typeof standardCategories !== 'undefined' ? standardCategories : [
      { id: 'mobile', name: 'موبایل و کامپیوتر' },
      { id: 'home', name: 'لوازم خانگی' },
      { id: 'other', name: 'سایر' }
    ];
    list.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      sel.appendChild(o);
    });
  }

  function getAllMallsForCity(provinceId, cityId) {
    var list = [];
    loadCustom().malls.forEach(function (m) {
      if (m.provinceId === provinceId && m.cityId === cityId) {
        list.push({ id: m.id, name: m.name + ' — ' + (m.categoryName || ''), catId: m.categoryId });
      }
    });
    var prov = provincesData.find(function (p) { return p.id === provinceId; });
    if (prov) {
      var city = (prov.cities || []).find(function (c) { return c.id === cityId; });
      if (city) {
        (city.categories || []).forEach(function (cat) {
          (cat.malls || []).forEach(function (m) {
            if (!list.some(function (x) { return x.id === m.id; })) {
              list.push({ id: m.id, name: m.name + ' — ' + cat.name, catId: cat.id });
            }
          });
        });
      }
    }
    return list;
  }

  function fillMalls() {
    var pid = document.getElementById('s-province').value;
    var cid = document.getElementById('s-city').value;
    var sel = document.getElementById('s-mall');
    if (!sel) return;
    sel.innerHTML = '';
    var malls = getAllMallsForCity(pid, cid);
    if (!malls.length) {
      var o = document.createElement('option');
      o.value = '';
      o.textContent = '— ابتدا پاساژ اضافه کنید —';
      sel.appendChild(o);
      return;
    }
    malls.forEach(function (m) {
      var o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.name;
      sel.appendChild(o);
    });
  }

  function refreshAll() {
    fillProvinceSelects();
    fillCities('m-province', 'm-city');
    fillCities('s-province', 's-city');
    fillCities('city-province', 'city-list-hint');
    fillMalls();
    renderTree();
  }

  /* ----- افزودن استان ----- */
  var btnProv = document.getElementById('btn-add-province');
  if (btnProv) btnProv.addEventListener('click', function () {
    var name = document.getElementById('p-name').value.trim();
    if (!name) { showMsg('نام استان الزامی است', false); return; }
    var id = document.getElementById('p-id').value.trim() || ('ostan_' + name.replace(/\s+/g, '-'));
    var custom = loadCustom();
    if (allProvinces().some(function (p) { return p.id === id || p.name === name; })) {
      showMsg('این استان از قبل هست', false);
      return;
    }
    custom.provinces.push({ id: id, name: name });
    saveCustom(custom);
    showMsg('استان «' + name + '» اضافه شد', true);
    document.getElementById('p-name').value = '';
    document.getElementById('p-id').value = '';
    refreshAll();
  });

  /* ----- افزودن شهر ----- */
  var btnCity = document.getElementById('btn-add-city');
  if (btnCity) btnCity.addEventListener('click', function () {
    var name = document.getElementById('city-name').value.trim();
    var provinceId = document.getElementById('city-province').value;
    if (!name) { showMsg('نام شهر الزامی است', false); return; }
    if (!provinceId) { showMsg('استان را انتخاب کنید', false); return; }
    var id = document.getElementById('city-id').value.trim() || ('city_' + name.replace(/\s+/g, '-'));
    var custom = loadCustom();
    if (allCities(provinceId).some(function (c) { return c.id === id || c.name === name; })) {
      showMsg('این شهر در این استان از قبل هست', false);
      return;
    }
    custom.cities.push({ id: id, name: name, provinceId: provinceId });
    saveCustom(custom);
    showMsg('شهر «' + name + '» اضافه شد', true);
    document.getElementById('city-name').value = '';
    document.getElementById('city-id').value = '';
    refreshAll();
  });

  /* ----- پاساژ ----- */
  document.getElementById('btn-add-mall').addEventListener('click', function () {
    var name = document.getElementById('m-name').value.trim();
    if (!name) { showMsg('نام پاساژ الزامی است', false); return; }
    var cat = resolveCategory('m-category', 'm-category-custom');
    var mall = {
      id: uid('mall'),
      provinceId: document.getElementById('m-province').value,
      cityId: document.getElementById('m-city').value,
      categoryId: cat.id,
      categoryName: cat.name,
      name: name,
      image: document.getElementById('m-image').value.trim() || '',
      address: document.getElementById('m-address').value.trim(),
      phone: document.getElementById('m-phone').value.trim(),
      fax: document.getElementById('m-fax').value.trim(),
      website: document.getElementById('m-website').value.trim(),
      stores: []
    };
    var custom = loadCustom();
    custom.malls.push(mall);
    saveCustom(custom);
    showMsg('پاساژ «' + name + '» در «' + cat.name + '» اضافه شد', true);
    document.getElementById('m-name').value = '';
    document.getElementById('m-category-custom').value = '';
    refreshAll();
  });

  /* ----- فروشگاه ----- */
  document.getElementById('btn-add-store').addEventListener('click', function () {
    var name = document.getElementById('s-name').value.trim();
    var mallId = document.getElementById('s-mall').value;
    if (!name) { showMsg('نام فروشگاه الزامی است', false); return; }
    if (!mallId) { showMsg('پاساژ را انتخاب کنید', false); return; }
    var brands = splitList(document.getElementById('s-brands').value);
    var cats = splitList(document.getElementById('s-cats').value);
    var aliasWords = splitList(document.getElementById('s-aliases').value);
    if (aliasWords.length && brands.length) {
      var extra = loadExtraAliases();
      brands.forEach(function (b) {
        if (!extra[b]) extra[b] = [];
        aliasWords.forEach(function (a) {
          if (extra[b].indexOf(a) === -1) extra[b].push(a);
        });
      });
      saveExtraAliases(extra);
    }
    var store = {
      id: uid('s'),
      provinceId: document.getElementById('s-province').value,
      cityId: document.getElementById('s-city').value,
      mallId: mallId,
      name: name,
      floor: document.getElementById('s-floor').value.trim() || '—',
      unit: document.getElementById('s-unit').value.trim() || '—',
      phone: document.getElementById('s-phone').value.trim(),
      fax: document.getElementById('s-fax').value.trim(),
      whatsapp: document.getElementById('s-whatsapp').value.trim(),
      telegram: document.getElementById('s-telegram').value.trim(),
      instagram: document.getElementById('s-instagram').value.trim(),
      website: document.getElementById('s-website').value.trim(),
      shopCategories: cats,
      brands: brands
    };
    var custom = loadCustom();
    custom.stores.push(store);
    saveCustom(custom);
    showMsg('فروشگاه «' + name + '» اضافه شد', true);
    document.getElementById('s-name').value = '';
    refreshAll();
  });

  /* ----- حذف ----- */
  function deleteProvince(id) {
    var custom = loadCustom();
    custom.provinces = custom.provinces.filter(function (p) { return p.id !== id; });
    custom.cities = custom.cities.filter(function (c) { return c.provinceId !== id; });
    var mallIds = {};
    custom.malls = custom.malls.filter(function (m) {
      if (m.provinceId === id) { mallIds[m.id] = true; return false; }
      return true;
    });
    custom.stores = custom.stores.filter(function (s) { return !mallIds[s.mallId] && s.provinceId !== id; });
    saveCustom(custom);
    showMsg('استان سفارشی و زیرمجموعه‌ها حذف شد', true);
    refreshAll();
  }

  function deleteCity(id) {
    var custom = loadCustom();
    custom.cities = custom.cities.filter(function (c) { return c.id !== id; });
    var mallIds = {};
    custom.malls = custom.malls.filter(function (m) {
      if (m.cityId === id) { mallIds[m.id] = true; return false; }
      return true;
    });
    custom.stores = custom.stores.filter(function (s) { return !mallIds[s.mallId] && s.cityId !== id; });
    saveCustom(custom);
    showMsg('شهر سفارشی و زیرمجموعه‌ها حذف شد', true);
    refreshAll();
  }

  function deleteMall(mallId) {
    var custom = loadCustom();
    custom.malls = custom.malls.filter(function (m) { return m.id !== mallId; });
    custom.stores = custom.stores.filter(function (s) { return s.mallId !== mallId; });
    saveCustom(custom);
    showMsg('پاساژ و فروشگاه‌هایش حذف شد', true);
    refreshAll();
  }

  function deleteStore(storeId) {
    var custom = loadCustom();
    custom.stores = custom.stores.filter(function (s) { return s.id !== storeId; });
    saveCustom(custom);
    showMsg('فروشگاه حذف شد', true);
    refreshAll();
  }

  function provinceName(id) {
    var p = allProvinces().find(function (x) { return x.id === id; });
    return p ? p.name : id;
  }
  function cityName(pid, cid) {
    var c = allCities(pid).find(function (x) { return x.id === cid; });
    return c ? c.name : cid;
  }

  function renderTree() {
    var box = document.getElementById('tree-root');
    if (!box) return;
    var custom = loadCustom();
    var html = '';
    var nid = 0;
    function tid() { nid++; return 'tn' + nid; }

    function nodeOpen(id, label, extraBtn) {
      return '<div class="tree-node">' +
        '<div style="display:flex;align-items:center;gap:4px">' +
        '<button type="button" class="tree-toggle" data-tree="' + id + '">' +
        '<span class="arrow"></span><span>' + label + '</span></button>' +
        (extraBtn || '') + '</div>' +
        '<div class="tree-children" id="' + id + '">';
    }
    function nodeClose() { return '</div></div>'; }

    // استان‌های سفارشی
    if (custom.provinces.length) {
      var idp = tid();
      html += nodeOpen(idp, 'استان‌های اضافه‌شده (ادمین)');
      custom.provinces.forEach(function (p) {
        html += '<div class="tree-leaf"><span>' + p.name + ' <small style="opacity:.6">(' + p.id + ')</small></span>' +
          '<button type="button" class="btn-del" data-del-province="' + p.id + '">حذف</button></div>';
      });
      html += nodeClose();
    }

    if (custom.cities.length) {
      var idc = tid();
      html += nodeOpen(idc, 'شهرهای اضافه‌شده (ادمین)');
      custom.cities.forEach(function (c) {
        html += '<div class="tree-leaf"><span>' + provinceName(c.provinceId) + ' / ' + c.name + '</span>' +
          '<button type="button" class="btn-del" data-del-city="' + c.id + '">حذف</button></div>';
      });
      html += nodeClose();
    }

    // درخت پاساژ/فروشگاه
    var tree = {};
    custom.malls.forEach(function (m) {
      if (!tree[m.provinceId]) tree[m.provinceId] = {};
      if (!tree[m.provinceId][m.cityId]) tree[m.provinceId][m.cityId] = {};
      var catKey = m.categoryId || 'other';
      if (!tree[m.provinceId][m.cityId][catKey]) {
        tree[m.provinceId][m.cityId][catKey] = { name: m.categoryName || catKey, malls: {} };
      }
      tree[m.provinceId][m.cityId][catKey].malls[m.id] = { mall: m, stores: [] };
    });
    custom.stores.forEach(function (s) {
      var ok = false;
      Object.keys(tree).forEach(function (pid) {
        Object.keys(tree[pid]).forEach(function (cid) {
          Object.keys(tree[pid][cid]).forEach(function (ck) {
            if (tree[pid][cid][ck].malls[s.mallId]) {
              tree[pid][cid][ck].malls[s.mallId].stores.push(s);
              ok = true;
            }
          });
        });
      });
      if (!ok) {
        if (!tree['_x']) tree['_x'] = { _: { orphan: { name: 'بدون پاساژ', malls: {} } } };
        if (!tree['_x']['_'].orphan.malls[s.mallId]) {
          tree['_x']['_'].orphan.malls[s.mallId] = { mall: { id: s.mallId, name: '(نامشخص)' }, stores: [] };
        }
        tree['_x']['_'].orphan.malls[s.mallId].stores.push(s);
      }
    });

    if (!Object.keys(tree).length && !custom.provinces.length && !custom.cities.length) {
      box.innerHTML = '<p style="color:var(--muted);padding:8px 0">هنوز داده‌ای نیست. از تب‌ها اضافه کنید.</p>';
      return;
    }

    Object.keys(tree).forEach(function (pid) {
      var pLabel = pid === '_x' ? 'سایر' : provinceName(pid);
      var id1 = tid();
      html += nodeOpen(id1, 'استان: ' + pLabel);
      Object.keys(tree[pid]).forEach(function (cid) {
        var cLabel = cid === '_' ? '—' : cityName(pid, cid);
        var id2 = tid();
        html += nodeOpen(id2, 'شهر: ' + cLabel);
        Object.keys(tree[pid][cid]).forEach(function (ck) {
          var catNode = tree[pid][cid][ck];
          var id3 = tid();
          html += nodeOpen(id3, 'دسته: ' + catNode.name);
          Object.keys(catNode.malls).forEach(function (mid) {
            var node = catNode.malls[mid];
            var id4 = tid();
            var delM = '<button type="button" class="btn-edit" data-edit-mall="' + mid + '">ویرایش</button>' +'<button type="button" class="btn-del" data-del-mall="' + mid + '">حذف</button>';
            html += nodeOpen(id4, 'پاساژ: ' + (node.mall.name || mid), delM);
            if (!node.stores.length) {
              html += '<div class="tree-leaf" style="color:var(--muted)">فروشگاهی نیست</div>';
            }
            node.stores.forEach(function (s) {
              html += '<div class="tree-leaf"><span>فروشگاه: ' + s.name + '</span><span style="display:flex;gap:4px">' +
                '<button type="button" class="btn-edit" data-edit-store="' + s.id + '">ویرایش</button>' +
                '<button type="button" class="btn-del" data-del-store="' + s.id + '">حذف</button></span></div>';
            });
            html += nodeClose();
          });
          html += nodeClose();
        });
        html += nodeClose();
      });
      html += nodeClose();
    });

    box.innerHTML = html;
  }

  document.getElementById('tree-root').addEventListener('click', function (e) {
    var b;
    b = e.target.closest('[data-edit-mall]');
    if (b) { openEditMall(b.getAttribute('data-edit-mall')); return; }
    b = e.target.closest('[data-edit-store]');
    if (b) { openEditStore(b.getAttribute('data-edit-store')); return; }
    b = e.target.closest('[data-del-province]');
    if (b) { if (confirm('استان و زیرمجموعه‌های سفارشی حذف شود؟')) deleteProvince(b.getAttribute('data-del-province')); return; }
    b = e.target.closest('[data-del-city]');
    if (b) { if (confirm('شهر و زیرمجموعه‌های سفارشی حذف شود؟')) deleteCity(b.getAttribute('data-del-city')); return; }
    b = e.target.closest('[data-del-mall]');
    if (b) { if (confirm('پاساژ و فروشگاه‌هایش حذف شود؟')) deleteMall(b.getAttribute('data-del-mall')); return; }
    b = e.target.closest('[data-del-store]');
    if (b) { if (confirm('فروشگاه حذف شود؟')) deleteStore(b.getAttribute('data-del-store')); }
  });

  /* ----- خروجی ----- */
  document.getElementById('btn-export').addEventListener('click', function () {
    var data = JSON.parse(JSON.stringify(provincesData));
    var custom = loadCustom();
    var extraAliases = loadExtraAliases();

    custom.provinces.forEach(function (p) {
      if (!data.some(function (x) { return x.id === p.id; })) {
        data.push({ id: p.id, name: p.name, cities: [] });
      }
    });
    custom.cities.forEach(function (c) {
      var prov = data.find(function (p) { return p.id === c.provinceId; });
      if (!prov) return;
      if (!prov.cities) prov.cities = [];
      if (!prov.cities.some(function (x) { return x.id === c.id; })) {
        prov.cities.push({ id: c.id, name: c.name, categories: [] });
      }
    });

    custom.malls.forEach(function (m) {
      var prov = data.find(function (p) { return p.id === m.provinceId; });
      if (!prov) return;
      var city = (prov.cities || []).find(function (c) { return c.id === m.cityId; });
      if (!city) return;
      if (!city.categories) city.categories = [];
      var cat = city.categories.find(function (c) { return c.id === m.categoryId; });
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
      data.forEach(function (p) {
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

    var aliases = typeof searchAliases !== 'undefined' ? JSON.parse(JSON.stringify(searchAliases)) : {};
    Object.keys(extraAliases).forEach(function (k) {
      if (!aliases[k]) aliases[k] = [];
      (extraAliases[k] || []).forEach(function (a) {
        if (aliases[k].indexOf(a) === -1) aliases[k].push(a);
      });
    });
    var std = typeof standardCategories !== 'undefined' ? standardCategories : [];
    var out = '/** data.js — خروجی پنل ادمین */\n';
    out += 'const searchAliases = ' + JSON.stringify(aliases, null, 2) + ';\n\n';
    out += 'const standardCategories = ' + JSON.stringify(std, null, 2) + ';\n\n';
    out += 'const provincesData = ' + JSON.stringify(data, null, 2) + ';\n';
    var blob = new Blob([out], { type: 'application/javascript;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.js';
    a.click();
    URL.revokeObjectURL(a.href);
    showMsg('data.js دانلود شد', true);
  });

  document.getElementById('btn-clear').addEventListener('click', function () {
    if (!confirm('همه داده‌های ادمین در این مرورگر پاک شود؟')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ALIAS_KEY);
    showMsg('پاک شد', true);
    refreshAll();
  });

  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      var panel = document.getElementById('tab-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
      if (btn.dataset.tab === 'tree') renderTree();
    });
  });

  document.getElementById('m-province').addEventListener('change', function () {
    fillCities('m-province', 'm-city');
  });
  document.getElementById('s-province').addEventListener('change', function () {
    fillCities('s-province', 's-city');
    fillMalls();
  });
  document.getElementById('s-city').addEventListener('change', fillMalls);


  /* بنر صفحه اصلی */
  var bannerInput = document.getElementById('banner-url');
  var bannerPrev = document.getElementById('banner-preview');
  if (bannerInput) {
    var saved = localStorage.getItem('passazh_banner_url') || '';
    bannerInput.value = saved;
    if (saved && bannerPrev) {
      bannerPrev.src = saved;
      bannerPrev.style.display = 'block';
    }
  }
  var btnBanner = document.getElementById('btn-save-banner');
  if (btnBanner) btnBanner.addEventListener('click', function () {
    var url = (document.getElementById('banner-url').value || '').trim();
    localStorage.setItem('passazh_banner_url', url);
    if (bannerPrev) {
      if (url) { bannerPrev.src = url; bannerPrev.style.display = 'block'; }
      else { bannerPrev.style.display = 'none'; }
    }
    showMsg(url ? 'بنر ذخیره شد — صفحه اصلی را رفرش کنید' : 'بنر پاک شد', true);
  });

  /* باز/بسته شدن درخت */
  document.getElementById('tree-root').addEventListener('click', function (e) {
    var tog = e.target.closest('.tree-toggle');
    if (tog) {
      var id = tog.getAttribute('data-tree');
      var child = document.getElementById(id);
      if (child) {
        child.classList.toggle('open');
        tog.classList.toggle('open');
      }
      return;
    }
  });


  function openEditMall(id) {
    var m = loadCustom().malls.find(function (x) { return x.id === id; });
    if (!m) { showMsg('فقط موارد اضافه‌شده از ادمین قابل ویرایش‌اند', false); return; }
    document.getElementById('edit-panel').style.display = 'block';
    document.getElementById('edit-title').textContent = 'ویرایش پاساژ: ' + m.name;
    document.getElementById('edit-type').value = 'mall';
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-fields').innerHTML =
      '<div class="form-row"><label>نام</label><input id="e-name" value="' + (m.name || '').replace(/"/g, '&quot;') + '" /></div>' +
      '<div class="form-row"><label>عکس</label><input id="e-image" value="' + (m.image || '').replace(/"/g, '&quot;') + '" /></div>' +
      '<div class="form-row"><label>آدرس</label><input id="e-address" value="' + (m.address || '').replace(/"/g, '&quot;') + '" /></div>' +
      '<div class="form-row"><label>تلفن</label><input id="e-phone" value="' + (m.phone || '').replace(/"/g, '&quot;') + '" /></div>' +
      '<div class="form-row"><label>فکس</label><input id="e-fax" value="' + (m.fax || '').replace(/"/g, '&quot;') + '" /></div>' +
      '<div class="form-row"><label>سایت</label><input id="e-website" value="' + (m.website || '').replace(/"/g, '&quot;') + '" /></div>';
    document.getElementById('edit-panel').scrollIntoView({ behavior: 'smooth' });
  }

  function openEditStore(id) {
    var s = loadCustom().stores.find(function (x) { return x.id === id; });
    if (!s) { showMsg('فقط فروشگاه ادمین قابل ویرایش است', false); return; }
    document.getElementById('edit-panel').style.display = 'block';
    document.getElementById('edit-title').textContent = 'ویرایش فروشگاه: ' + s.name;
    document.getElementById('edit-type').value = 'store';
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-fields').innerHTML =
      '<div class="form-row"><label>نام</label><input id="e-name" value="' + (s.name || '').replace(/"/g, '&quot;') + '" /></div>' +
      '<div class="grid-2"><div class="form-row"><label>طبقه</label><input id="e-floor" value="' + (s.floor || '') + '" /></div>' +
      '<div class="form-row"><label>واحد</label><input id="e-unit" value="' + (s.unit || '') + '" /></div></div>' +
      '<div class="form-row"><label>تلفن</label><input id="e-phone" value="' + (s.phone || '') + '" /></div>' +
      '<div class="form-row"><label>فکس</label><input id="e-fax" value="' + (s.fax || '') + '" /></div>' +
      '<div class="form-row"><label>واتساپ</label><input id="e-whatsapp" value="' + (s.whatsapp || '') + '" /></div>' +
      '<div class="form-row"><label>تلگرام</label><input id="e-telegram" value="' + (s.telegram || '') + '" /></div>' +
      '<div class="form-row"><label>اینستا</label><input id="e-instagram" value="' + (s.instagram || '') + '" /></div>' +
      '<div class="form-row"><label>سایت</label><input id="e-website" value="' + (s.website || '') + '" /></div>' +
      '<div class="form-row"><label>دسته‌ها (ویرگول)</label><input id="e-cats" value="' + (s.shopCategories || []).join('، ') + '" /></div>' +
      '<div class="form-row"><label>برندها (ویرگول)</label><input id="e-brands" value="' + (s.brands || []).join('، ') + '" /></div>';
    document.getElementById('edit-panel').scrollIntoView({ behavior: 'smooth' });
  }

  document.getElementById('btn-save-edit').addEventListener('click', function () {
    var type = document.getElementById('edit-type').value;
    var id = document.getElementById('edit-id').value;
    var custom = loadCustom();
    if (type === 'mall') {
      var m = custom.malls.find(function (x) { return x.id === id; });
      if (!m) return;
      m.name = document.getElementById('e-name').value.trim() || m.name;
      m.image = document.getElementById('e-image').value.trim();
      m.address = document.getElementById('e-address').value.trim();
      m.phone = document.getElementById('e-phone').value.trim();
      m.fax = document.getElementById('e-fax').value.trim();
      m.website = document.getElementById('e-website').value.trim();
    } else if (type === 'store') {
      var s = custom.stores.find(function (x) { return x.id === id; });
      if (!s) return;
      s.name = document.getElementById('e-name').value.trim() || s.name;
      s.floor = document.getElementById('e-floor').value.trim();
      s.unit = document.getElementById('e-unit').value.trim();
      s.phone = document.getElementById('e-phone').value.trim();
      s.fax = document.getElementById('e-fax').value.trim();
      s.whatsapp = document.getElementById('e-whatsapp').value.trim();
      s.telegram = document.getElementById('e-telegram').value.trim();
      s.instagram = document.getElementById('e-instagram').value.trim();
      s.website = document.getElementById('e-website').value.trim();
      s.shopCategories = splitList(document.getElementById('e-cats').value);
      s.brands = splitList(document.getElementById('e-brands').value);
    }
    saveCustom(custom);
    document.getElementById('edit-panel').style.display = 'none';
    showMsg('ذخیره شد', true);
    refreshAll();
  });
  document.getElementById('btn-cancel-edit').addEventListener('click', function () {
    document.getElementById('edit-panel').style.display = 'none';
  });

  fillCategories('m-category');
  refreshAll();
})();
