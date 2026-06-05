import { test, expect, request as playwrightRequest } from '@playwright/test';

// ============================================================================
// Check-In and Payment System — E2E Tests
// Validates: Customer Portal, Check-In Flow, Checkout, Payment Registration
// ============================================================================

// Login credentials for testing
const ADMIN_EMAIL = 'admin@massas.co';
const ADMIN_PASSWORD = 'admin123';

// Base URL for testing
const BASE_URL = 'http://localhost:3000';

async function login(page: any) {
  await page.goto('/plugins/login');
  await page.waitForLoadState('domcontentloaded');

  // Fill email
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(ADMIN_EMAIL);

  // Fill password
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(ADMIN_PASSWORD);

  // Click login button
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');
}

test.describe('Customer Portal - Check-In Flow', () => {
  test.beforeEach(async ({ request }) => {
    // Clean DB before each test
    await request.post('/api/test/reset').catch(() => {});
  });

  test('customer can select table and create check-in', async ({ page }) => {
    // Navigate to customer portal
    await page.goto('/plugins/customer-portal/');
    await page.waitForLoadState('domcontentloaded');

    // Select table number
    const tableInput = page.locator('input[type="number"]').first();
    await tableInput.fill('5');

    // Click Entrar button
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    await page.waitForLoadState('networkidle');

    // Should redirect to check-in page
    await expect(page.locator('text=Check-in da Mesa')).toBeVisible();
  });

  test('customer can complete check-in with name', async ({ page }) => {
    // Navigate to customer portal and select table
    await page.goto('/plugins/customer-portal/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="number"]').first().fill('7');
    await page.getByRole('button', { name: 'Entrar' }).first().click();

    // Fill customer name
    const nameInput = page.locator('input[placeholder="Ex: João"]');
    await nameInput.fill('Maria Silva');

    // Submit check-in
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    await page.waitForLoadState('networkidle');

    // Should redirect to menu page
    await expect(page.locator('text=Meus Pedidos')).toBeVisible();
  });

  test('customer can view orders after check-in', async ({ page }) => {
    // Create check-in
    await page.goto('/plugins/customer-portal/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="number"]').first().fill('3');
    await page.getByRole('button', { name: 'Entrar' }).first().click();

    await page.locator('input[placeholder="Ex: João"]').fill('Carlos');
    await page.getByRole('button', { name: 'Entrar' }).first().click();
    await page.waitForLoadState('networkidle');

    // Should show orders page with "Meus Pedidos" heading
    await expect(page.locator('text=Meus Pedidos')).toBeVisible();
    await expect(page.locator('text=Mesa 3')).toBeVisible();
  });
});

