/* pages.js — page renderers */
const $ = id => document.getElementById(id);
const app = () => $('app');
const NO_IMG = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22><rect fill=%22%23f1f5f9%22 width=%22400%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%2394a3b8%22 font-size=%2216%22>No image</text></svg>";

function brandDisplay(c) { return c.brandNameEn || c.brandName; }
function brandLogo(b, size) {
  const s = size || 44;
  if (b.logoURL) return `<img src="${b.logoURL}" alt="${b.nameEn||b.name}" style="width:${s-8}px;height:${s-8}px;object-fit:contain" onerror="this.replaceWith(document.createTextNode('${b.name[0]}'))">`;
  return b.name[0];
}

function carCard(c) {
  const disc = c.isDiscontinued ? '<span class="tag tag-discontinued">Discontinued</span>' : '';
  const upcoming = c.isUpcoming ? '<span class="tag tag-orange">Coming Soon</span>' : '';
  return `<div class="card" onclick="location.hash='#/car/${c.id}'">
    <img class="card-img" src="${c.imageURLs[0]||''}" alt="${c.name}" loading="lazy" onerror="this.src='${NO_IMG}'">
    <div class="card-body">
      <div class="card-brand">${brandDisplay(c)} ${upcoming}${disc}</div>
      <div class="card-name">${c.name}</div>
      <div class="card-price">${priceText(c.priceRange)}</div>
      <div class="card-tags">
        <span class="tag tag-gray">${c.categoryEn}</span>
        ${c.spec.range?'<span class="tag">'+c.spec.range+'km / '+kmToMi(c.spec.range)+'mi</span>':''}
        <button class="add-compare-btn" onclick="event.stopPropagation();toggleCompare('${c.id}')" id="cmp-${c.id}">${Compare.has(c.id)?'✓ Added':'+ Compare'}</button>
      </div>
    </div>
  </div>`;
}

