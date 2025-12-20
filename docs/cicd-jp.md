# CI/CD 連携

このガイドでは、CI/CD 環境、特に GitHub Actions で Workload Identity Federation を使用して firex を利用する方法を説明します。

## GitHub Actions と Workload Identity Federation

Workload Identity Federation を使用すると、サービスアカウントキーを保存せずに GitHub Actions から Google Cloud に認証できます。CI/CD ではこの方法が推奨されます。

### メリット

- **長期間有効な認証情報が不要** - サービスアカウントキーの管理やローテーションが不要
- **短命トークン** - ワークフロー実行ごとに自動生成
- **キー漏洩リスクなし** - キーは Google Cloud 外に出ない

### GCP 側の設定

#### 1. Workload Identity Pool を作成

```bash
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

#### 2. GitHub プロバイダーを作成

```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

#### 3. サービスアカウントを作成（必要な場合）

```bash
gcloud iam service-accounts create "firex-cicd" \
  --display-name="firex CI/CD Service Account"
```

#### 4. サービスアカウントに Firestore アクセス権を付与

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:firex-cicd@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

#### 5. GitHub Actions がサービスアカウントを使用できるように設定

```bash
gcloud iam service-accounts add-iam-policy-binding "firex-cicd@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/OWNER/REPO"
```

以下を置き換えてください：
- `PROJECT_ID` - GCP プロジェクト ID
- `PROJECT_NUMBER` - GCP プロジェクト番号（数値）
- `OWNER/REPO` - GitHub リポジトリ（例: `myorg/myrepo`）

### GitHub Actions ワークフロー例

```yaml
name: Firestore Backup

on:
  schedule:
    - cron: '0 0 * * *'  # 毎日バックアップ
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # OIDC に必須

    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
          service_account: 'firex-cicd@PROJECT_ID.iam.gserviceaccount.com'

      - name: Firestore コレクションをエクスポート
        run: npx @hummer98/firex export users --output backup.json

      - uses: actions/upload-artifact@v4
        with:
          name: firestore-backup
          path: backup.json
```

> **Note**: `google-github-actions/auth` アクションは自動的に `GOOGLE_APPLICATION_CREDENTIALS` を設定します。firex（Firebase Admin SDK 経由）はこれを自動的に認証に使用するため、追加の設定は不要です。

### その他の CI/CD プラットフォーム

Workload Identity Federation は以下もサポートしています：
- **GitLab CI/CD** - GitLab の OIDC プロバイダーを使用
- **CircleCI** - CircleCI の OIDC トークンを使用
- **Azure DevOps** - Azure AD ワークロード ID を使用

プラットフォーム固有の設定については、[Google Cloud ドキュメント](https://cloud.google.com/iam/docs/workload-identity-federation)を参照してください。

## 代替手段: サービスアカウントキー（非推奨）

Workload Identity Federation が利用できない場合、GitHub シークレットにサービスアカウントキーを保存して使用できます：

```yaml
- name: Google Cloud に認証
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}

- name: firex を実行
  run: npx @hummer98/firex list users
```

> **Warning**: サービスアカウントキーは長期間有効な認証情報です。漏洩した場合、手動で無効化するまで使用され続ける可能性があります。可能な限り Workload Identity Federation を使用してください。
