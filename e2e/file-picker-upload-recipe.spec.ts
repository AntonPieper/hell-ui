import { expect, test, type Locator, type Page } from '@playwright/test';

interface BrowserFile {
  readonly name: string;
  readonly type: string;
  readonly size?: number;
}

async function gotoUploadRecipe(page: Page): Promise<Locator> {
  await page.goto('/components/file-picker', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'File Picker', level: 1 })).toBeVisible();
  return page.locator('app-file-picker-upload-recipe-example');
}

async function dropFiles(picker: Locator, files: readonly BrowserFile[]): Promise<void> {
  await picker.evaluate((element, definitions) => {
    const transfer = new DataTransfer();
    for (const definition of definitions) {
      transfer.items.add(
        new File([new Uint8Array(definition.size ?? 1)], definition.name, {
          type: definition.type,
        }),
      );
    }
    element.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    );
  }, files);
}

function itemRow(example: Locator, name: string): Locator {
  return example.locator(`[data-upload-item="${name}"]`);
}

test.describe('application-owned File Picker upload recipe', () => {
  test('queues a browse selection, reports progress, and announces completion', async ({
    page,
  }) => {
    const example = await gotoUploadRecipe(page);
    const browse = example.getByRole('button', { name: 'Browse files' });

    await browse.focus();
    await expect(browse).toBeFocused();
    const chooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('photo'),
    });

    const row = itemRow(example, 'photo.png');
    await expect(row).toHaveAttribute('data-upload-status', /pending|uploading/);
    await expect(
      example.getByRole('progressbar', { name: 'photo.png upload progress' }),
    ).toBeVisible();
    await expect(page.locator('.cdk-live-announcer-element')).toHaveText('1 file accepted');

    await expect(row).toHaveAttribute('data-upload-status', 'done');
    await expect(row).toContainText('Complete');
    await expect(example.getByRole('progressbar', { name: 'photo.png upload progress' })).toHaveCount(
      0,
    );
    await expect(example.locator('[data-upload-announcement]')).toHaveText(
      'photo.png upload complete',
    );
  });

  test('enforces total capacity in application state after File Picker acquisition', async ({
    page,
  }) => {
    const example = await gotoUploadRecipe(page);
    const chooserPromise = page.waitForEvent('filechooser');
    await example.getByRole('button', { name: 'Browse files' }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles([
      { name: 'one.pdf', mimeType: 'application/pdf', buffer: Buffer.from('one') },
      { name: 'two.pdf', mimeType: 'application/pdf', buffer: Buffer.from('two') },
      { name: 'overflow.pdf', mimeType: 'application/pdf', buffer: Buffer.from('overflow') },
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('notes') },
    ]);

    await expect(itemRow(example, 'one.pdf')).toBeVisible();
    await expect(itemRow(example, 'two.pdf')).toBeVisible();
    await expect(itemRow(example, 'overflow.pdf')).toHaveCount(0);
    const acquisitionRejections = example.locator('[data-upload-rejections]');
    await expect(acquisitionRejections.locator('[data-reason="type"]')).toContainText('notes.txt');
    await expect(acquisitionRejections.locator('[data-reason="count"]')).toHaveCount(0);

    const capacityIssues = example.locator('[data-upload-capacity-issues]');
    await expect(capacityIssues).toHaveAttribute('role', 'status');
    await expect(capacityIssues).toHaveAttribute('aria-live', 'polite');
    await expect(capacityIssues.locator('[data-capacity-file="overflow.pdf"]')).toContainText(
      'application upload queue is limited to 4 files',
    );
    await expect(capacityIssues.locator('[data-reason]')).toHaveCount(0);
    await expect(page.locator('.cdk-live-announcer-element')).toHaveText(
      '3 files accepted. 1 file rejected',
    );
  });

  test('surfaces a server error, retries from the keyboard, and preserves focus', async ({
    page,
  }) => {
    const example = await gotoUploadRecipe(page);
    const picker = example.getByRole('button', { name: 'Add upload files' });
    await dropFiles(picker, [{ name: 'server-error.pdf', type: 'application/pdf' }]);

    const row = itemRow(example, 'server-error.pdf');
    await expect(row).toHaveAttribute('data-upload-status', 'error');
    await expect(row.locator('[data-upload-error]')).toContainText('server returned 500');
    await expect(example.locator('[data-upload-announcement]')).toHaveText(
      'server-error.pdf failed because the server returned an error',
    );

    const seededRetry = itemRow(example, 'passport-scan.jpg').getByRole('button', {
      name: 'Retry passport-scan.jpg',
    });
    const retry = row.getByRole('button', { name: 'Retry server-error.pdf' });
    const remove = row.getByRole('button', { name: 'Remove server-error.pdf' });
    await expect(seededRetry).toBeVisible();
    await expect(retry).toBeVisible();
    await retry.focus();
    await expect(retry).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(remove).toBeFocused();
    await expect(
      example.getByRole('progressbar', { name: 'server-error.pdf upload progress' }),
    ).toBeVisible();
    await expect(row).toHaveAttribute('data-upload-status', 'done');
    await expect(example.locator('[data-upload-announcement]')).toHaveText(
      'server-error.pdf upload complete',
    );
  });

  test('removes from the keyboard and returns focus to the acquisition target', async ({ page }) => {
    const example = await gotoUploadRecipe(page);
    const picker = example.getByRole('button', { name: 'Add upload files' });
    const row = itemRow(example, 'contract-signed.pdf');
    const remove = row.getByRole('button', { name: 'Remove contract-signed.pdf' });

    await remove.focus();
    await expect(remove).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(row).toHaveCount(0);
    await expect(picker).toBeFocused();
    await expect(example.locator('[data-upload-announcement]')).toHaveText(
      'contract-signed.pdf removed from the upload queue',
    );
  });
});
