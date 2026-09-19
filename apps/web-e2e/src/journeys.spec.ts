import { expect, test } from '@playwright/test';
import { createRoom, joinRoom, openMeeting } from './support/meeting';

test('empty name keeps create disabled, then a valid name creates a room', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Создать комнату' })).toBeDisabled();
  await page.getByLabel('Имя').fill('Анна');
  await page.getByRole('button', { name: 'Создать комнату' }).click();
  await expect(page).toHaveURL(/\/room\//);
  await expect(
    page.getByText(
      'Пока никого нет. Скопируйте ссылку, чтобы пригласить участников.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Скопировать ссылку' }).click();
  await expect(page.getByText('Ссылка скопирована')).toBeVisible();
});

test('second participant joins by link and both share chat', async ({
  browser,
}) => {
  const host = await openMeeting(browser);
  const guest = await openMeeting(browser);
  try {
    const roomUrl = await createRoom(host.page, 'Анна');
    await joinRoom(guest.page, roomUrl, 'Борис');

    await expect(
      host.page.getByLabel('Участники').getByText('Анна'),
    ).toBeVisible();
    await expect(
      host.page.getByLabel('Участники').getByText('Борис'),
    ).toBeVisible();
    await expect(host.page.getByText('Борис присоединился к комнате')).toBeVisible();

    await host.page.getByRole('textbox', { name: 'Сообщение' }).fill('Привет');
    await host.page.getByRole('button', { name: 'Отправить' }).click();
    await expect(guest.page.getByRole('article').filter({ hasText: 'Привет' })).toBeVisible();
    await expect(
      guest.page.getByRole('article').filter({ hasText: 'Привет' }).getByText('Анна'),
    ).toBeVisible();
  } finally {
    await host.context.close();
    await guest.context.close();
  }
});

test('mic and camera toggles update the remote tile and keyboard activates mic', async ({
  browser,
}) => {
  const host = await openMeeting(browser);
  const guest = await openMeeting(browser);
  try {
    const roomUrl = await createRoom(host.page, 'Анна');
    await joinRoom(guest.page, roomUrl, 'Борис');

    const hostMic = host.page.getByRole('button', { name: 'Выключить микрофон' });
    await expect(hostMic).toBeEnabled();
    await hostMic.focus();
    await host.page.keyboard.press('Enter');
    await expect(
      host.page.getByRole('button', { name: 'Включить микрофон' }),
    ).toBeFocused();
    await expect(guest.page.getByText('Микрофон выключен')).toBeVisible();

    await host.page.getByRole('button', { name: 'Выключить камеру' }).click();
    await expect(
      host.page.getByRole('button', { name: 'Включить камеру' }),
    ).toBeVisible();
  } finally {
    await host.context.close();
    await guest.context.close();
  }
});

test('leave removes the guest and returns them to the start screen', async ({
  browser,
}) => {
  const host = await openMeeting(browser);
  const guest = await openMeeting(browser);
  try {
    const roomUrl = await createRoom(host.page, 'Анна');
    await joinRoom(guest.page, roomUrl, 'Борис');

    await guest.page.getByRole('button', { name: 'Выйти из комнаты' }).click();
    await expect(guest.page).toHaveURL('/');
    await expect(host.page.getByText('Борис вышел из комнаты')).toBeVisible();
    await expect(
      host.page.getByText(
        'Пока никого нет. Скопируйте ссылку, чтобы пригласить участников.',
      ),
    ).toBeVisible();
  } finally {
    await host.context.close();
    await guest.context.close();
  }
});

test('fifth participant is refused with a retry control', async ({ browser }) => {
  const occupants: Awaited<ReturnType<typeof openMeeting>>[] = [];
  try {
    const host = await openMeeting(browser);
    occupants.push(host);
    const roomUrl = await createRoom(host.page, 'Анна');
    for (const name of ['Борис', 'Вера', 'Глеб']) {
      const occupant = await openMeeting(browser);
      occupants.push(occupant);
      await joinRoom(occupant.page, roomUrl, name);
    }

    const fifth = await openMeeting(browser);
    occupants.push(fifth);
    await fifth.page.goto(roomUrl);
    await fifth.page.getByLabel('Имя').fill('Дима');
    await fifth.page.getByRole('button', { name: 'Войти' }).click();
    await expect(
      fifth.page.getByRole('heading', { name: 'Комната заполнена' }),
    ).toBeVisible();
    await expect(
      fifth.page.getByRole('button', { name: 'Повторить вход' }),
    ).toBeVisible();
  } finally {
    await Promise.all(occupants.map((occupant) => occupant.context.close()));
  }
});
