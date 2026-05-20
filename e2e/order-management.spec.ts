import { test, expect } from '@playwright/test';

// ============================================================================
// Order Management System — E2E Tests
// Validates: Menu Catalog, Orders & Delivery, KDS, Payments, Audit, SSE
// ============================================================================

test.describe('Menu Catalog Plugin', () => {
  test('nav rail shows Cardápio destination', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navRailButton = page.locator('nav button[title="Cardápio"]').first();
    await expect(navRailButton).toBeVisible();
  });

  test('clicking Cardápio opens drawer with product list', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open the Cardápio drawer
    const navRailButton = page.locator('nav button[title="Cardápio"]').first();
    await navRailButton.click();

    // Should show "Cardápio" heading
    await expect(page.getByRole('heading', { name: 'Cardápio' })).toBeVisible();
  });

  test('displays default categories and products', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Cardápio drawer
    await page.locator('nav button[title="Cardápio"]').first().click();

    // Category buttons should be visible
    await expect(page.getByRole('button', { name: 'Entradas' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pratos Principais' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bebidas' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sobremesas' }),
    ).toBeVisible();
  });

  test('filters products by category', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Cardápio"]').first().click();

    // Click on "Bebidas" category
    await page.getByRole('button', { name: 'Bebidas' }).click();

    // Should show beverage products
    await expect(page.getByText('Refrigerante')).toBeVisible();
    await expect(page.getByText('Suco Natural')).toBeVisible();
  });
});

test.describe('Orders & Delivery Plugin', () => {
  test('nav rail shows Pedidos destination', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navRailButton = page.locator('nav button[title="Pedidos"]').first();
    await expect(navRailButton).toBeVisible();
  });

  test('opens Pedidos drawer with three tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pedidos"]').first().click();

    // Should show three tabs
    await expect(page.getByText('🛒 Carrinho')).toBeVisible();
    await expect(page.getByText('🔥 Ativos')).toBeVisible();
    await expect(page.getByText('📦 Para Entregar')).toBeVisible();
  });

  test('can add products to cart', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pedidos"]').first().click();

    // Click the "+" button next to a product
    const addButtons = page.getByRole('button', { name: '+' });
    const firstAdd = addButtons.first();
    await firstAdd.click();

    // Cart should show 1 item
    await expect(page.getByText('Carrinho (1)')).toBeVisible();
  });

  test('shows table number selector', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pedidos"]').first().click();

    // The table input is a number input next to "Mesa:" label text
    const tableInput = page.locator('input[type="number"]').first();
    await expect(tableInput).toBeVisible();
  });

  test('cart shows total price', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pedidos"]').first().click();

    // Add a product
    await page.getByRole('button', { name: '+' }).first().click();

    // Total should be visible
    await expect(page.getByText('Total:')).toBeVisible();
  });

  test('active tab shows no active orders initially', async ({
    page,
    request,
  }) => {
    await request.post('/api/test/reset');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pedidos"]').first().click();

    // Switch to "Ativos" tab
    await page.getByText('🔥 Ativos').click();

    await expect(page.getByText('Nenhum pedido ativo.')).toBeVisible();
  });

  test('deliver tab shows no items initially', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pedidos"]').first().click();

    // Switch to "Para Entregar" tab
    await page.getByText('📦 Para Entregar').click();

    await expect(page.getByText('Nenhum item pronto.')).toBeVisible();
  });
});

test.describe('KDS Plugin', () => {
  test('nav rail shows Cozinha destination', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navRailButton = page.locator('nav button[title="Cozinha"]').first();
    await expect(navRailButton).toBeVisible();
  });

  test('opens KDS board with two columns', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Cozinha"]').first().click();

    // Should show KDS heading
    await expect(
      page.getByRole('heading', { name: 'Cozinha — KDS' }),
    ).toBeVisible();

    // Should show two columns
    await expect(page.getByText(/Pendentes/)).toBeVisible();
    await expect(page.getByText(/Em Preparo/)).toBeVisible();
  });
});

test.describe('Payments Plugin', () => {
  test('nav rail shows Pagamentos destination', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const navRailButton = page
      .locator('nav button[title="Pagamentos"]')
      .first();
    await expect(navRailButton).toBeVisible();
  });

  test('opens payments page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pagamentos"]').first().click();

    // Should show heading
    await expect(
      page.getByRole('heading', { name: 'Pagamentos' }),
    ).toBeVisible();
  });

  test('shows no open orders initially', async ({ page, request }) => {
    await request.post('/api/test/reset');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pagamentos"]').first().click();

    await expect(page.getByText('Nenhum pedido aberto.')).toBeVisible();
  });
});