test.describe('Customer Portal - Checkout', () => {
  test.beforeEach(async ({ request }) => {
    // Clean DB before each test
    await request.post('/api/test/reset').catch(() => {});
  });

  test('checkout page shows consolidated check-in summary', async ({ page, request }) => {
    // Create a product first
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'Checkout Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prodRes = await request.post('/api/menu/products', {
      data: { name: 'Checkout Test Product', price: 25.0, categoryId: cat.id },
    });
    const product = await prodRes.json();

    // Create check-in via API
    const checkInRes = await request.post('/api/checkins', {
      data: { tableNumber: 5, customerName: 'Test Customer' },
    });
    expect(checkInRes.ok()).toBe(true);
    const checkIn = await checkInRes.json();

    // Create an order via API
    const orderRes = await request.post('/api/orders', {
      data: {
        checkInId: checkIn.id,
        tableNumber: 5,
        customerName: 'Test Customer',
        items: [{ productId: product.id, quantity: 2, selectedPriceId: product.prices[0].id }],
      },
    });
    expect(orderRes.ok()).toBe(true);

    // Navigate to customer portal checkout (requires login)
    await login(page);
    await page.goto('/plugins/customer-portal/checkout');
    await page.waitForLoadState('networkidle');

    // Should show checkout page with check-in summary
    await expect(page.locator('text=Checkout')).toBeVisible();

    // Should show items from the order
    await expect(page.locator('text=Checkout Test Product')).toBeVisible();

    // Should show payment summary section
    await expect(page.locator('text=SubTotal:')).toBeVisible();
    await expect(page.locator('text=Pagamentos:')).toBeVisible();
    await expect(page.locator('text=Total a pagar:')).toBeVisible();
  });

  test('checkout calculates correct totals', async ({ page, request }) => {
    // Create products
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'Total Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prod1Res = await request.post('/api/menu/products', {
      data: { name: 'Produto 1', price: 30.0, categoryId: cat.id },
    });
    const product1 = await prod1Res.json();

    const prod2Res = await request.post('/api/menu/products', {
      data: { name: 'Produto 2', price: 20.0, categoryId: cat.id },
    });
    const product2 = await prod2Res.json();

    // Create check-in
    const checkInRes = await request.post('/api/checkins', {
      data: { tableNumber: 8, customerName: 'Test Customer' },
    });
    const checkIn = await checkInRes.json();

    // Create two orders
    await request.post('/api/orders', {
      data: {
        checkInId: checkIn.id,
        tableNumber: 8,
        customerName: 'Test Customer',
        items: [
          { productId: product1.id, quantity: 1, selectedPriceId: product1.prices[0].id },
          { productId: product2.id, quantity: 2, selectedPriceId: product2.prices[0].id },
        ],
      },
    });

    // Navigate to checkout (requires login)
    await login(page);
    await page.goto('/plugins/customer-portal/checkout');
    await page.waitForLoadState('networkidle');

    // Expected total: 30 + (20 * 2) = 70
    await expect(page.locator('text=SubTotal: R$ 70,00')).toBeVisible();
    await expect(page.locator('text=Pagamentos: R$ 0,00')).toBeVisible();
    await expect(page.locator('text=Total a pagar: R$ 70,00')).toBeVisible();
  });

  test('payment registration updates checkout totals', async ({ page, request }) => {
    // Create product
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'Payment Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prodRes = await request.post('/api/menu/products', {
      data: { name: 'Payment Test Product', price: 50.0, categoryId: cat.id },
    });
    const product = await prodRes.json();

    // Create check-in
    const checkInRes = await request.post('/api/checkins', {
      data: { tableNumber: 10, customerName: 'Test Customer' },
    });
    const checkIn = await checkInRes.json();

    // Create order
    await request.post('/api/orders', {
      data: {
        checkInId: checkIn.id,
        tableNumber: 10,
        customerName: 'Test Customer',
        items: [{ productId: product.id, quantity: 1, selectedPriceId: product.prices[0].id }],
      },
    });

    // Navigate to checkout (requires login)
    await login(page);
    await page.goto('/plugins/customer-portal/checkout');
    await page.waitForLoadState('networkidle');

    // Initial state: total 50, paid 0
    await expect(page.locator('text=SubTotal: R$ 50,00')).toBeVisible();
    await expect(page.locator('text=Total a pagar: R$ 50,00')).toBeVisible();

    // Register payment via API
    const paymentRes = await request.post('/api/payments', {
      data: {
        checkInId: checkIn.id,
        amount: 30,
        method: 'pix',
      },
    });
    expect(paymentRes.ok()).toBe(true);

    // Refresh page to see updated totals
    await page.reload({ waitUntil: 'networkidle' });

    // Updated state: total 50, paid 30, remaining 20
    await expect(page.locator('text=Pagamentos: R$ 30,00')).toBeVisible();
    await expect(page.locator('text=Total a pagar: R$ 20,00')).toBeVisible();
  });
});

