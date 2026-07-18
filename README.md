# Pokémon Championship Series Upcoming 賽程

以 [GitHub Pages](https://pages.github.com/) 呈現 [Pokémon Championship Series](https://championships.pokemon.com/en-us/events?status=upcoming) 的 upcoming 官方賽事。

每筆資料格式範例：

```
2026 Pokémon World Championships - San Francisco
Aug. 28-30
World Championships
```

## 資料來源

本站不直接解析 HTML，而是使用官方頁面內嵌的 JSON API：

- 頁面：`https://championships.pokemon.com/en-us/events?status=upcoming`
- API：`https://championships.pokemon.com/api/events.json?locale=en-us`

`scripts/fetch_events.py` 會抓取 API、轉換欄位後寫入 `data/events.json`。

## 本地預覽

```bash
python scripts/fetch_events.py
python -m http.server 8080
```

瀏覽器開啟 `http://localhost:8080`。

## 部署到 GitHub Pages

1. 將此 repo push 到 GitHub（例如 `dcg-ptcg-div`）。
2. 到 repo **Settings → Pages**：
   - **Build and deployment → Source** 選 **Deploy from a branch**
   - **Branch** 選 `gh-pages`，資料夾選 **`/ (root)`**
3. push 到 `main` 後，workflow 會：
   - 執行 `fetch_events.py` 更新 `data/events.json`
   - 將靜態檔推送到 `gh-pages` 分支
4. 等 1～2 分鐘後，網址為：`https://<username>.github.io/<repo>/`

若 repo 名稱為 `<username>.github.io`，則根網址為 `https://<username>.github.io/`。

### 若 deploy 出現 404

舊版 workflow 使用 **GitHub Actions** 作為 Pages 來源，若 Settings 未啟用會失敗。  
目前已改為推送 **`gh-pages` 分支**，請確認 Pages 來源設為 **`gh-pages` / root**，不是 `GitHub Actions`。

## 自動更新

workflow 每天 UTC 06:00 會重新抓取最新賽程；也可在 GitHub **Actions** 手動執行 **Update events and deploy Pages**。

## 專案結構

```
├── index.html              # 主頁
├── css/style.css
├── js/app.js
├── data/events.json        # 抓取後的賽事資料
├── scripts/fetch_events.py # 抓取腳本
└── .github/workflows/deploy.yml
```

## 免責聲明

非 The Pokémon Company 官方網站。賽事資訊以 [championships.pokemon.com](https://championships.pokemon.com/) 為準。
