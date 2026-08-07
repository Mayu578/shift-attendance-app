# グランドスタッフ勤怠管理アプリ

出勤・退勤を記録すると、自動で以下を計算します。

- **残業時間**：実働時間 − 所定労働時間（デフォルト8時間、ユーザーごとに変更可能）
- **勤務間インターバル**：前回の退勤から次回の出勤までの休息時間（11時間未満は警告表示）
- **月間集計**：月ごとの総勤務時間・総残業時間・最短インターバル・警告件数

ログイン機能付きで、何人でもアカウント登録可能。管理者画面ではユーザー管理と全スタッフの勤怠閲覧ができます。

**最初に登録した1人が自動的に管理者になります。** それ以降の登録者はスタッフとして登録され、管理者画面から権限を変更できます。

## 構成

- `backend/` : FastAPI（Python）+ SQLite + JWT認証
- `frontend/` : React（Vite + TypeScript）

## セットアップ

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
- DBはSQLite（`backend/attendance.db` に自動生成）。本番運用時は `app/database.py` のURLをPostgreSQLなどに変更してください。
- `app/security.py` の `SECRET_KEY` は本番デプロイ前に必ずランダムな値に変更してください。

### 2. フロントエンド

別のターミナルで:

```bash
cd frontend
npm install
npm run dev
```

- http://localhost:5173 にアクセス

### 3. 使い方

1. `/register` で最初のアカウントを作成 → 自動的に管理者になります
2. 他のスタッフは同じ画面から各自アカウント登録
3. スタッフはログイン後「マイ勤怠」から出勤・退勤を登録
4. 管理者は「全員の勤怠」で全スタッフの月次データを閲覧、「ユーザー管理」で権限変更・無効化・削除が可能

## Render + Vercelへのデプロイ

事前にこのプロジェクトをGitHubリポジトリにpushしておいてください（Render/Vercelはどちらもgit連携でデプロイします）。

### 1. Render（バックエンド + PostgreSQL）

`render.yaml` を使ったBlueprintデプロイが簡単です。

1. [Render](https://render.com)にログイン → 「New +」→「Blueprint」
2. GitHubリポジトリを選択（`render.yaml` を自動検出）
3. `attendance-db`（PostgreSQL）と `attendance-api`（Web Service）が同時に作成される
4. デプロイ完了後、APIのURL（例: `https://attendance-api.onrender.com`）を控える
5. 環境変数 `ALLOWED_ORIGINS` に、後でVercelのURLを設定し直す（一旦は仮のままでOK）

Blueprintを使わない場合は手動で：
- Web Service作成時、Root Directoryを `backend` に設定
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- PostgreSQLを別途作成し、`DATABASE_URL` 環境変数に接続文字列を設定
- `SECRET_KEY` にランダムな文字列を設定

⚠️ 無料プランはアクセスが無いと自動的にスリープします。次のアクセス時に起動に数十秒かかることがあります。

### 2. Vercel（フロントエンド）

1. [Vercel](https://vercel.com)にログイン → 「Add New」→「Project」
2. 同じGitHubリポジトリをインポート
3. **Root Directory** を `frontend` に設定（重要）
4. Framework Presetは自動でVite検出されるはず（Build Command: `npm run build`、Output Directory: `dist`）
5. 「Environment Variables」に `VITE_API_BASE_URL` = RenderのAPI URL（例: `https://attendance-api.onrender.com`）を追加
6. Deploy

### 3. 最後にCORSを更新

VercelのURL（例: `https://attendance-app.vercel.app`）が決まったら、Renderの環境変数 `ALLOWED_ORIGINS` にそのURLを設定して再デプロイしてください。設定しないとフロントエンドからのAPIリクエストがブラウザにブロックされます。

## 今後の拡張候補

- 所定労働時間・インターバル基準時間を画面から設定できるように
- CSV/Excelエクスポート
- 打刻のリアルタイム記録（「今すぐ出勤」ボタン）
- 通知（インターバル不足のアラートメールなど）
