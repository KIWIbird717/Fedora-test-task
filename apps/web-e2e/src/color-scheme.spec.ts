import { expect, test } from '@playwright/test';

test('dark scheme follows the system and can be overridden', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.getByRole('button', { name: /Переключить тему/ }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(
    page.getByRole('button', { name: 'Светлая тема. Переключить тему' }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Переключить тему/ }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
