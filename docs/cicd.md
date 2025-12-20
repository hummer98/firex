# CI/CD Integration

This guide explains how to use firex in CI/CD environments, particularly with GitHub Actions using Workload Identity Federation.

## GitHub Actions with Workload Identity Federation

Workload Identity Federation allows GitHub Actions to authenticate with Google Cloud without storing service account keys. This is the recommended approach for CI/CD.

### Benefits

- **No long-lived credentials** - No service account keys to manage or rotate
- **Short-lived tokens** - Automatically generated per workflow run
- **No risk of key leakage** - Keys never leave Google Cloud

### GCP Setup

#### 1. Create a Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

#### 2. Create a GitHub Provider

```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

#### 3. Create a Service Account (if needed)

```bash
gcloud iam service-accounts create "firex-cicd" \
  --display-name="firex CI/CD Service Account"
```

#### 4. Grant Firestore Access to the Service Account

```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:firex-cicd@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

#### 5. Allow GitHub Actions to Impersonate the Service Account

```bash
gcloud iam service-accounts add-iam-policy-binding "firex-cicd@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/OWNER/REPO"
```

Replace:
- `PROJECT_ID` - Your GCP project ID
- `PROJECT_NUMBER` - Your GCP project number (numeric)
- `OWNER/REPO` - Your GitHub repository (e.g., `myorg/myrepo`)

### GitHub Actions Workflow Example

```yaml
name: Firestore Backup

on:
  schedule:
    - cron: '0 0 * * *'  # Daily backup
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for OIDC

    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
          service_account: 'firex-cicd@PROJECT_ID.iam.gserviceaccount.com'

      - name: Export Firestore collection
        run: npx @hummer98/firex export users --output backup.json

      - uses: actions/upload-artifact@v4
        with:
          name: firestore-backup
          path: backup.json
```

> **Note**: The `google-github-actions/auth` action automatically sets `GOOGLE_APPLICATION_CREDENTIALS`. firex (via Firebase Admin SDK) uses this for authentication automatically. No additional configuration is required.

### Other CI/CD Platforms

Workload Identity Federation also supports:
- **GitLab CI/CD** - Use GitLab's OIDC provider
- **CircleCI** - Use CircleCI's OIDC tokens
- **Azure DevOps** - Use Azure AD workload identity

Refer to [Google Cloud documentation](https://cloud.google.com/iam/docs/workload-identity-federation) for platform-specific setup.

## Alternative: Service Account Key (Not Recommended)

If Workload Identity Federation is not available, you can use a service account key stored as a GitHub secret:

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}

- name: Run firex
  run: npx @hummer98/firex list users
```

> **Warning**: Service account keys are long-lived credentials. If compromised, they can be used until manually revoked. Prefer Workload Identity Federation whenever possible.
