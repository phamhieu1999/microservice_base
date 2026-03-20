# CI cho Auth Service

Cấu hình CI (Lint, Test, Build) riêng cho **auth-service**. Chọn một trong ba: GitHub Actions, GitLab CI hoặc Jenkins.

---

## 1. GitHub Actions

**File:** `.github/workflows/auth-service.yml`

- **Kích hoạt:** Push hoặc Pull Request có thay đổi trong `services/auth-service/**` hoặc chính file workflow.
- **Bước:** Checkout → Node 20 → Install → Lint → Test → Build.
- **Thư mục làm việc:** `services/auth-service` (defaults.run.working-directory).

**Cách dùng:** Đẩy code lên GitHub, pipeline tự chạy khi có thay đổi auth-service. Xem kết quả tại **Actions**.

```bash
# Chạy tương đương trên máy
cd services/auth-service
npm install
npm run lint
npm run test -- --passWithNoTests
npm run build
```

---

## 2. GitLab CI

**File:** `.gitlab-ci.yml` (ở root repo)

- **Jobs:** `auth-service:lint`, `auth-service:test`, `auth-service:build`.
- **Kích hoạt:** Chỉ khi có thay đổi trong `services/auth-service/**` (merge request hoặc push branch).
- **Image:** `node:20-alpine`.
- **Cache:** `services/auth-service/node_modules` theo branch.
- **Artifacts:** Build output `services/auth-service/dist/` (giữ 1 ngày).

**Cách dùng:** Push hoặc MR lên GitLab; pipeline chỉ chạy job auth-service khi có sửa trong auth-service.

**Lưu ý:** Nếu repo dùng monorepo với lockfile ở root, có thể sửa `before_script` để cài từ root:

```yaml
before_script:
  - npm ci 2>/dev/null || npm install
  - cd services/auth-service && npm ci 2>/dev/null || npm install
```

---

## 3. Jenkins

**File:** `services/auth-service/Jenkinsfile`

- **Stages:** Checkout → Setup Node → Install → Lint → Test → Build.
- **Yêu cầu:** Plugin **NodeJS** và cấu hình tool "Node.js 20" trong Jenkins (Manage Jenkins → Global Tool Configuration).

**Cách tạo job:**

1. **New Item** → **Pipeline**.
2. **Pipeline** → Definition: **Pipeline script from SCM**.
3. SCM: Git, repo URL, branch.
4. **Script Path:** `services/auth-service/Jenkinsfile`.

**Nếu chưa có Node.js tool:** Đổi stage Setup Node thành dùng Docker hoặc nvm. Ví dụ dùng Docker:

```groovy
stage('Lint') {
  steps {
    docker.image("node:20-alpine").inside("-v ${env.WORKSPACE}:${env.WORKSPACE} -w ${env.WORKSPACE}/${env.SERVICE_DIR}") {
      sh 'npm ci 2>/dev/null || npm install'
      sh 'npm run lint'
    }
  }
}
```

Hoặc cài Node bằng nvm trong shell.

---

## Tóm tắt

| Nền tảng   | File                         | Kích hoạt theo path      |
|-----------|------------------------------|---------------------------|
| GitHub    | `.github/workflows/auth-service.yml` | `services/auth-service/**` |
| GitLab    | `.gitlab-ci.yml`             | `services/auth-service/**` |
| Jenkins   | `services/auth-service/Jenkinsfile` | Chạy khi build pipeline   |

Cả ba đều chạy: **lint** (eslint) → **test** (jest, `--passWithNoTests`) → **build** (nest build).
