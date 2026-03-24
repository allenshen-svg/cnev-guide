/* data.js — load and query ev_data.json */
const DB = { brands:[], cars:[], events:[], news:[], newReleases:[], ready:false };
const CNY_TO_USD = 0.137; // approximate ¥10,000 → $1,370

const CAT_EN = { '轿车':'Sedan', 'SUV':'SUV', 'MPV':'MPV', '跑车':'Sports Car' };
const HQ_EN = { '深圳':'Shenzhen', '上海':'Shanghai', '广州':'Guangzhou', '北京':'Beijing', '安徽合肥':'Hefei', '杭州':'Hangzhou', '武汉':'Wuhan' };
const DRIVE_EN = { '前驱':'FWD', '后驱':'RWD', '四驱':'AWD', '后驱/四驱':'RWD / AWD' };
const MOTOR_EN = {
  '前置单电机':'Single front motor', '后置单电机':'Single rear motor', '后置双电机':'Dual rear motors',
  '前后双电机':'Front + rear dual motors', '三电机':'Tri-motor', '增程式双电机':'Range-extended dual motors',
  '后置单电机/双电机':'Single / dual rear motors', '前后双电机(增程)':'Front + rear (range-extended)',
  '1.5T增程器+后置电机':'1.5T range extender + rear motor', '1.5T增程器+后置驱动电机':'1.5T range extender + rear motor',
  '三电机(V8s碳化硅)':'Tri-motor (V8s SiC)', 'V6 后置单电机':'V6 single rear motor', 'V6s Plus 后置单电机':'V6s Plus single rear motor'
};
function catEn(c) { return CAT_EN[c] || c; }
function hqEn(h) { return HQ_EN[h] || h; }

/* Translate a Chinese string: try exact map, then do regex-based substitution */
function t(s, map) {
  if (!s) return s;
  if (map && map[s]) return map[s];
  return s;
}

/* Translate charging time strings like "30分钟充至80%" */
function tCharge(s) {
  if (!s) return s;
  return s.replace(/(\d+)分钟?充至(\d+)%/g, '$1 min to $2%')
          .replace(/充电(\d+)分钟续航(\d+)km/g, '$1 min charge → $2 km range')
          .replace(/(\d+)分充好·(\d+)分充饱/g, '$1 min quick / $2 min full')
          .replace(/快充(\d+)分钟至(\d+)%/g, 'Fast charge $1 min to $2%')
          .replace(/分钟/g, ' min').replace(/分/g, ' min');
}

/* Translate screen size strings */
function tScreen(s) {
  if (!s) return s;
  return s.replace(/英寸/g, '"')
          .replace(/中控屏/g, 'center display')
          .replace(/旋转屏/g, 'rotating display')
          .replace(/后排娱乐屏/g, '+ rear entertainment')
          .replace(/后排屏幕/g, 'rear display')
          .replace(/仪表/g, 'instrument')
          .replace(/方向盘屏/g, 'steering display')
          .replace(/三屏联动/g, 'Triple-screen')
          .replace(/抬头显示/g, 'HUD')
          .replace(/全景显示/g, 'panoramic display');
}

/* Translate OS names */
function tOS(s) {
  if (!s) return s;
  return s.replace(/智能座舱/g, ' cockpit')
          .replace(/鸿蒙座舱/g, 'HarmonyOS cockpit')
          .replace(/小米澎湃/g, 'Xiaomi HyperOS');
}

/* Translate chip info */
function tChip(s) {
  if (!s) return s;
  return s.replace(/华为昇腾\s*芯片/g, 'Huawei Ascend')
          .replace(/华为昇腾/g, 'Huawei Ascend ')
          .replace(/双/g, 'Dual ')
          .replace(/比亚迪智驾芯片/g, 'BYD AD chip')
          .replace(/比亚迪自研芯片/g, 'BYD proprietary chip')
          .replace(/英伟达/g, 'NVIDIA ')
          .replace(/骁龙芯片/g, 'Snapdragon')
          .replace(/高通/g, 'Qualcomm ');
}

/* Translate autopilot / smart driving */
function tAutopilot(s) {
  if (!s) return s;
  return s.replace(/全域智驾/g, 'full-scenario AD')
          .replace(/全场景智驾/g, 'full-scenario AD')
          .replace(/智能驾驶辅助/g, 'driving assistance')
          .replace(/智能驾驶/g, 'smart driving')
          .replace(/智驾/g, 'AD')
          .replace(/高阶辅助驾驶/g, 'advanced ADAS')
          .replace(/辅助驾驶/g, 'ADAS')
          .replace(/高速NOA领航辅助/g, 'Highway NOA')
          .replace(/高速NOA/g, 'Highway NOA')
          .replace(/基础/g, 'Basic ')
          .replace(/增强版/g, 'Enhanced')
          .replace(/超感系统/g, 'sensor suite')
          .replace(/端到端/g, 'end-to-end')
          .replace(/级/g, ' ')
          .replace(/华为乾崑/g, 'Huawei Qiankun ')
          .replace(/华为/g, 'Huawei ')
          .replace(/小米/g, 'Xiaomi ')
          .replace(/浩瀚/g, 'SEA ')
          .replace(/天神之眼B/g, 'Sky Eye B ');
}

