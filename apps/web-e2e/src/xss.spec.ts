import { expect, test } from '@playwright/test';
import { createRoom, joinRoom, openMeeting } from './support/meeting';

const MARKUP = '<img src=x onerror=alert(1)><script>alert(1)</script>';

test('illegal markup in the name field is rejected before join', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Имя').fill(MARKUP);
  await expect(
    page.getByText(
      'Имя может содержать буквы, цифры, пробелы, дефис и апостроф',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Создать комнату' })).toBeDisabled();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  await expect(page.getByText('alert(1)')).toHaveCount(0);
});

test('chat markup is rendered as text, not HTML', async ({ browser }) => {
  const host = await openMeeting(browser);
  const guest = await openMeeting(browser);
  const dialogs: string[] = [];
  try {
    guest.page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      void dialog.dismiss();
    });
    const roomUrl = await createRoom(host.page, 'Анна');
    await joinRoom(guest.page, roomUrl, 'Борис');

    await host.page.getByRole('textbox', { name: 'Сообщение' }).fill(MARKUP);
    await host.page.getByRole('button', { name: 'Отправить' }).click();

    const message = guest.page.getByRole('article').filter({ hasText: MARKUP });
    await expect(message).toBeVisible();
    await expect(message.locator('img')).toHaveCount(0);
    await expect(message.locator('script')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  } finally {
    await host.context.close();
    await guest.context.close();
  }
});
