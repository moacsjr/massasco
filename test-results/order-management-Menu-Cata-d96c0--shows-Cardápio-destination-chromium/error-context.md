# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: order-management.spec.ts >> Menu Catalog Plugin >> nav rail shows Cardápio destination
- Location: e2e/order-management.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav button[title="Cardápio"]').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('nav button[title="Cardápio"]').first()

```

```yaml
- link "🏠 Home":
  - /url: /
- banner:
  - img "🚀"
  - text: DevXP Portal
  - link "👥 Usuários":
    - /url: /plugins/user-management
- navigation:
  - button "🧭":
    - img "🧭"
- main:
  - heading "Bem-vindo ao DevXP Portal v2.2" [level=3]
  - paragraph:
    - text: O sistema foi atualizado para uma arquitetura puramente baseada em
    - strong: Plugins
    - text: .
  - heading "O que mudou?" [level=3]
  - list:
    - listitem:
      - strong: "Entities Removidas:"
      - text: O conceito de entidades foi removido para simplificar o core.
    - listitem:
      - strong: "Features:"
      - text: Plugins que adicionam interface visual por meio de
      - emphasis: Extension Points
      - text: .
    - listitem:
      - strong: "Services:"
      - text: Plugins que fornecem APIs de backend para outros plugins.
  - paragraph: 💡 Explore o menu lateral para ver as funcionalidades instaladas via plugins.
- contentinfo
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // ============================================================================
  4   | // Order Management System — E2E Tests
  5   | // Validates: Menu Catalog, Orders & Delivery, KDS, Payments, Audit, SSE
  6   | // ============================================================================
  7   | 
  8   | test.describe('Menu Catalog Plugin', () => {
  9   |   test('nav rail shows Cardápio destination', async ({ page }) => {
  10  |     await page.goto('/');
  11  |     await page.waitForLoadState('domcontentloaded');
  12  | 
  13  |     const navRailButton = page.locator('nav button[title="Cardápio"]').first();
> 14  |     await expect(navRailButton).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  15  |   });
  16  | 
  17  |   test('clicking Cardápio opens drawer with product list', async ({ page }) => {
  18  |     await page.goto('/');
  19  |     await page.waitForLoadState('domcontentloaded');
  20  | 
  21  |     // Open the Cardápio drawer
  22  |     const navRailButton = page.locator('nav button[title="Cardápio"]').first();
  23  |     await navRailButton.click();
  24  | 
  25  |     // Should show "Cardápio" heading
  26  |     await expect(page.getByRole('heading', { name: 'Cardápio' })).toBeVisible();
  27  |   });
  28  | 
  29  |   test('displays default categories and products', async ({ page }) => {
  30  |     await page.goto('/');
  31  |     await page.waitForLoadState('domcontentloaded');
  32  | 
  33  |     // Open Cardápio drawer
  34  |     await page.locator('nav button[title="Cardápio"]').first().click();
  35  | 
  36  |     // Category buttons should be visible
  37  |     await expect(page.getByRole('button', { name: 'Entradas' })).toBeVisible();
  38  |     await expect(page.getByRole('button', { name: 'Pratos Principais' })).toBeVisible();
  39  |     await expect(page.getByRole('button', { name: 'Bebidas' })).toBeVisible();
  40  |     await expect(page.getByRole('button', { name: 'Sobremesas' })).toBeVisible();
  41  |   });
  42  | 
  43  |   test('filters products by category', async ({ page }) => {
  44  |     await page.goto('/');
  45  |     await page.waitForLoadState('domcontentloaded');
  46  | 
  47  |     await page.locator('nav button[title="Cardápio"]').first().click();
  48  | 
  49  |     // Click on "Bebidas" category
  50  |     await page.getByRole('button', { name: 'Bebidas' }).click();
  51  | 
  52  |     // Should show beverage products
  53  |     await expect(page.getByText('Refrigerante')).toBeVisible();
  54  |     await expect(page.getByText('Suco Natural')).toBeVisible();
  55  |   });
  56  | });
  57  | 
  58  | test.describe('Orders & Delivery Plugin', () => {
  59  |   test('nav rail shows Pedidos destination', async ({ page }) => {
  60  |     await page.goto('/');
  61  |     await page.waitForLoadState('domcontentloaded');
  62  | 
  63  |     const navRailButton = page.locator('nav button[title="Pedidos"]').first();
  64  |     await expect(navRailButton).toBeVisible();
  65  |   });
  66  | 
  67  |   test('opens Pedidos drawer with three tabs', async ({ page }) => {
  68  |     await page.goto('/');
  69  |     await page.waitForLoadState('domcontentloaded');
  70  | 
  71  |     await page.locator('nav button[title="Pedidos"]').first().click();
  72  | 
  73  |     // Should show three tabs
  74  |     await expect(page.getByText('🛒 Carrinho')).toBeVisible();
  75  |     await expect(page.getByText('🔥 Ativos')).toBeVisible();
  76  |     await expect(page.getByText('📦 Para Entregar')).toBeVisible();
  77  |   });
  78  | 
  79  |   test('can add products to cart', async ({ page }) => {
  80  |     await page.goto('/');
  81  |     await page.waitForLoadState('domcontentloaded');
  82  | 
  83  |     await page.locator('nav button[title="Pedidos"]').first().click();
  84  | 
  85  |     // Click the "+" button next to a product
  86  |     const addButtons = page.getByRole('button', { name: '+' });
  87  |     const firstAdd = addButtons.first();
  88  |     await firstAdd.click();
  89  | 
  90  |     // Cart should show 1 item
  91  |     await expect(page.getByText('Carrinho (1)')).toBeVisible();
  92  |   });
  93  | 
  94  |   test('shows table number selector', async ({ page }) => {
  95  |     await page.goto('/');
  96  |     await page.waitForLoadState('domcontentloaded');
  97  | 
  98  |     await page.locator('nav button[title="Pedidos"]').first().click();
  99  | 
  100 |     // The table input is a number input next to "Mesa:" label text
  101 |     const tableInput = page.locator('input[type="number"]').first();
  102 |     await expect(tableInput).toBeVisible();
  103 |   });
  104 | 
  105 |   test('cart shows total price', async ({ page }) => {
  106 |     await page.goto('/');
  107 |     await page.waitForLoadState('domcontentloaded');
  108 | 
  109 |     await page.locator('nav button[title="Pedidos"]').first().click();
  110 | 
  111 |     // Add a product
  112 |     await page.getByRole('button', { name: '+' }).first().click();
  113 | 
  114 |     // Total should be visible
```