/* Translate variant names */
function tVariant(s) {
  if (!s) return s;
  return s.replace(/长续航/g, 'Long Range')
          .replace(/标准续航/g, 'Standard Range')
          .replace(/超长续航/g, 'Ultra Long Range')
          .replace(/首发版/g, 'Launch Edition')
          .replace(/四驱性能/g, 'AWD Performance')
          .replace(/四驱高性能/g, 'AWD High Performance')
          .replace(/四驱穿越版/g, 'AWD Adventure')
          .replace(/探索版/g, 'Explorer')
          .replace(/标准版/g, 'Standard')
          .replace(/智享版/g, 'Smart')
          .replace(/尊享版/g, 'Premium')
          .replace(/旗舰版/g, 'Flagship')
          .replace(/四驱/g, 'AWD ')
          .replace(/后驱/g, 'RWD ')
          .replace(/版/g, '');
}

/* Translate spec object in-place */
function translateSpec(s) {
  if (!s) return s;
  if (s.driveType) s.driveType = t(s.driveType, DRIVE_EN);
  if (s.motorType) s.motorType = t(s.motorType, MOTOR_EN);
  if (s.chargingTime) s.chargingTime = tCharge(s.chargingTime);
  if (s.screenSize) s.screenSize = tScreen(s.screenSize);
  if (s.os) s.os = tOS(s.os);
  if (s.chipsInfo) s.chipsInfo = tChip(s.chipsInfo);
  if (s.autopilot) s.autopilot = tAutopilot(s.autopilot);
  return s;
}

async function loadData() {
  if (DB.ready) return;
  const r = await fetch('data/ev_data.json');
  const d = await r.json();
  DB.brands = d.brands || [];
  DB.cars = (d.cars || []).map(c => {
    translateSpec(c.spec);
    if (c.variants) c.variants.forEach(v => { if (v.spec) translateSpec(v.spec); v.name = tVariant(v.name); });
    return { ...c, categoryEn: catEn(c.category), brandNameEn: (DB.brands.find(b=>b.id===c.brandId)||{}).nameEn || c.brandName };
  });
  DB.events = d.events || [];
  DB.news = d.news || [];
  DB.newReleases = d.newReleases || [];
  DB.ready = true;
}

function getBrand(id) { return DB.brands.find(b => b.id === id); }
function getCar(id) { return DB.cars.find(c => c.id === id); }
function getCarsByBrand(bid) { return DB.cars.filter(c => c.brandId === bid); }

function searchCars(q) {
  if (!q) return [];
  const lq = q.toLowerCase();
  return DB.cars.filter(c =>
    c.name.toLowerCase().includes(lq) ||
    c.brandName.toLowerCase().includes(lq) ||
    (c.brandNameEn||'').toLowerCase().includes(lq) ||
    c.series.toLowerCase().includes(lq)
  ).slice(0, 10);
}

function filterCars(opts) {
  let list = [...DB.cars];
  if (opts.brand) list = list.filter(c => c.brandId === opts.brand);
  if (opts.category) list = list.filter(c => c.category === opts.category);
  if (opts.minPrice) list = list.filter(c => c.priceRange.max >= opts.minPrice);
  if (opts.maxPrice) list = list.filter(c => c.priceRange.min <= opts.maxPrice);
  if (opts.minRange) list = list.filter(c => (c.spec.range || 0) >= opts.minRange);
  if (opts.hideDiscontinued) list = list.filter(c => !c.isDiscontinued);
  if (opts.sort === 'price-asc') list.sort((a,b) => a.priceRange.min - b.priceRange.min);
  if (opts.sort === 'price-desc') list.sort((a,b) => b.priceRange.min - a.priceRange.min);
  if (opts.sort === 'range') list.sort((a,b) => (b.spec.range||0) - (a.spec.range||0));
  return list;
}

function priceText(pr) {
  const usdMin = (pr.min * 10000 * CNY_TO_USD / 1000).toFixed(1);
  const usdMax = (pr.max * 10000 * CNY_TO_USD / 1000).toFixed(1);
  if (pr.min === pr.max) return `¥${pr.min.toFixed(1)}W (~$${usdMin}k)`;
  return `¥${pr.min.toFixed(1)}–${pr.max.toFixed(1)}W (~$${usdMin}–${usdMax}k)`;
}

function kmToMi(km) { return km ? Math.round(km * 0.621) : 0; }
