# コストダッシュボード

検品コスト・直入庫コストを可視化するダッシュボードです。  
Google スプレッドシートと連携し、シートに追記するだけで自動更新されます。

---

## セットアップ手順

### 1. GitHubにリポジトリ作成

1. [github.com/new](https://github.com/new) でリポジトリを作成（名前例：`cost-dashboard`）
2. このフォルダ内のファイルをすべてアップロード、またはgit pushする

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/cost-dashboard.git
git push -u origin main
```

---

### 2. Google Sheets API の設定

#### 2-1. Google Cloud でサービスアカウントを作成

1. [console.cloud.google.com](https://console.cloud.google.com) にアクセス
2. 新しいプロジェクトを作成（または既存のものを使用）
3. 左メニュー → **「APIとサービス」→「ライブラリ」**
4. 「Google Sheets API」を検索して **有効化**
5. **「APIとサービス」→「認証情報」→「認証情報を作成」→「サービスアカウント」**
6. サービスアカウントに名前をつけて作成
7. 作成されたサービスアカウントをクリック → **「キー」タブ → 「鍵を追加」→「JSON」**
8. ダウンロードされたJSONファイルを保存（後で使います）

#### 2-2. スプレッドシートを共有

1. ダッシュボードで使うGoogleスプレッドシートを開く
2. 右上「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（例：`xxx@project.iam.gserviceaccount.com`）を追加
4. 権限：「閲覧者」でOK

#### 2-3. スプレッドシートのシート名を確認

- 検品コストのシート名（例：`検品コスト`）
- 直入庫コストのシート名（例：`直入庫コスト`）

スプレッドシートのURLから **スプレッドシートID** をメモ：  
`https://docs.google.com/spreadsheets/d/【ここがID】/edit`

---

### 3. Vercelにデプロイ

1. [vercel.com](https://vercel.com) にGitHubアカウントでログイン
2. 「New Project」→ GitHubのリポジトリを選択
3. 「Environment Variables」に以下を設定：

| 変数名 | 値 |
|--------|-----|
| `DASHBOARD_PASSWORD` | 任意のパスワード（例：`mypass123`） |
| `GOOGLE_SHEETS_ID` | スプレッドシートのID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | サービスアカウントのメール |
| `GOOGLE_PRIVATE_KEY` | JSONファイル内の `private_key` の値をそのままコピー |
| `INSPECTION_SHEET_NAME` | 検品コストのシート名（例：`検品コスト`） |
| `DIRECT_SHEET_NAME` | 直入庫コストのシート名（例：`直入庫コスト`） |

> ⚠️ `GOOGLE_PRIVATE_KEY` は `"` で囲まれた長い文字列です。改行 `\n` を含むままコピーしてください。

4. 「Deploy」ボタンを押す → 自動でビルド・公開されます
5. 表示されたURLをチームに共有

---

### 4. スプレッドシートの列構成（検品コストシート）

| 列名 | 内容 |
|------|------|
| 年月 | YYYY/MM 形式 |
| 日付 | YYYY/MM/DD 形式（年月の代わりに使用可） |
| 工場 | 工場名 |
| 検品会社 | 検品会社名 |
| 品番 | 品番コード |
| 良品数 | 良品の数量 |
| 不良数 | 不良品の数量 |
| 検品数 | 検品合計数（良品＋不良品） |
| 検品費 | 検品にかかった費用 |
| BASE | BASE金額 |
| 抜き取り | 抜き取り費用 |
| その他 | その他費用 |
| 差額 | 差額 |

### スプレッドシートの列構成（直入庫コストシート）

| 列名 | 内容 |
|------|------|
| 報告日 | YYYY/MM/DD 形式 |
| 工場名 | 工場名 |
| 品番 | 品番コード |
| 納品数/抜き取り数 の組み合わせ | 納品数と抜取数 |
| 良品数 | 良品の数量 |
| 検品会社 | 検品会社名 |
| 梱包費 | 梱包費用 |
| BASE | BASE金額 |
| 差額 | 差額 |

---

## データ更新方法

スプレッドシートに新しい行を追記するだけで、ダッシュボードの「🔄 更新」ボタンを押すと最新データが反映されます。  
VercelはAPIをサーバーサイドで処理するため、スプシへの追記 → 更新ボタン → 即反映されます。

---

## ローカルで動かす場合

```bash
# 依存パッケージをインストール
npm install

# .env.local を作成
cp .env.local.example .env.local
# .env.local を編集して各値を設定

# 開発サーバー起動
npm run dev
# → http://localhost:3000 で確認
```
