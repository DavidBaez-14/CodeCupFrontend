import { defineConfig, devices } from '@playwright/test';

// E2E de frontend con RED MOCKEADA (page.route): no toca el backend ni Supabase de producción.
// Los flujos se prueban en viewport móvil, que es el principal de uso.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] }, // viewport ~393px, isMobile, touch
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