/* ══ Home ══ */
function renderHome() {
  const hot = DB.cars.filter(c=>!c.isDiscontinued&&!c.isUpcoming).slice(0,8);
  const upcoming = DB.cars.filter(c=>c.isUpcoming).slice(0,4);
  app().innerHTML = `
    <div class="hero">
      <h1>⚡ Discover China's Electric Vehicles</h1>
      <p>${DB.brands.length} brands, ${DB.cars.length} models — the most comprehensive Chinese EV database</p>
      <div class="hero-stats">
        <div class="hero-stat"><div class="num">${DB.brands.length}</div><div class="label">Brands</div></div>
        <div class="hero-stat"><div class="num">${DB.cars.length}</div><div class="label">Models</div></div>
        <div class="hero-stat"><div class="num">${DB.events.length}</div><div class="label">Events</div></div>
      </div>
    </div>
    ${renderCarousel(DB.newReleases)}

    <!-- Test Drive CTA -->
    <div class="cta-banner">
      <div class="cta-text">
        <h2>🇨🇳 Test Drive in China</h2>
        <p>Experience the world's most advanced EVs firsthand. Register for an exclusive trip to test drive BYD, NIO, Xiaomi, and more.</p>
      </div>
      <a href="#/test-drive" class="cta-btn">Register Now →</a>
    </div>

    <div class="section-title">🏷️ Brands <a href="#/brands" class="more">View all →</a></div>
    <div class="brand-grid" style="margin-bottom:32px">
      ${DB.brands.map(b=>{
        const cnt = getCarsByBrand(b.id).length;
        return `<div class="brand-card" onclick="location.hash='#/brand/${b.id}'">
          <div class="brand-logo">${brandLogo(b)}</div>
          <div class="brand-info"><div class="b-name">${b.nameEn || b.name}</div><div class="b-count">${cnt} models</div></div>
        </div>`;
      }).join('')}
    </div>
    <div class="section-title">🔥 Popular Models</div>
    <div class="card-grid" style="margin-bottom:32px">${hot.map(carCard).join('')}</div>
    ${upcoming.length?`<div class="section-title">🚀 Coming Soon</div><div class="card-grid" style="margin-bottom:32px">${upcoming.map(carCard).join('')}</div>`:''}
    ${DB.news.length?`<div class="section-title">📰 Latest News <a href="#/news" class="more">More →</a></div><div class="news-grid">${DB.news.slice(0,3).map(newsCard).join('')}</div>`:''}

    <!-- SEO Content -->
    <div class="seo-footer">
      <h2>Your Complete Guide to Chinese Electric Vehicles</h2>
      <p>CNEV Guide is the most comprehensive English-language resource for Chinese electric vehicles (EVs). We cover ${DB.brands.length} leading brands including <strong>BYD</strong>, <strong>NIO</strong>, <strong>XPeng (Xpeng Motors)</strong>, <strong>Li Auto</strong>, <strong>Zeekr</strong>, <strong>AITO (Huawei)</strong>, <strong>Xiaomi EV</strong>, <strong>Deepal</strong>, <strong>Leapmotor</strong>, and more — with detailed specs, pricing, range, and performance data for ${DB.cars.length}+ models.</p>
      <h3>Why Chinese EVs?</h3>
      <p>China is the world's largest electric vehicle market, producing some of the most advanced and affordable EVs available today. From the <strong>BYD Seal</strong>, often compared to the Tesla Model 3, to the luxury <strong>NIO ET7</strong> with its innovative battery swap technology, to the tech-focused <strong>Xiaomi SU7</strong> — Chinese automakers are redefining what's possible in electric mobility. Many models offer 500–700 km range, advanced autonomous driving, and cutting-edge infotainment at competitive prices.</p>
      <h3>Compare & Discover</h3>
      <p>Use our <a href="#/compare">comparison tool</a> to compare up to 4 Chinese EVs side by side — including range (km & miles), power (kW & hp), battery capacity, acceleration, dimensions, and pricing in both CNY and USD. Browse all models by <a href="#/brands">brand</a>, filter by price range, body type, and drive type on our <a href="#/cars">all cars</a> page.</p>
      <h3>Test Drive in China</h3>
      <p>Planning a trip to China? <a href="#/test-drive">Register for a test drive experience</a> and drive the latest Chinese EVs firsthand at official brand showrooms and experience centers. We help international visitors coordinate test drives with BYD, NIO, XPeng, Zeekr, and other top Chinese EV brands.</p>
      <p class="seo-keywords">Chinese electric vehicles · China EV guide · BYD cars · NIO electric car · XPeng motors · Li Auto · Zeekr · Xiaomi SU7 · Xiaomi YU7 · Chinese EV comparison · test drive China · buy Chinese EV · EV range comparison · best Chinese electric cars ${new Date().getFullYear()} · affordable electric vehicles · Chinese car brands · electric SUV China · electric sedan China · CATL battery · BYD Blade battery</p>
    </div>
  `;
  updateCompareUI();
  requestAnimationFrame(initCarousel);
}

