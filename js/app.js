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
      <span style="font-size:12px">加入稀飯 LINE 封閉社群，每日盤後 ETF 點評、配息預估提前 24 小時推送。</span><br>
      <a href="#monetize" class="upsell-cta" data-view-link>看訂閱方案 →</a>
    </div>
  `;
}

// ─── Calculator ──────────────────────────────────────────────
// Typical dividend per share per payout (rough estimates for prototype)
const ETF_TYPICAL_DIVIDEND = {
  '0050': 1.00,    // 半年配 ~1元/股
  '006208': 1.40,
  '0056': 0.866,   // 季配
  '00878': 0.42,
  '00919': 0.78,
  '00929': 0.09,   // 月配
  '00713': 0.78,
  '00918': 0.565,
  '00891': 0.60,
  '00927': 0.91,
  '00981A': 0.41,
  '00403A': 0,      // 首配未公佈
  '2330': 6.00,    // 季配（年4次，每次估6元）
  '2317': 5.50,
  '2308': 14.00,
  '2454': 24.00,
};

function initCalc() {
  const sel = document.getElementById('calc-etf');
  if (sel.options.length === 0) {
    // Populate options once
    State.etfs.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.code;
      opt.textContent = `${e.code} ${e.name}`;
      opt.dataset.dividend = ETF_TYPICAL_DIVIDEND[e.code] || 1.0;
      sel.appendChild(opt);
    });
    sel.value = '0050';

    sel.addEventListener('change', onCalcEtfChange);
    document.getElementById('calc-shares').addEventListener('input', recalc);
    document.getElementById('calc-dividend').addEventListener('input', recalc);
  }
  // Set initial dividend
  onCalcEtfChange();
  recalc();
}

function onCalcEtfChange() {
  const sel = document.getElementById('calc-etf');
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('calc-dividend').value = opt.dataset.dividend || '1.00';
  recalc();
}

function recalc() {
  const shares = parseInt(document.getElementById('calc-shares').value) || 0;
  const divPerShare = parseFloat(document.getElementById('calc-dividend').value) || 0;
  const totalDividend = shares * 1000 * divPerShare; // 1 zhang = 1000 shares

  const threshold = 20000;
  const triggered = totalDividend >= threshold;
  const fee = triggered ? totalDividend * 0.0211 : 0;
  const sharesToTrigger = divPerShare > 0 ? Math.ceil(threshold / (divPerShare * 1000)) : 0;

  document.getElementById('calc-total').textContent = `NT$ ${formatNum(totalDividend)}`;
  document.getElementById('calc-trigger').textContent = triggered ? '是 ⚠️' : '否 ✓';
  document.getElementById('calc-trigger').className = 'calc-result-val ' + (triggered ? 'warn' : 'good');
  document.getElementById('calc-fee').textContent = `NT$ ${formatNum(fee)}`;
  document.getElementById('calc-fee').className = 'calc-result-val ' + (triggered ? 'warn' : '');
  document.getElementById('calc-threshold').textContent = sharesToTrigger > 0 ? `${sharesToTrigger} 張` : '— 張';

  const pctOfThreshold = Math.min(100, (totalDividend / threshold) * 100);
  document.getElementById('calc-bar').style.width = pctOfThreshold + '%';
}

function formatNum(n) {
  return Math.round(n).toLocaleString('en-US');
}

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
const ALLOC_COLORS = { '市值型 ETF': '#10b981', '高股息 ETF': '#f59e0b', '美股 ETF': '#6366f1', '債券 ETF': '#ec4899' };

const ALLOCATION_BY_AGE = {
  '20-30': {
    stage: '資產累積初期',
    description: '時間是最大資產 — 用 10-30 年的長期複利累積部位。風險承受度最高，重點抓成長。',
    allocation: [
      { name: '市值型 ETF', pct: 70, suggested: ['0050', '006208', '00692'], note: '長期跟著大盤成長，分割後 0050 入手門檻低' },
      { name: '高股息 ETF', pct: 20, suggested: ['00878', '0056'], note: '小比例培養領息習慣，享受配息再投入複利' },
      { name: '美股 ETF', pct: 10, suggested: ['009815', '00646'], note: '降低台股單一市場集中' }
    ],
    tip: '剛起步不要怕跌，跌的時候反而是累積張數的最佳時機。設定每月固定扣款，10 年不中斷，複利會驚艷你。新手不要碰主動式 ETF 或槓桿型，先把市值型存好。',
    monthlyBudget: '建議每月 NT$ 5,000-10,000 起步'
  },
  '30-40': {
    stage: '家庭組成期',
    description: '可能買房、結婚、生子，現金流需求上升，但時間仍長，成長依然主軸。',
    allocation: [
      { name: '市值型 ETF', pct: 50, suggested: ['0050', '006208'], note: '主力仍在成長端' },
      { name: '高股息 ETF', pct: 30, suggested: ['00878', '00919', '0056'], note: '配息再投入或補家用' },
      { name: '美股 ETF', pct: 10, suggested: ['009815', '00646'], note: '全球分散' },
      { name: '債券 ETF', pct: 10, suggested: ['00679B', '00937B'], note: '小比例降波動' }
    ],
    tip: '可以試月配 ETF（00929、00940、00946）培養領息感，但月配仍要看「填息率」+「殖利率」雙指標。00919、0056 這種季配老牌仍是核心。',
    monthlyBudget: '建議每月 NT$ 10,000-30,000'
  },
  '40-50': {
    stage: '中堅期',
    description: '事業高峰、收入較穩，要從「累積資產」逐漸轉向「打造被動現金流」。',
    allocation: [
      { name: '市值型 ETF', pct: 35, suggested: ['0050', '006208'], note: '保留成長部位抗通膨' },
      { name: '高股息 ETF', pct: 35, suggested: ['00878', '00919', '00918', '00713'], note: '主力轉為現金流' },
      { name: '美股 ETF', pct: 10, suggested: ['009815'], note: '分散' },
      { name: '債券 ETF', pct: 20, suggested: ['00679B', '00937B'], note: '增加穩定度' }
    ],
    tip: '開始重視「填息率」而非「殖利率」— 配得高但填不回來等於沒賺。可用工具頁的試算機檢查持有張數是否觸發補充保費。',
    monthlyBudget: '建議每月 NT$ 20,000-50,000'
  },
  '50-60': {
    stage: '退休準備期',
    description: '距離退休 5-10 年，要把資產「轉換」成穩定現金流，降低波動。',
    allocation: [
      { name: '市值型 ETF', pct: 20, suggested: ['0050'], note: '保留少量抗通膨' },
      { name: '高股息 ETF', pct: 45, suggested: ['00878', '00919', '00891', '00918'], note: '主力現金流' },
      { name: '美股 ETF', pct: 15, suggested: ['009815', '00646'], note: '匯率分散' },
      { name: '債券 ETF', pct: 20, suggested: ['00679B', '00937B'], note: '降低波動' }
    ],
    tip: '組合月配 + 季配 + 半年配 ETF 做到「月月領息」現金流。可以開始試算退休後每月被動收入需求 vs 預期支出。',
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
      <a href="#" onclick="showToast('Dcard - @stevenhongisme');return false;" class="platform-pill">💬 Dcard</a>
      <a href="#" onclick="showToast('方格子 - stevenhongisme');return false;" class="platform-pill">📰 方格子</a>
      <a href="#" onclick="showToast('股市爆料同學會');return false;" class="platform-pill">📈 股市爆料同學會</a>
      <a href="#" onclick="showToast('傳送門 - stevenhongisme');return false;" class="platform-pill">🌐 傳送門</a>
      <a href="#" onclick="showToast('LINE 封閉社群 (付費)');return false;" class="platform-pill highlight">💎 LINE 封閉社群</a>
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
      <p><b>⚠️ 不會！</b>稀飯只經營部落格、FB、IG、Dcard、方格子、股市爆料同學會、傳送門、LINE 封閉社群。<b>不會私訊邀請加入飆股群組</b>，也請勿點擊來路不明的連結。看到都是假冒的 ✋</p>
    </details>
    <details class="qa">
      <summary>為什麼要付費加入 LINE 社群？</summary>
      <p>免費公開內容是「報導」，LINE 封閉社群是「解讀」。提前 24 小時收到配息預估、每日盤後 ETF 點評、月度持股 portfolio 揭露 — 給願意付月 NT$ 299 的鐵粉。</p>
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
    { who: 'host', name: '稀飯', avatar: '🍚', text: '📌 公告：明天 (5/28) 直播解讀 0050 換股結果，晚上 20:00 LINE 群開講，記得設提醒！', time: '10:32', pinned: true },
    { who: 'user', name: '存股族阿明', text: '請問月配 ETF 跟季配怎麼選比較好？', time: '11:05' },
    { who: 'host', name: '稀飯', avatar: '🍚', text: '@存股族阿明 看你的現金流需求！如果你已經退休要每月有錢花 → 月配；如果還在累積階段 → 季配填息率通常比較好。我寫過一篇分析👇', time: '11:08' },
    { who: 'host', name: '稀飯', avatar: '🍚', text: '👉 [月配 vs 季配完整比較] - 5/15 發在 LINE 社群獨家', time: '11:08', isLink: true },
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
        <div class="chat-title">💎 LINE 封閉社群</div>
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
