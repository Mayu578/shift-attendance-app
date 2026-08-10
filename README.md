# グランドスタッフ勤怠管理アプリ

空港グランドスタッフのような変形労働時間制（月175時間などでシフトが組まれ、日によって勤務時間が異なる）の働き方に対応した勤怠管理アプリです。

🔗 **本番URL**: https://shift-attendance-app-eta.vercel.app

## できること

- **ログイン・複数ユーザー登録**：最初に登録した1人が自動的に管理者になり、以降の登録者はスタッフとして登録されます
- **打刻登録**：勤務日を1つ選ぶだけで、あとは時刻だけを入力（日付を毎回選び直す必要はありません）。日をまたぐ夜勤も、終了時刻が開始時刻より前なら自動で翌日と判定します
- **予定シフト vs 実績の記録**：会社が組んだ予定シフト（予定出勤・予定退勤）と、実際の打刻を分けて記録できます
- **残業の自動計算**：1日8時間固定ではなく、**予定シフトの時刻をはみ出した分**（早出＋遅退）だけを残業として計算します（変形労働時間制向け）
- **勤務間インターバルの自動計算**：前回の退勤から次回の出勤までの休息時間を計算し、11時間未満は警告表示します
- **時給・残業時給の設定と給与の可視化**：時給・残業時給を登録すると、日ごと・月ごとの支給見込額が自動計算されます
- **月次サマリー**：月間予定シフト・総勤務時間・残業時間・支給見込額・インターバル警告件数を一覧表示
- **管理者画面**：ユーザー管理（権限変更・無効化・削除）、全スタッフの月次勤怠閲覧

## 構成

- `backend/` : FastAPI（Python）+ PostgreSQL（本番）/ SQLite（ローカル）+ JWT認証
- `frontend/` : React（Vite + TypeScript）

### デプロイ構成

- **フロントエンド**: Vercel（`frontend`ディレクトリをルートに指定）
- **バックエンド**: Render（Web Service、`backend`ディレクトリをルートに指定）
- **データベース**: [Neon](https://neon.tech)（無料枠のPostgreSQLを外部サービスとして利用）
  - Renderの無料プランはPostgreSQLインスタンスをアカウントにつき1つまでしか持てないため、他プロジェクトで既に使っている場合はNeonのような外部無料DBを使うのがおすすめです

## セットアップ（ローカル開発）

### 1. バックエンド

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windowsは venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- APIドキュメント(Swagger UI): http://localhost:8000/docs
- DBはSQLite（`backend/attendance.db` に自動生成）。`DATABASE_URL`環境変数を設定すると、そちらのPostgreSQLが優先されます。
- `app/security.py` の `SECRET_KEY` は本番デプロイ前に必ずランダムな値に変更してください（環境変数`SECRET_KEY`で上書き可能）。

### 2. フロントエンド

別のターミナルで:

```bash
cd frontend
npm install
npm run dev
```

- http://localhost:5173 にアクセス
- バックエンドの接続先を変えたい場合は`.env`に`VITE_API_BASE_URL`を設定（未設定時は`http://localhost:8000`）

### 3. 使い方

1. `/register` で最初のアカウントを作成 → 自動的に管理者になります
2. 他のスタッフは同じ画面から各自アカウント登録
3. スタッフはログイン後「マイ勤怠」から：
   - 「時給を設定する」で時給・残業時給を登録
   - 「打刻を登録」で勤務日・予定シフト・実際の出退勤時刻を入力
4. 管理者は「全員の勤怠」で全スタッフの月次データを閲覧、「ユーザー管理」で権限変更・無効化・削除が可能

## Render + Vercelへのデプロイ

事前にこのプロジェクトをGitHubリポジトリにpushしておいてください（Render/Vercelはどちらもgit連携でデプロイします）。

### 1. Render（バックエンド）

Web Serviceを手動作成する場合：
- Root Directoryを `backend` に設定
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- 環境変数を設定：
  - `DATABASE_URL`：PostgreSQLの接続文字列（Neon等）
  - `SECRET_KEY`：ランダムな文字列
  - `ALLOWED_ORIGINS`：VercelのURL（例: `https://your-app.vercel.app`）
  - `PYTHON_VERSION`：`3.11.9`（最新のPythonだと一部依存パッケージのビルドに失敗するため固定）

`render.yaml`を使ったBlueprintデプロイも可能です（DB作成込みで自動構築されます。ただし無料DBの上限に注意）。

⚠️ 無料プランはアクセスが無いと自動的にスリープします。次のアクセス時に起動に数十秒かかることがあります。

### 2. Vercel（フロントエンド）

1. Vercelでリポジトリをインポート
2. **Root Directory** を `frontend` に設定（重要）
3. 環境変数 `VITE_API_BASE_URL` にRenderのAPI URLを設定
4. Deploy

### 3. CORSを更新

VercelのURLが決まったら、Renderの環境変数 `ALLOWED_ORIGINS` にそのURLを設定して再デプロイしてください。設定しないとフロントエンドからのAPIリクエストがブラウザにブロックされます。

## データベースのスキーマを変更したとき

このアプリはマイグレーションツール（Alembicなど）を使っておらず、起動時に `SQLAlchemy` の `create_all` でテーブルが無ければ作成する仕組みです。そのため、**既存のテーブルにカラムを追加しても、本番DBには自動反映されません**。

開発中でデータを消しても問題ない場合は、以下の手順でリセットできます。

1. NeonのSQL Editor等で、既存テーブルを削除する
```sql
   DROP TABLE IF EXISTS attendances;
   DROP TABLE IF EXISTS users;
```
2. Renderで再デプロイ（Manual Deploy → Deploy latest commit）すると、起動時に新しい構造でテーブルが自動的に作り直されます

本番でユーザーのデータを保持したまま構造変更したい場合は、Alembicなどのマイグレーションツールの導入を検討してください。

## 開発中に詰まったポイント（トラブルシューティング）

- **Renderで`pydantic-core`のビルドが失敗する**：Renderが自動選択したPythonバージョン（3.14など）に対応したビルド済みパッケージが無いと、ソースからのビルドに失敗することがあります。`backend/runtime.txt`または環境変数`PYTHON_VERSION`で`3.11.9`のように明示的に固定すると解決します。
- **Renderの無料PostgreSQLが作成できない**："cannot have more than one active free tier database" というエラーが出る場合、既に別プロジェクトで無料DBを使い切っています。[Neon](https://neon.tech)など外部の無料DBサービスを使うか、不要な既存DBを削除してください。
- **CORSエラー（`No 'Access-Control-Allow-Origin' header`）**：バックエンドの`ALLOWED_ORIGINS`環境変数に、フロントエンドの正確なURL（末尾スラッシュなし）が設定されているか確認し、変更後は再デプロイしてください。

## 今後の拡張候補

- CSV/Excelエクスポート
- 打刻のリアルタイム記録（「今すぐ出勤」ボタン）
- 通知（インターバル不足のアラートメールなど）
- マイグレーションツール（Alembic）の導入