// Extended ETF mock data for Yield Ranking / Calendar / Watchlist tools
// Realistic-feel numbers based on actual market estimates as of 2026-05

window.ETFS_EXTENDED = [
  // 高股息系列
  { code: '00919', name: '群益台灣精選高息', payout: '季配', yield_pct: 12.5, price: 24.15, change_pct: 0.42, next_payout: '2026-06-16', last_dividend: 0.78, category: '高股息' },
  { code: '00927', name: '群益台灣半導體收益', payout: '季配', yield_pct: 16.1, price: 27.76, change_pct: 1.32, next_payout: '2026-07-19', last_dividend: 0.94, category: '高股息' },
  { code: '00918', name: '大華優利高填息30', payout: '季配', yield_pct: 10.8, price: 23.07, change_pct: -0.21, next_payout: '2026-06-18', last_dividend: 0.62, category: '高股息' },
  { code: '00878', name: '國泰永續高股息', payout: '季配', yield_pct: 7.4, price: 27.33, change_pct: 0.55, next_payout: '2026-08-18', last_dividend: 0.42, category: '高股息' },
  { code: '0056',  name: '元大高股息', payout: '季配', yield_pct: 9.1, price: 38.23, change_pct: 0.32, next_payout: '2026-07-22', last_dividend: 1.00, category: '高股息' },
  { code: '00713', name: '元大台灣高息低波', payout: '季配', yield_pct: 6.2, price: 51.45, change_pct: -0.15, next_payout: '2026-06-19', last_dividend: 0.78, category: '高股息' },
  { code: '00891', name: '中信關鍵半導體', payout: '季配', yield_pct: 12.0, price: 34.34, change_pct: 0.88, next_payout: '2026-08-18', last_dividend: 1.25, category: '高股息' },
  { code: '00929', name: '復華台灣科技優息', payout: '月配', yield_pct: 5.5, price: 25.10, change_pct: 0.40, next_payout: '2026-06-19', last_dividend: 0.13, category: '高股息' },
  { code: '00939', name: '統一台灣高息動能', payout: '月配', yield_pct: 5.1, price: 16.72, change_pct: 0.18, next_payout: '2026-06-13', last_dividend: 0.072, category: '高股息' },
  { code: '00940', name: '元大台灣價值高息', payout: '月配', yield_pct: 4.4, price: 10.01, change_pct: 0.10, next_payout: '2026-06-11', last_dividend: 0.045, category: '高股息' },
  { code: '00934', name: '中信成長高股息', payout: '月配', yield_pct: 7.4, price: 22.77, change_pct: 0.66, next_payout: '2026-06-12', last_dividend: 0.25, category: '高股息' },
  { code: '00946', name: '群益科技高息成長', payout: '月配', yield_pct: 6.6, price: 11.20, change_pct: 0.27, next_payout: '2026-06-06', last_dividend: 0.058, category: '高股息' },

  // 市值型
  { code: '0050',  name: '元大台灣50', payout: '半年配', yield_pct: 2.9, price: 75.50, change_pct: 0.85, next_payout: '2026-07-22', last_dividend: 1.00, category: '市值型' },
  { code: '006208', name: '富邦台50', payout: '半年配', yield_pct: 2.7, price: 97.20, change_pct: 0.82, next_payout: '2026-07-15', last_dividend: 1.34, category: '市值型' },
  { code: '00692', name: '富邦公司治理', payout: '半年配', yield_pct: 3.1, price: 53.40, change_pct: 0.45, next_payout: '2026-07-19', last_dividend: 0.85, category: '市值型' },

  // 主動式 ETF
  { code: '00981A', name: '主動統一台股增長', payout: '季配', yield_pct: 8.1, price: 16.40, change_pct: 1.10, next_payout: '2026-06-17', last_dividend: 0.41, category: '主動式' },
  { code: '00982A', name: '主動群益台灣強棒', payout: '季配', yield_pct: 11.5, price: 22.40, change_pct: 0.95, next_payout: '2026-05-19', last_dividend: 0.64, category: '主動式' },
  { code: '00403A', name: '主動統一升級50', payout: '季配', yield_pct: 0,    price: 10.37, change_pct: 0.20, next_payout: '2026-11-15', last_dividend: 0,    category: '主動式' },

  // 債券 ETF
  { code: '00679B', name: '元大美債20年', payout: '季配', yield_pct: 4.1, price: 27.45, change_pct: -0.05, next_payout: '2026-07-19', last_dividend: 0.28, category: '債券' },
  { code: '00937B', name: '群益ESG投等債20+', payout: '月配', yield_pct: 5.8, price: 15.20, change_pct: -0.03, next_payout: '2026-06-09', last_dividend: 0.072, category: '債券' },
];
