# 霞ノ杜小学校（架空）

活動記録の「参加児童代表」は画面では伏字、**印刷プレビュー**でフルネームが表示されます。

`token-gate.js` の `TOKEN_GATE_ORIGIN` を本番ポータルに合わせてください。

## 配信（GitHub Pages）

- **表** … `portal/*/index.html` — ソースに PDF パス・カタログ JS なし（ネタバレ防止）
- **認証** … `portal/kn-gate.html` — 卒業生ログイン後 `portal/kn-hub.html` へ
- **裏** … `portal/*/back.html` — 学校だより・行事など（`school-catalog.js`、PDF リンクあり）

ログイン後は従来どおり **2013〜2019 年度のアーカイブ**、未ログインの裏ページでは **2020〜2026（現在の学校）** が表示されます。

詳細: [`docs/information-classification.md`](docs/information-classification.md)

※ `api/`・`middleware.js` は Vercel 用のオプションです。GitHub Pages では使われません。
