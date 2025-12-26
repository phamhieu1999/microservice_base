# Load Testing với k6

## 📋 Overview

Load testing scripts sử dụng k6 để test performance của hệ thống.

## 🚀 Setup

### Install k6
```bash
# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# macOS
brew install k6

# Or use Docker
docker pull grafana/k6
```

## 📝 Test Scenarios

### 1. Basic Load Test
**File:** `test/load/k6-load-test.js`

**Scenario:**
- Ramp up: 0 → 20 users (30s)
- Stay: 20 users (1m)
- Ramp up: 20 → 50 users (30s)
- Stay: 50 users (1m)
- Ramp down: 50 → 0 users (30s)

**Tests:**
- Health check
- User registration
- Get products
- Create order

**Run:**
```bash
k6 run test/load/k6-load-test.js
```

**With custom base URL:**
```bash
k6 run --env BASE_URL=http://localhost:3000 test/load/k6-load-test.js
```

## 📊 Metrics

### Thresholds:
- **P95 Latency**: < 500ms
- **Error Rate**: < 1%

### Metrics Collected:
- `http_req_duration` - Request duration
- `http_req_failed` - Failed requests
- `errors` - Custom error rate

## 📈 Results

Results được output ra:
- `stdout` - Console output
- `summary.json` - JSON summary file

## 🔧 Customization

### Adjust Load:
Edit `stages` trong `options`:
```javascript
stages: [
  { duration: '1m', target: 100 },  // 100 concurrent users
  { duration: '5m', target: 100 },
  { duration: '1m', target: 0 },
],
```

### Adjust Thresholds:
```javascript
thresholds: {
  http_req_duration: ['p(95)<1000'], // P95 < 1s
  http_req_failed: ['rate<0.05'],    // Error rate < 5%
},
```

---

**Last Updated:** 2024

