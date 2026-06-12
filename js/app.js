/* ─────────────────────────────────────────────────────────
   稀飯 App Prototype — Routing + Render + Calculator
   ───────────────────────────────────────────────────────── */

const State = {
  posts: [],
  etfs: [],
  themes: [],
  postsById: {},
  postsByTheme: {},
  isCmoney: false,
};

const THEME_EMOJI = {
  '市值型 ETF': '📊',
  '高股息 ETF': '💵',
  '債券 ETF': '🏦',
  '金融股存股': '💴',
  '民生 / 傳產存股': '🏭',
  '美股 ETF / 月配息': '🇺🇸',
  '配息策略': '💰',
  '退休 / FIRE / 被動收入': '🏖️',
  '定期定額 / 複利紀律': '⏰',
  '資產配置': '🎯',
  'Fed / 利率 / 總經': '🌎',
  '個人理財 / 保險': '🛡️',
};

// ─── Load all data (from window.APP_DATA injected by data/data.js) ───
function loadData() {
  if (!window.APP_DATA) {
    alert('資料載入失敗：data/data.js 沒被載入');
    return;
  }
  State.posts = window.APP_DATA.posts || [];
  State.etfs = window.APP_DATA.etfs || [];
  State.themes = window.APP_DATA.themes || [];

  State.posts.forEach(p => { State.postsById[p.id] = p; });
  State.postsByTheme = State.posts.reduce((acc, p) => {
    (acc[p.theme] = acc[p.theme] || []).push(p);
    return acc;
  }, {});
}

// ─── Check URL params for role=cmoney ─────────────────────────
function detectRole() {
  const params = new URLSearchParams(window.location.search);
  State.isCmoney = params.get('role') === 'cmoney';
  if (State.isCmoney) {
    document.querySelector('.cmoney-only').classList.add('show');
    document.querySelector('.mock-banner').textContent = '🎬 ROI Demo 模式 — 完整 4-tab 含 ROI 後台';
  }
}

// ─── View management ─────────────────────────────────────────
function showView(viewName, param) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + viewName);
  if (!view) {
    console.warn('View not found:', viewName);
    showView('home');
    return;
  }
  view.classList.add('active');

  // Update bottom nav
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.view === viewName);
  });

  // Hide header on detail views
  const headerVisible = ['home', 'library', 'monetize', 'roi'].includes(viewName);
  document.getElementById('appHeader').style.display = headerVisible ? '' : 'none';

  // Per-view render
  switch (viewName) {
    case 'home': renderHome(); break;
    case 'library': renderLibrary(); break;
    case 'theme': renderTheme(param); break;
    case 'post': renderPost(param); break;
    case 'monetize': /* static */ break;
    case 'roi': /* static */ break;
    case 'calc': initCalc(); break;
    case 'yield': renderYield(); break;
    case 'calendar': renderCalendar(); break;
    case 'watchlist': renderWatchlist(); break;
    case 'allocation': renderAllocation(); break;
    case 'community': renderCommunity(); break;
    case 'rating': renderRating(); break;
    case 'holdings': renderHoldings(param); break;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ─── Router ──────────────────────────────────────────────────
function handleRoute() {
  const hash = window.location.hash.replace(/^#/, '') || 'home';
  const [view, ...rest] = hash.split('/');
  const param = rest.join('/');
  showView(view, param ? decodeURIComponent(param) : undefined);
}

window.addEventListener('hashchange', handleRoute);

// Backup: explicit click handler on data-view-link / hash links (in case hashchange doesn't fire)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const hash = link.getAttribute('href');
  if (hash === '#') return;  // dummy link (alert-based)
  e.preventDefault();
  if (window.location.hash === hash) {
    // Same hash — force re-render
    handleRoute();
  } else {
    window.location.hash = hash;
  }
});

