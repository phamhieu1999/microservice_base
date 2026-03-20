# Git & CI của hệ thống

## 1. Hiện trạng

### Git
- Repo: **monorepo** (một repo chứa nhiều service).
- Branch hiện tại (theo snapshot): `feature/backenđ` (tracking `origin/feature/backenđ`).

### CI (Continuous Integration)
- **Chưa có cấu hình CI** trong repo:
  - Không có `.github/workflows/` (GitHub Actions)
  - Không có `.gitlab-ci.yml` (GitLab CI)
  - Không có `Jenkinsfile`, `.circleci/`, `azure-pipelines.yml`, v.v.

### Scripts hiện có

| Vị trí | Script | Hành vi |
|--------|--------|--------|
| **Root** `package.json` | `npm run lint` | Chỉ `echo "no root lint"` (placeholder) |
| **Root** `package.json` | `npm run test` | Chỉ `echo "run tests per service"` (placeholder) |
| **Từng service** `services/*/package.json` | `lint` | `eslint "src/**/*.ts"` (một số có `--fix`) |
| **Từng service** | `test` | `jest` |
| **Từng service** | `build` | `nest build` |

- Các service dùng **npm workspaces** (`"workspaces": ["services/*"]`), chạy từ root: `npm install` cài chung, có thể chạy script theo workspace.

---

## 2. Workflow CI đã thêm (GitHub Actions)

Nếu repo host trên **GitHub**, đã thêm workflow mặc định tại:

```
.github/workflows/ci.yml
```

Workflow này:
- Chạy trên: **push** vào bất kỳ branch nào, **pull_request** vào bất kỳ branch nào.
- Các bước:
  1. Checkout code.
  2. Setup Node.js (phiên bản LTS).
  3. Cache `node_modules` (theo lockfile).
  4. `npm install` (nếu có `package-lock.json` ở root thì đổi thành `npm ci` trong workflow để build tái lập).
  5. **Lint**: chạy lint cho tất cả workspaces (các service trong `services/`).
  6. **Test**: chạy test cho tất cả workspaces.
  7. **Build** (optional): build tất cả service để đảm bảo compile thành công.

Khi push/PR, GitHub sẽ tự chạy pipeline này; kết quả hiện trên tab **Actions** và trên PR.

---

## 3. Chạy tương đương CI ở local

Root `package.json` đã có script chạy lint/test/build cho tất cả workspaces:

```bash
# Từ root repo
npm install
npm run lint    # eslint cho mọi service
npm run test    # jest cho mọi service
npm run build   # nest build cho mọi service
```

---

## 4. Tóm tắt

| Hạng mục | Trạng thái |
|----------|------------|
| Git | Monorepo, branch feature |
| CI config | Trước: không có → Sau: có `.github/workflows/ci.yml` (nếu dùng GitHub) |
| Lint/Test từng service | Có (eslint, jest, nest build) |
| Lint/Test/Build từ root | Có: `npm run lint/test/build` chạy cho mọi workspace |

Nếu dùng **GitLab** hoặc **Jenkins**, cần tạo file cấu hình tương ứng (`.gitlab-ci.yml` hoặc `Jenkinsfile`) và gọi cùng các lệnh: `npm ci`, lint, test, build.