/* ── Carousel helper ── */
function renderCarousel(items) {
  if (!items || !items.length) return '';
  return `
    <div class="section-title">🚗 New Releases</div>
    <div class="carousel">
      <button class="carousel-nav prev" onclick="scrollCarousel(-1)">‹</button>
      <div class="carousel-track" id="carouselTrack">
        ${items.map((n, i) => `
          <div class="carousel-slide" onclick="${n.carId ? "location.hash='#/car/"+n.carId+"'" : ''}">
            <img src="${n.coverImageURL||''}" alt="${n.carName}" onerror="this.style.background='var(--sf2)'">
            <div class="slide-info">
              <h3>${n.carName}</h3>
              <div class="slide-meta">
                <span class="slide-tag">${n.brandName}</span>
                <span>📅 ${n.expectedDate||''}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="carousel-nav next" onclick="scrollCarousel(1)">›</button>
    </div>
    <div class="carousel-dots" id="carouselDots"></div>
  `;
}

let _carouselTimer = null;
function initCarousel() {
  const track = $('carouselTrack');
  const dotsEl = $('carouselDots');
  if (!track || !dotsEl) return;
  const slides = track.querySelectorAll('.carousel-slide');
  if (!slides.length) return;
  // Build dots
  dotsEl.innerHTML = Array.from(slides).map((_, i) => `<button class="carousel-dot${i===0?' active':''}" onclick="scrollToSlide(${i})"></button>`).join('');
  // Update dots on scroll
  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / (slides[0].offsetWidth + 16));
    dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
  });
  // Auto-scroll
  clearInterval(_carouselTimer);
  _carouselTimer = setInterval(() => scrollCarousel(1), 4000);
  track.addEventListener('pointerenter', () => clearInterval(_carouselTimer));
  track.addEventListener('pointerleave', () => { _carouselTimer = setInterval(() => scrollCarousel(1), 4000); });
}

function scrollCarousel(dir) {
  const track = $('carouselTrack');
  if (!track) return;
  const slide = track.querySelector('.carousel-slide');
  if (!slide) return;
  const w = slide.offsetWidth + 16;
  const maxScroll = track.scrollWidth - track.clientWidth;
  let target = track.scrollLeft + dir * w;
  if (target > maxScroll) target = 0;
  if (target < 0) target = maxScroll;
  track.scrollTo({ left: target, behavior: 'smooth' });
}

function scrollToSlide(i) {
  const track = $('carouselTrack');
  if (!track) return;
  const slide = track.querySelector('.carousel-slide');
  if (!slide) return;
  track.scrollTo({ left: i * (slide.offsetWidth + 16), behavior: 'smooth' });
}

/* ══ Brands ══ */
function renderBrands() {
  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <span>All Brands</span></div>
    <h2 style="margin-bottom:20px">All Brands (${DB.brands.length})</h2>
    <div class="brand-grid">
      ${DB.brands.map(b=>{
        const cnt = getCarsByBrand(b.id).length;
        return `<div class="brand-card" onclick="location.hash='#/brand/${b.id}'">
          <div class="brand-logo">${brandLogo(b)}</div>
          <div class="brand-info"><div class="b-name">${b.nameEn || b.name}</div><div class="b-count">${cnt} models · ${hqEn(b.headquarters)||''}</div></div>
        </div>`;
      }).join('')}
    </div>
  `;
}

