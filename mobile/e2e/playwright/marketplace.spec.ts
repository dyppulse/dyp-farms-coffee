import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    // Assuming login flow, then navigate to marketplace
    await page.goto('/marketplace');
  });

  test('displays coffee lots list', async ({ page }) => {
    const lotCards = page.locator('[data-testid="lot-card"]');
    await expect(lotCards).toHaveCount(5);
  });

  test('shows lot details on click', async ({ page }) => {
    const firstLot = page.locator('[data-testid="lot-card"]').first();
    await firstLot.click();

    const detailsContainer = page.locator('[data-testid="lot-details"]');
    await expect(detailsContainer).toBeVisible();
  });

  test('filters lots by origin', async ({ page }) => {
    const originFilter = page.locator('select[aria-label="Origin"]');
    await originFilter.selectOption('Ethiopia');

    const lotCards = page.locator('[data-testid="lot-card"]');
    const firstCard = lotCards.first();

    const originText = await firstCard.locator('text=Ethiopia').isVisible();
    expect(originText).toBeTruthy();
  });

  test('searches for lots', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search lots..."]');
    await searchInput.fill('Yirgacheffe');

    await page.waitForLoadState('networkidle');

    const lotCards = page.locator('[data-testid="lot-card"]');
    const count = await lotCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('adds lot to cart', async ({ page }) => {
    const firstLot = page.locator('[data-testid="lot-card"]').first();
    await firstLot.click();

    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await addToCartButton.click();

    const successMessage = page.locator('text=Added to cart');
    await expect(successMessage).toBeVisible();
  });

  test('increments quantity in cart', async ({ page }) => {
    const firstLot = page.locator('[data-testid="lot-card"]').first();
    await firstLot.click();

    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await addToCartButton.click();

    // Open cart
    const cartIcon = page.locator('button[aria-label="Cart"]');
    await cartIcon.click();

    const increaseButton = page.locator('button[aria-label="Increase quantity"]');
    await increaseButton.click();

    const quantity = page.locator('[data-testid="cart-quantity"]');
    await expect(quantity).toContainText('2');
  });

  test('displays carbon footprint information', async ({ page }) => {
    const carbonBadge = page.locator('[data-testid="carbon-badge"]').first();
    await expect(carbonBadge).toBeVisible();

    // Hover to see more details
    await carbonBadge.hover();

    const carbonDetails = page.locator('[data-testid="carbon-details"]');
    await expect(carbonDetails).toBeVisible();
  });

  test('shows quality grade information', async ({ page }) => {
    const firstLot = page.locator('[data-testid="lot-card"]').first();
    await firstLot.click();

    const gradeInfo = page.locator('[data-testid="grade-info"]');
    await expect(gradeInfo).toBeVisible();

    const gradeText = await gradeInfo.textContent();
    expect(gradeText).toMatch(/Grade: [A-Z]/);
  });
});

test.describe('Marketplace Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
  });

  test('sorts lots by price ascending', async ({ page }) => {
    const sortSelect = page.locator('select[aria-label="Sort by"]');
    await sortSelect.selectOption('price-asc');

    await page.waitForLoadState('networkidle');

    const prices = await page
      .locator('[data-testid="lot-price"]')
      .allTextContents();

    const numericPrices = prices.map((p) =>
      parseInt(p.replace(/[^\d]/g, ''))
    );

    for (let i = 0; i < numericPrices.length - 1; i++) {
      expect(numericPrices[i]).toBeLessThanOrEqual(numericPrices[i + 1]);
    }
  });

  test('sorts lots by rating', async ({ page }) => {
    const sortSelect = page.locator('select[aria-label="Sort by"]');
    await sortSelect.selectOption('rating');

    await page.waitForLoadState('networkidle');

    const ratings = await page
      .locator('[data-testid="lot-rating"]')
      .allTextContents();

    expect(ratings.length).toBeGreaterThan(0);
  });
});

test.describe('Responsive Design', () => {
  test('marketplace works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/marketplace');

    const lotCards = page.locator('[data-testid="lot-card"]');
    await expect(lotCards.first()).toBeVisible();

    // Check that cards stack vertically
    const cardLocations = await lotCards.evaluateAll((elements) =>
      elements.map((el) => ({
        top: el.getBoundingClientRect().top,
        width: el.getBoundingClientRect().width,
      }))
    );

    expect(cardLocations[0].width).toBeLessThan(400);
  });

  test('marketplace is usable on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/marketplace');

    const lotCards = page.locator('[data-testid="lot-card"]');
    await expect(lotCards.first()).toBeVisible();
  });
});
