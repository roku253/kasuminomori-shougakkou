# 情報区分（霞ノ杜小学校サイト）

## GitHub Pages 構成（現行）

| 層 | パス例 | 内容 |
|----|--------|------|
| 表（公開） | `portal/newsletters/index.html` など | 令和2〜8年度の号一覧あり。未ログインで号を押すと認証モーダル（HTMLソースにPDFパスは直書きしない） |
| 認証 | `portal/kn-gate.html` | 卒業生（在学時氏名＋生年月日）→ `sessionStorage` |
| ハブ | `portal/kn-hub.html` | 認証後の資料入口（要ログイン） |
| 裏 | `portal/newsletters/back.html` など | 従来の PDF 一覧・年度切替 |

### 年度・メニュー（従来どおり `school-catalog.js` / `school-shell.js`）

- **未ログイン** … 令和2〜8年度（2020〜2026）、メニューは現役向け
- **ログイン後（卒業生）** … 平成25〜31年度（2013〜2019）、メニューは卒業生向け（行事・タイムカプセル等）

## A — 完全公開

`assets/pdf/notice-*.pdf` — トップの各種お知らせ

## 注意

- 裏ページのソースには PDF パスが含まれます（認証後に到達する想定）
- 表ページの View Source では PDF 情報は出ません
- PDF の直 URL は GitHub Pages では遮断できません（リポジトリ・URL 共有に注意）
