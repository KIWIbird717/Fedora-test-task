import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:5173';

/**
 * Chromium + fake media keeps camera/mic journeys deterministic without
 * physical devices. Firefox/WebKit fake-device flags are not equivalent.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    locale: 'ru-RU',
    permissions: ['camera', 'microphone', 'clipboard-read', 'clipboard-write'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--mute-audio',
      ],
    },
  },
  webServer: [
    {
      command: 'pnpm exec nx build api && node apps/api/dist/main.js',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      cwd: workspaceRoot,
      env: {
        ...process.env,
        API_HOST: '0.0.0.0',
        API_PORT: '3000',
        CORS_ORIGINS: 'http://localhost:5173',
      },
    },
    {
      command: 'pnpm exec vite --config apps/web/vite.config.mts',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      cwd: workspaceRoot,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        permissions: [
          'camera',
          'microphone',
          'clipboard-read',
          'clipboard-write',
        ],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--mute-audio',
          ],
        },
      },
    },
  ],
});
