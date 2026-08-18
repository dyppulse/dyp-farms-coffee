# Testing Strategy for Dyp Farms Coffee

This document outlines the comprehensive testing approach for the Dyp Farms Coffee platform, covering three testing frameworks:

- **Jest** - Unit & Component Testing
- **Playwright** - Web E2E Testing
- **Detox** - Native Mobile E2E Testing

## Quick Start

### Install Dependencies

```bash
# Mobile app
cd mobile
npm install

# Backend
cd ../backend
npm install
```

## Testing Frameworks

### 1. Jest - Unit & Component Tests

Jest is used for unit testing components, hooks, and services in React Native.

#### Setup

Jest is configured in `mobile/package.json` with:
- React Native preset
- Testing Library React Native support
- Module name mapper for path aliases
- Coverage collection

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="Login"
```

#### Test Structure

```
mobile/src/
├── components/__tests__/
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   ├── Input.test.tsx
│   └── ...
├── services/__tests__/
│   ├── auth.service.test.ts
│   └── ...
└── api/__tests__/
    └── client.test.ts
```

#### Example Tests

**Component Test** (`src/components/__tests__/Button.test.tsx`):
- Render with props
- User interactions (press)
- Disabled state
- Loading state
- Variant styles

**API Test** (`src/api/__tests__/client.test.ts`):
- Authentication (auth token handling)
- Error handling (network, HTTP errors)
- API endpoints (lots, carbon, auctions)
- Request/response mocking

#### Best Practices

1. **Mock External Dependencies**: Use `jest.mock()` for Expo modules, APIs, etc.
2. **Use Testing Library**: Interact with components the way users do
3. **Test Behavior, Not Implementation**: Don't test internal state
4. **Keep Tests Focused**: One test should verify one behavior
5. **Use Data Factories**: Create consistent test data

#### Coverage Goals

- Components: 80%+ coverage
- Services/Utils: 90%+ coverage
- API Client: 85%+ coverage

### 2. Playwright - Web E2E Testing

Playwright tests the web version of the app (via Expo Web) across browsers and devices.

#### Setup

Playwright is configured in `mobile/playwright.config.ts`:
- Multiple browsers (Chrome, Firefox, Safari)
- Mobile viewports (iPhone 12, Pixel 5)
- HTML reporter with screenshots/videos
- Auto-start web server

#### Running Tests

```bash
# Run all tests
npm run test:playwright

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in specific project
npx playwright test --project="Mobile Chrome"

# Debug mode
npx playwright test --debug

# Show reports
npx playwright show-report
```

#### Test Structure

```
mobile/e2e/playwright/
├── auth.spec.ts (login/signup flows)
├── marketplace.spec.ts (browsing, filtering)
├── cart.spec.ts (shopping cart)
├── auctions.spec.ts (bidding)
└── carbon.spec.ts (carbon footprint display)
```

#### Example Tests

**Auth Tests** (`e2e/playwright/auth.spec.ts`):
- Display login screen
- Email validation
- Password strength validation
- Login request handling
- Dashboard redirect
- Session persistence
- Logout

**Marketplace Tests** (`e2e/playwright/marketplace.spec.ts`):
- Display lot listings
- Search/filter functionality
- Sorting options
- Add to cart
- Carbon footprint display
- Responsive design (mobile, tablet, desktop)

#### Best Practices

1. **Use Page Object Model**: Abstract selectors into reusable methods
2. **Wait for Elements**: Use `waitForSelector()`, `waitForNavigation()`
3. **Test User Flows**: Full happy paths (login → browse → purchase)
4. **Handle Async**: Properly wait for network requests
5. **Mobile First**: Test mobile viewports thoroughly
6. **Parallel Execution**: Playwright runs tests in parallel by default

#### Test Isolation

Each test:
- Starts fresh (no shared state)
- Can run in any order
- Cleans up after itself
- Uses explicit waits (not sleeps)

#### Debugging

```bash
# Step through test
npx playwright test --debug

# Show browser during test
npx playwright test --headed

# Run single test
npx playwright test auth.spec.ts -g "displays login"

# Trace browser actions
npx playwright test --trace=on
```

### 3. Detox - Native Mobile E2E Testing

Detox tests the native iOS/Android app at the UI level.

#### Prerequisites

**For iOS:**
- macOS with Xcode 14+
- iPhone Simulator (iPhone 15)
- Detox CLI: `npm install -g detox-cli`

**For Android:**
- Android SDK 31+
- Android Emulator (Pixel 4 API 31)
- Gradle configured

#### Setup

Detox is configured in `mobile/.detoxrc.json`:
- iOS and Android app configurations
- Simulator/emulator device settings
- Multiple configurations (debug, release)
- Jest test runner

#### Running Tests

```bash
# Build app for testing (iOS)
npm run test:e2e:build

# Run E2E tests (iOS)
npm run test:e2e

# Run specific test file
detox test e2e/detox/login.e2e.ts --configuration ios.sim.debug

# Run with logging
detox test --configuration ios.sim.debug --cleanup

