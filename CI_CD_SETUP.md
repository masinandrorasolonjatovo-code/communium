# CI/CD Pipeline Documentation

Derniere mise a jour: 2026-05-30

## Overview

The CI/CD pipeline is configured using GitHub Actions with the following jobs:

### 1. **TypeScript Compilation Check** (`typescript-check`)
- Verifies that all TypeScript code compiles without errors
- Runs ESLint on the backend code
- Ensures code quality standards are met

### 2. **Unit Tests** (`unit-tests`)
- Runs all unit tests for the matching algorithm
- Uses Jest as the test runner
- Generates code coverage reports
- Uploads coverage to Codecov

### 3. **Load Testing & Performance** (`load-tests`)
- Tests the API under heavy load (100 concurrent users for 30 seconds)
- Verifies response times are within performance targets:
  - Average response time: < 1 second
  - P95 response time: < 2 seconds
  - P99 response time: < 3 seconds
  - Success rate: > 95%
- Uses PostgreSQL and Redis services for testing

### 4. **Code Quality & Formatting** (`code-quality`)
- Checks Prettier formatting for both frontend and backend
- Ensures consistent code style across the project

### 5. **Build Docker Images** (`build-docker`)
- Builds Docker images for all services
- Verifies Dockerfile configurations are correct

## Testing Locally

### Install Dependencies
```bash
cd backend
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev ts-node @types/node
```

### Run Unit Tests
```bash
npm run test:unit
```

### Run Load Tests
```bash
# Make sure your API server is running on localhost:5000
npm run test:load
```

### Run Performance Benchmarks
```bash
npm run test:perf
```

### Run All Tests
```bash
npm test
```

## Matching Algorithm Performance Targets

Given that Communium targets the elite Moroccan audience where performance is critical:

- **Page Load Time Target**: < 2 seconds
- **Matching Algorithm**: Should handle 1000+ users in < 2 seconds
- **API Response Time**: 
  - Average: < 1 second
  - P95: < 2 seconds
  - P99: < 3 seconds

## Continuous Integration Flow

```
Push/PR → TypeScript Check → Unit Tests → Load Tests → Code Quality → Build Docker
                   ↓              ↓            ↓              ↓             ↓
              (must pass)    (must pass)  (must pass)    (must pass)  (must pass)
```

If any step fails, the pipeline will fail and the PR/commit will be blocked.

## Performance Monitoring

The pipeline includes:

1. **Unit Tests**: Test correctness of the matching algorithm
2. **Performance Benchmarks**: Test execution speed with various dataset sizes
3. **Load Tests**: Test API stability under concurrent load
4. **Coverage Reports**: Monitor code coverage (uploaded to Codecov)

## GitHub Actions Secrets

For production deployments, you may need to add the following secrets to your GitHub repository:

- `DATABASE_URL`: Production database URL
- `REDIS_URL`: Production Redis URL
- `STRIPE_SECRET_KEY`: Stripe API key
- `SUPABASE_URL`: Supabase configuration
- `CLERK_SECRET_KEY`: Clerk authentication key

Configure these in: Settings → Secrets and variables → Actions

## Troubleshooting

### Tests failing locally but passing in CI
- Ensure you're using the same Node.js version (18+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm ci`

### Load tests timing out
- Check that your API server is running and accessible
- Increase timeout in the GitHub Actions workflow if needed

### Performance benchmarks failing
- The matching algorithm may need optimization
- Consider caching frequently accessed data
- Profile the code using Node.js profiler

## Future Improvements

- [ ] Add integration tests
- [ ] Add E2E tests for critical user flows
- [ ] Set up performance regression testing
- [ ] Add security scanning (OWASP, dependency vulnerabilities)
- [ ] Configure automated deployments to staging/production
- [ ] Add database migration tests
