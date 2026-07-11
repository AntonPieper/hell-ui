import { expect, test, type Page } from '@playwright/test';

test.describe('reduced motion contracts', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('collapses Hell duration tokens without changing consumer data slots', async ({ page }) => {
    await page.goto('/components/spinner');
    await expect(page.getByRole('heading', { name: 'Spinner', level: 1 })).toBeVisible();

    const consumerMotion = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes consumer-owned-motion {
          to { opacity: 0.5; }
        }
      `;
      document.head.append(style);

      const probe = document.createElement('div');
      probe.dataset['slot'] = 'consumer-owned';
      probe.style.animation = 'consumer-owned-motion 2s linear infinite';
      probe.style.transition = 'opacity 3s linear';
      document.body.append(probe);

      const computed = getComputedStyle(probe);
      return {
        animationDuration: computed.animationDuration,
        animationIterationCount: computed.animationIterationCount,
        transitionDuration: computed.transitionDuration,
      };
    });

    expect(consumerMotion).toEqual({
      animationDuration: '2s',
      animationIterationCount: 'infinite',
      transitionDuration: '3s',
    });

    const hellDurations = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return [
        computed.getPropertyValue('--hell-duration-fast').trim(),
        computed.getPropertyValue('--hell-duration-base').trim(),
        computed.getPropertyValue('--hell-duration-slow').trim(),
      ];
    });
    expect(hellDurations).toEqual(['1ms', '1ms', '1ms']);
  });

  test('stops hardcoded spinner and skeleton motion', async ({ page }) => {
    await page.goto('/components/spinner');
    await expect(page.getByRole('heading', { name: 'Spinner', level: 1 })).toBeVisible();

    const spinners = page.locator('app-spinner-variants-example [hellSpinner]');
    await expect(spinners).toHaveCount(4);
    expect(
      await spinners.evaluateAll((elements) =>
        elements.map((element) =>
          getComputedStyle(
            element,
            element.getAttribute('data-variant') === 'dots' ? '::before' : null,
          ).animationName,
        ),
      ),
    ).toEqual(['none', 'none', 'none', 'none']);

    await page.goto('/components/skeleton');
    await expect(page.getByRole('heading', { name: 'Skeleton', level: 1 })).toBeVisible();

    const skeleton = page.locator('app-skeleton-basic-example [hellSkeleton]');
    await expect(skeleton).toBeVisible();
    expect(await skeleton.evaluate((element) => getComputedStyle(element).animationName)).toBe(
      'none',
    );
    expect(await skeleton.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
      'none',
    );
  });

  test('keeps token-driven floating lifecycle behavior intact', async ({ page }) => {
    await page.goto('/components/popover');
    await expect(page.getByRole('heading', { name: 'Popover', level: 1 })).toBeVisible();

    const trigger = page.getByRole('button', { name: 'What is this status?' });
    await page.evaluate(() => {
      const onAnimationEnd = (event: AnimationEvent) => {
        if (!(event.target instanceof Element) || !event.target.matches('[hellPopover]')) return;
        document.documentElement.dataset['hellReducedMotionAnimationEnd'] = event.animationName;
        document.removeEventListener('animationend', onAnimationEnd);
      };
      document.addEventListener('animationend', onAnimationEnd);
    });
    await trigger.click();
    const popover = page.locator('[hellPopover]').filter({ hasText: 'Pending review' });
    await expect(popover).toBeVisible();
    expect(await popover.evaluate((element) => getComputedStyle(element).animationDuration)).toBe(
      '0.001s',
    );
    await expect.poll(() => page.evaluate(
      () => document.documentElement.dataset['hellReducedMotionAnimationEnd'],
    )).toBe('hell-pop-in');

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('stops hardcoded audio transcript motion', async ({ page }) => {
    await installSpeechTranscriptSupport(page);
    await page.goto('/components/audio-player');
    await expect(page.getByRole('heading', { name: 'Audio player', level: 1 })).toBeVisible();

    const transcriptExample = page.locator('app-audio-player-speech-transcript-example');
    await transcriptExample.getByRole('button', { name: 'Show speech transcript' }).click();
    const transcript = transcriptExample.locator('[data-slot="captions"]');
    await expect(transcript).toBeVisible();
    expect(await transcript.evaluate((element) => getComputedStyle(element).animationName)).toBe(
      'none',
    );
    await transcriptExample.locator('audio').evaluate((audio) => {
      audio.dispatchEvent(new Event('play'));
    });
    await expect(transcript).toHaveAttribute('data-state', 'live');
    expect(
      await transcript.locator('[data-slot="captionsDot"]').evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
    ).toBe('none');
  });

  test('preserves normal motion when no preference is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/components/spinner');
    await expect(page.getByRole('heading', { name: 'Spinner', level: 1 })).toBeVisible();

    const spinner = page.locator('app-spinner-basic-example [hellSpinner]');
    expect(await spinner.evaluate((element) => getComputedStyle(element).animationName)).toBe(
      'hell-spin',
    );

    const hellDurations = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return [
        computed.getPropertyValue('--hell-duration-fast').trim(),
        computed.getPropertyValue('--hell-duration-base').trim(),
        computed.getPropertyValue('--hell-duration-slow').trim(),
      ].map((value) =>
        value.endsWith('ms') ? Number.parseFloat(value) / 1_000 : Number.parseFloat(value),
      );
    });
    expect(hellDurations).toEqual([0.12, 0.18, 0.26]);

    await page.goto('/components/skeleton');
    const skeleton = page.locator('app-skeleton-basic-example [hellSkeleton]');
    await expect(skeleton).toBeVisible();
    expect(await skeleton.evaluate((element) => getComputedStyle(element).animationName)).toBe(
      'hell-shimmer',
    );
    expect(
      await skeleton.evaluate((element) => getComputedStyle(element).backgroundImage),
    ).not.toBe('none');
  });
});

async function installSpeechTranscriptSupport(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class FakeSpeechRecognition extends EventTarget {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onerror = null;
      onend = null;
      start(): void {}
      stop(): void {}
      abort(): void {}
    }

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      value: FakeSpeechRecognition,
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'captureStream', {
      configurable: true,
      value: () => {
        const track = { stop: () => {} };
        return {
          getAudioTracks: () => [track],
          getTracks: () => [track],
        } as unknown as MediaStream;
      },
    });
  });
}