# Android tests (when configured)
detox test --configuration android.emu.debug
```

#### Building for Detox

**iOS:**
```bash
xcodebuild -workspace ios/dyp_farms_mobile.xcworkspace \
  -scheme dyp_farms_mobile \
  -configuration Release \
  -sdk iphonesimulator \
  -derivedDataPath ios/build
```

**Android:**
```bash
cd android
./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release
```

#### Test Structure

```
mobile/e2e/detox/
├── login.e2e.ts (authentication)
├── marketplace.e2e.ts (browsing, filtering)
├── cart.e2e.ts (shopping cart)
├── auctions.e2e.ts (bidding)
└── quality.e2e.ts (quality scanning)
```

#### Example Tests

**Login Tests** (`e2e/detox/login.e2e.ts`):
- Display login screen
- Validation (empty fields)
- Successful login → dashboard navigation
- Password visibility toggle
- Session persistence after restart

**Marketplace Tests** (`e2e/detox/marketplace.e2e.ts`):
- Navigate to marketplace
- Display lot listings
- Open lot details
- Filter by origin/price
- Search for lots
- Add to cart
- Update quantity
- Carbon footprint display

#### Best Practices

1. **Use Test IDs**: Add `testID` props to elements for reliable targeting
2. **Avoid Sleeps**: Use `waitFor()` with explicit conditions
3. **Synchronize App State**: Ensure app is in expected state before testing
4. **Test Native Features**: Gestures, permissions, deep links
5. **Keep Reusable Helpers**: Common login/setup flows in separate files

#### Element Selectors

```typescript
// By ID
element(by.id('email-input'))

// By text
element(by.text('Login'))

// By matcher
element(by.type('RCTTouchableOpacity'))

// Multiple matches
element(by.id('lot-card')).atIndex(0)
```

#### Synchronization

```typescript
// Wait for element
await waitFor(element(by.id('dashboard')))
  .toBeVisible()
  .withTimeout(5000);

// Wait for text
await waitFor(element(by.text('Successfully added')))
  .toExist()
  .withTimeout(3000);
```

#### Debugging

```bash
# Get view hierarchy
detox test --configuration ios.sim.debug --record-logs all

# Device logging
detox test --configuration ios.sim.debug --cleanup --verbose

# Attach debugger
node --inspect-brk node_modules/.bin/detox test --configuration ios.sim.debug
```

## Integration: Running All Tests

```bash
# Run complete test suite
npm run test:all
```

This runs:
1. Jest unit tests
2. Playwright E2E tests
3. Detox E2E tests

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: cd mobile && npm install

      - name: Run Jest tests
        run: cd mobile && npm test -- --coverage

      - name: Run Playwright tests
        run: cd mobile && npm run test:playwright

  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Build Detox
        run: cd mobile && npm run test:e2e:build

      - name: Run Detox tests
        run: cd mobile && npm run test:e2e
```

## Test Coverage

Coverage reports are generated by Jest in `coverage/` directory.

View HTML report:
```bash
open coverage/lcov-report/index.html
```

Coverage thresholds:
- **Statements**: 75%
- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 75%

## Common Issues & Solutions

### Jest

**Issue**: Mock not working
- **Solution**: Ensure mock is defined before import
- Use `jest.mock()` at top of test file, before component import

**Issue**: Async test timeout
- **Solution**: Increase timeout: `jest.setTimeout(10000)`
- Use `async/await` for async operations

### Playwright

**Issue**: Element not found
- **Solution**: Use `waitForSelector()` or `waitForNavigation()`
- Add explicit waits for dynamic content

**Issue**: Flaky mobile tests
- **Solution**: Increase viewport waits
- Test on actual mobile devices in CI

### Detox

**Issue**: "Element not found by matcher"
- **Solution**: Verify testID is correctly set
- Use `getViewHierarchy()` to debug element tree

**Issue**: Synchronization timeout
- **Solution**: App might not be responding
- Check app logs with `--verbose` flag
- Ensure all network requests complete

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Guide](https://playwright.dev/)
- [Detox E2E Testing](https://wix.github.io/Detox/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)

## Contributing Tests

When adding features:

1. **Write tests first** (TDD approach recommended)
2. **Unit tests** for logic, services, utilities
3. **Component tests** for UI components
4. **E2E tests** for critical user flows
5. **Ensure coverage** doesn't decrease

Example PR checklist:
- [ ] Unit tests for new code
- [ ] Component tests for UI changes
- [ ] E2E tests for new features
- [ ] Coverage maintained or improved
- [ ] All tests passing locally
- [ ] Tests work in CI

## Performance Testing

For performance-critical paths:

```typescript
// Detox performance measurement
const start = Date.now();
await element(by.id('search')).typeText('query');
await waitFor(element(by.id('results'))).toBeVisible();
const duration = Date.now() - start;

console.log(`Search took ${duration}ms`);
```

## Accessibility Testing

Tests should verify accessibility:

```typescript
// Test aria labels in Playwright
await expect(element('button[aria-label="Add to cart"]')).toBeVisible();

// Test accessibility in Detox
await expect(element(by.id('accessible-button'))).toExist();
```

---

**Last Updated**: 2026-08-18
**Testing Frameworks**: Jest 29, Playwright 1.40, Detox 20.15
