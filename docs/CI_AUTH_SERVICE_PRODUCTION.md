# CI/CD Production – Auth Service (ví dụ)

Ví dụ pipeline **production** cho auth-service: test → build Docker image → push registry → deploy.

---

## 1. GitHub Actions (Production)

**File:** `.github/workflows/auth-service-production.yml`

### Kích hoạt
- Push vào `main` hoặc `master` (có thay đổi trong `services/auth-service/**`)
- Khi tạo **Release** (published)
- **Manual:** Workflow dispatch (chọn environment: production / staging)

### Luồng
1. **test-and-build:** Lint → Test → Build app → Docker meta (tags) → Login GHCR → Build & push image (cache GHA).
2. **deploy-production:** Chạy khi branch main/master hoặc release; dùng GitHub **Environment** `production` (có thể bật approval, protection rules).

### Secrets / Cấu hình
- **GITHUB_TOKEN:** Tự có, dùng push lên GitHub Container Registry (ghcr.io).
- Nếu dùng registry khác (Docker Hub, GitLab): thêm secrets (ví dụ `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`) và đổi bước login/push.
- Deploy thực tế: cấu hình `DEPLOY_HOST`, `SSH_PRIVATE_KEY` (hoặc kubeconfig) trong Environment **production** và bỏ comment các lệnh trong bước "Deploy to production".

### Image
- Mặc định: `ghcr.io/<owner>/auth-service:<branch|sha|latest>`.
- Đổi `env.REGISTRY` và repo trong bước Docker meta nếu dùng registry khác.

---

## 2. GitLab CI (Production)

**File mẫu:** `.gitlab-ci-production.yml.example`

### Cách dùng
- **Cách 1:** Đổi tên thành `.gitlab-ci.yml` (thay file hiện tại) hoặc merge nội dung vào `.gitlab-ci.yml`.
- **Cách 2:** Include trong `.gitlab-ci.yml`:
  ```yaml
  include:
    - local: .gitlab-ci-production.yml.example
  ```

### Stages
- **test:** Lint + test + build (chỉ khi có thay đổi auth-service trên default branch hoặc MR).
- **build:** Build Docker image, push lên **GitLab Container Registry** (`$CI_REGISTRY_IMAGE/auth-service:$CI_COMMIT_SHORT_SHA` và `latest`).
- **deploy:** Job **manual** `deploy:auth-service:production`, dùng GitLab **Environment** `production` (có thể set URL: `https://auth.example.com`).

### Biến / Secrets
- `CI_REGISTRY`, `CI_REGISTRY_USER`, `CI_REGISTRY_PASSWORD`: GitLab tự inject.
- Deploy qua SSH: thêm biến **Variables** (masked): `SSH_PRIVATE_KEY`, `PRODUCTION_USER`, `PRODUCTION_HOST` và bỏ comment lệnh SSH trong job deploy.

### Chạy build Docker
- Cần **Docker-in-Docker** (services: docker:dind); GitLab Runner cần quyền chạy Docker (privileged hoặc docker socket).

---

## 3. Jenkins (Production)

**File:** `services/auth-service/Jenkinsfile.production`

### Cách dùng
- Tạo **Pipeline** job, **Pipeline script from SCM**, **Script Path:** `services/auth-service/Jenkinsfile.production`.
- Hoặc dùng **Multibranch Pipeline**; Jenkins nhận branch và chạy file này cho auth-service.

### Tham số (Parameters)
- **DEPLOY_ENV:** `none` | `staging` | `production` — deploy chỉ chạy khi chọn `production` (và branch main/master).
- **REGISTRY:** ví dụ `ghcr.io`, `docker.io`, `registry.gitlab.com`.
- **IMAGE_NAMESPACE:** org/namespace trên registry (ví dụ `myorg` → `ghcr.io/myorg/auth-service`).

### Stages
1. **Lint & Test:** Giống Jenkinsfile thường (Node, lint, test, build).
2. **Docker Build & Push:** Chạy khi branch `main`, `master` hoặc `release/*`; build image từ `services/auth-service/Dockerfile`, push tag `BUILD_NUMBER` và `latest`. Cần **Credentials** Jenkins (ID: `registry-credentials-id`) cho registry.
3. **Deploy to Production:** Chạy khi branch main/master **và** DEPLOY_ENV = `production`; trong script chỉ cần bỏ comment và cấu hình SSH hoặc kubectl.

### Credentials
- **registry-credentials-id:** Username/Password (hoặc token) cho registry.
- Deploy: **production-ssh** (SSH key) hoặc **kube-prod** (kubeconfig) tùy cách deploy.

---

## 4. So sánh nhanh

| Nền tảng   | File                                      | Build image     | Push registry     | Deploy production   |
|------------|-------------------------------------------|-----------------|--------------------|----------------------|
| GitHub     | `.github/workflows/auth-service-production.yml` | Docker build-push | GHCR (hoặc khác)   | Environment + script |
| GitLab     | `.gitlab-ci-production.yml.example`      | docker build/push | GitLab Registry    | Job manual + env     |
| Jenkins    | `services/auth-service/Jenkinsfile.production`  | docker build/push | Parameter REGISTRY | Parameter DEPLOY_ENV |

---

## 5. Deploy thực tế (gợi ý)

- **Docker Compose trên VPS:** SSH vào server, `docker compose pull auth-service && docker compose up -d auth-service` (compose file trỏ image từ registry).
- **Kubernetes:** `kubectl set image deployment/auth-service auth-service=<image:tag> -n production` rồi `kubectl rollout status`.
- **GitHub/GitLab Environment:** Bật approval cho environment `production` để deploy chỉ chạy sau khi có người duyệt.

Sau khi cấu hình xong secrets và biến môi trường, chỉ cần push lên branch chính (hoặc tạo release) để chạy pipeline production cho auth-service.
