/* compare.js — car comparison tool */
const Compare = {
  list: JSON.parse(localStorage.getItem('ev_compare') || '[]'),
  max: 4,
  has(id) { return this.list.includes(id); },
  add(id) { if (!this.has(id) && this.list.length < this.max) { this.list.push(id); this.save(); } },
  remove(id) { this.list = this.list.filter(x => x !== id); this.save(); },
  toggle(id) { this.has(id) ? this.remove(id) : this.add(id); },
  save() { localStorage.setItem('ev_compare', JSON.stringify(this.list)); updateCompareUI(); },
  clear() { this.list = []; this.save(); }
};

function toggleCompare(id) {
  Compare.toggle(id);
  document.querySelectorAll('.add-compare-btn').forEach(btn => {
    const cid = btn.id.replace('cmp-', '');
    if (cid === id) {
      btn.textContent = Compare.has(id) ? '✓ Added' : '+ Compare';
      btn.className = 'add-compare-btn' + (Compare.has(id) ? ' added' : '');
    }
  });
}

function updateCompareUI() {
  const f = $('compareFloat');
  const cnt = $('compareCount');
  if (f && cnt) {
    cnt.textContent = Compare.list.length;
    f.classList.toggle('hidden', Compare.list.length === 0);
  }
  document.querySelectorAll('.add-compare-btn').forEach(btn => {
    const cid = btn.id.replace('cmp-', '');
    if (Compare.has(cid)) { btn.textContent = '✓ Added'; btn.className = 'add-compare-btn added'; }
  });
}

function renderCompare() {
  const cars = Compare.list.map(getCar).filter(Boolean);
  const specRows = [
    ['Brand', c => brandDisplay(c)],
    ['Price', c => priceText(c.priceRange)],
    ['Type', c => c.categoryEn],
    ['Battery', c => c.spec.batteryCapacity ? c.spec.batteryCapacity + 'kWh' : '-'],
    ['Range', c => c.spec.range ? c.spec.range + 'km / ' + kmToMi(c.spec.range) + 'mi' : '-'],
    ['Fast Charge', c => c.spec.fastChargePower ? c.spec.fastChargePower + 'kW' : '-'],
    ['Power', c => c.spec.totalPower ? c.spec.totalPower + 'kW (' + Math.round(c.spec.totalPower*1.341) + 'hp)' : '-'],
    ['Torque', c => c.spec.totalTorque ? c.spec.totalTorque + 'N·m' : '-'],
    ['0-100km/h', c => c.spec.acceleration ? c.spec.acceleration + 's' : '-'],
    ['Top Speed', c => c.spec.topSpeed ? c.spec.topSpeed + 'km/h' : '-'],
    ['Drivetrain', c => c.spec.driveType || '-'],
    ['Wheelbase', c => c.spec.wheelbase ? c.spec.wheelbase + 'mm' : '-'],
    ['Weight', c => c.spec.weight ? c.spec.weight + 'kg (' + Math.round(c.spec.weight*2.205) + 'lbs)' : '-'],
    ['Smart Driving', c => c.spec.autopilot || '-'],
    ['Dimensions', c => c.spec.length ? `${c.spec.length}×${c.spec.width}×${c.spec.height}mm` : '-'],
  ];

  app().innerHTML = `
    <div class="breadcrumb"><a href="#/">Home</a> / <span>Compare</span></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2>Compare Models (${cars.length}/${Compare.max})</h2>
      ${cars.length?'<button class="btn-reset" onclick="Compare.clear();renderCompare()">Clear All</button>':''}
    </div>
    ${cars.length === 0 ? `
      <div style="text-align:center;padding:60px;color:var(--tx3)">
        <div style="font-size:48px;margin-bottom:16px">📊</div>
        <p style="font-size:16px;margin-bottom:8px">No models added to compare</p>
        <p>Click "+ Compare" on any car card to add it here</p>
        <button class="btn-filter" style="margin-top:16px" onclick="showComparePicker()">+ Add Model</button>
      </div>
    ` : `
      <div style="overflow-x:auto">
        <table class="compare-table">
          <tr>
            <th></th>
            ${cars.map(c => `<td class="compare-header">
              <img src="${c.imageURLs[0]||''}" style="width:100%;height:120px;object-fit:cover;border-radius:6px" onerror="this.style.background='var(--sf2)'">
              <div class="c-name"><a href="#/car/${c.id}" style="color:var(--tx)">${c.name}</a></div>
              <div class="c-price">${priceText(c.priceRange)}</div>
              <button class="compare-remove" onclick="Compare.remove('${c.id}');renderCompare()">✕ Remove</button>
            </td>`).join('')}
            ${cars.length < Compare.max ? '<td><div class="compare-add" onclick="showComparePicker()"><div class="compare-add-icon">+</div>Add Model</div></td>' : ''}
          </tr>
          ${specRows.map(([label, fn]) => {
            const vals = cars.map(fn);
            let bestI = -1;
            if (['Range','Power','Torque','Fast Charge'].includes(label)) {
              const nums = cars.map(c => parseFloat(fn(c)) || 0);
              const mx = Math.max(...nums);
              if (mx > 0) bestI = nums.indexOf(mx);
            }
            if (label === '0-100km/h') {
              const nums = cars.map(c => parseFloat(fn(c)) || 999);
              const mn = Math.min(...nums.filter(v=>v<999));
              if (mn < 999) bestI = nums.indexOf(mn);
            }
            return `<tr><th>${label}</th>${vals.map((v,i) => `<td class="${i===bestI?'highlight-best':''}">${v}</td>`).join('')}${cars.length<Compare.max?'<td></td>':''}</tr>`;
          }).join('')}
        </table>
      </div>
    `}
  `;
}

function showComparePicker() {
  const existing = new Set(Compare.list);
  const available = DB.cars.filter(c => !existing.has(c.id));
  const overlay = document.createElement('div');
  overlay.className = 'compare-picker';
  overlay.innerHTML = `
    <div class="compare-picker-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3>Select a Model</h3>
        <button onclick="this.closest('.compare-picker').remove()" style="background:none;border:none;font-size:20px;cursor:pointer">&times;</button>
      </div>
      <input type="text" id="cpSearch" placeholder="Search models…" style="width:100%;padding:8px 12px;border:1px solid var(--bd);border-radius:6px;margin-bottom:12px;font-size:14px">
      <div id="cpList">
        ${available.map(c => `
          <div class="compare-picker-item" onclick="Compare.add('${c.id}');this.closest('.compare-picker').remove();renderCompare()">
            <img src="${c.imageURLs[0]||''}" onerror="this.style.background='var(--sf2)'">
            <div style="flex:1"><div style="font-weight:600;font-size:14px">${c.name}</div><div style="font-size:12px;color:var(--tx2)">${brandDisplay(c)} · ${priceText(c.priceRange)}</div></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  const cpSearch = overlay.querySelector('#cpSearch');
  cpSearch.focus();
  cpSearch.addEventListener('input', () => {
    const q = cpSearch.value.toLowerCase();
    overlay.querySelectorAll('.compare-picker-item').forEach(el => {
      el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
