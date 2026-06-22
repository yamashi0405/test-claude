'use strict';

const KEYS = {
  RECORDS: 'smoking_records',
  PRICE_PER_PACK: 'smoking_price_per_pack',
  CIGS_PER_PACK: 'smoking_cigs_per_pack',
};

// ---- Date helpers ----

function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getNow() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ---- Storage ----

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.RECORDS)) || {};
  } catch {
    return {};
  }
}

function saveRecords(records) {
  localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
}

function getPricePerPack() {
  return parseInt(localStorage.getItem(KEYS.PRICE_PER_PACK), 10) || 570;
}

function getCigsPerPack() {
  return parseInt(localStorage.getItem(KEYS.CIGS_PER_PACK), 10) || 20;
}

// ---- Cost calculation ----

function pricePerCig() {
  return getPricePerPack() / getCigsPerPack();
}

function calcCost(count) {
  return Math.round(count * pricePerCig());
}

function formatCost(yen) {
  return '¥' + yen.toLocaleString('ja-JP');
}

// ---- Today tab ----

function renderTodayDate() {
  const d = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
  document.getElementById('today-date').textContent = label;
}

function renderToday() {
  renderTodayDate();
  const records = loadRecords();
  const today = getToday();
  const times = records[today] || [];
  const count = times.length;

  document.getElementById('today-count').textContent = count;
  document.getElementById('today-cost').textContent = formatCost(calcCost(count));

  const logEl = document.getElementById('today-log');
  logEl.innerHTML = '';

  if (times.length === 0) {
    const li = document.createElement('li');
    li.className = 'log-empty';
    li.textContent = '記録なし';
    logEl.appendChild(li);
    return;
  }

  [...times].reverse().forEach((time, i) => {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'log-num';
    num.textContent = '#' + (times.length - i);
    const t = document.createElement('span');
    t.textContent = time.slice(0, 5);
    li.appendChild(num);
    li.appendChild(t);
    logEl.appendChild(li);
  });
}

function addCigarette() {
  const records = loadRecords();
  const today = getToday();
  if (!records[today]) records[today] = [];
  records[today].push(getNow());
  saveRecords(records);
  renderToday();
}

function undoLast() {
  const records = loadRecords();
  const today = getToday();
  if (!records[today] || records[today].length === 0) return;
  records[today].pop();
  if (records[today].length === 0) delete records[today];
  saveRecords(records);
  renderToday();
}

// ---- Calendar tab ----

const now = new Date();
let calYear = now.getFullYear();
let calMonth = now.getMonth(); // 0-indexed

function renderCalendar() {
  const records = loadRecords();
  const today = getToday();
  const nowDate = new Date();

  document.getElementById('cal-month-label').textContent =
    `${calYear}年${calMonth + 1}月`;

  // Disable next button if already on current month
  const isCurrentMonth = calYear === nowDate.getFullYear() && calMonth === nowDate.getMonth();
  document.getElementById('cal-next').disabled = isCurrentMonth;

  const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monStr = String(calMonth + 1).padStart(2, '0');

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  // Leading empty cells
  for (let i = 0; i < firstDow; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell cal-cell--empty';
    grid.appendChild(cell);
  }

  let totalCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calYear}-${monStr}-${String(day).padStart(2, '0')}`;
    const count = records[dateStr] ? records[dateStr].length : 0;
    totalCount += count;

    const dow = (firstDow + day - 1) % 7; // 0=Sun, 6=Sat

    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (dow === 0) cell.classList.add('cal-cell--sun');
    if (dow === 6) cell.classList.add('cal-cell--sat');
    if (dateStr === today) cell.classList.add('cal-cell--today');
    if (count > 0) {
      cell.classList.add('cal-cell--has-data');
      // intensity: 1 cig = 0.1, 20+ cigs = 1.0
      cell.style.setProperty('--intensity', Math.min(count / 20, 1));
    }

    const numEl = document.createElement('span');
    numEl.className = 'cal-day-num';
    numEl.textContent = day;
    cell.appendChild(numEl);

    if (count > 0) {
      const cntEl = document.createElement('span');
      cntEl.className = 'cal-day-count';
      cntEl.textContent = count + '本';
      cell.appendChild(cntEl);

      const costEl = document.createElement('span');
      costEl.className = 'cal-day-cost';
      costEl.textContent = formatCost(calcCost(count));
      cell.appendChild(costEl);
    }

    grid.appendChild(cell);
  }

  // Summary
  const summary = document.getElementById('cal-summary');
  summary.innerHTML = `
    <span class="cal-summary-label">${calMonth + 1}月 合計</span>
    <div class="cal-summary-right">
      <div class="cal-summary-count">${totalCount}本</div>
      <div class="cal-summary-cost">${formatCost(calcCost(totalCount))}</div>
    </div>
  `;

}

function calPrev() {
  if (calMonth === 0) { calYear--; calMonth = 11; }
  else calMonth--;
  renderCalendar();
}

function calNext() {
  const nowDate = new Date();
  if (calYear === nowDate.getFullYear() && calMonth === nowDate.getMonth()) return;
  if (calMonth === 11) { calYear++; calMonth = 0; }
  else calMonth++;
  renderCalendar();
}

// ---- Settings tab ----

function updatePerCigDisplay() {
  const price = parseInt(document.getElementById('price-per-pack').value, 10) || 570;
  const cigs = parseInt(document.getElementById('cigs-per-pack').value, 10) || 20;
  const per = (price / cigs).toFixed(1);
  document.getElementById('per-cig-price').textContent = '¥' + per;
}

function loadSettings() {
  document.getElementById('price-per-pack').value = getPricePerPack();
  document.getElementById('cigs-per-pack').value = getCigsPerPack();
  updatePerCigDisplay();
}

function saveSettings() {
  const price = parseInt(document.getElementById('price-per-pack').value, 10);
  const cigs = parseInt(document.getElementById('cigs-per-pack').value, 10);
  if (!price || !cigs || price < 1 || cigs < 1) return;

  localStorage.setItem(KEYS.PRICE_PER_PACK, price);
  localStorage.setItem(KEYS.CIGS_PER_PACK, cigs);

  renderToday();
  updatePerCigDisplay();

  const btn = document.getElementById('btn-save-settings');
  btn.textContent = '保存しました';
  btn.classList.add('saved');
  setTimeout(() => {
    btn.textContent = '保存';
    btn.classList.remove('saved');
  }, 1500);
}

// ---- Tab switching ----

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`.tab-btn[data-tab="${name}"]`).classList.add('active');

  if (name === 'today') renderToday();
  if (name === 'history') renderCalendar();
}

// ---- Init ----

document.getElementById('cal-prev').addEventListener('click', calPrev);
document.getElementById('cal-next').addEventListener('click', calNext);

document.getElementById('btn-smoke').addEventListener('click', addCigarette);
document.getElementById('btn-undo').addEventListener('click', undoLast);
document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

document.getElementById('price-per-pack').addEventListener('input', updatePerCigDisplay);
document.getElementById('cigs-per-pack').addEventListener('input', updatePerCigDisplay);

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

loadSettings();
renderToday();
