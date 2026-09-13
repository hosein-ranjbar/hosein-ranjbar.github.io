/**
 * admin.js
 * تب ۱: افزودن پاساژ (دسته استاندارد مشترک — تکراری ساخته نمی‌شود)
 * تب ۲: افزودن فروشگاه
 * تب ۳: نقشه درختی + حذف
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
      if (!d.malls) d.malls = [];
      if (!d.stores) d.stores = [];
      return d;
    } catch (e) {
      return { malls: [], stores: [] };
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

  /** پیدا کردن دسته استاندارد با id یا ساخت از نام سفارشی با id پایدار بر اساس نام */
  function resolveCategory(selectId, customInputId) {
    var customName = document.getElementById(customInputId).value.trim();
    if (customName) {
      // id پایدار از روی نام تا دو بار «طلا» دو دسته نشود
      var stableId = 'cat_' + customName.replace(/\s+/g, '-');
      return { id: stableId, name: customName };
    }
    var sel = document.getElementById(selectId);
    var id = sel.value;
    var name = sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : id;
    // اگر standardCategories هست از همان id استفاده کن
    if (typeof standardCategories !== 'undefined') {
      for (var i = 0; i < standardCategories.length; i++) {
        if (standardCategories[i].id === id) {
          return { id: standardCategories[i].id, name: standardCategories[i].name };
        }
      }
    }
    return { id: id, name: name };
  }

  function fillProvinces(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '';
    provincesData.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      sel.appendChild(o);
    });
  }

  function fillCities(provinceSelectId, citySelectId) {
    var pid = document.getElementById(provinceSelectId).value;
    var sel = document.getElementById(citySelectId);
    sel.innerHTML = '';
    var prov = provincesData.find(function (p) { return p.id === pid; });
    if (!prov) return;
    (prov.cities || []).forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      sel.appendChild(o);
    });
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
    var custom = loadCustom();
    custom.malls.forEach(function (m) {
      if (m.provinceId === provinceId && m.cityId === cityId) {
        list.push({
          id: m.id,
          name: m.name + ' — ' + (m.categoryName || m.categoryId),
          catId: m.categoryId
        });
      }
    });
    // از data.js هم اگر mall داشت
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

  function refreshLists() {
    fillCities('m-province', 'm-city');
    fillCities('s-province', 's-city');
    fillMalls();
    renderTree();
  }

  /* ========== افزودن پاساژ ========== */
  document.getElementById('btn-add-mall').addEventListener('click', function () {
    var name = document.getElementById('m-name').value.trim();
    if (!name) { showMsg('نام پاساژ الزامی است', false); return; }

    var cat = resolveCategory('m-category', 'm-category-custom');
    var provinceId = document.getElementById('m-province').value;
    var cityId = document.getElementById('m-city').value;

    var mall = {
      id: uid('mall'),
      provinceId: provinceId,
      cityId: cityId,
      categoryId: cat.id,      // id ثابت (مثلاً mobile) → همه کنار هم
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
    showMsg('پاساژ «' + name + '» در دسته «' + cat.name + '» اضافه شد', true);
    document.getElementById('m-name').value = '';
    document.getElementById('m-category-custom').value = '';
    refreshLists();
  });

  /* ========== افزودن فروشگاه ========== */
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
    refreshLists();
  });

  /* ========== حذف ========== */
  function deleteMall(mallId) {
    var custom = loadCustom();
    custom.malls = custom.malls.filter(function (m) { return m.id !== mallId; });
    custom.stores = custom.stores.filter(function (s) { return s.mallId !== mallId; });
    saveCustom(custom);
    showMsg('پاساژ و فروشگاه‌هایش حذف شد', true);
    refreshLists();
  }

  function deleteStore(storeId) {
    var custom = loadCustom();
    custom.stores = custom.stores.filter(function (s) { return s.id !== storeId; });
    saveCustom(custom);
    showMsg('فروشگاه حذف شد', true);
    refreshLists();
  }

  /* ========== نقشه درختی ========== */
  function provinceName(id) {
    var p = provincesData.find(function (x) { return x.id === id; });
    return p ? p.name : id;
  }
  function cityName(pid, cid) {
    var p = provincesData.find(function (x) { return x.id === pid; });
    if (!p) return cid;
    var c = (p.cities || []).find(function (x) { return x.id === cid; });
    return c ? c.name : cid;
  }

  function renderTree() {
    var box = document.getElementById('tree-root');
    if (!box) return;
    var custom = loadCustom();
    if (!custom.malls.length && !custom.stores.length) {
      box.innerHTML = '<p style="color:var(--muted);padding:8px 0">هنوز داده‌ای اضافه نشده. از تب پاساژ و فروشگاه اضافه کنید.</p>';
      return;
    }

    // گروه: استان → شهر → دسته → پاساژ → فروشگاه
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
      // پیدا کردن پاساژ
      var found = false;
      Object.keys(tree).forEach(function (pid) {
        Object.keys(tree[pid]).forEach(function (cid) {
          Object.keys(tree[pid][cid]).forEach(function (catKey) {
            if (tree[pid][cid][catKey].malls[s.mallId]) {
              tree[pid][cid][catKey].malls[s.mallId].stores.push(s);
              found = true;
            }
          });
        });
      });
      if (!found) {
        // فروشگاه بدون پاساژ در درخت — نشان بده
        if (!tree['_orphan']) tree['_orphan'] = {};
        if (!tree['_orphan']['_']) tree['_orphan']['_'] = {};
        if (!tree['_orphan']['_']['orphan']) {
          tree['_orphan']['_']['orphan'] = { name: 'بدون پاساژ', malls: {} };
        }
        if (!tree['_orphan']['_']['orphan'].malls[s.mallId]) {
          tree['_orphan']['_']['orphan'].malls[s.mallId] = {
            mall: { id: s.mallId, name: '(پاساژ حذف‌شده)' },
            stores: []
          };
        }
        tree['_orphan']['_']['orphan'].malls[s.mallId].stores.push(s);
      }
    });

    var html = '';
    Object.keys(tree).forEach(function (pid) {
      var pLabel = pid === '_orphan' ? 'سایر' : provinceName(pid);
      html += '<div class="tree-prov"><div class="tree-line tree-p">' + pLabel + '</div>';
      Object.keys(tree[pid]).forEach(function (cid) {
        var cLabel = pid === '_orphan' ? '' : cityName(pid, cid);
        if (cLabel) html += '<div class="tree-line tree-c">← ' + cLabel + '</div>';
        Object.keys(tree[pid][cid]).forEach(function (catKey) {
          var catNode = tree[pid][cid][catKey];
          html += '<div class="tree-line tree-cat">← دسته: ' + catNode.name + '</div>';
          Object.keys(catNode.malls).forEach(function (mid) {
            var node = catNode.malls[mid];
            html += '<div class="tree-line tree-mall">' +
              '<span>← پاساژ: ' + (node.mall.name || mid) + '</span>' +
              '<button type="button" class="btn-del" data-del-mall="' + mid + '">حذف</button>' +
              '</div>';
            node.stores.forEach(function (s) {
              html += '<div class="tree-line tree-store">' +
                '<span>← فروشگاه: ' + s.name + '</span>' +
                '<button type="button" class="btn-del" data-del-store="' + s.id + '">حذف</button>' +
                '</div>';
            });
          });
        });
      });
      html += '</div>';
    });
    box.innerHTML = html;
  }

  document.getElementById('tree-root').addEventListener('click', function (e) {
    var mallBtn = e.target.closest('[data-del-mall]');
    if (mallBtn) {
      if (confirm('این پاساژ و همه فروشگاه‌هایش حذف شود؟')) {
        deleteMall(mallBtn.getAttribute('data-del-mall'));
      }
      return;
    }
    var storeBtn = e.target.closest('[data-del-store]');
    if (storeBtn) {
      if (confirm('این فروشگاه حذف شود؟')) {
        deleteStore(storeBtn.getAttribute('data-del-store'));
      }
    }
  });

  /* ========== خروجی data.js ========== */
  document.getElementById('btn-export').addEventListener('click', function () {
    var data = JSON.parse(JSON.stringify(provincesData));
    var custom = loadCustom();
    var extraAliases = loadExtraAliases();

    // پاساژها را با categoryId ثابت در همان دسته جمع کن
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
          id: m.id,
          name: m.name,
          image: m.image || '',
          address: m.address || '',
          phone: m.phone || '',
          fax: m.fax || '',
          website: m.website || '',
          stores: []
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
                    id: s.id,
                    name: s.name,
                    floor: s.floor,
                    unit: s.unit,
                    phone: s.phone,
                    fax: s.fax,
                    whatsapp: s.whatsapp,
                    telegram: s.telegram,
                    instagram: s.instagram,
                    website: s.website,
                    shopCategories: s.shopCategories || [],
                    brands: s.brands || []
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
    if (!confirm('همه داده‌های اضافه‌شده در این مرورگر پاک شود؟')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ALIAS_KEY);
    showMsg('پاک شد', true);
    refreshLists();
  });

  /* تب‌ها */
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

  fillProvinces('m-province');
  fillProvinces('s-province');
  fillCategories('m-category');
  refreshLists();
})();