/* ══ Brand detail ══ */
function renderBrandDetail(brandId) {
  const brand = getBrand(brandId);
  if (!brand) { app().innerHTML = '<p>Brand not found</p>'; return; }
  const cars = getCarsByBrand(brandId);
  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <a href="#/brands">Brands</a> / <span>${brand.nameEn || brand.name}</span></div>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div class="brand-logo" style="width:56px;height:56px;font-size:28px">${brandLogo(brand, 56)}</div>
      <div>
        <h2>${brand.nameEn || brand.name} <span style="font-weight:400;font-size:16px;color:var(--tx2)">${brand.name}</span></h2>
        <p style="color:var(--tx2);font-size:13px">${hqEn(brand.headquarters)||''}, China · Founded ${brand.founded||''} · ${cars.length} models</p>
      </div>
    </div>
    <div class="card-grid">${cars.map(carCard).join('')}</div>
  `;
  updateCompareUI();
}

/* ══ Car detail ══ */
function renderCarDetail(carId) {
  const c = getCar(carId);
  if (!c) { app().innerHTML = '<p>Model not found</p>'; return; }
  const s = c.spec;
  const specs = [
    ['Battery', s.batteryCapacity ? s.batteryCapacity+'kWh' : '-'],
    ['Range (CLTC)', s.range ? s.range+'km / '+kmToMi(s.range)+'mi' : '-'],
    ['Fast Charge', s.fastChargePower ? s.fastChargePower+'kW' : '-'],
    ['Charge Time', s.chargingTime || '-'],
    ['Motor Type', s.motorType || '-'],
    ['Total Power', s.totalPower ? s.totalPower+'kW ('+Math.round(s.totalPower*1.341)+'hp)' : '-'],
    ['Total Torque', s.totalTorque ? s.totalTorque+'N·m' : '-'],
    ['0-100km/h', s.acceleration ? s.acceleration+'s' : '-'],
    ['Top Speed', s.topSpeed ? s.topSpeed+'km/h ('+Math.round(s.topSpeed*0.621)+'mph)' : '-'],
    ['Drivetrain', s.driveType || '-'],
    ['Dimensions', s.length ? `${s.length}×${s.width}×${s.height}mm` : '-'],
    ['Wheelbase', s.wheelbase ? s.wheelbase+'mm' : '-'],
    ['Curb Weight', s.weight ? s.weight+'kg ('+Math.round(s.weight*2.205)+'lbs)' : '-'],
    ['Smart Driving', s.autopilot || '-'],
    ['Chip', s.chipsInfo || '-'],
    ['Display', s.screenSize || '-'],
    ['OS', s.os || '-'],
  ];
  const disc = c.isDiscontinued ? '<span class="tag tag-discontinued" style="font-size:14px;padding:4px 12px">Discontinued</span>' : '';
  const variantHtml = c.variants && c.variants.length > 1 ? `
    <div class="section-title" style="margin-top:24px">📋 Trim Levels</div>
    <div style="overflow-x:auto"><table class="compare-table"><tr><th>Trim</th><th>Price</th><th>Battery</th><th>Range</th><th>Power</th><th>0-100</th></tr>
    ${c.variants.map(v=>`<tr><td><b>${v.name}</b></td><td style="color:var(--pri);font-weight:600">¥${v.price}W (~$${(v.price*10000*CNY_TO_USD/1000).toFixed(1)}k)</td>
      <td>${v.spec?.batteryCapacity||s.batteryCapacity||'-'}kWh</td>
      <td>${v.spec?.range||s.range||'-'}km</td>
      <td>${v.spec?.totalPower||s.totalPower||'-'}kW</td>
      <td>${v.spec?.acceleration||s.acceleration||'-'}s</td></tr>`).join('')}
    </table></div>` : '';

  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <a href="#/brand/${c.brandId}">${brandDisplay(c)}</a> / <span>${c.name}</span></div>
    <div class="detail-hero">
      <img src="${c.imageURLs[0]||''}" alt="${c.name}" onerror="this.style.background='var(--sf2)'">
      <div class="detail-hero-overlay">
        <div style="display:flex;align-items:center;gap:10px"><h1>${c.name}</h1>${disc}</div>
        <div class="price">${priceText(c.priceRange)}</div>
      </div>
    </div>
    ${c.imageURLs.length>1?`<div class="gallery">${c.imageURLs.map(u=>'<img src="'+u+'" loading="lazy" onerror="this.remove()">').join('')}</div>`:''}
    <div class="card-tags" style="margin:16px 0">
      <span class="tag tag-gray">${c.categoryEn}</span>
      <span class="tag tag-gray">${c.year} Model</span>
      ${s.range?'<span class="tag">Range: '+s.range+'km / '+kmToMi(s.range)+'mi</span>':''}
      <button class="add-compare-btn" style="font-size:12px;padding:4px 12px" onclick="toggleCompare('${c.id}')" id="cmp-${c.id}">${Compare.has(c.id)?'✓ Added to Compare':'+ Add to Compare'}</button>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <a href="#/test-drive" class="cta-btn" style="font-size:13px;padding:8px 16px">🚗 Book Test Drive</a>
    </div>
    <div class="section-title">📊 Key Specifications</div>
    <div class="spec-grid">${specs.map(([l,v])=>`<div class="spec-item"><span class="spec-label">${l}</span><span class="spec-val">${v}</span></div>`).join('')}</div>
    ${variantHtml}
  `;
  updateCompareUI();
}

