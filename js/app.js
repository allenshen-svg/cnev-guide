/* app.js — initialisation */
(async function boot() {
  await loadData();

  // Routes
  Router.on('/', renderHome);
  Router.on('/brands', renderBrands);
  Router.on('/brand/:id', renderBrandDetail);
  Router.on('/car/:id', renderCarDetail);
  Router.on('/cars', renderAllCars);
  Router.on('/compare', renderCompare);
  Router.on('/events', renderEvents);
  Router.on('/news', renderNews);
  Router.on('/test-drive', renderTestDrive);
  Router.on('/messages', renderMessages);
  Router.start();

  // Search
  const si = $('searchInput');
  const sd = $('searchDropdown');
  if (si && sd) {
    si.addEventListener('input', () => {
      const q = si.value.trim();
      if (!q) { sd.classList.add('hidden'); return; }
      const hits = searchCars(q);
      if (!hits.length) { sd.innerHTML = '<div class="sd-empty">No results</div>'; sd.classList.remove('hidden'); return; }
      sd.innerHTML = hits.map(c => `<a class="sd-item" href="#/car/${c.id}">${c.brandName} ${c.name}<span class="sd-price">${priceText(c.priceRange)}</span></a>`).join('');
      sd.classList.remove('hidden');
    });
    document.addEventListener('click', e => { if (!si.contains(e.target) && !sd.contains(e.target)) sd.classList.add('hidden'); });
  }

  // Mobile menu
  const mb = $('menuBtn');
  const nav = $('navLinks');
  if (mb && nav) mb.addEventListener('click', () => nav.classList.toggle('open'));
  window.addEventListener('hashchange', () => { if (nav) nav.classList.remove('open'); window.scrollTo(0, 0); });

  // Compare UI init
  updateCompareUI();
})();
