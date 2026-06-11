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
    searchEl.addEventListener('focus', onCalcSearch);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#calc-etf-search') && !e.target.closest('#calc-etf-dropdown')) {
        document.getElementById('calc-etf-dropdown').style.display = 'none';
      }
    });
  }
  // 預設帶 0056 + 00878 兩檔當示範
  if (calcPortfolio.length === 0) {
    ['0056', '00878'].forEach(c => {
      const e = getEtfDividends().find(x => x.code === c);
      if (e) calcPortfolio.push({ ...e, zhang: 50, odd: 0 });
    });
  }
  renderCalcPortfolio();
}

function onCalcSearch() {
  const q = document.getElementById('calc-etf-search').value.trim().toLowerCase();
  const dd = document.getElementById('calc-etf-dropdown');
  let list = getEtfDividends().filter(e => !calcPortfolio.some(p => p.code === e.code));
  if (q) list = list.filter(e => e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
  list = list.slice(0, 30);
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
        if (e) { calcPortfolio.push({ ...e, zhang: 10, odd: 0 }); renderCalcPortfolio(); }
        document.getElementById('calc-etf-search').value = '';
        document.getElementById('calc-etf-dropdown').style.display = 'none';
      };
    });
  }
  dd.style.display = 'block';
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
  if (calcPortfolio.length === 0) {
    wrap.innerHTML = '<div class="calc-empty">尚未加入 ETF — 用上方搜尋加入你持有的 ETF</div>';
    document.getElementById('calc-summary').style.display = 'none';
    document.getElementById('calc-note').innerHTML = '';
    return;
  }

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

  renderActiveEtfList();
}

// 主動式 ETF 一覽（配置 tab 底部）
let activeEtfFilter = 'all';
const ACTIVE_TYPE_LABEL = { '主動式國內股票型': '台股', '主動式國外股票型': '海外股', '主動式債券型': '債券' };
const ACTIVE_TYPE_COLOR = { '主動式國內股票型': '#10b981', '主動式國外股票型': '#6366f1', '主動式債券型': '#ec4899' };

function renderActiveEtfList() {
  const all = window.ACTIVE_ETFS || [];
  document.querySelectorAll('#active-filters .chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.atype === activeEtfFilter);
    chip.onclick = () => { activeEtfFilter = chip.dataset.atype; renderActiveEtfList(); };
  });
  const list = activeEtfFilter === 'all' ? all : all.filter(e => e.type === activeEtfFilter);
  const el = document.getElementById('active-etf-list');
  if (!el) return;
  el.innerHTML = `<div style="font-size:11px;color:#9ca3af;margin:0 4px 8px">共 ${all.length} 檔主動式 ETF · 顯示 ${list.length} 檔</div>` +
    list.map(e => {
      const tcolor = ACTIVE_TYPE_COLOR[e.type] || '#6b7280';
      const tlabel = ACTIVE_TYPE_LABEL[e.type] || e.type;
      const incept = e.inception && e.inception.length === 8 ? `${e.inception.slice(0,4)}/${e.inception.slice(4,6)}` : '';
      return `
        <div class="active-etf-row" onclick="showToast('${e.code} ${e.name} — 完整評等在評等分頁')">
          <div class="ae-left">
            <span class="ae-type" style="background:${tcolor}">${tlabel}</span>
            <div>
              <div class="ae-code">${e.code} <span class="ae-name">${escapeHtml(e.name)}</span></div>
              <div class="ae-meta">${escapeHtml(e.manager.replace('證券投資信託股份有限公司','投信').replace('證券投資信託','投信'))}${incept ? ' · 成立 '+incept : ''}</div>
            </div>
          </div>
          <div class="ae-fee">${e.mgmt_fee != null ? '費 '+e.mgmt_fee+'%' : ''}</div>
        </div>`;
    }).join('');
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

function renderRating() {
  const order = { S: 0, A: 1, B: 2, C: 3, N: 4 };
  const sorted = [...RATING_DATA].sort((a, b) => order[a.grade] - order[b.grade]);

  const html = sorted.map(r => {
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
    return `
      <div class="rate-card" onclick="showToast('${r.code} 完整評等理由 — 付費社團解鎖（mock）')">
        <div class="rate-head">
          <div class="grade-badge" style="background:${g.bg}">${r.grade}</div>
          <div class="rate-meta">
            <div class="rate-code">${r.code} <span class="rate-name">${escapeHtml(r.name)}</span></div>
            <div class="rate-ytd">今年以來 <b>${r.ytd}</b></div>
          </div>
        </div>
        <div class="rate-dims">${bars}</div>
        <div class="rate-comment">🍚 ${escapeHtml(r.comment)}</div>
      </div>`;
  }).join('');

  document.getElementById('rating-list').innerHTML = html + `
    <div class="upsell" style="margin-top:16px">
      <b>🔓 想看完整評等理由 + 調級即時通知？</b><br>
      <span style="font-size:12px">加入稀飯付費社團（APP 內），評級異動第一時間推播給你。</span><br>
      <a href="#monetize" class="upsell-cta" data-view-link>查看訂閱方案 →</a>
    </div>`;
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