// Toast notification (replaces alert which may be blocked by browser)
function showToast(msg) {
  let toast = document.getElementById('_toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_toast';
    toast.style.cssText = 'position:fixed;left:50%;bottom:100px;transform:translateX(-50%);background:#1f2937;color:white;padding:12px 20px;border-radius:99px;font-size:13px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);opacity:0;transition:opacity 0.3s;max-width:90%;text-align:center';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}
// Make showToast available globally for inline onclick handlers
window.showToast = showToast;

// ─── Home view (now "工具") — purely static, no dynamic render needed
function renderHome() {
  // Tools-only page, all elements are in index.html. No dynamic content to render.
}

function postCardHtml(p) {
  const dateStr = p.date || '—';
  const platIcon = p.platform === 'facebook' ? '📘' : '📸';
  // Card shows only meta + 2-3 sentence summary (no redundant title)
  return `
    <a href="#post/${p.id}" class="card" style="display:block;text-decoration:none;color:inherit">
      <div class="card-meta">
        <span>${platIcon}</span>
        <span>${dateStr}</span>
        <span class="dot">·</span>
        <span style="color:#10b981;font-weight:600">${p.theme}</span>
        ${p.is_sponsored ? '<span class="dot">·</span><span style="color:#dc2626">📢 業配</span>' : ''}
      </div>
      <div class="card-summary" style="font-size:14px;color:#1f2937;margin-top:8px;line-height:1.6">${escapeHtml(p.summary)}</div>
      <div class="card-footer">
        <span class="engage">❤️ ${p.engagement.likes}</span>
        <span class="engage">💬 ${p.engagement.comments}</span>
        <span class="engage">⏱️ ${p.read_min} 分鐘</span>
        <span class="engage" style="margin-left:auto;color:#10b981">閱讀全文 →</span>
      </div>
    </a>
  `;
}

function themeCardHtml(t) {
  const emoji = THEME_EMOJI[t.name] || '📁';
  return `
    <a href="#theme/${encodeURIComponent(t.name)}" class="theme-card">
      <div class="tc-emoji">${emoji}</div>
      <div class="tc-name">${escapeHtml(t.name)}</div>
      <div class="tc-count">${t.post_count} 篇</div>
      <div class="tc-bar"></div>
    </a>
  `;
}

// ─── Library view ────────────────────────────────────────────
function renderLibrary() {
  // Featured: 3 most recent posts from 3 DIFFERENT themes (more diverse, less redundant)
  const sortedByDate = [...State.posts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const featured = [];
  const seenThemes = new Set();
  for (const p of sortedByDate) {
    if (!seenThemes.has(p.theme)) {
      featured.push(p);
      seenThemes.add(p.theme);
      if (featured.length >= 3) break;
    }
  }

  document.getElementById('library-featured').innerHTML = featured.map(p => postCardHtml(p)).join('');

  // 12 themes
  document.getElementById('library-themes').innerHTML = State.themes
    .filter(t => t.post_count > 0)
    .map(t => themeCardHtml(t))
    .join('');
}

// ─── Theme view ──────────────────────────────────────────────
function renderTheme(themeName) {
  if (!themeName) { showView('library'); return; }

  const posts = State.postsByTheme[themeName] || [];
  const emoji = THEME_EMOJI[themeName] || '📁';

  document.getElementById('theme-header').innerHTML = `
    <div class="back-bar"><a href="#library">← 回知識庫</a></div>
    <div style="padding:20px 4px 0">
      <div style="font-size:42px">${emoji}</div>
      <h2 style="font-size:22px;margin-top:6px;color:#111827">${escapeHtml(themeName)}</h2>
      <div style="font-size:13px;color:#6b7280;margin-top:4px">${posts.length} 篇文章</div>
    </div>
  `;

  if (posts.length === 0) {
    document.getElementById('theme-posts').innerHTML = '<div class="card" style="text-align:center;color:#9ca3af">尚無文章</div>';
    return;
  }

  document.getElementById('theme-posts').innerHTML = posts
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map(p => postCardHtml(p))
    .join('');
}

// ─── Post detail view ────────────────────────────────────────
function renderPost(postId) {
  const p = State.postsById[postId];
  if (!p) { showView('home'); return; }

  const platIcon = p.platform === 'facebook' ? '📘' : '📸';
  const platName = p.platform === 'facebook' ? 'Facebook' : 'Instagram';

  const relatedHtml = (p.related_etfs && p.related_etfs.length > 0) ? `
    <div class="post-related">
      <div class="post-related-title">🔗 文章提到的 ETF / 個股</div>
      <div class="related-etfs">
        ${p.related_etfs.map(e => `<a href="#" class="etf-chip" onclick="alert('Prototype — 跳至 ${e} 百科頁');return false;">${e}</a>`).join('')}
      </div>
    </div>
  ` : '';

  document.getElementById('post-content').innerHTML = `
    <div class="back-bar"><a href="#" onclick="history.back();return false;">← 返回</a></div>
    <div class="post-header" style="padding-top:16px">
      <span class="post-theme-tag">${escapeHtml(p.theme)}</span>
      ${p.is_sponsored ? '<span class="post-theme-tag" style="background:#fee2e2;color:#dc2626">📢 業配</span>' : ''}
      <div class="post-title">${escapeHtml(p.title)}</div>
      <div class="post-meta">
        <span>${platIcon} ${platName}</span>
        <span>${p.date}</span>
        <span>⏱️ ${p.read_min} 分鐘閱讀</span>
        <span>❤️ ${p.engagement.likes}</span>
        <span>💬 ${p.engagement.comments}</span>
      </div>
    </div>
    <div class="post-body">${escapeHtml(p.content)}</div>
    ${relatedHtml}
    <div class="upsell">
      <b>📥 想看更深入分析？</b><br>
      <span style="font-size:12px">加入稀飯付費社團（APP 內），每日盤後 ETF 點評、配息預估提前 24 小時推播。</span><br>
      <a href="#monetize" class="upsell-cta" data-view-link>看訂閱方案 →</a>
    </div>
  `;
}

// ─── Calculator（多 ETF 投資組合）─────────────────────────────
// 資料：window.ETF_DIVIDENDS（CMoney SQL，202 檔，每檔最新一期）
// 補充保費規則：每一筆股利「單獨」判斷股利所得是否 ≥ 2 萬，不是組合加總
const THRESHOLD = 20000, RATE = 0.0211;
let calcPortfolio = []; // [{code,name,dividend,income_pct,interest_pct,payout,ex_date,yield_pct,zhang,odd}]

function getEtfDividends() { return (window.ETF_DIVIDENDS || []); }

function fmtExDate(s) {
  if (!s || s.length !== 8) return '';
  return `${s.slice(0,4)}/${s.slice(4,6)}/${s.slice(6,8)}`;
}

function initCalc() {
  const searchEl = document.getElementById('calc-etf-search');
  if (!searchEl.dataset.bound) {
    searchEl.dataset.bound = '1';
    searchEl.addEventListener('input', onCalcSearch);
  }
  // 預設帶 0056 + 00878 兩檔當示範
  if (calcPortfolio.length === 0) {
    ['0056', '00878'].forEach(c => {
      const e = getEtfDividends().find(x => x.code === c);
      if (e) calcPortfolio.push({ ...e, zhang: 50, odd: 0 });
    });
  }
  closeCalcAdd();
  renderCalcPortfolio();
}

// 展開新增面板
function openCalcAdd() {
  document.getElementById('calc-add-panel').style.display = 'block';
  document.getElementById('calc-add-btn').style.display = 'none';
  const s = document.getElementById('calc-etf-search');
  s.value = '';
  onCalcSearch();        // 先顯示全部清單（未輸入也有結果）
  setTimeout(() => s.focus(), 50);
}
// 收起新增面板
function closeCalcAdd() {
  const panel = document.getElementById('calc-add-panel');
  if (panel) panel.style.display = 'none';
  const btn = document.getElementById('calc-add-btn');
  if (btn) btn.style.display = '';
}

function onCalcSearch() {
  const q = document.getElementById('calc-etf-search').value.trim().toLowerCase();
  const dd = document.getElementById('calc-etf-dropdown');
  let list = getEtfDividends().filter(e => !calcPortfolio.some(p => p.code === e.code));
  if (q) list = list.filter(e => e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
  list = list.slice(0, 40);
  if (list.length === 0) {
    dd.innerHTML = '<div class="etf-opt" style="color:#9ca3af">查無可加入的 ETF</div>';
  } else {
    dd.innerHTML = list.map(e =>
      `<div class="etf-opt" data-code="${e.code}">
        <b>${e.code}</b> ${escapeHtml(e.name)}
        <span class="etf-opt-tag">${e.payout || ''} · 配 ${e.dividend}</span>
      </div>`).join('');
    dd.querySelectorAll('.etf-opt[data-code]').forEach(el => {
      el.onclick = () => {
        const e = getEtfDividends().find(x => x.code === el.dataset.code);
        if (e) {
          calcPortfolio.push({ ...e, zhang: 10, odd: 0 });
          renderCalcPortfolio();
          showToast(`已加入 ${e.code} ${e.name}`);
        }
        closeCalcAdd();   // 選完自動收起，回到組合清單
      };
    });
  }
}

function calcOneEtf(p) {
  const totalShares = (p.zhang || 0) * 1000 + (p.odd || 0);
  const totalDiv = totalShares * p.dividend;
  const incomePct = (p.income_pct || 0) + (p.interest_pct || 0);
  const taxable = totalDiv * incomePct / 100;
  const triggered = taxable >= THRESHOLD;
  const fee = triggered ? taxable * RATE : 0;
  const perShareTaxable = p.dividend * incomePct / 100;
  const sharesToTrigger = perShareTaxable > 0 ? Math.ceil(THRESHOLD / perShareTaxable) : 0;
  return { totalShares, totalDiv, incomePct, taxable, triggered, fee, perShareTaxable, sharesToTrigger };
}

function renderCalcPortfolio() {
  const wrap = document.getElementById('calc-portfolio');
  const step2 = document.getElementById('calc-step2');
  if (calcPortfolio.length === 0) {
    wrap.innerHTML = '<div class="calc-empty">👇 點下方「＋ 新增 ETF」加入你持有的 ETF</div>';
    document.getElementById('calc-summary').style.display = 'none';
    if (step2) step2.style.display = 'none';
    document.getElementById('calc-note').innerHTML = '';
    return;
  }
  if (step2) step2.style.display = '';

  wrap.innerHTML = calcPortfolio.map((p, i) => {
    const r = calcOneEtf(p);
    const thZ = Math.floor(r.sharesToTrigger / 1000), thO = r.sharesToTrigger % 1000;
    let thText = r.perShareTaxable <= 0 ? '本期免課' : (thO > 0 ? `${formatNum(thZ)}張${thO}股` : `${formatNum(thZ)}張`);
    const estTag = p.ratio_estimated ? `<span class="cp-est" title="最新期占比未公告，沿用 ${p.ratio_period ? p.ratio_period.slice(0,6) : '上期'}">占比估</span>` : '';
    return `
      <div class="cp-card ${r.triggered ? 'triggered' : ''}">
        <div class="cp-head">
          <div>
            <span class="cp-code">${p.code}</span> <span class="cp-name">${escapeHtml(p.name)}</span>
            <div class="cp-sub">${p.payout || ''} · 每股配 ${p.dividend} 元 · 股利所得 ${r.incomePct}% ${estTag}</div>
          </div>
          <button class="cp-del" onclick="removeCalcEtf(${i})">×</button>
        </div>
        <div class="cp-inputs">
          <div class="cp-inp"><input type="number" min="0" max="99999" value="${p.zhang}" oninput="updateCalcEtf(${i},'zhang',this.value)"><span>張</span></div>
          <div class="cp-plus">＋</div>
          <div class="cp-inp"><input type="number" min="0" max="999" value="${p.odd}" oninput="updateCalcEtf(${i},'odd',this.value)"><span>股</span></div>
        </div>
        <div class="cp-result ${r.triggered ? 'warn' : 'good'}">
          ${r.incomePct === 0
            ? `✓ 本期 0% 股利所得，免補保費（持有再多都免）`
            : r.triggered
              ? `⚠️ 課稅基礎 NT$ ${formatNum(r.taxable)}（≥2萬）→ 補保費 NT$ ${formatNum(r.fee)}`
              : `✓ 課稅基礎 NT$ ${formatNum(r.taxable)}（未達2萬）· 超過 ${thText} 才觸發`}
        </div>
      </div>`;
  }).join('');

  // 組合總覽
  let totalDiv = 0, totalFee = 0, trigCount = 0;
  calcPortfolio.forEach(p => {
    const r = calcOneEtf(p);
    totalDiv += r.totalDiv; totalFee += r.fee; if (r.triggered) trigCount++;
  });
  document.getElementById('calc-summary').style.display = '';
  document.getElementById('calc-total').textContent = `NT$ ${formatNum(totalDiv)}`;
  document.getElementById('calc-trigcount').textContent = `${trigCount} / ${calcPortfolio.length} 檔`;
  document.getElementById('calc-trigcount').className = 'calc-result-val ' + (trigCount > 0 ? 'warn' : 'good');
  document.getElementById('calc-fee').textContent = `NT$ ${formatNum(totalFee)}`;
  document.getElementById('calc-fee').className = 'calc-result-val ' + (totalFee > 0 ? 'warn' : '');

  document.getElementById('calc-note').innerHTML =
    `💡 補充保費是「<b>每一筆</b>股利單獨看股利所得有沒有達 2 萬」就課 2.11%，<b>不是把多檔加總</b>。所以分散持有多檔、單檔不超標，就能合法避開。配息與占比為 CMoney 最新一期實際資料。`;
}

function updateCalcEtf(i, field, val) {
  if (!calcPortfolio[i]) return;
  calcPortfolio[i][field] = parseInt(val) || 0;
  renderCalcPortfolio();
}
function removeCalcEtf(i) {
  calcPortfolio.splice(i, 1);
  renderCalcPortfolio();
}

function formatNum(n) { return Math.round(n).toLocaleString('en-US'); }

// ─── Yield Ranking ───────────────────────────────────────────
let yieldFilter = 'all';

function renderYield() {
  const data = (window.ETFS_EXTENDED || []).filter(e => e.yield_pct > 0);
  const filtered = yieldFilter === 'all' ? data : data.filter(e => e.payout === yieldFilter);
  const sorted = [...filtered].sort((a, b) => b.yield_pct - a.yield_pct);

  // Wire up filter chips (only once per view show)
  document.querySelectorAll('#yield-filters .chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === yieldFilter);
    chip.onclick = () => {
      yieldFilter = chip.dataset.filter;
      renderYield();
    };
  });

  // Render list
  const html = sorted.map((e, idx) => {
    const changeClass = e.change_pct >= 0 ? 'pos' : 'neg';
    const changeIcon = e.change_pct >= 0 ? '▲' : '▼';
    const rankBadge = idx < 3 ? `<span class="rank-badge top">${idx + 1}</span>` : `<span class="rank-badge">${idx + 1}</span>`;
    const topTag = idx === 0 ? '<span class="ribbon">👑 殖利率王</span>' : '';
    return `
      <div class="rank-row" onclick="showToast('${e.code} ${e.name} 詳細頁（mock）')">
        ${rankBadge}
        <div class="rank-main">
          <div class="rank-code">${e.code} <span class="rank-name">${escapeHtml(e.name)}</span> ${topTag}</div>
          <div class="rank-sub">${e.payout} · 上期配 ${e.last_dividend} 元</div>
        </div>
        <div class="rank-right">
          <div class="rank-yield">${e.yield_pct.toFixed(1)}<span style="font-size:11px">%</span></div>
          <div class="rank-price ${changeClass}">$ ${e.price.toFixed(2)} ${changeIcon}${Math.abs(e.change_pct).toFixed(2)}%</div>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById('yield-list').innerHTML = html || '<div class="card" style="text-align:center;color:#9ca3af">沒有符合的 ETF</div>';
}

// ─── Calendar (Future 30 Days) ───────────────────────────────
function renderCalendar() {
  const data = window.ETFS_EXTENDED || [];
  // Group by next_payout date
  const byDate = {};
  data.forEach(e => {
    if (!e.next_payout || e.last_dividend === 0) return; // skip no-payout
    (byDate[e.next_payout] = byDate[e.next_payout] || []).push(e);
  });
  const dates = Object.keys(byDate).sort();
  const today = new Date().toISOString().slice(0, 10);

  const html = dates.map(d => {
    const items = byDate[d];
    const isPast = d < today;
    const dateObj = new Date(d);
    const dayName = ['週日','週一','週二','週三','週四','週五','週六'][dateObj.getDay()];
    const monthDay = `${dateObj.getMonth()+1}/${dateObj.getDate()}`;
    const dateLabel = isPast ? '已除息' : daysUntil(d) === 0 ? '今日' : `${daysUntil(d)} 天後`;

    const itemsHtml = items.map(e => `
      <div class="cal-etf-row" onclick="showToast('${e.code} ${e.name} 詳細頁（mock）')">
        <div>
          <b>${e.code}</b> <span style="color:#6b7280">${escapeHtml(e.name)}</span>
          <span class="cal-payout-tag">${e.payout}</span>
        </div>
        <div class="cal-amount">$ ${e.last_dividend} <span style="font-size:11px;color:#6b7280">/股</span></div>
      </div>
    `).join('');

    return `
      <div class="cal-day ${isPast ? 'past' : ''}">
        <div class="cal-day-header">
          <div>
            <div class="cal-date">${monthDay} <span style="font-size:13px;color:#6b7280">${dayName}</span></div>
            <div class="cal-date-sub">${dateLabel}</div>
          </div>
          <div class="cal-count">${items.length} 檔</div>
        </div>
        <div class="cal-etfs">${itemsHtml}</div>
      </div>
    `;
  }).join('');
  document.getElementById('calendar-list').innerHTML = html || '<div class="card" style="text-align:center;color:#9ca3af">近期無除息資料</div>';
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  return Math.round((target - today) / 86400000);
}

// ─── Watchlist ───────────────────────────────────────────────
const DEFAULT_WATCHLIST = ['0050', '0056', '00878', '00929', '00919'];

function renderWatchlist() {
  const data = window.ETFS_EXTENDED || [];
  const watching = DEFAULT_WATCHLIST.map(code => data.find(e => e.code === code)).filter(Boolean);
  document.getElementById('watchlist-count').textContent = watching.length;

  const html = watching.map(e => {
    const changeClass = e.change_pct >= 0 ? 'pos' : 'neg';
    const changeIcon = e.change_pct >= 0 ? '▲' : '▼';
    const daysToPayout = daysUntil(e.next_payout);
    const payoutNote = daysToPayout > 0 ? `${daysToPayout} 天後除息` : daysToPayout === 0 ? '今日除息！' : '已除息';
    return `
      <div class="wl-card" onclick="showToast('${e.code} ${e.name} 詳細頁（mock）')">
        <div class="wl-header">
          <div>
            <div class="wl-code">${e.code}</div>
            <div class="wl-name">${escapeHtml(e.name)}</div>
          </div>
          <button class="wl-remove" onclick="event.stopPropagation();showToast('已從關注移除 ${e.code} (mock)')">×</button>
        </div>
        <div class="wl-stats">
          <div class="wl-stat">
            <div class="wl-stat-label">現價</div>
            <div class="wl-stat-val">$ ${e.price.toFixed(2)}</div>
            <div class="wl-stat-sub ${changeClass}">${changeIcon}${Math.abs(e.change_pct).toFixed(2)}%</div>
          </div>
          <div class="wl-stat">
            <div class="wl-stat-label">殖利率</div>
            <div class="wl-stat-val">${e.yield_pct.toFixed(1)}<span style="font-size:12px">%</span></div>
            <div class="wl-stat-sub">${e.payout}</div>
          </div>
          <div class="wl-stat">
            <div class="wl-stat-label">下次除息</div>
            <div class="wl-stat-val" style="font-size:14px">${e.next_payout.slice(5)}</div>
            <div class="wl-stat-sub">${payoutNote}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  document.getElementById('watchlist-list').innerHTML = html;
}

// ─── Allocation by Age ───────────────────────────────────────
const ALLOC_COLORS = { '市值型 ETF': '#10b981', '高股息 ETF': '#f59e0b', '主動式 ETF': '#8b5cf6', '美股 ETF': '#6366f1', '債券 ETF': '#ec4899' };

const ALLOCATION_BY_AGE = {
  '20-30': {
    stage: '資產累積初期',
    description: '時間是最大資產 — 用 10-30 年的長期複利累積部位。風險承受度最高，重點抓成長。',
    allocation: [
      { name: '市值型 ETF', pct: 60, suggested: ['0050', '006208', '00692'], note: '長期跟著大盤成長，分割後 0050 入手門檻低' },
      { name: '高股息 ETF', pct: 15, suggested: ['00878', '0056'], note: '小比例培養領息習慣，享受配息再投入複利' },
      { name: '主動式 ETF', pct: 15, suggested: ['00981A', '00991A', '00985A'], note: '年輕能承受波動，用「進化版台灣50」主動選股拚超額報酬' },
      { name: '美股 ETF', pct: 10, suggested: ['009815', '00646'], note: '降低台股單一市場集中' }
    ],
    tip: '剛起步不要怕跌，跌的時候反而是累積張數的最佳時機。主動式 ETF 波動大、成立又短沒經歷過股災，比例控制在 15% 以內當衛星就好，核心還是市值型。',
    monthlyBudget: '建議每月 NT$ 5,000-10,000 起步'
  },
  '30-40': {
    stage: '家庭組成期',
    description: '可能買房、結婚、生子，現金流需求上升，但時間仍長，成長依然主軸。',
    allocation: [
      { name: '市值型 ETF', pct: 45, suggested: ['0050', '006208'], note: '主力仍在成長端' },
      { name: '高股息 ETF', pct: 25, suggested: ['00878', '00919', '0056'], note: '配息再投入或補家用' },
      { name: '主動式 ETF', pct: 15, suggested: ['00981A', '00982A', '00994A'], note: '挑配息穩的主動式（如 00982A 季季調升）兼顧成長與現金流' },
      { name: '美股 ETF', pct: 10, suggested: ['009815', '00646'], note: '全球分散' },
      { name: '債券 ETF', pct: 5, suggested: ['00679B', '00937B'], note: '小比例降波動' }
    ],
    tip: '可以試月配 ETF（00929、00940、00946）培養領息感，但月配仍要看「填息率」+「殖利率」雙指標。主動式 ETF 選費用率合理、經理人有紀錄的。',
    monthlyBudget: '建議每月 NT$ 10,000-30,000'
  },
  '40-50': {
    stage: '中堅期',
    description: '事業高峰、收入較穩，要從「累積資產」逐漸轉向「打造被動現金流」。',
    allocation: [
      { name: '市值型 ETF', pct: 30, suggested: ['0050', '006208'], note: '保留成長部位抗通膨' },
      { name: '高股息 ETF', pct: 35, suggested: ['00878', '00919', '00918', '00713'], note: '主力轉為現金流' },
      { name: '主動式 ETF', pct: 10, suggested: ['00982A', '00984A'], note: '小比例主動高息（如 00984A），用一點主動操作換取超額報酬' },
      { name: '美股 ETF', pct: 10, suggested: ['009815'], note: '分散' },
      { name: '債券 ETF', pct: 15, suggested: ['00679B', '00937B'], note: '增加穩定度' }
    ],
    tip: '開始重視「填息率」而非「殖利率」— 配得高但填不回來等於沒賺。主動式 ETF 比例要收斂，畢竟離退休越近越禁不起大波動。可用工具頁試算機檢查補充保費。',
    monthlyBudget: '建議每月 NT$ 20,000-50,000'
  },
  '50-60': {
    stage: '退休準備期',
    description: '距離退休 5-10 年，要把資產「轉換」成穩定現金流，降低波動。主動式 ETF 成立太短沒過股災，這階段開始退出。',
    allocation: [
      { name: '市值型 ETF', pct: 20, suggested: ['0050'], note: '保留少量抗通膨' },
      { name: '高股息 ETF', pct: 45, suggested: ['00878', '00919', '00891', '00918'], note: '主力現金流' },
      { name: '美股 ETF', pct: 15, suggested: ['009815', '00646'], note: '匯率分散' },
      { name: '債券 ETF', pct: 20, suggested: ['00679B', '00937B'], note: '降低波動' }
    ],
    tip: '組合月配 + 季配 + 半年配 ETF 做到「月月領息」現金流。可以開始試算退休後每月被動收入需求 vs 預期支出。這階段不建議再加主動式，波動風險不對稱。',
    monthlyBudget: '建議每月 NT$ 30,000-80,000'
  },
  '60+': {
    stage: '退休期',
    description: '依靠資產被動收入過日子。穩定 > 成長，但仍需保留抗通膨部位。',
    allocation: [
      { name: '市值型 ETF', pct: 10, suggested: ['0050'], note: '抗通膨保險' },
      { name: '高股息 ETF', pct: 50, suggested: ['00878', '00919', '0056', '00929'], note: '核心現金流' },
      { name: '美股 ETF', pct: 10, suggested: ['00646'], note: '降低台股集中' },
      { name: '債券 ETF', pct: 30, suggested: ['00679B', '00937B'], note: '主力穩定資產' }
    ],
    tip: '退休階段最重要不是賺更多，是「不要虧錢」。配置以保本 + 現金流為主。記得通膨會吃掉購買力，至少保留 10% 股票部位抗通膨。',
    monthlyBudget: '消費階段 — 重點是被動收入 > 月支出'
  }
};

let currentAge = '20-30';

function renderAllocation() {
  // Wire up chips
  document.querySelectorAll('#age-chips .chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.age === currentAge);
    chip.onclick = () => {
      currentAge = chip.dataset.age;
      renderAllocation();
    };
  });

  const data = ALLOCATION_BY_AGE[currentAge];
  if (!data) return;

  // Build conic-gradient for pie chart
  let cursor = 0;
  const stops = data.allocation.map(a => {
    const start = cursor;
    const end = cursor + a.pct;
    cursor = end;
    return `${ALLOC_COLORS[a.name]} ${start}% ${end}%`;
  }).join(', ');

  // Legend
  const legendHtml = data.allocation.map(a => `
    <div class="legend-row">
      <span class="legend-dot" style="background:${ALLOC_COLORS[a.name]}"></span>
      <span class="legend-name">${a.name}</span>
      <span class="legend-pct">${a.pct}%</span>
    </div>
  `).join('');

  // Category cards (each allocation with suggested ETFs)
  const catHtml = data.allocation.map(a => `
    <div class="alloc-cat" style="border-left-color:${ALLOC_COLORS[a.name]}">
      <div class="alloc-cat-head">
        <div class="alloc-cat-name">${a.name}</div>
        <div class="alloc-cat-pct" style="color:${ALLOC_COLORS[a.name]}">${a.pct}%</div>
      </div>
      <div class="alloc-cat-note">${escapeHtml(a.note)}</div>
      <div class="alloc-cat-etfs">
        ${a.suggested.map(code => `<span class="etf-pill">${code}</span>`).join('')}
      </div>
    </div>
  `).join('');

  document.getElementById('alloc-content').innerHTML = `
    <div class="alloc-stage-card">
      <div class="alloc-stage-name">${escapeHtml(data.stage)}</div>
      <div class="alloc-stage-desc">${escapeHtml(data.description)}</div>
    </div>

    <div class="alloc-pie-wrap">
      <div class="alloc-pie" style="background: conic-gradient(${stops})"></div>
      <div class="alloc-pie-center">${currentAge}<br><span style="font-size:11px;color:#9ca3af;font-weight:normal">歲</span></div>
    </div>

    <div class="alloc-legend">${legendHtml}</div>

    <div class="section-title" style="margin-top:24px">建議配置 + ETF</div>
    ${catHtml}

    <div class="alloc-tip">
      <div class="alloc-tip-label">💡 稀飯小提醒</div>
      <div>${escapeHtml(data.tip)}</div>
    </div>

    <div class="alloc-budget">
      <span style="font-size:11px;color:#6b7280">💰 投入規模參考</span>
      <div>${escapeHtml(data.monthlyBudget)}</div>
    </div>
  `;

  renderAllEtfList();
}

// 全 ETF 分類瀏覽（配置 tab 底部）
let allEtfFilter = 'all';
let allEtfSearch = '';
let expandedCats = {};  // 哪些分類展開了（預設全摺疊）
// 分類顯示順序 + 色票（依稀飯讀者最常看的排）
const CAT_ORDER = ['高股息 ETF','市值型 ETF','主動式台股 ETF','產業主題 ETF','ESG ETF','其他台股 ETF','美股 ETF','海外股 ETF','日股 ETF','主動式海外 ETF','債券 ETF','主動式債券 ETF','槓桿/反向 ETF'];
const CAT_COLOR = {
  '高股息 ETF':'#f59e0b','市值型 ETF':'#10b981','主動式台股 ETF':'#8b5cf6','產業主題 ETF':'#06b6d4',
  'ESG ETF':'#22c55e','其他台股 ETF':'#94a3b8','美股 ETF':'#6366f1','海外股 ETF':'#3b82f6',
  '日股 ETF':'#ef4444','主動式海外 ETF':'#a855f7','債券 ETF':'#ec4899','主動式債券 ETF':'#db2777','槓桿/反向 ETF':'#78716c'
};

function renderAllEtfList() {
  const all = window.ALL_ETFS || [];
  // 計算各分類檔數
  const counts = {};
  all.forEach(e => counts[e.cat] = (counts[e.cat]||0)+1);
  const cats = CAT_ORDER.filter(c => counts[c]);

  // chips（動態生成）
  const chipBox = document.getElementById('alletf-filters');
  if (chipBox) {
    chipBox.innerHTML = `<button class="chip ${allEtfFilter==='all'?'active':''}" data-cat="all">全部 ${all.length}</button>` +
      cats.map(c => `<button class="chip ${allEtfFilter===c?'active':''}" data-cat="${c}">${c.replace(' ETF','')} ${counts[c]}</button>`).join('');
    chipBox.querySelectorAll('.chip').forEach(ch => ch.onclick = () => { allEtfFilter = ch.dataset.cat; renderAllEtfList(); });
  }
  // search
  const searchEl = document.getElementById('alletf-search');
  if (searchEl && !searchEl.dataset.bound) {
    searchEl.dataset.bound = '1';
    searchEl.addEventListener('input', () => { allEtfSearch = searchEl.value.trim().toLowerCase(); renderAllEtfList(); });
  }

  let list = all;
  if (allEtfFilter !== 'all') list = list.filter(e => e.cat === allEtfFilter);
  if (allEtfSearch) list = list.filter(e => e.code.toLowerCase().includes(allEtfSearch) || e.name.toLowerCase().includes(allEtfSearch));

  const el = document.getElementById('alletf-list');
  if (!el) return;

  // 全部模式：按分類分組（可折疊，預設收合）；篩選模式：平鋪
  let html = '';
  if (allEtfFilter === 'all' && !allEtfSearch) {
    cats.forEach(c => {
      const items = all.filter(e => e.cat === c);
      const open = !!expandedCats[c];
      html += `<div class="cat-group-head clickable ${open ? 'open' : ''}" style="border-left-color:${CAT_COLOR[c]}" onclick="toggleCat('${c}')">
        <span class="cat-arrow">${open ? '▾' : '▸'}</span>
        <span style="flex:1">${c}</span>
        <span>${items.length} 檔</span>
      </div>`;
      if (open) html += `<div class="cat-group-body">${items.map(e => etfRowHtml(e)).join('')}</div>`;
    });
  } else {
    html = `<div style="font-size:11px;color:#9ca3af;margin:0 4px 8px">顯示 ${list.length} / ${all.length} 檔</div>`;
    html += list.map(e => etfRowHtml(e)).join('') || '<div class="calc-empty">查無符合的 ETF</div>';
  }
  el.innerHTML = html;
}

function toggleCat(c) {
  expandedCats[c] = !expandedCats[c];
  renderAllEtfList();
}

function etfRowHtml(e) {
  const c = CAT_COLOR[e.cat] || '#6b7280';
  const tag = e.cat.replace(' ETF','');
  const fee = e.mgmt_fee != null ? '費 '+e.mgmt_fee+'%' : '';
  const hasHold = (window.ETF_HOLDINGS_DATA && window.ETF_HOLDINGS_DATA.holdings[e.code]);
  return `
    <div class="active-etf-row" ${hasHold ? `onclick="location.hash='#holdings/${e.code}'"` : `onclick="showToast('${e.code} ${e.name}')"`}>
      <div class="ae-left">
        <span class="ae-type" style="background:${c}">${tag}</span>
        <div>
          <div class="ae-code">${e.code} <span class="ae-name">${escapeHtml(e.name)}</span></div>
          <div class="ae-meta">${escapeHtml(e.manager)}${e.index ? ' · '+escapeHtml(e.index.length>16?e.index.slice(0,16)+'…':e.index) : ''}</div>
        </div>
      </div>
      <div class="ae-fee">${fee}${hasHold ? ' 🔍' : ''}</div>
    </div>`;
}

// ─── Rating (主動式 ETF 評等) ─────────────────────────────────
// 數據基底：稀飯 2026-04/05 文章中實際提到的報酬/配息/規模數字（prototype 整理）
// 分數 = 績效30% + 風險20% + 配息20% + 費用15% + 規模15%（公式公開）
const RATING_DATA = [
  { code: '00981A', name: '主動統一台股增長', grade: 'S', ytd: '+67.2%',
    scores: { perf: 95, risk: 55, div: 78, fee: 58, scale: 96 },
    comment: '人氣王。發行價 10 元一路漲到 30 元，首配 0.41 全資本利得免補保費。費用率偏高是代價。' },
  { code: '00994A', name: '主動第一金台股優', grade: 'S', ytd: '+68.2%',
    scores: { perf: 96, risk: 55, div: 62, fee: 65, scale: 62 },
    comment: '黑馬冠軍。討論度不高但績效霸榜一段時間，低調的實力派。' },
  { code: '00991A', name: '主動復華未來50', grade: 'S', ytd: '+68.6%',
    scores: { perf: 94, risk: 45, div: 60, fee: 64, scale: 80 },
    comment: '科技主攻型「未來的台灣50」。能買上櫃股是它對 0050 的最大優勢，波動也是同類最高。' },
  { code: '00982A', name: '主動群益台灣強棒', grade: 'A', ytd: '+51.8%',
    scores: { perf: 85, risk: 60, div: 92, fee: 63, scale: 74 },
    comment: '配息模範生：0.236→0.334→0.377→0.64 季季調升、填息率 100%、全資本利得。' },
  { code: '00980A', name: '主動野村臺灣優選', grade: 'A', ytd: '+56.2%',
    scores: { perf: 86, risk: 62, div: 84, fee: 64, scale: 75 },
    comment: '績效配息兩頭兼顧，配息連兩季成長。野村雙檔中的主力。' },
  { code: '00992A', name: '主動群益科技創新', grade: 'A', ytd: '+66.6%',
    scores: { perf: 93, risk: 42, div: 50, fee: 60, scale: 64 },
    comment: '純科技衝鋒隊，跟 00981A 一路纏鬥。首次評價不分配，要領息的不適合。' },
  { code: '00985A', name: '主動野村台灣50', grade: 'A', ytd: '+34.1%',
    scores: { perf: 75, risk: 76, div: 66, fee: 68, scale: 70 },
    comment: '三檔「進化版台灣50」中最防守：台積電 27% + 金融傳產壓艙，波動理論上最低。' },
  { code: '00995A', name: '主動中信台灣卓越', grade: 'B', ytd: '+60%±',
    scores: { perf: 82, risk: 55, div: 60, fee: 62, scale: 66 },
    comment: '跟前段班差距咬很近，但還沒拉出自己的識別度。' },
  { code: '00984A', name: '主動安聯台灣高息', grade: 'B', ytd: '+29.2%',
    scores: { perf: 70, risk: 70, div: 72, fee: 64, scale: 58 },
    comment: '首檔主動高息。同期贏 0056/00919，但首配動用 52% 平準金要再觀察。' },
  { code: '00403A', name: '主動統一升級50', grade: 'N', ytd: '掛牌未滿季',
    scores: { perf: 0, risk: 50, div: 50, fee: 60, scale: 98 },
    comment: '掛牌 3 天規模衝 1,500 億的怪物新兵。股票部位才 76%，溢價一度 3.4%——等建倉完再評。' },
  { code: '00999A', name: '主動野村臺灣高息', grade: 'N', ytd: '掛牌未滿季',
    scores: { perf: 0, risk: 55, div: 60, fee: 64, scale: 45 },
    comment: '高息+成長雙拼新兵，與 00980A 同經理人。9 月首配前先觀察。' },
];

const GRADE_STYLE = {
  S: { bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  A: { bg: 'linear-gradient(135deg,#10b981,#059669)' },
  B: { bg: 'linear-gradient(135deg,#3b82f6,#2563eb)' },
  C: { bg: 'linear-gradient(135deg,#9ca3af,#6b7280)' },
  N: { bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
};

const DIM_LABELS = { perf: '績效', risk: '風險', div: '配息', fee: '費用', scale: '規模' };

let currentGrade = 'A';
const GRADE_DESC = {
  S: '頂級（總分 ≥85）',
  A: '優等（75-84）',
  B: '中段（65-74）',
  C: '後段（<65）',
  N: '觀察中（新檔未滿一季）',
};

// 真實評等資料來源：window.RATING（CMoney SQL 算分）；無則 fallback 到手編 RATING_DATA
function getRatingData() {
  const real = window.RATING;
  if (!real || !real.length) return RATING_DATA;
  // 補上短評（依分數特徵自動生成）
  return real.map(r => ({ ...r, comment: r.comment || ratingComment(r) }));
}

function ratingComment(r) {
  const s = r.scores;
  const bits = [];
  if (r.grade === 'N') return `新檔觀察中，淨值資料未滿一季，暫不評分。近期報酬 ${r.m3 != null ? '+' + r.m3.toFixed(1) + '%' : '—'}。`;
  if (s.perf >= 85) bits.push('績效強');
  else if (s.perf <= 45) bits.push('績效偏弱');
  if (s.fee >= 80) bits.push('費用低');
  else if (s.fee <= 35) bits.push('費用偏高');
  if (s.div >= 75) bits.push('配息佳');
  if (s.risk >= 78) bits.push('波動小');
  else if (s.risk <= 55) bits.push('波動較大');
  const perf3 = r.m3 != null ? `近三月 ${r.m3 >= 0 ? '+' : ''}${r.m3.toFixed(1)}%` : '';
  const feeStr = r.fee != null ? `管理費 ${r.fee}%` : '';
  return `${bits.join('、') || '各維度均衡'}。${perf3}${feeStr ? '、' + feeStr : ''}。${r.is_bond ? '（債券型，以債券標準評分）' : ''}`;
}

function renderRating() {
  const data = getRatingData();
  const order = { S: 0, A: 1, B: 2, C: 3, N: 4 };
  // 各級別檔數
  const counts = {};
  data.forEach(r => counts[r.grade] = (counts[r.grade] || 0) + 1);
  const grades = ['S', 'A', 'B', 'C', 'N'].filter(g => counts[g]);
  if (!grades.includes(currentGrade)) currentGrade = grades[0];

  // 切換按鈕
  const tabs = document.getElementById('grade-tabs');
  if (tabs) {
    tabs.innerHTML = grades.map(g => {
      const st = GRADE_STYLE[g];
      const active = g === currentGrade;
      return `<button class="grade-tab ${active ? 'active' : ''}" data-grade="${g}"
                style="${active ? 'background:' + st.bg.match(/#[0-9a-f]+/i)[0] : ''}">
                <span class="gt-letter">${g}</span>
                <span class="gt-count">${counts[g]}</span>
              </button>`;
    }).join('');
    tabs.querySelectorAll('.grade-tab').forEach(t => t.onclick = () => { currentGrade = t.dataset.grade; renderRating(); });
  }

  const list = data.filter(r => r.grade === currentGrade);
  const cardsHtml = list.map(r => {
    const g = GRADE_STYLE[r.grade];
    const bars = Object.keys(DIM_LABELS).map(k => {
      const v = r.scores[k];
      return `
        <div class="rate-dim">
          <div class="rate-dim-label">${DIM_LABELS[k]}</div>
          <div class="rate-dim-bar"><div class="rate-dim-fill" style="width:${v}%"></div></div>
          <div class="rate-dim-val">${v > 0 ? v : '—'}</div>
        </div>`;
    }).join('');
    const hasHoldings = (window.ETF_HOLDINGS || {})[r.code];
    const totalStr = r.total != null ? `總分 ${r.total}` : '未評分';
    return `
      <div class="rate-card">
        <div class="rate-head">
          <div class="grade-badge" style="background:${g.bg}">${r.grade}</div>
          <div class="rate-meta">
            <div class="rate-code">${r.code} <span class="rate-name">${escapeHtml(r.name)}</span></div>
            <div class="rate-ytd">${totalStr} · 報酬 <b>${r.ytd}</b></div>
          </div>
        </div>
        <div class="rate-dims">${bars}</div>
        <div class="rate-comment">🍚 ${escapeHtml(r.comment)}</div>
        ${hasHoldings ? `<a href="#holdings/${r.code}" class="rate-holdings-link" onclick="event.stopPropagation()">查看成分股 →</a>` : ''}
      </div>`;
  }).join('');

  document.getElementById('rating-list').innerHTML =
    `<div class="grade-header"><span class="grade-header-letter" style="background:${GRADE_STYLE[currentGrade].bg}">${currentGrade}</span>${GRADE_DESC[currentGrade]} · ${list.length} 檔</div>` +
    cardsHtml + `
    <div class="upsell" style="margin-top:16px">
      <b>🔓 想看完整評等理由 + 調級即時通知？</b><br>
      <span style="font-size:12px">加入稀飯付費社團（APP 內），評級異動第一時間推播給你。</span><br>
      <a href="#monetize" class="upsell-cta" data-view-link>查看訂閱方案 →</a>
    </div>`;
}

// ─── Holdings (成分股) — 雙向：ETF→成分股 / 個股→ETF ──────────
let holdingsMode = 'etf';   // 'etf' = 看 ETF 持有什麼；'stock' = 看個股被誰持有
let holdingsEtf = '0050';
let holdingsStock = '2330';

function HD() { return window.ETF_HOLDINGS_DATA || { holdings:{}, stock_index:{}, stock_names:{}, etf_names:{} }; }

function renderHoldings(param) {
  // param 可能是 ETF 代號（從評等卡點過來）
  const d = HD();
  if (param && d.holdings[param]) { holdingsMode = 'etf'; holdingsEtf = param; }

  // 綁定模式切換
  document.querySelectorAll('#holdings-mode .chip').forEach(ch => {
    ch.classList.toggle('active', ch.dataset.mode === holdingsMode);
    ch.onclick = () => { holdingsMode = ch.dataset.mode; document.getElementById('holdings-search').value=''; renderHoldings(); };
  });

  const searchEl = document.getElementById('holdings-search');
  if (searchEl && !searchEl.dataset.bound) {
    searchEl.dataset.bound = '1';
    searchEl.addEventListener('input', renderHoldingsSearch);
    searchEl.addEventListener('focus', renderHoldingsSearch);
  }
  searchEl.placeholder = holdingsMode === 'etf'
    ? '搜尋 ETF 代號或名稱，例如 0050 / 高股息'
    : '搜尋個股代號或名稱，例如 2330 / 台積電 / 聯電';

  renderHoldingsSearch();
  if (holdingsMode === 'etf') renderEtfHoldings();
  else renderStockReverse();
}

function renderHoldingsSearch() {
  const d = HD();
  const q = (document.getElementById('holdings-search')?.value || '').trim().toLowerCase();
  const dd = document.getElementById('holdings-dropdown');
  if (!dd) return;
  if (!q) { dd.style.display = 'none'; return; }

  let list;
  if (holdingsMode === 'etf') {
    list = Object.keys(d.holdings).map(c => ({ code: c, name: d.etf_names[c] || '' }))
      .filter(e => e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)).slice(0, 30);
  } else {
    list = Object.keys(d.stock_index).map(s => ({ code: s, name: d.stock_names[s] || '' }))
      .filter(e => e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q))
      .sort((a,b) => d.stock_index[b.code].length - d.stock_index[a.code].length).slice(0, 30);
  }
  dd.innerHTML = list.length ? list.map(e =>
    `<div class="etf-opt" data-code="${e.code}"><b>${e.code}</b> ${escapeHtml(e.name)}${holdingsMode==='stock'?`<span class="etf-opt-tag">${d.stock_index[e.code].length} 檔 ETF 持有</span>`:''}</div>`).join('')
    : '<div class="etf-opt" style="color:#9ca3af">查無資料</div>';
  dd.querySelectorAll('.etf-opt[data-code]').forEach(el => el.onclick = () => {
    if (holdingsMode === 'etf') holdingsEtf = el.dataset.code; else holdingsStock = el.dataset.code;
    document.getElementById('holdings-search').value = '';
    dd.style.display = 'none';
    renderHoldings();
  });
  dd.style.display = 'block';
}

// ETF → 成分股
function renderEtfHoldings() {
  const d = HD();
  const code = holdingsEtf;
  const holdings = d.holdings[code] || [];
  const name = d.etf_names[code] || '';
  const sum = holdings.reduce((s, h) => s + h.w, 0);
  const maxW = holdings.length ? holdings[0].w : 1;

  const rows = holdings.map((h, i) => `
    <div class="hold-row" onclick="jumpToStock('${h.sym}')">
      <span class="hold-rank">${i + 1}</span>
      <div class="hold-bar-wrap">
        <div class="hold-name"><b>${h.sym}</b> ${escapeHtml(h.name)}</div>
        <div class="hold-bar"><div class="hold-bar-fill" style="width:${Math.min(100, h.w / maxW * 100)}%"></div></div>
      </div>
      <span class="hold-w">${h.w}%</span>
    </div>`).join('');

  document.getElementById('holdings-detail').innerHTML = `
    <div class="hold-card-head">
      <div class="hold-code">${code} <span class="hold-cname">${escapeHtml(name)}</span></div>
      <div class="hold-sub">前 ${holdings.length} 大成分股 · 合計 ${sum.toFixed(1)}%　·　點個股可反查</div>
    </div>
    ${rows || '<div class="calc-empty">查無成分股資料</div>'}
    <div class="hold-note">📊 來自 CMoney SQL（sysETFSHD）前 15 大持股。共 ${Object.keys(d.holdings).length} 檔 ETF 可查。</div>`;
}

// 個股 → 哪些 ETF 持有（稀飯招牌套路）
function renderStockReverse() {
  const d = HD();
  const sym = holdingsStock;
  const etfs = d.stock_index[sym] || [];
  const name = d.stock_names[sym] || '';
  const maxW = etfs.length ? etfs[0].w : 1;

  const rows = etfs.map((e, i) => `
    <div class="hold-row" onclick="jumpToEtf('${e.etf}')">
      <span class="hold-rank">${i + 1}</span>
      <div class="hold-bar-wrap">
        <div class="hold-name"><b>${e.etf}</b> ${escapeHtml(d.etf_names[e.etf] || '')}</div>
        <div class="hold-bar"><div class="hold-bar-fill" style="width:${Math.min(100, e.w / maxW * 100)}%"></div></div>
      </div>
      <span class="hold-w">${e.w}%</span>
    </div>`).join('');

  document.getElementById('holdings-detail').innerHTML = `
    <div class="hold-card-head">
      <div class="hold-code">${sym} <span class="hold-cname">${escapeHtml(name)}</span></div>
      <div class="hold-sub">被 ${etfs.length} 檔 ETF 列入前 15 大持股（含量高→低）　·　點 ETF 看全部成分股</div>
    </div>
    <div class="hold-reverse-intro">💡 看好 ${escapeHtml(name)} 但不想單壓個股？這些 ETF 含量最高，可間接持有又分散風險。</div>
    ${rows || '<div class="calc-empty">查無持有此個股的 ETF（可能不在任何 ETF 前 15 大）</div>'}
    <div class="hold-note">📊 來自 CMoney SQL（sysETFSHD）。僅統計個股在各 ETF「前 15 大」的情況，含量低的不列。</div>`;
}

// 從 ETF 成分股點個股 → 切到反查
function jumpToStock(sym) {
  const d = HD();
  if (!d.stock_index[sym]) { showToast('此個股無反查資料'); return; }
  holdingsMode = 'stock'; holdingsStock = sym;
  renderHoldings();
}
// 從反查點 ETF → 切到成分股
function jumpToEtf(code) {
  const d = HD();
  if (!d.holdings[code]) { showToast('此 ETF 無成分股資料'); return; }
  holdingsMode = 'etf'; holdingsEtf = code;
  renderHoldings();
}

// ─── Community (社團) — 3 sub-sections ──────────────────────
let currentCommunitySub = 'profile';

function renderCommunity() {
  // Wire up sub tabs
  document.querySelectorAll('#community-tabs .chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.sub === currentCommunitySub);
    chip.onclick = () => {
      currentCommunitySub = chip.dataset.sub;
      renderCommunity();
    };
  });

  const container = document.getElementById('community-content');
  if (currentCommunitySub === 'profile') container.innerHTML = renderProfileSub();
  else if (currentCommunitySub === 'vip') container.innerHTML = renderVipSub();
  else if (currentCommunitySub === 'chat') container.innerHTML = renderChatSub();
}

// 稀飯專區
function renderProfileSub() {
  return `
    <div class="card profile-card">
      <div class="profile-tag">關於稀飯</div>
      <p class="profile-intro">
        你今天要不要來點稀飯套餐呢？我是稀飯 🍚<br>
        我是一個專注於 <b>台股 ETF / 存股</b> 的內容創作者，從 2023 年 10 月開始在 Instagram 寫作，2025 年 6 月擴展到 Facebook。
        平均每天追蹤 30+ 檔 ETF 的配息、填息、新檔上市，立志做台灣最即時的 ETF 觀察家。
      </p>
    </div>

    <div class="section-title">📊 寫作里程碑</div>
    <div class="milestone-grid">
      <div class="milestone">
        <div class="milestone-num">1,059</div>
        <div class="milestone-label">總篇數</div>
      </div>
      <div class="milestone">
        <div class="milestone-num">12</div>
        <div class="milestone-label">主題涵蓋</div>
      </div>
      <div class="milestone">
        <div class="milestone-num">32</div>
        <div class="milestone-label">IG 月份</div>
      </div>
      <div class="milestone">
        <div class="milestone-num">100+</div>
        <div class="milestone-label">月產文</div>
      </div>
    </div>

    <div class="section-title">📅 重要時間軸</div>
    <div class="timeline">
      <div class="timeline-row">
        <div class="timeline-date">2023-10</div>
        <div class="timeline-text"><b>稀飯 IG 開站</b><br>首篇 ETF 介紹文上線</div>
      </div>
      <div class="timeline-row">
        <div class="timeline-date">2025-06</div>
        <div class="timeline-text"><b>擴展 Facebook</b><br>同步發布 + 多平台佈局</div>
      </div>
      <div class="timeline-row">
        <div class="timeline-date">2025-12</div>
        <div class="timeline-text"><b>開始日報級配息追蹤</b><br>月產文從 30 篇 → 100+ 篇</div>
      </div>
      <div class="timeline-row highlight">
        <div class="timeline-date">2026-05</div>
        <div class="timeline-text"><b>月產文突破 200 篇 🎉</b><br>單月 FB 210 篇歷史新高</div>
      </div>
    </div>

    <div class="section-title">🔗 稀飯經營的平台</div>
    <div class="platform-grid">
      <a href="https://stevenhongisme.com" target="_blank" class="platform-pill">📝 部落格</a>
      <a href="https://www.facebook.com/stevenhongisme" target="_blank" class="platform-pill">📘 Facebook</a>
      <a href="https://www.instagram.com/steven.is.me_" target="_blank" class="platform-pill">📸 Instagram</a>
      <a href="https://vocus.cc/user/@stevenhongisme" target="_blank" class="platform-pill">📰 方格子</a>
      <a href="https://www.cmoney.tw/forum/user/6338042" target="_blank" class="platform-pill">📈 股市爆料同學會</a>
      <a href="#" onclick="showToast('付費社團就在本 APP 的「社團」分頁');return false;" class="platform-pill highlight">💎 付費社團（本 APP）</a>
    </div>

    <div class="section-title">❓ 常見問題</div>
    <details class="qa">
      <summary>稀飯這名字怎麼來的？</summary>
      <p>因為我希望我的內容像「稀飯套餐」一樣 — 暖、好消化、營養。每篇貼文都是熱騰騰的一碗。所以每篇我都會用「你今天要不要來點稀飯套餐呢？」開場。</p>
    </details>
    <details class="qa">
      <summary>我是投資新手能跟著操作嗎？</summary>
      <p>稀飯內容偏 ETF 跟存股策略，沒有個股技術分析，新手友善度高。但所有貼文都附「投資一定有風險」聲明，請依個人狀況評估，必要時諮詢理財顧問。</p>
    </details>
    <details class="qa">
      <summary>稀飯會私訊我嗎？</summary>
      <p><b>⚠️ 不會！</b>稀飯只經營部落格、FB、IG、方格子、股市爆料同學會，以及本 APP 的付費社團。<b>不會私訊邀請加入飆股群組</b>，也請勿點擊來路不明的連結。看到都是假冒的 ✋</p>
    </details>
    <details class="qa">
      <summary>為什麼要加入付費社團？</summary>
      <p>免費公開內容是「報導」，APP 付費社團是「解讀」。提前 24 小時收到配息預估推播、每日盤後 ETF 點評、月度持股 portfolio 揭露 — 給願意付月 NT$ 299 的鐵粉。</p>
    </details>
  `;
}

// VIP 文章區
function renderVipSub() {
  const articles = [
    { tag: 'NEW', tagColor: '#dc2626', title: '2026 下半年 ETF 投資全攻略', desc: '8 大主題 ETF 預估、降息環境下的最佳配置、稀飯不藏私的個人持股比例', minutes: 25, locked: true, special: true },
    { tag: 'EXCLUSIVE', tagColor: '#7c3aed', title: '主動式 ETF 完整評等表 (11 檔)', desc: '從成立績效、選股邏輯、產業配置到費用率，給 11 檔主動式 ETF 完整評等 ABCD', minutes: 18, locked: true },
    { tag: 'EXCLUSIVE', tagColor: '#7c3aed', title: '補充保費避稅 4 大策略', desc: '高股息持有人必看 — 怎麼配置避免被課 2.11%、資本利得型 ETF 的選法', minutes: 12, locked: true },
    { tag: 'MEMBER', tagColor: '#0891b2', title: '我的個人持股配比公開', desc: '稀飯自己錢都放哪？月配 vs 季配怎麼搭？1,200 萬的真實資產配置揭露', minutes: 15, locked: true },
    { tag: 'FREE', tagColor: '#10b981', title: '2026 全年除息行事曆完整版', desc: '500+ ETF 配息預估、除息日、發放日、補充保費警示等等。<b>新會員首月免費</b>', minutes: 8, locked: false, free: true },
  ];

  const html = articles.map(a => {
    const lockIcon = a.locked ? '🔒' : '✅';
    const cta = a.locked ? '訂閱 VIP 解鎖' : '免費閱讀 →';
    const ctaColor = a.locked ? '#dc2626' : '#10b981';
    return `
      <div class="vip-article ${a.locked ? 'locked' : ''}" onclick="${a.locked ? "showToast('🔒 VIP 文章 — 請先訂閱')" : "showToast('已解鎖 — Prototype 不含真實內容')"}">
        <div class="vip-tag" style="background:${a.tagColor}">${a.tag}</div>
        <h3 class="vip-title">${lockIcon} ${a.title}</h3>
        <p class="vip-desc">${a.desc}</p>
        <div class="vip-footer">
          <span class="vip-time">⏱️ ${a.minutes} 分鐘閱讀</span>
          <span class="vip-cta" style="color:${ctaColor}">${cta}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="vip-banner">
      <div class="vip-banner-icon">💎</div>
      <div style="flex:1">
        <div class="vip-banner-title">VIP 限定文章區</div>
        <div class="vip-banner-sub">每月新增 8-12 篇深度分析，<b>NT$ 299/月</b> 解鎖全部</div>
      </div>
      <a href="#monetize" class="vip-banner-btn">立即訂閱</a>
    </div>

    <div class="section-title">本月精選</div>
    ${html}
  `;
}

// 聊天室
function renderChatSub() {
  const messages = [
    { who: 'host', name: '稀飯', avatar: '🍚', text: '📌 公告：明天 (5/28) 直播解讀 0050 換股結果，晚上 20:00 社團直播開講，記得設提醒！', time: '10:32', pinned: true },
    { who: 'user', name: '存股族阿明', text: '請問月配 ETF 跟季配怎麼選比較好？', time: '11:05' },
    { who: 'host', name: '稀飯', avatar: '🍚', text: '@存股族阿明 看你的現金流需求！如果你已經退休要每月有錢花 → 月配；如果還在累積階段 → 季配填息率通常比較好。我寫過一篇分析👇', time: '11:08' },
    { who: 'host', name: '稀飯', avatar: '🍚', text: '👉 [月配 vs 季配完整比較] - 5/15 發在付費社團獨家', time: '11:08', isLink: true },
    { who: 'user', name: '小美', text: '00919 這次 0.78 創新高耶！要不要追？', time: '11:23' },
    { who: 'user', name: '飯友 K', text: '配得多不一定是好事 要看填息率啊', time: '11:25' },
    { who: 'host', name: '稀飯', avatar: '🍚', text: '@小美 對，00919 這次配很猛！我自己抱著沒賣，但提醒大家：高股息追高要小心追到除息高點 ⚠️', time: '11:28' },
    { who: 'user', name: '新手姐', text: '稀飯老師你的補充保費試算機真的太方便！', time: '11:42' },
    { who: 'host', name: '稀飯', avatar: '🍚', text: '@新手姐 謝謝支持～完整版我會持續加入更多 ETF。最近會新增「年度試算」功能！', time: '11:43' },
    { who: 'user', name: 'ETF 新手', text: '請問 0050 還可以買嗎？已經 75 元了 怕追高...', time: '12:01' },
    { who: 'host', name: '稀飯', avatar: '🍚', text: '@ETF 新手 怕追高就用「定期定額」啊！不要猜高低點。我已經陪大家定期定額買 0050 一年多了，從 48 元一路扣到現在 75 元，平均成本 56 元。', time: '12:03' },
  ];

  const msgHtml = messages.map(m => {
    if (m.pinned) {
      return `<div class="chat-pin">📌 ${escapeHtml(m.text)}</div>`;
    }
    const isHost = m.who === 'host';
    return `
      <div class="chat-msg ${isHost ? 'host' : 'user'}">
        ${isHost ? `<div class="chat-avatar host-avatar">${m.avatar}</div>` : ''}
        <div class="chat-bubble-wrap">
          <div class="chat-name">${isHost ? `<b>${m.name}</b> <span class="chat-badge">作者</span>` : m.name}</div>
          <div class="chat-bubble ${isHost ? 'host-bubble' : ''} ${m.isLink ? 'is-link' : ''}">${escapeHtml(m.text)}</div>
          <div class="chat-time">${m.time}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="chat-header">
      <div>
        <div class="chat-title">💎 稀飯付費社團</div>
        <div class="chat-sub">當前 50 人 · 24 小時內 23 則訊息</div>
      </div>
      <div class="chat-online">● 在線</div>
    </div>

    <div class="chat-room">${msgHtml}</div>

    <div class="chat-locked">
      <div class="chat-locked-icon">🔒</div>
      <div class="chat-locked-text">
        <b>升級 VIP 才能發言</b><br>
        <span style="font-size:11px;color:#6b7280">月 NT$ 299 / 季 NT$ 799 / 年 NT$ 2,790</span>
      </div>
      <a href="#monetize" class="chat-locked-btn">立即加入</a>
    </div>
  `;
}

// ─── Utilities ───────────────────────────────────────────────
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Init ────────────────────────────────────────────────────
(function init() {
  loadData();
  detectRole();
  handleRoute();
})();