test.describe('Payment System - Check-In Auto-Close', () => {
  test.beforeEach(async ({ request }) => {
    // Clean DB before each test
    await request.post('/api/test/reset').catch(() => {});
  });

  test('check-in closes when fully paid and items delivered', async ({ page, request }) => {
    // Create product
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'AutoClose Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prodRes = await request.post('/api/menu/products', {
      data: { name: 'AutoClose Product', price: 100.0, categoryId: cat.id },
    });
    const product = await prodRes.json();

    // Create check-in
    const checkInRes = await request.post('/api/checkins', {
      data: { tableNumber: 15, customerName: 'Test Customer' },
    });
    const checkIn = await checkInRes.json();

    // Create order
    const orderRes = await request.post('/api/orders', {
      data: {
        checkInId: checkIn.id,
        tableNumber: 15,
        customerName: 'Test Customer',
        items: [{ productId: product.id, quantity: 1, selectedPriceId: product.prices[0].id }],
      },
    });
    const order = await orderRes.json();

    // Update order to PAID status
    await request.patch(`/api/orders/${order.id}`, {
      data: { status: 'PAID' },
    });

    // Register full payment
    await request.post('/api/payments', {
      data: {
        checkInId: checkIn.id,
        amount: 100,
        method: 'pix',
      },
    });

    // Mark item as delivered
    const itemRes = await request.get(`/api/orders/${order.id}`);
    const item = await itemRes.json();
    const itemId = item.items[0].id;

    await request.patch(`/api/order-items/${itemId}`, {
      data: { status: 'DELIVERED' },
    });

    // Verify check-in is closed
    const checkInDetailRes = await request.get(`/api/checkins/${checkIn.id}`);
    const checkInDetail = await checkInDetailRes.json();
    expect(checkInDetail.status).toBe('CLOSED');
    expect(checkInDetail.closedAt).toBeDefined();
  });

  test('check-in summary endpoint returns correct data', async ({ request }) => {
    // Create product
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'Summary Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prodRes = await request.post('/api/menu/products', {
      data: { name: 'Summary Product', price: 75.0, categoryId: cat.id },
    });
    const product = await prodRes.json();

    // Create check-in
    const checkInRes = await request.post('/api/checkins', {
      data: { tableNumber: 20, customerName: 'Test Customer' },
    });
    const checkIn = await checkInRes.json();

    // Create order
    await request.post('/api/orders', {
      data: {
        checkInId: checkIn.id,
        tableNumber: 20,
        customerName: 'Test Customer',
        items: [{ productId: product.id, quantity: 1, selectedPriceId: product.prices[0].id }],
      },
    });

    // Register partial payment
    await request.post('/api/payments', {
      data: {
        checkInId: checkIn.id,
        amount: 30,
        method: 'pix',
      },
    });

    // Get check-in summary
    const summaryRes = await request.get(`/api/checkins/${checkIn.id}`);
    const summary = await summaryRes.json();

    expect(summary.summary.subTotal).toBe(75);
    expect(summary.summary.totalPayments).toBe(30);
    expect(summary.summary.totalDue).toBe(45);
    expect(summary.summary.isFullyPaid).toBe(false);
  });
});

test.describe('API Endpoints - Check-Ins and Payments', () => {
  let authenticatedRequest: any;

  test.beforeAll(async () => {
    // Create a new request context and perform login
    authenticatedRequest = await playwrightRequest.newContext({
      baseURL: BASE_URL,
    });

    // Perform login
    const loginResponse = await authenticatedRequest.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }

    // The response should include cookies in the Set-Cookie header
    // These are automatically handled by the context for subsequent requests
  });

  test.afterAll(async () => {
    if (authenticatedRequest) {
      await authenticatedRequest.dispose();
    }
  });

  test('GET /api/checkins?tableNumber returns active check-in', async () => {
    // Create a check-in
    await authenticatedRequest.post('/api/checkins', {
      data: { tableNumber: 25, customerName: 'Test Customer' },
    });

    // Get active check-in for table
    const res = await authenticatedRequest.get('/api/checkins?tableNumber=25');
    expect(res.ok()).toBe(true);
    const checkIns = await res.json();
    expect(Array.isArray(checkIns)).toBe(true);
    expect(checkIns.length).toBeGreaterThan(0);
    expect(checkIns[0].tableNumber).toBe(25);
  });

  test('POST /api/payments creates payment with checkInId', async () => {
    // Create check-in
    const checkInRes = await authenticatedRequest.post('/api/checkins', {
      data: { tableNumber: 30, customerName: 'Test Customer' },
    });
    const checkIn = await checkInRes.json();

    // Create payment
    const paymentRes = await authenticatedRequest.post('/api/payments', {
      data: {
        checkInId: checkIn.id,
        amount: 50,
        method: 'pix',
      },
    });

    expect(paymentRes.ok()).toBe(true);
    const payment = await paymentRes.json();
    expect(payment.checkInId).toBe(checkIn.id);
    expect(payment.amount).toBe(50);
    expect(payment.method).toBe('pix');
  });

  test('GET /api/payments?checkInId returns payments for check-in', async () => {
    // Create check-in
    const checkInRes = await authenticatedRequest.post('/api/checkins', {
      data: { tableNumber: 35, customerName: 'Test Customer' },
    });
    const checkIn = await checkInRes.json();

    // Create multiple payments
    await authenticatedRequest.post('/api/payments', {
      data: { checkInId: checkIn.id, amount: 20, method: 'pix' },
    });
    await authenticatedRequest.post('/api/payments', {
      data: { checkInId: checkIn.id, amount: 30, method: 'maquininha' },
    });

    // Get payments for check-in
    const res = await authenticatedRequest.get(`/api/payments?checkInId=${checkIn.id}`);
    expect(res.ok()).toBe(true);
    const payments = await res.json();
    expect(payments.length).toBe(2);
    expect(payments[0].checkInId).toBe(checkIn.id);
  });
});
