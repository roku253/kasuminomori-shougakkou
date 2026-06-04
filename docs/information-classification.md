# 情報区分（霞ノ杜小学校サイト）

## GitHub Pages 構成（現行）

| 層 | パス例 | 内容 |
|----|--------|------|
| 表（公開） | `portal/newsletters/index.html` など | 2017〜2026年度の号一覧。未ログインで号を押すと認証モーダル（HTMLソースにPDFパスは直書きしない） |
| 認証 | `portal/kn-gate.html` | ログインID・パスワード → `sessionStorage`（卒業生の入力方法はFAQ）。`school-login.js` は SHA-256 照合のみで平文の正解は含めない |
| ハブ | `portal/kn-hub.html` | 認証後の資料入口（要ログイン） |
| 裏 | `portal/newsletters/back.html` など | PDF 一覧（2017〜2026） |

### 年度・メニュー（`school-catalog.js` / `school-shell.js`）

- **未ログイン** … 2017〜2026年度の一覧表示、クリックで認証。メニューは現役向け（タイムカプセルなし）
- **ログイン後（卒業生）** … 同じ2017〜2026年度を閲覧、メニューは卒業生向け（タイムカプセルあり）

### タイムカプセル

- 一覧: `archives/time-capsule/` — 2017〜2026
- 実体: **2020年度作成分**（`archives/time-capsule/2020/`、関連記録は `archives/2019/`）

## A — 完全公開

`assets/pdf/notice-*.pdf` — トップの各種お知らせ

## 注意

- 裏ページのソースには PDF パスが含まれます（認証後に到達する想定）
- 表ページの View Source では PDF 情報は出ません
- PDF の直 URL は GitHub Pages では遮断できません（リポジトリ・URL 共有に注意）
