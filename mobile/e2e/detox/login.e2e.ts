describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display login screen', async () => {
    await expect(element(by.text('Welcome to Dyp Farms'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
  });

  it('should show validation error for empty email', async () => {
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).multiTap(1);

    await expect(
      element(by.text('Email is required'))
    ).toBeVisible();
  });

  it('should show validation error for empty password', async () => {
    await element(by.id('email-input')).typeText('farmer@example.com');
    await element(by.id('login-button')).multiTap(1);

    await expect(
      element(by.text('Password is required'))
    ).toBeVisible();
  });

  it('should navigate to dashboard on successful login', async () => {
    await element(by.id('email-input')).typeText('farmer@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).multiTap(1);

    // Wait for navigation and check dashboard is displayed
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to signup on link click', async () => {
    await element(by.text('Create Account')).multiTap(1);

    await waitFor(element(by.id('signup-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should toggle password visibility', async () => {
    const passwordInput = element(by.id('password-input'));
    const toggleButton = element(by.id('toggle-password'));

    // Initially hidden (type password)
    await expect(passwordInput).toHaveType('password');

    // Toggle to show
    await toggleButton.multiTap(1);
    await expect(passwordInput).toHaveType('text');

    // Toggle to hide
    await toggleButton.multiTap(1);
    await expect(passwordInput).toHaveType('password');
  });
});

describe('Session Persistence', () => {
  it('should restore session after app restart', async () => {
    // Login
    await element(by.id('email-input')).typeText('farmer@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).multiTap(1);

    // Wait for dashboard
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Close and relaunch app
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // Should still be logged in
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });
});
