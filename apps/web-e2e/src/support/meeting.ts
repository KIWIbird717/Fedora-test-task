import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

export async function openMeeting(
  browser: Browser,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}

export async function waitForInRoom(page: Page): Promise<void> {
  await expect(
    page.getByRole('navigation', { name: 'Управление звонком' }),
  ).toBeVisible();
}

export async function createRoom(page: Page, name: string): Promise<string> {
  await page.goto('/');
  await page.getByLabel('Имя').fill(name);
  await page.getByRole('button', { name: 'Создать комнату' }).click();
  await expect(page).toHaveURL(/\/room\//);
  await waitForInRoom(page);
  return page.url();
}

export async function joinRoom(
  page: Page,
  roomUrl: string,
  name: string,
): Promise<void> {
  await page.goto(roomUrl);
  await page.getByLabel('Имя').fill(name);
  await page.getByRole('button', { name: 'Войти' }).click();
  await waitForInRoom(page);
}
