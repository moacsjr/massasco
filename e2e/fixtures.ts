import { test as baseTest, request } from '@playwright/test';

// Login credentials for testing
export const ADMIN_EMAIL = 'admin@massas.co';
export const ADMIN_PASSWORD = 'admin123';

// Extend base test with authenticated request context
export const test = baseTest.extend<{
  authenticatedRequest: typeof request;
}>({
  authenticatedRequest: async ({ }, use) => {
    const context = await request.newContext({
      baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    });

    // Perform login
    const loginResponse = await context.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    if (!loginResponse.ok()) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }

    // Get cookies from login response
    const cookies = await context.cookies();
    for (const cookie of cookies) {
      await context.addCookies([cookie]);
    }

    await use(context);

    await context.dispose();
  },
});

export const expect = test.expect;
