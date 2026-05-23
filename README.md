# 霞ノ杜小学校（架空）

活動記録の「参加児童代表」は画面では伏字、**印刷プレビュー**でフルネームが表示されます。

`token-gate.js` の `TOKEN_GATE_ORIGIN` を本番ポータルに合わせてください。

## 配信（GitHub Pages）

- **表** … `portal/*/index.html` — ソースに PDF パス・カタログ JS なし（ネタバレ防止）
- **認証** … `portal/kn-gate.html` — ログインID・パスワード（卒業生の入力方法はFAQ）→ `sessionStorage` → `portal/kn-hub.html`
- **裏** … `portal/*/back.html` — 学校だより・行事など（`school-catalog.js`、PDF リンクあり）

学校だより・行事・学校生活は **2017〜2026年度（10年）** を常に表示。未ログインでも号一覧は見え、クリック時に認証モーダルが開きます。卒業生ログイン後は同じ10年分を閲覧でき、メニューにタイムカプセルが追加されます。

タイムカプセルは **2017〜2026 の一覧**、中身は **2021年度のみ** 公開です。

詳細: [`docs/information-classification.md`](docs/information-classification.md)

※ 仮PDFは `assets/pdf/` に配置済み。PDF生成スクリプト（旧 `tools/`）は廃止しました。
