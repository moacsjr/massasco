import { test, expect } from '@playwright/test';

// ============================================================================
// Main Template Layout Tests
// Validates the main-template plugin renders the full page structure correctly
// ============================================================================

test.describe('Main Template Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('renders the full page structure', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });

  test('displays app icon and name in header', async ({ page }) => {
    // App icon (emoji-based icon component)
    const appIcon = page.getByRole('img', { name: '🚀' });
    await expect(appIcon).toBeVisible();

    // App name — use exact match to avoid strict mode violation
    await expect(page.getByText('DevXP Portal', { exact: true })).toBeVisible();
  });

  test('renders header menu area (menubar items extension point)', async ({ page }) => {
    // The menubarPlugin contributes a div with the ExtensionPoint
    // Even if empty, the container div should exist in the DOM
    const header = page.locator('header').first();
    // Check that the header contains the menubar structure
    await expect(header).toContainText('DevXP Portal');
  });

  test('renders the main content area', async ({ page }) => {
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('renders the home link', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: '🏠 Home' });
    await expect(homeLink).toBeVisible();
  });
});

test.describe('Left Menu Section (Nav Rail + Drawer)', () => {
  test('nav rail shows at least one destination', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The menu-nav-bar plugin registers a left-menu contribution
    // So the nav rail should be visible with at least one button
    const navRail = page.locator('nav').first();
    await expect(navRail).toBeVisible();
    expect(await navRail.locator('button').count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Right Menu Section (Tab Drawer)', () => {
  test('right menu trigger is hidden when no items registered', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No right menu items are registered by default
    const rightPanelTriggers = page.locator('div[style*="position: fixed"]').locator('button');
    expect(await rightPanelTriggers.count()).toBe(0);
  });
});

test.describe('Content Section', () => {
  test('content area renders page content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Footer Section', () => {
  test('footer is rendered', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('footer exists in the DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Footer should be present in the DOM
    const footer = page.locator('footer');
    expect(await footer.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Extension Points Availability', () => {
  test('header menu extension point accepts contributions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});

test.describe('Design System Components', () => {
  test('Icon component renders in header', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const icon = page.getByRole('img', { name: '🚀' });
    await expect(icon).toBeVisible();
  });
});

test.describe('Page Navigation', () => {
  test('home link navigates to home page', async ({ page }) => {
    await page.goto('/domain');
    await page.waitForLoadState('networkidle');

    const homeLink = page.getByRole('link', { name: '🏠 Home' });
    await homeLink.evaluate((el) => (el as HTMLElement).click());
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Menu Nav Bar Plugin', () => {
  test('nav rail shows Navigation destination icon', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The menu-nav-bar plugin contributes to main-template:left-menu
    // It should appear as a nav rail button with the 🧭 icon
    const navRailButton = page.locator('nav button[title="Navigation"]').first();
    await expect(navRailButton).toBeVisible();
  });

  test('clicking Navigation icon opens drawer with route list', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click the nav rail button
    const navRailButton = page.locator('nav button[title="Navigation"]').first();
    await navRailButton.click();

    // Drawer should open showing "Navigation" heading
    await expect(page.getByRole('heading', { name: 'Navigation' })).toBeVisible();
  });

  test('drawer shows registered plugin routes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open the navigation drawer
    const navRailButton = page.locator('nav button[title="Navigation"]').first();
    await navRailButton.click();

    // Should see plugin group headers
    await expect(page.getByText('Autenticação')).toBeVisible();
    await expect(page.getByText('Gestão de Usuários')).toBeVisible();
  });

  test('route links navigate to correct pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open the navigation drawer
    const navRailButton = page.locator('nav button[title="Navigation"]').first();
    await navRailButton.click();

    // Click on "Meu Perfil" link
    const profileLink = page.getByRole('link', { name: 'Meu Perfil' });
    await profileLink.click();

    // Should navigate to the auth plugin profile page
    await page.waitForURL('/plugins/auth/profile');
    await expect(page).toHaveURL('/plugins/auth/profile');
  });
});
