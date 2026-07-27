import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ensurePageIsActive } from './utils';

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

/**
 * The drop-zone surface plus its built-in `::before` glyph. Border *style* is
 * part of the contract, not just border color: drag-over turns the resting
 * dashed outline solid so the armed state survives a monochrome rendering.
 *
 * Every comparison in this file is measured against a value this returns, so it
 * has to be a settled one. Read mid-transition, the resting background came
 * back as `rgba(247, 248, 250, 0.494)` — a frame, not a resting state — and the
 * poll after the drop then waited for a colour the element would never return
 * to, on a page that was behaving correctly.
 *
 * Finishing and reading happen in one evaluate deliberately: as two round trips
 * a transition starting in the gap reintroduces the same hazard.
 */
async function zoneStyle(picker: Locator): Promise<Record<string, string | undefined>> {
  return picker.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      try {
        animation.finish();
      } catch {
        // Infinite animations cannot finish and do not gate settling.
      }
    }
    const view = element.ownerDocument.defaultView;
    const style = view?.getComputedStyle(element);
    const glyph = view?.getComputedStyle(element, '::before');
    return {
      backgroundColor: style?.backgroundColor,
      borderColor: style?.borderColor,
      borderTopStyle: style?.borderTopStyle,
      glyphColor: glyph?.backgroundColor,
      glyphTransform: glyph?.transform,
    };
  });
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
    // A deactivated page freezes animation clocks, so settling would never
    // complete and every reading below would be a frozen frame.
    await ensurePageIsActive(page);

    const picker = page
      .locator('app-file-picker-basic-example')
      .getByRole('button', { name: 'Add attachments' });
    const restingStyle = await zoneStyle(picker);
    expect(restingStyle.borderTopStyle).toBe('dashed');
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
    await expect.poll(() => zoneStyle(picker).then((style) => style.glyphTransform)).not.toBe(
      restingStyle.glyphTransform,
    );
    const draggingStyle = await zoneStyle(picker);
    expect(draggingStyle.backgroundColor).not.toBe(restingStyle.backgroundColor);
    expect(draggingStyle.borderColor).not.toBe(restingStyle.borderColor);
    expect(draggingStyle.borderTopStyle).toBe('solid');
    expect(draggingStyle.glyphColor).not.toBe(restingStyle.glyphColor);

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
    await expect.poll(() => zoneStyle(picker)).toEqual(restingStyle);
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

  test('renders the built-in drop glyph and honors the before:hidden opt-out', async ({ page }) => {
    await gotoFilePicker(page);

    const glyph = (picker: Locator) =>
      picker.evaluate((element) => {
        const style = element.ownerDocument.defaultView?.getComputedStyle(element, '::before');
        return {
          content: style?.content,
          display: style?.display,
          width: style?.width,
          height: style?.height,
          // `||`, not `??`: an engine that exposes only the prefixed property
          // returns `""` for the unprefixed one rather than `undefined`, and
          // `??` would keep the empty string. That is exactly how the
          // `user-select` read below used to fail on WebKit.
          maskImage: style?.maskImage || style?.webkitMaskImage,
        };
      });

    // The default host ships the glyph with zero consumer markup, and its mask
    // resolves from --hell-icon-upload rather than falling back to `none`.
    const defaultGlyph = await glyph(
      page.locator('app-file-picker-basic-example').getByRole('button', { name: 'Add attachments' }),
    );
    expect(defaultGlyph.display).toBe('block');
    expect(defaultGlyph.content).not.toBe('none');
    expect(defaultGlyph.width).not.toBe('0px');
    expect(defaultGlyph.height).not.toBe('0px');
    expect(defaultGlyph.maskImage).toContain('data:image/svg+xml');

    // The documented `before:hidden` escape hatch depends on Tailwind's
    // utilities layer outranking the components layer that owns the glyph.
    const optedOutGlyph = await glyph(
      page
        .locator('app-file-picker-styling-example')
        .getByRole('button', { name: 'Add compact attachments' }),
    );
    expect(optedOutGlyph.display).toBe('none');
  });

  // The glyph color is a *stable* property of a focused disabled host, not an
  // eventual one, so it must not be asserted with a polling primitive that a
  // running transition can satisfy before the transition has done anything.
  // Reduced motion collapses `--hell-duration-fast` through the shared
  // substrate override, and both reads settle a frame first.
  test.describe('disabled focus guard', () => {
    test.use({ reducedMotion: 'reduce' });

    test('keeps the glyph dimmed when a disabled picker takes focus', async ({ page }) => {
      await gotoFilePicker(page);

      // The upload recipe restores focus to the picker host after a removal, so
      // a disabled host really does receive focus in practice. It must keep the
      // resting glyph instead of lighting up as if it were operable.
      const enabled = page
        .locator('app-file-picker-basic-example')
        .getByRole('button', { name: 'Add attachments' });
      const disabled = page
        .locator('app-file-picker-disabled-example')
        .getByRole('button', { name: 'Add files' });
      await expect(disabled).toHaveAttribute('data-disabled', 'true');

      const glyphColor = (picker: Locator) =>
        picker.evaluate(
          (element) =>
            element.ownerDocument.defaultView?.getComputedStyle(element, '::before').backgroundColor,
        );
      const settle = () =>
        page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
        );

      // The reference value carries the same hazard as the assertion: sampling
      // it while anything is still transitioning pins a frame the glyph never
      // returns to, so settle before reading it too.
      await settle();
      const restingColor = await glyphColor(enabled);

      // Establish that the accent rule is live before pinning the guard, so a
      // rule that never fires cannot pass the guard assertion by accident.
      await enabled.evaluate((element) => (element as HTMLElement).focus());
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(enabled).toBeFocused();
      await settle();
      expect(await glyphColor(enabled)).not.toBe(restingColor);

      // The guard itself: a disabled host that takes focus keeps the resting
      // glyph, read once the accent transition would long since have run.
      await disabled.evaluate((element) => (element as HTMLElement).focus());
      await expect(disabled).toBeFocused();
      await settle();
      expect(await glyphColor(disabled)).toBe(restingColor);
    });
  });

  test('opts projected text entry out of the select-none root without freeing labels', async ({
    page,
  }) => {
    await gotoFilePicker(page);

    // WebKit exposes only the prefixed longhand on `getComputedStyle`, so an
    // unprefixed read returns `""` there even though the shipped CSS applies.
    // `||` rather than `??` for that reason: the miss is an empty string, not
    // `undefined`.
    const userSelect = (element: Element): string => {
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return (
        style?.getPropertyValue('user-select') ||
        style?.getPropertyValue('-webkit-user-select') ||
        'unknown'
      );
    };

    const picker = page
      .locator('app-file-picker-basic-example')
      .getByRole('button', { name: 'Add attachments' });
    await expect.poll(() => picker.evaluate(userSelect)).toBe('none');

    // Projected text entry normalizes to `text` on every engine; label shapes
    // stay out of the opt-out, because giving them `user-select: text` makes
    // their labels drag-selectable — the smear `select-none` exists to prevent.
    const projected = await picker.evaluate((element) => {
      const read = (target: Element): string => {
        const style = target.ownerDocument.defaultView?.getComputedStyle(target);
        return (
          style?.getPropertyValue('user-select') ||
          style?.getPropertyValue('-webkit-user-select') ||
          'unknown'
        );
      };
      const measure = (tag: string, mutate?: (node: HTMLElement) => void): string => {
        const node = element.ownerDocument.createElement(tag);
        node.setAttribute('data-file-picker-projected-probe', '');
        mutate?.(node);
        element.append(node);
        const value = read(node);
        node.remove();
        return value;
      };
      return {
        input: measure('input', (node) => ((node as HTMLInputElement).type = 'text')),
        textarea: measure('textarea'),
        editable: measure('div', (node) => {
          node.setAttribute('contenteditable', '');
          node.textContent = 'Label';
        }),
        // A non-editable host, spelled the way the attribute's ASCII
        // case-insensitivity allows. It must not take the opt-out.
        notEditable: measure('div', (node) => {
          node.setAttribute('contenteditable', 'FALSE');
          node.textContent = 'Label';
        }),
        button: measure('button', (node) => (node.textContent = 'Label')),
        tabbable: measure('div', (node) => {
          node.tabIndex = 0;
          node.textContent = 'Label';
        }),
      };
    });

    expect(projected.input).toBe('text');
    expect(projected.textarea).toBe('text');
    expect(projected.editable).toBe('text');
    expect(projected.notEditable).not.toBe('text');
    expect(projected.button).not.toBe('text');
    expect(projected.tabbable).not.toBe('text');
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
