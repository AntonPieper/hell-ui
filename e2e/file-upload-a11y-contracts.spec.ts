import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoFileUpload(page: Page): Promise<Locator> {
  await page.goto('/components/file-upload');
  await expect(page.getByRole('heading', { name: 'File upload', level: 1 })).toBeVisible();
  return page.locator('app-file-upload-adapter-example');
}

function itemRow(example: Locator, name: string): Locator {
  return example.locator('[data-slot="item"]', { hasText: name });
}

const PNG_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64',
);

test.describe('file upload browser accessibility contract', () => {
  test('adds files through Browse with per-file progress and a polite announcement', async ({
    page,
  }) => {
    const example = await gotoFileUpload(page);
    const browse = example.getByRole('button', { name: 'Browse files' });

    // Activate the real Browse button from the keyboard, then let Playwright
    // supply the two files to the resulting native file chooser.
    await browse.focus();
    await expect(browse).toBeFocused();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([
      { name: 'photo-1.png', mimeType: 'image/png', buffer: PNG_PIXEL },
      { name: 'photo-2.png', mimeType: 'image/png', buffer: PNG_PIXEL },
    ]);

    // Both appear, each with its own named progressbar while uploading.
    await expect(
      example.getByRole('progressbar', { name: 'photo-1.png upload progress' }),
    ).toBeVisible();
    await expect(
      example.getByRole('progressbar', { name: 'photo-2.png upload progress' }),
    ).toBeVisible();

    // The addition is announced politely through the CDK announcer, not a live
    // region on the list.
    await expect(page.locator('.cdk-live-announcer-element')).toHaveText('2 files added');
    await expect(example.locator('[aria-live]')).toHaveCount(0);

    // The adapter drives each file to done.
    await expect(itemRow(example, 'photo-1.png')).toContainText('Done');
    await expect(itemRow(example, 'photo-2.png')).toContainText('Done');
    await expect(example.getByRole('progressbar')).toHaveCount(0);
  });

  test('rejects a wrong-type and an oversized file inline with a readable reason', async ({
    page,
  }) => {
    const example = await gotoFileUpload(page);
    const input = example.locator('input[type="file"]');

    await input.setInputFiles([
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('plain text') },
    ]);

    // A transient inline row (not a toast) carries the Label Contract reason, and
    // the rejection is announced politely.
    const typeRow = example.locator('[data-slot="item"][data-status="rejected"]', {
      hasText: 'notes.txt',
    });
    await expect(typeRow).toBeVisible();
    await expect(typeRow).toContainText('is not an accepted file type');
    await expect(page.locator('.cdk-live-announcer-element')).toHaveText('1 file rejected');

    // An image over the 5 MB limit is rejected for size on the same path.
    await input.setInputFiles([
      { name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(6 * 1024 * 1024, 1) },
    ]);
    const sizeRow = example.locator('[data-slot="item"][data-status="rejected"]', {
      hasText: 'huge.png',
    });
    await expect(sizeRow).toBeVisible();
    await expect(sizeRow).toContainText('larger than');
  });

  test('reaches every action in the keyboard tab order', async ({ page }) => {
    const example = await gotoFileUpload(page);

    // The drop zone is a focusable button; Browse and the per-item actions follow
    // it in document order.
    await example.locator('[data-slot="dropzone"]').focus();
    await expect(example.locator('[data-slot="dropzone"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(example.getByRole('button', { name: 'Browse files' })).toBeFocused();

    await page.keyboard.press('Tab');
    // First list action is the done item's Remove button.
    await expect(example.getByRole('button', { name: 'Remove contract-signed.pdf' })).toBeFocused();
  });

  test('retries a failed upload from the keyboard', async ({ page }) => {
    const example = await gotoFileUpload(page);

    // The seeded error item exposes a Retry button; activating it with the
    // keyboard emits retried and the adapter re-runs the transfer to done.
    const retry = example.getByRole('button', { name: 'Retry passport-scan.jpg' });
    await retry.focus();
    await expect(retry).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(
      example.getByRole('progressbar', { name: 'passport-scan.jpg upload progress' }),
    ).toBeVisible();
    await expect(itemRow(example, 'passport-scan.jpg')).toContainText('Done');
    await expect
      .poll(async () => (await page.locator('.cdk-live-announcer-element').textContent())?.trim())
      .toBe('passport-scan.jpg uploaded');
  });

  test('removes an item from the keyboard', async ({ page }) => {
    const example = await gotoFileUpload(page);

    await expect(itemRow(example, 'contract-signed.pdf')).toBeVisible();
    const remove = example.getByRole('button', { name: 'Remove contract-signed.pdf' });
    await remove.focus();
    await expect(remove).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(itemRow(example, 'contract-signed.pdf')).toHaveCount(0);
  });
});