/* ══ All cars with filters ══ */
function renderAllCars() {
  const cats = [...new Set(DB.cars.map(c=>c.category))];
  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <span>All Models</span></div>
    <h2 style="margin-bottom:16px">All Models</h2>
    <div class="filter-bar" id="filterBar">
      <span class="filter-label">Brand</span>
      <select id="fBrand"><option value="">All</option>${DB.brands.map(b=>'<option value="'+b.id+'">'+(b.nameEn||b.name)+'</option>').join('')}</select>
      <span class="filter-label">Type</span>
      <select id="fCat"><option value="">All</option>${cats.map(c=>'<option value="'+c+'">'+catEn(c)+'</option>').join('')}</select>
      <span class="filter-label">Price (¥W)</span>
      <input type="number" id="fMinP" placeholder="Min" style="width:70px">
      <span>-</span>
      <input type="number" id="fMaxP" placeholder="Max" style="width:70px">
      <span class="filter-label">Range ≥</span>
      <input type="number" id="fRange" placeholder="km" style="width:70px">
      <span class="filter-label">Sort</span>
      <select id="fSort"><option value="">Default</option><option value="price-asc">Price ↑</option><option value="price-desc">Price ↓</option><option value="range">Range ↓</option></select>
      <label style="font-size:12px;display:flex;align-items:center;gap:4px"><input type="checkbox" id="fHideDisc"> Hide discontinued</label>
      <button class="btn-filter" onclick="applyFilter()">Filter</button>
      <button class="btn-reset" onclick="resetFilter()">Reset</button>
    </div>
    <div id="carResults" class="card-grid"></div>
  `;
  applyFilter();
}

function applyFilter() {
  const opts = {
    brand: $('fBrand')?.value || '',
    category: $('fCat')?.value || '',
    minPrice: parseFloat($('fMinP')?.value) || 0,
    maxPrice: parseFloat($('fMaxP')?.value) || 0,
    minRange: parseInt($('fRange')?.value) || 0,
    sort: $('fSort')?.value || '',
    hideDiscontinued: $('fHideDisc')?.checked || false,
  };
  const list = filterCars(opts);
  const el = $('carResults');
  if (el) {
    el.innerHTML = list.length ? list.map(carCard).join('') : '<p style="color:var(--tx3);padding:40px;text-align:center">No models match your filters</p>';
    updateCompareUI();
  }
}

function resetFilter() {
  ['fBrand','fCat','fSort'].forEach(id => { if ($(id)) $(id).value = ''; });
  ['fMinP','fMaxP','fRange'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('fHideDisc')) $('fHideDisc').checked = false;
  applyFilter();
}

/* ══ Events ══ */
function renderEvents() {
  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <span>Events</span></div>
    <h2 style="margin-bottom:20px">EV Events in China (${DB.events.length})</h2>
    ${DB.events.map(e => `
      <div class="event-card">
        ${e.coverImageURL?'<img src="'+e.coverImageURL+'" loading="lazy" onerror="this.remove()">':''}
        <div class="event-info">
          <h3>${e.title}</h3>
          <p>${e.description||e.subtitle||''}</p>
          <div class="event-meta">
            <span>📅 ${e.date}${e.endDate?' – '+e.endDate:''}</span>
            <span>📍 ${e.location||''}</span>
            <span class="tag ${e.isUpcoming?'tag-orange':'tag-gray'}">${e.isUpcoming?'Upcoming':'Ended'}</span>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

/* ══ News ══ */
function newsCard(n) {
  return `<div class="news-card" ${n.url?'onclick="window.open(\''+n.url+'\',\'_blank\')"':''} style="cursor:pointer">
    ${n.imageURL?'<img src="'+n.imageURL+'" loading="lazy" onerror="this.remove()">':''}
    <div class="news-card-body">
      <h3>${n.title}</h3>
      <p>${n.summary||''}</p>
      <div class="news-meta"><span>${n.source||''}</span><span>${n.date||''}</span></div>
    </div>
  </div>`;
}

function renderNews() {
  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <span>News</span></div>
    <h2 style="margin-bottom:20px">EV Industry News (${DB.news.length})</h2>
    <div class="news-grid">${DB.news.map(newsCard).join('')}</div>
  `;
}

/* ══ Test Drive Registration ══ */
function renderTestDrive() {
  const brandOpts = DB.brands.map(b => '<option value="'+b.id+'">'+(b.nameEn||b.name)+'</option>').join('');
  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <span>Test Drive in China</span></div>
    <div class="td-hero">
      <h1>🇨🇳 Test Drive in China</h1>
      <p>Experience the world's most innovative electric vehicles firsthand. Register your interest and we'll arrange an exclusive test drive trip to China.</p>
    </div>

    <div class="td-features">
      <div class="td-feature">
        <div class="td-icon">🚗</div>
        <h3>Drive Multiple EVs</h3>
        <p>Test drive models from BYD, NIO, Xiaomi, XPeng, and more — all in one trip.</p>
      </div>
      <div class="td-feature">
        <div class="td-icon">🏭</div>
        <h3>Factory Tours</h3>
        <p>Visit world-class EV manufacturing facilities and see cutting-edge production lines.</p>
      </div>
      <div class="td-feature">
        <div class="td-icon">🌏</div>
        <h3>Cultural Experience</h3>
        <p>Combine your test drive with city tours, local cuisine, and cultural highlights.</p>
      </div>
      <div class="td-feature">
        <div class="td-icon">🤝</div>
        <h3>Expert Guidance</h3>
        <p>English-speaking guides and EV experts accompany you throughout the trip.</p>
      </div>
    </div>

    <div class="td-form-wrap">
      <h2>Register Your Interest</h2>
      <p style="color:var(--tx2);margin-bottom:20px">Fill out the form below and we'll contact you with trip details and scheduling options.</p>
      <form id="tdForm" class="td-form" onsubmit="return submitTestDrive(event)">
        <div class="form-row">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="tdName" required placeholder="Your full name">
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="tdEmail" required placeholder="your@email.com">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Country / Region *</label>
            <select id="tdCountry" required>
              <option value="">Select your country</option>
              <option>United States</option><option>United Kingdom</option><option>Germany</option>
              <option>France</option><option>Australia</option><option>Japan</option><option>South Korea</option>
              <option>Singapore</option><option>Malaysia</option><option>Thailand</option><option>UAE</option>
              <option>Canada</option><option>Brazil</option><option>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Phone (with country code)</label>
            <input type="tel" id="tdPhone" placeholder="+1 234 567 8900">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Brands Interested In</label>
            <select id="tdBrands" multiple style="height:100px">
              ${brandOpts}
            </select>
            <span class="form-hint">Hold Ctrl/Cmd to select multiple</span>
          </div>
          <div class="form-group">
            <label>Preferred Travel Period</label>
            <select id="tdPeriod">
              <option value="">Flexible</option>
              <option>2026 Q2 (Apr–Jun)</option>
              <option>2026 Q3 (Jul–Sep)</option>
              <option>2026 Q4 (Oct–Dec)</option>
              <option>2027 Q1 (Jan–Mar)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Trip Duration</label>
          <select id="tdDuration">
            <option>3–5 days</option>
            <option>1 week</option>
            <option>2 weeks</option>
          </select>
        </div>
        <div class="form-group">
          <label>Additional Notes</label>
          <textarea id="tdNotes" rows="3" placeholder="Tell us about your EV preferences, specific models you'd like to test, or any questions…"></textarea>
        </div>
        <button type="submit" class="td-submit">Submit Registration →</button>
      </form>
    </div>
  `;
}

async function submitTestDrive(e) {
  e.preventDefault();
  const data = {
    name: $('tdName').value,
    email: $('tdEmail').value,
    country: $('tdCountry').value,
    phone: $('tdPhone').value,
    brands: Array.from($('tdBrands').selectedOptions).map(o => o.value),
    period: $('tdPeriod').value,
    duration: $('tdDuration').value,
    notes: $('tdNotes').value,
  };
  const btn = $('tdForm').querySelector('.td-submit');
  btn.textContent = 'Submitting…';
  btn.disabled = true;
  try {
    const r = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const res = await r.json();
    if (!res.ok) throw new Error(res.error || 'Submission failed');
    $('tdForm').innerHTML = `
      <div style="text-align:center;padding:40px">
        <div style="font-size:48px;margin-bottom:16px">✅</div>
        <h2>Thank You, ${data.name}!</h2>
        <p style="color:var(--tx2);margin-top:8px">Your test drive interest has been registered. We'll contact you at <b>${data.email}</b> with trip details and scheduling options.</p>
        <p style="color:var(--tx2);margin-top:12px">You can check your messages anytime:</p>
        <a href="#/messages" class="cta-btn" style="display:inline-block;margin-top:12px">📬 My Messages</a>
        <br>
        <a href="#/" class="cta-btn" style="display:inline-block;margin-top:12px;background:var(--sf2);color:var(--tx)">← Back to Home</a>
      </div>
    `;
  } catch (err) {
    btn.textContent = 'Submit Registration →';
    btn.disabled = false;
    alert(err.message || 'Network error, please try again');
  }
  return false;
}

/* ── User Messages Page ── */
function renderMessages() {
  const saved = localStorage.getItem('cnev_msg_email') || '';
  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <span>My Messages</span></div>
    <div class="td-form-wrap" style="max-width:700px">
      <h2>📬 My Messages</h2>
      <p style="color:var(--tx2);margin-bottom:20px">Enter your registered email to view messages from the CNEV Guide team.</p>
      <div id="msgLogin" style="${saved ? 'display:none' : ''}">
        <div class="form-group">
          <label>Your registered email</label>
          <input type="email" id="msgEmail" placeholder="your@email.com" value="${saved}">
        </div>
        <button class="td-submit" onclick="loadUserMessages()">View Messages →</button>
      </div>
      <div id="msgContent" style="${saved ? '' : 'display:none'}">
        <div id="msgEmailDisplay" style="font-size:13px;color:var(--tx2);margin-bottom:16px">${saved ? 'Logged in as <b>' + saved + '</b> · <a href="javascript:void(0)" onclick="msgLogout()" style="color:var(--pri)">Switch account</a>' : ''}</div>
        <div id="userMsgList"></div>
      </div>
    </div>
  `;
  if (saved) loadUserMessages();
}

async function loadUserMessages() {
  const emailEl = $('msgEmail');
  const email = (emailEl ? emailEl.value : localStorage.getItem('cnev_msg_email') || '').trim().toLowerCase();
  if (!email || !email.includes('@')) { alert('Please enter a valid email'); return; }

  // Generate token (HMAC on client would need the secret — instead we ask server)
  // Token is derived from email on server side; we pass email and get token via a lightweight endpoint
  // For simplicity, we use a token-fetch approach
  localStorage.setItem('cnev_msg_email', email);
  const tokenR = await fetch('/api/message-token?email=' + encodeURIComponent(email));
  const tokenD = await tokenR.json();
  if (!tokenD.ok) {
    $('userMsgList').innerHTML = '<div style="text-align:center;padding:30px;color:var(--tx2)">No registrations found for this email.</div>';
    $('msgLogin').style.display = 'none';
    $('msgContent').style.display = '';
    $('msgEmailDisplay').innerHTML = 'Email: <b>' + email + '</b> · <a href="javascript:void(0)" onclick="msgLogout()" style="color:var(--pri)">Switch</a>';
    return;
  }
  const token = tokenD.token;
  const regIds = tokenD.registrations;
  localStorage.setItem('cnev_msg_token', token);

  // Fetch messages
  const r = await fetch('/api/messages?email=' + encodeURIComponent(email) + '&token=' + token);
  const d = await r.json();

  $('msgLogin').style.display = 'none';
  $('msgContent').style.display = '';
  $('msgEmailDisplay').innerHTML = 'Logged in as <b>' + email + '</b> · <a href="javascript:void(0)" onclick="msgLogout()" style="color:var(--pri)">Switch account</a>';

  if (!d.ok || !d.data.length) {
    $('userMsgList').innerHTML = `
      <div style="text-align:center;padding:30px;color:var(--tx2)">
        <div style="font-size:36px;margin-bottom:12px">📭</div>
        <p>No messages yet. Our team will reach out to you soon!</p>
      </div>
    `;
    // Still show reply box for each registration
    if (regIds && regIds.length) {
      $('userMsgList').innerHTML += regIds.map(r => `
        <div class="user-reply-box" style="margin-top:16px;padding:16px;background:var(--sf2);border-radius:var(--r)">
          <div style="font-size:13px;color:var(--tx2);margin-bottom:8px">Send a message (Registration #${r.id})</div>
          <div style="display:flex;gap:8px">
            <input type="text" id="reply_${r.id}" placeholder="Type a message…" style="flex:1;padding:8px 12px;border:1px solid var(--bd);border-radius:8px;font-size:14px" onkeydown="if(event.key==='Enter')sendUserReply(${r.id},'${email}','${token}')">
            <button class="td-submit" style="padding:8px 16px;margin:0" onclick="sendUserReply(${r.id},'${email}','${token}')">Send</button>
          </div>
        </div>
      `).join('');
    }
    return;
  }

  // Group messages by registration
  const grouped = {};
  d.data.forEach(m => {
    if (!grouped[m.registration_id]) grouped[m.registration_id] = [];
    grouped[m.registration_id].push(m);
  });

  let html = '';
  for (const regId of Object.keys(grouped)) {
    const msgs = grouped[regId];
    html += `<div style="margin-bottom:24px;border:1px solid var(--bd);border-radius:var(--r);overflow:hidden">
      <div style="background:var(--sf2);padding:10px 14px;font-size:13px;font-weight:600;color:var(--tx2)">Registration #${regId}</div>
      <div style="padding:14px;display:flex;flex-direction:column;gap:10px">
        ${msgs.map(m => `
          <div style="max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;
            ${m.sender === 'admin' ? 'align-self:flex-start;background:#10b981;color:#fff;border-bottom-left-radius:4px' : 'align-self:flex-end;background:var(--sf2);color:var(--tx);border-bottom-right-radius:4px'}">
            <div>${escHtml(m.content)}</div>
            <div style="font-size:11px;${m.sender === 'admin' ? 'color:rgba(255,255,255,.7)' : 'color:var(--tx3)'};margin-top:4px">
              ${m.sender === 'admin' ? '👤 CNEV Team' : '🙋 You'} · ${new Date(m.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric'})} ${new Date(m.created_at).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}
            </div>
          </div>
        `).join('')}
      </div>
      <div style="padding:10px 14px;border-top:1px solid var(--bd);display:flex;gap:8px">
        <input type="text" id="reply_${regId}" placeholder="Type a reply…" style="flex:1;padding:8px 12px;border:1px solid var(--bd);border-radius:8px;font-size:14px" onkeydown="if(event.key==='Enter')sendUserReply(${regId},'${email}','${token}')">
        <button class="td-submit" style="padding:8px 16px;margin:0" onclick="sendUserReply(${regId},'${email}','${token}')">Send</button>
      </div>
    </div>`;
  }

  // Also add reply boxes for registrations with no messages yet
  if (regIds) {
    for (const r of regIds) {
      if (!grouped[r.id]) {
        html += `
        <div style="margin-bottom:16px;padding:16px;background:var(--sf2);border-radius:var(--r)">
          <div style="font-size:13px;color:var(--tx2);margin-bottom:8px">Registration #${r.id} — No messages yet</div>
          <div style="display:flex;gap:8px">
            <input type="text" id="reply_${r.id}" placeholder="Type a message…" style="flex:1;padding:8px 12px;border:1px solid var(--bd);border-radius:8px;font-size:14px" onkeydown="if(event.key==='Enter')sendUserReply(${r.id},'${email}','${token}')">
            <button class="td-submit" style="padding:8px 16px;margin:0" onclick="sendUserReply(${r.id},'${email}','${token}')">Send</button>
          </div>
        </div>`;
      }
    }
  }

  $('userMsgList').innerHTML = html;
}

async function sendUserReply(regId, email, token) {
  const input = $('reply_' + regId);
  if (!input) return;
  const content = input.value.trim();
  if (!content) return;
  input.value = '';
  try {
    const r = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, registration_id: regId, content })
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error);
    await loadUserMessages();
  } catch (e) {
    alert('Failed to send: ' + (e.message || 'Network error'));
    input.value = content;
  }
}

function msgLogout() {
  localStorage.removeItem('cnev_msg_email');
  localStorage.removeItem('cnev_msg_token');
  renderMessages();
}

function escHtml(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
