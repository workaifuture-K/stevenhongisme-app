# 稀飯的 ETF 日報 — App Prototype

台股 ETF / 存股 KOL「稀飯」的行動 App 概念原型（WebView 形式，可用手機瀏覽器當 App 體驗）。

> ⚠️ **這是 prototype**：所有數字為示範用途，非實際資料。設計目的是讓作者本人與合作方檢視產品形狀。

## 線上預覽

- 一般版（作者視角）：`/`
- ROI Demo 版（合作方視角，多一個 ROI 後台 tab）：`/?role=cmoney`

## 內容結構（bottom nav）

| Tab | 內容 |
|-----|------|
| 🛠️ 工具 | 補充保費試算機（可互動）、殖利率排行、除息日曆、我的關注 |
| 📚 知識 | 今日重點 + 12 個 ETF/存股主題知識庫（從 1,059 篇貼文抽樣） |
| 🎯 配置 | 5 個年齡層的建議 ETF 配置（圓餅圖 + 建議標的） |
| 👥 社團 | 稀飯專區 / VIP 文章區 / 聊天室 |
| 💰 變現 | 試算工具 / 電子書 / 課程 / LINE 訂閱 / 券商開戶 |
| 📊 ROI | （`?role=cmoney` 限定）營收估算 + 對標 KOL |

## 技術

- 純靜態：HTML + CSS + Vanilla JS，無 build step
- 資料：`data/data.js`（從實際爬取的 1,059 篇貼文抽樣 42 篇 + ETF mock 資料）
- 路由：hash-based SPA（`#home` / `#calc` / `#yield` ...）

## 本地預覽

直接用瀏覽器開 `index.html` 即可（資料以 `<script>` 載入，無 CORS 問題）。

## 部署

接 Netlify，push 到 main 自動部署。設定見 `netlify.toml`（純靜態，publish 根目錄）。

## 資料來源

內容資料由 [stock-toolkit](https://github.com/workaifuture-K/stock-toolkit) KOL 量化工具鏈爬取分析後抽樣產生。
