# 霞ノ杜小学校（架空）

活動記録の「参加児童代表」は画面では伏字、**印刷プレビュー**でフルネームが表示されます。

`token-gate.js` の `TOKEN_GATE_ORIGIN` を本番ポータルに合わせてください。

## 関係者認証（個人情報を含む PDF）

- 学校だより・保健だより・名簿などは **Cookie + Edge Middleware** で保護（`notice-*` のみ公開）。
- 本番（Vercel）では [`.env.example`](.env.example) を参照し、Dashboard に `KN_AUTH_SECRET` / `KN_GRADUATE_NAMES` / `KN_GRADUATE_BIRTHS` を設定してください。
- ローカル確認: `npx vercel dev`（静的ファイルだけのプレビューでは API / Middleware は動きません）。

詳細: [`docs/information-classification.md`](docs/information-classification.md)
