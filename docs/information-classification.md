# 情報区分（霞ノ杜小学校サイト）

実際の小学校サイトと同様、資料を区分して配信します。

## A — 公開

誰でも閲覧可能（認証不要・検索避けは `robots.txt` で補助）。

| 例 | パス |
|----|------|
| いじめ防止方針、学校案内、情報管理規定など | `assets/pdf/notice-*.pdf` |

## B〜D — 関係者向け（要認証）

氏名（在学時）と生年月日で **サーバー認証** 後、HttpOnly Cookie でセッション管理。  
Middleware により **URL 直打ちでも未認証では 403**（HTML リクエスト時はお問い合わせへ誘導）。

| 区分 | 内容 | パス例 |
|------|------|--------|
| B | 学校だより・年間行事（現役年度含む） | `newsletter-*.pdf`, `events-*.pdf` |
| C | 卒業生アーカイブ（年度切替は UI） | 同上（h25〜h30, r1〜r8） |
| D | 保健・学年だより・名簿・給食など | `health-*.pdf`, `grade-news-*.pdf`, `roster-*.pdf`, `lunch-*.pdf` |
| — | タイムカプセル | `assets/time-capsule-*.pdf` |

## 技術

- `POST /api/auth/login` — 認証・Cookie 発行
- `GET /api/auth/session` — セッション確認
- `POST /api/auth/logout` — Cookie 削除
- `middleware.js` — 保護対象 PDF の直アクセス遮断

## 環境変数（本番必須）

| 変数 | 説明 |
|------|------|
| `KN_AUTH_SECRET` | Cookie 署名用秘密鍵 |
| `KN_GRADUATE_NAMES` | 許可氏名（カンマ区切り） |
| `KN_GRADUATE_BIRTHS` | 許可生年月日（数字のみ正規化後照合、カンマ区切り） |

ローカル開発（`vercel dev`）では未設定時のみ開発用デフォルトが使われます。本番で未設定の場合、認証は常に失敗します。