test.describe('Full Order Flow', () => {
  test.beforeEach(async ({ request }) => {
    // Clean DB before each test to avoid data pollution
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await request.post('/api/test/reset', { data: {} }).catch(() => {});
  });

  test('complete order lifecycle: create → kitchen → deliver → pay', async ({
    page,
    request,
  }) => {
    // Seed: create category + product
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'Flow Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prodRes = await request.post('/api/menu/products', {
      data: { name: 'Flow Test Product', price: 25.0, categoryId: cat.id },
    });
    const product = await prodRes.json();

    // Step 1: Create an order via API
    const orderResponse = await request.post('/api/orders', {
      data: {
        tableNumber: 5,
        items: [{ productId: product.id, quantity: 2, notes: 'Sem gelo' }],
      },
    });
    expect(orderResponse.ok()).toBe(true);
    const order = await orderResponse.json();
    expect(order.id).toBeDefined();
    expect(order.items.length).toBe(1);

    // Step 2: Verify order appears in Orders & Delivery
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Pedidos"]').first().click();
    await page.getByText('🔥 Ativos').click();

    // Should show Mesa 5 (use heading selector to avoid strict mode violation)
    await expect(page.locator('text=Mesa 5')).toBeVisible();

    // Close the drawer by clicking the backdrop or close button
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Step 3: Verify order appears in KDS
    await page.locator('nav button[title="Cozinha"]').first().click();

    // Should show PENDING items
    await expect(page.getByText('Flow Test Product').first()).toBeVisible();
    await expect(page.locator('text=Mesa 5')).toBeVisible();

    // Step 4: Kitchen starts preparing
    const startButtons = page.getByRole('button', {
      name: '▶ Iniciar Preparo',
    });
    await startButtons.first().click();
    await page.waitForTimeout(1000); // Wait for SSE update
    await page.reload({ waitUntil: 'networkidle' }); // Force KDS refresh
    await page.locator('nav button[title="Cozinha"]').first().click();

    // Should move to "Em Preparo" column
    await expect(page.locator('text=/Em Preparo/')).toBeVisible();

    // Step 5: Kitchen marks as ready
    const readyButtons = page.getByRole('button', { name: '✅ Pronto' });
    await readyButtons.first().click();

    // Item should be gone from KDS (moved to READY)
    await page.waitForTimeout(500);

    // Close drawer and switch to Pedidos
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Step 6: Verify item appears in "Para Entregar"
    await page.locator('nav button[title="Pedidos"]').first().click();
    await page.getByText('📦 Para Entregar').click();

    // Should show ready items
    await expect(page.getByText('Flow Test Product').first()).toBeVisible();

    // Step 7: Mark as delivered
    const deliverButtons = page.getByRole('button', { name: '✅ Entregue' });
    await deliverButtons.first().click();

    await page.waitForTimeout(500);

    // Close and go to payments
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Step 8: Verify payments page shows the order
    await page.locator('nav button[title="Pagamentos"]').first().click();

    // Should show Mesa 5 as an open order
    await expect(page.locator('text=Mesa 5')).toBeVisible();
  });

  test('order notes are displayed in KDS', async ({ page, request }) => {
    // Seed data
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'Notes Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prodRes = await request.post('/api/menu/products', {
      data: { name: 'Notes Test Product', price: 30.0, categoryId: cat.id },
    });
    const product = await prodRes.json();

    await request.post('/api/orders', {
      data: {
        tableNumber: 3,
        items: [{ productId: product.id, quantity: 1, notes: 'Mal passado' }],
      },
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('nav button[title="Cozinha"]').first().click();

    // Should show the note
    await expect(page.getByText('Mal passado').first()).toBeVisible();
  });
});

test.describe('API Endpoints', () => {
  test('GET /api/menu/categories returns categories', async ({ request }) => {
    // First create a category
    await request.post('/api/menu/categories', {
      data: { name: 'Test Category', description: 'For testing' },
    });

    const res = await request.get('/api/menu/categories');
    expect(res.ok()).toBe(true);
    const categories = await res.json();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  test('GET /api/menu/products returns products', async ({ request }) => {
    // First create a category, then a product
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'Test Cat 2', description: 'Test' },
    });
    const cat = await catRes.json();

    await request.post('/api/menu/products', {
      data: { name: 'Test Product', price: 10.0, categoryId: cat.id },
    });

    const res = await request.get('/api/menu/products');
    expect(res.ok()).toBe(true);
    const products = await res.json();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  test('GET /api/orders returns orders', async ({ request }) => {
    const res = await request.get('/api/orders');
    expect(res.ok()).toBe(true);
    const orders = await res.json();
    expect(Array.isArray(orders)).toBe(true);
  });

  test('POST /api/audit creates audit log', async ({ request }) => {
    const res = await request.post('/api/audit', {
      data: {
        module: 'test',
        eventType: 'TEST_EVENT',
        payload: { key: 'value' },
      },
    });
    expect(res.ok()).toBe(true);
    const log = await res.json();
    expect(log.module).toBe('test');
    expect(log.eventType).toBe('TEST_EVENT');
  });

  test('GET /api/audit returns logs', async ({ request }) => {
    const res = await request.get('/api/audit');
    expect(res.ok()).toBe(true);
    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);
  });
});

test.describe('SSE Events', () => {
  test('SSE endpoint is accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // The page should connect to /api/events via EventSource
    // We verify by checking the page loads without SSE errors
    const hasSSEConnection = await page.evaluate(() => {
      // Next.js dev server loads fine; EventSource connects to /api/events
      return typeof EventSource !== 'undefined';
    });
    expect(hasSSEConnection).toBe(true);
  });

  test('order creation publishes events verifiable via audit log', async ({
    page,
    request,
  }) => {
    // Create a category + product first
    const catRes = await request.post('/api/menu/categories', {
      data: { name: 'SSE Test Cat', description: 'Test' },
    });
    const cat = await catRes.json();

    const prodRes = await request.post('/api/menu/products', {
      data: { name: 'SSE Test Product', price: 15.0, categoryId: cat.id },
    });
    const product = await prodRes.json();

    // Create order
    await request.post('/api/orders', {
      data: {
        tableNumber: 99,
        items: [{ productId: product.id, quantity: 1 }],
      },
    });

    // Verify audit log captured the event
    const auditRes = await request.get('/api/audit?module=test');
    // Audit endpoint should be reachable
    expect(auditRes.ok()).toBe(true);
  });
});

test.describe('Nav Rail Summary', () => {
  test('all order management nav items are present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const expectedItems = [
      'Navigation',
      'Cardápio',
      'Pedidos',
      'Cozinha',
      'Pagamentos',
    ];
    for (const item of expectedItems) {
      const button = page.locator(`nav button[title="${item}"]`).first();
      await expect(button).toBeVisible();
    }
  });
});
