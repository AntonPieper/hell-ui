import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface BrowserFile {
  readonly name: string;
  readonly type: string;
  readonly size?: number;
}

async function gotoFilePicker(page: Page): Promise<void> {
  await page.goto('/components/file-picker', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'File Picker', level: 1 })).toBeVisible();
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

test.describe('File Picker browser contract', () => {
  test('opens the same native chooser from keyboard activation and the exported action', async ({
    page,
  }) => {
    await gotoFilePicker(page);

    const example = page.locator('app-file-picker-basic-example');
    const picker = example.getByRole('button', { name: 'Add attachments' });
    await expect(picker).toHaveAttribute('data-slot', 'root');
    await expect(picker).toHaveAttribute('tabindex', '0');
    await picker.focus();
    await expect(picker).toBeFocused();

    const keyboardChooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const keyboardChooser = await keyboardChooserPromise;
    await keyboardChooser.setFiles({
      name: 'keyboard.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('keyboard'),
    });

    await expect(example.getByText('keyboard.txt')).toBeVisible();
    await expect(page.locator('.cdk-live-announcer-element')).toHaveText('1 file accepted');

    const actionChooserPromise = page.waitForEvent('filechooser');
    await example.getByRole('button', { name: 'Browse from a separate action' }).click();
    const actionChooser = await actionChooserPromise;
    await actionChooser.setFiles({
      name: 'action.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('action'),
    });

    await expect(example.getByText('action.txt')).toBeVisible();
  });

  test('keeps drag state across child boundaries and clears it after drop', async ({ page }) => {
    await gotoFilePicker(page);

    const picker = page
      .locator('app-file-picker-basic-example')
      .getByRole('button', { name: 'Add attachments' });
    const restingStyle = await picker.evaluate((element) => {
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return {
        backgroundColor: style?.backgroundColor,
        borderColor: style?.borderColor,
      };
    });
    await picker.evaluate((element) => {
      element.dispatchEvent(
        new DragEvent('dragenter', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer(),
        }),
      );
    });
    await expect(picker).toHaveAttribute('data-dragging', 'true');
    const draggingStyle = await picker.evaluate((element) => {
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return {
        backgroundColor: style?.backgroundColor,
        borderColor: style?.borderColor,
      };
    });
    expect(draggingStyle.backgroundColor).not.toBe(restingStyle.backgroundColor);
    expect(draggingStyle.borderColor).not.toBe(restingStyle.borderColor);

    await picker.locator('strong').evaluate((child) => {
      child.dispatchEvent(
        new DragEvent('dragleave', {
          bubbles: true,
          cancelable: true,
          relatedTarget: child.parentElement,
          dataTransfer: new DataTransfer(),
        }),
      );
    });
    await expect(picker).toHaveAttribute('data-dragging', 'true');

    await dropFiles(picker, []);
    await expect(picker).not.toHaveAttribute('data-dragging');
    await expect
      .poll(() =>
        picker.evaluate((element) => {
          const style = element.ownerDocument.defaultView?.getComputedStyle(element);
          return {
            backgroundColor: style?.backgroundColor,
            borderColor: style?.borderColor,
          };
        }),
      )
      .toEqual(restingStyle);
    await expect(page.locator('app-file-picker-basic-example [data-file-picker-result]')).toContainText(
      '0 accepted',
    );
  });

  test('leaves projected interactive controls independent of host browsing', async ({ page }) => {
    await gotoFilePicker(page);

    const example = page.locator('app-file-picker-basic-example');
    const picker = example.getByRole('button', { name: 'Add attachments' });
    await picker.evaluate((element) => {
      const button = element.ownerDocument.createElement('button');
      button.type = 'button';
      button.setAttribute('data-file-picker-nested-action', '');
      button.setAttribute('data-activations', '0');
      const content = element.ownerDocument.createElement('span');
      content.setAttribute('data-file-picker-nested-content', '');
      content.textContent = 'Nested consumer action';
      button.append(content);
      button.addEventListener('click', () => {
        const activations = Number(button.getAttribute('data-activations') ?? '0');
        button.setAttribute('data-activations', String(activations + 1));
      });
      element.append(button);
    });

    let chooserCount = 0;
    page.on('filechooser', () => {
      chooserCount += 1;
    });
    const nestedAction = picker.locator('[data-file-picker-nested-action]');
    await nestedAction.locator('[data-file-picker-nested-content]').click();
    await expect(nestedAction).toHaveAttribute('data-activations', '1');
    expect(chooserCount).toBe(0);

    const chooserPromise = page.waitForEvent('filechooser');
    await picker.locator('strong').click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'ordinary-content.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('ordinary content'),
    });

    expect(chooserCount).toBe(1);
    await expect(example.getByText('ordinary-content.txt')).toBeVisible();
  });

  test('preserves type, size, custom, and per-batch count rejection reasons', async ({ page }) => {
    await gotoFilePicker(page);

    const example = page.locator('app-file-picker-validation-example');
    const picker = example.getByRole('button', { name: 'Add review files' });
    await dropFiles(picker, [
      { name: 'notes.txt', type: 'text/plain' },
      { name: 'huge.pdf', type: 'application/pdf', size: 5 * 1024 * 1024 + 1 },
      { name: 'draft.pdf', type: 'application/pdf' },
      { name: 'approved.pdf', type: 'application/pdf' },
      { name: 'photo.png', type: 'image/png' },
      { name: 'overflow.pdf', type: 'application/pdf' },
    ]);

    await expect(example.getByText('approved.pdf')).toBeVisible();
    await expect(example.getByText('photo.png')).toBeVisible();
    await expect(example.locator('[data-reason="type"]')).toContainText('notes.txt');
    await expect(example.locator('[data-reason="size"]')).toContainText('huge.pdf');
    await expect(example.locator('[data-reason="custom"]')).toContainText('draft.pdf');
    await expect(example.locator('[data-reason="count"]')).toContainText('overflow.pdf');
    await expect(page.locator('.cdk-live-announcer-element')).toHaveText(
      '2 files accepted. 4 files rejected',
    );

    await dropFiles(picker, [{ name: 'next.pdf', type: 'application/pdf' }]);
    await expect(example.getByText('next.pdf')).toBeVisible();
    await expect(example.locator('[data-file-picker-rejections]')).toHaveCount(0);
  });

  test('blocks every acquisition path while disabled', async ({ page }) => {
    await gotoFilePicker(page);

    const example = page.locator('app-file-picker-disabled-example');
    const picker = example.getByRole('button', { name: 'Add files' });
    await expect(picker).toHaveAttribute('data-disabled', 'true');
    await expect(picker).toHaveAttribute('aria-disabled', 'true');
    await expect(picker).toHaveAttribute('tabindex', '-1');
    await expect(picker).toHaveCSS('opacity', '0.6');

    await picker.dispatchEvent('click');
    await expect(picker.locator('input[type="file"]')).toHaveCount(0);
    await dropFiles(picker, [{ name: 'ignored.pdf', type: 'application/pdf' }]);
    await expect(example.getByText('Selection events: 0')).toBeVisible();
    await expect(picker).not.toHaveAttribute('data-dragging');
  });

  test('keeps the documented File Picker examples axe-clean', async ({ page }) => {
    await gotoFilePicker(page);

    const results = await new AxeBuilder({ page })
      .include('main')
      .withTags(WCAG_SMOKE_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
