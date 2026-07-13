import { Component, signal } from '@angular/core';
import { provideHellLabels } from '@hell-ui/angular/core';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { HellFileUpload, HELL_FILE_UPLOAD_LABELS, type HellFileUploadItem, type HellFileUploadRejection, type HellFileUploadUi } from './file-upload';

const liveAnnounce = vi.fn(() => Promise.resolve());
const announcementService = { announce: liveAnnounce };

@Component({
  imports: [HellFileUpload],
  template: `
    <hell-file-upload
      [items]="items()"
      [accept]="accept()"
      [maxBytes]="maxBytes()"
      [maxFiles]="maxFiles()"
      [disabled]="disabled()"
      [ui]="ui()"
      (filesAdded)="added.push($event)"
      (rejected)="rejections.push($event)"
      (removed)="removedIds.push($event)"
      (retried)="retriedIds.push($event)"
    />
  `,
})
class FileUploadHost {
  readonly items = signal<readonly HellFileUploadItem[]>([]);
  readonly accept = signal<string | null>(null);
  readonly maxBytes = signal<number | null>(null);
  readonly maxFiles = signal<number | null>(null);
  readonly disabled = signal(false);
  readonly ui = signal<HellFileUploadUi | undefined>(undefined);
  readonly added: File[][] = [];
  readonly rejections: HellFileUploadRejection[] = [];
  readonly removedIds: string[] = [];
  readonly retriedIds: string[] = [];
}

function file(name: string, type = '', size = 4): File {
  const blob = new File(['x'.repeat(size)], name, { type });
  // jsdom derives size from content; override so size-limit tests are explicit.
  Object.defineProperty(blob, 'size', { configurable: true, value: size });
  return blob;
}

describe('HellFileUpload', () => {
  beforeEach(() => {
    liveAnnounce.mockClear();
  });

  function setup(providers: unknown[] = []) {
    TestBed.configureTestingModule({
      imports: [FileUploadHost],
      providers: [
        { provide: LiveAnnouncer, useValue: announcementService },
        ...providers,
      ] as never[],
    });
    const fixture = TestBed.createComponent(FileUploadHost);
    fixture.detectChanges();
    return fixture;
  }

  function root(fixture: ReturnType<typeof setup>): HTMLElement {
    return query(fixture.nativeElement as HTMLElement, 'hell-file-upload');
  }

  function dropZone(fixture: ReturnType<typeof setup>): HTMLElement {
    return query(root(fixture), '[hellDropzone]');
  }

  function picker(fixture: ReturnType<typeof setup>): HTMLInputElement {
    return query<HTMLInputElement>(root(fixture), 'input[type="file"]');
  }

  function drop(fixture: ReturnType<typeof setup>, ...files: File[]): void {
    const event = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: { files: fileList(files) } });
    dropZone(fixture).dispatchEvent(event);
    fixture.detectChanges();
  }

  function browse(fixture: ReturnType<typeof setup>, ...files: File[]): void {
    const input = picker(fixture);
    Object.defineProperty(input, 'files', { configurable: true, value: fileList(files) });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  describe('anatomy', () => {
    it('renders a role=button drop zone and a real Browse button', () => {
      const fixture = setup();
      const host = root(fixture);

      expect(host.getAttribute('data-slot')).toBe('root');
      const zone = query(host, '[data-slot="dropzone"]');
      expect(zone.getAttribute('role')).toBe('button');
      const browseButton = query(host, '[data-slot="browse"]');
      // The Browse affordance is the button primitive (carries its data-size).
      expect(browseButton.tagName).toBe('BUTTON');
      expect(browseButton.hasAttribute('data-size')).toBe(true);
      // The composite reuses the icon primitive rather than owning inline SVG.
      expect(query(zone, 'hell-icon').getAttribute('aria-hidden')).toBe('true');
    });

    it('derives the hidden input multiple from maxFiles', () => {
      const fixture = setup();
      expect(picker(fixture).multiple).toBe(true);

      fixture.componentInstance.maxFiles.set(1);
      fixture.detectChanges();
      expect(picker(fixture).multiple).toBe(false);

      fixture.componentInstance.maxFiles.set(5);
      fixture.detectChanges();
      expect(picker(fixture).multiple).toBe(true);
    });
  });

  describe('validation matrix (identical for drop and browse)', () => {
    for (const [label, add] of [
      ['drop', (f: ReturnType<typeof setup>, ...files: File[]) => drop(f, ...files)],
      ['browse', (f: ReturnType<typeof setup>, ...files: File[]) => browse(f, ...files)],
    ] as const) {
      describe(`${label} path`, () => {
        it('accepts files that pass all rules and emits filesAdded', () => {
          const fixture = setup();
          const good = file('a.pdf', 'application/pdf');
          add(fixture, good);

          expect(fixture.componentInstance.added).toEqual([[good]]);
          expect(fixture.componentInstance.rejections).toEqual([]);
          expect(liveAnnounce).toHaveBeenCalledWith('1 file added', 'polite');
        });

        it('accepts a case-insensitive extension match and a MIME wildcard match', () => {
          const fixture = setup();
          fixture.componentInstance.accept.set('.pdf,image/*');
          fixture.detectChanges();

          const byExtension = file('SCAN.PDF');
          const byMime = file('scan', 'image/png');
          add(fixture, byExtension, byMime);

          expect(fixture.componentInstance.added).toEqual([[byExtension, byMime]]);
          expect(fixture.componentInstance.rejections).toEqual([]);
        });

        it('rejects a file by extension and by MIME when it misses the accept list', () => {
          const fixture = setup();
          fixture.componentInstance.accept.set('.pdf,image/*');
          fixture.detectChanges();

          const byExtension = file('notes.txt', 'text/plain');
          const byMime = file('archive', 'application/zip');
          const ok = file('scan.png', 'image/png');
          add(fixture, byExtension, byMime, ok);

          expect(fixture.componentInstance.added).toEqual([[ok]]);
          expect(fixture.componentInstance.rejections).toEqual([
            { file: byExtension, reason: 'type' },
            { file: byMime, reason: 'type' },
          ]);
          // Transient inline rows carry the Label Contract reason, not a toast.
          const rows = root(fixture).querySelectorAll('[data-status="rejected"][data-slot="item"]');
          expect(rows.length).toBe(2);
          expect(text(rows[0] as HTMLElement)).toContain('is not an accepted file type');
          expect(liveAnnounce).toHaveBeenCalledWith(
            '1 file added. 2 files rejected',
            'polite',
          );
        });

        it('rejects a file that exceeds maxBytes', () => {
          const fixture = setup();
          fixture.componentInstance.maxBytes.set(1024);
          fixture.detectChanges();

          const tooBig = file('big.bin', 'application/octet-stream', 4096);
          const ok = file('small.bin', 'application/octet-stream', 512);
          add(fixture, tooBig, ok);

          expect(fixture.componentInstance.added).toEqual([[ok]]);
          expect(fixture.componentInstance.rejections).toEqual([{ file: tooBig, reason: 'size' }]);
        });

        it('rejects files beyond the remaining maxFiles slots', () => {
          const fixture = setup();
          fixture.componentInstance.maxFiles.set(2);
          fixture.componentInstance.items.set([
            { id: '1', name: 'one.pdf', size: 4, status: 'done' },
          ]);
          fixture.detectChanges();

          const first = file('two.pdf', 'application/pdf');
          const second = file('three.pdf', 'application/pdf');
          add(fixture, first, second);

          // One slot remains, so the first is accepted and the second overflows.
          expect(fixture.componentInstance.added).toEqual([[first]]);
          expect(fixture.componentInstance.rejections).toEqual([{ file: second, reason: 'count' }]);
        });
      });
    }
  });

  describe('controlled per-status rendering', () => {
    it('renders pending/uploading/done/error state and only the relevant affordances', () => {
      const fixture = setup();
      fixture.componentInstance.items.set([
        { id: 'p', name: 'pending.pdf', size: 2048, status: 'pending' },
        { id: 'u', name: 'up.pdf', size: 2048, status: 'uploading', progress: 0.5 },
        { id: 'd', name: 'done.pdf', size: 2048, status: 'done' },
        { id: 'e', name: 'err.pdf', size: 2048, status: 'error', error: 'Network error' },
      ]);
      fixture.detectChanges();
      const host = root(fixture);

      const rows = host.querySelectorAll('ul [data-slot="item"]');
      expect(rows.length).toBe(4);

      expect(text(rows[0] as HTMLElement)).toContain('Pending');
      expect(text(rows[1] as HTMLElement)).toContain('Uploading');
      expect(text(rows[2] as HTMLElement)).toContain('Done');
      expect(text(rows[3] as HTMLElement)).toContain('Failed');
      expect(host.querySelectorAll('hell-icon[data-slot="itemIcon"]').length).toBe(4);

      // Uploading item exposes a progressbar with an accessible name; others do not.
      const progressbars = host.querySelectorAll('[data-slot="itemProgress"]');
      expect(progressbars.length).toBe(1);
      const bar = progressbars[0] as HTMLElement;
      expect(bar.getAttribute('role')).toBe('progressbar');
      expect(bar.getAttribute('aria-label')).toBe('up.pdf upload progress');
      expect(bar.getAttribute('aria-valuenow')).toBe('50');

      // The error item shows its message and a retry button; others show none.
      expect(host.querySelectorAll('[data-slot="itemRetry"]').length).toBe(1);
      const errorRow = rows[3] as HTMLElement;
      expect(text(query(errorRow, '[data-slot="itemError"]'))).toBe('Network error');
      // Every item has a remove button.
      expect(host.querySelectorAll('[data-slot="itemRemove"]').length).toBe(4);
    });

    it('exposes accessible names for remove and retry and leaves the glyph buttons empty', () => {
      const fixture = setup();
      fixture.componentInstance.items.set([
        { id: 'e', name: 'err.pdf', size: 2048, status: 'error', error: 'boom' },
      ]);
      fixture.detectChanges();
      const host = root(fixture);

      const remove = query(host, '[data-slot="itemRemove"]');
      const retry = query(host, '[data-slot="itemRetry"]');
      expect(remove.getAttribute('aria-label')).toBe('Remove err.pdf');
      expect(retry.getAttribute('aria-label')).toBe('Retry err.pdf');
      // Buttons carry no markup, so the CSS-mask glyph on `:empty` renders.
      expect(remove.childElementCount).toBe(0);
      expect(remove.textContent?.trim()).toBe('');
      expect(retry.childElementCount).toBe(0);
    });
  });

  describe('outputs', () => {
    it('emits removed and retried with the item id, never mutating items', () => {
      const fixture = setup();
      const items: readonly HellFileUploadItem[] = [
        { id: 'e', name: 'err.pdf', size: 2048, status: 'error', error: 'boom' },
      ];
      fixture.componentInstance.items.set(items);
      fixture.detectChanges();
      const host = root(fixture);

      query(host, '[data-slot="itemRetry"]').click();
      query(host, '[data-slot="itemRemove"]').click();

      expect(fixture.componentInstance.retriedIds).toEqual(['e']);
      expect(fixture.componentInstance.removedIds).toEqual(['e']);
      // The controlled input is untouched — the consumer owns the array.
      expect(fixture.componentInstance.items()).toBe(items);
    });
  });

  describe('disabled', () => {
    it('gates the drop path, the buttons, and the picker', () => {
      const fixture = setup();
      fixture.componentInstance.items.set([
        { id: 'e', name: 'err.pdf', size: 2048, status: 'error', error: 'boom' },
      ]);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const host = root(fixture);

      drop(fixture, file('a.pdf', 'application/pdf'));
      expect(fixture.componentInstance.added).toEqual([]);

      expect(query<HTMLButtonElement>(host, '[data-slot="browse"]').disabled).toBe(true);
      expect(query<HTMLButtonElement>(host, '[data-slot="itemRemove"]').disabled).toBe(true);
      expect(query<HTMLButtonElement>(host, '[data-slot="itemRetry"]').disabled).toBe(true);
      expect(host.getAttribute('data-disabled')).toBe('');
    });
  });

  describe('label contract', () => {
    it('overrides built-in strings and rejection reasons for a scope', () => {
      const fixture = setup([
        provideHellLabels(HELL_FILE_UPLOAD_LABELS, {
          browse: 'Choose files',
          rejectedType: (name) => `${name}: wrong type`,
          statusPending: 'Queued',
        }),
      ]);
      fixture.componentInstance.accept.set('.pdf');
      fixture.componentInstance.items.set([
        { id: 'queued', name: 'queued.pdf', size: 4, status: 'pending' },
      ]);
      fixture.detectChanges();

      expect(text(query(root(fixture), '[data-slot="browse"]'))).toBe('Choose files');

      drop(fixture, file('note.txt', 'text/plain'));
      const row = query(root(fixture), '[data-status="rejected"] [data-slot="itemError"]');
      expect(text(row)).toBe('note.txt: wrong type');
      expect(text(query(root(fixture), '[data-status="pending"]'))).toContain('Queued');
    });
  });

  describe('announcements', () => {
    it('announces mixed accepted and rejected files as one complete batch', () => {
      const fixture = setup();
      fixture.componentInstance.accept.set('.pdf');
      fixture.detectChanges();

      const accepted = file('accepted.pdf', 'application/pdf');
      const rejected = file('rejected.txt', 'text/plain');
      drop(fixture, accepted, rejected);

      expect(liveAnnounce).toHaveBeenCalledTimes(1);
      expect(liveAnnounce).toHaveBeenCalledWith('1 file added. 1 file rejected', 'polite');
    });

    it('politely announces done and error status transitions', () => {
      const fixture = setup();
      fixture.componentInstance.items.set([
        { id: 'a', name: 'a.pdf', size: 4, status: 'uploading', progress: 0.5 },
      ]);
      fixture.detectChanges();
      liveAnnounce.mockClear();

      fixture.componentInstance.items.set([
        { id: 'a', name: 'a.pdf', size: 4, status: 'done' },
      ]);
      fixture.detectChanges();
      expect(liveAnnounce).toHaveBeenCalledWith('a.pdf uploaded', 'polite');

      fixture.componentInstance.items.set([
        { id: 'a', name: 'a.pdf', size: 4, status: 'error', error: 'boom' },
      ]);
      fixture.detectChanges();
      expect(liveAnnounce).toHaveBeenCalledWith('a.pdf failed to upload', 'polite');
    });

    it('does not announce a status that has not changed', () => {
      const fixture = setup();
      fixture.componentInstance.items.set([
        { id: 'a', name: 'a.pdf', size: 4, status: 'done' },
      ]);
      fixture.detectChanges();
      liveAnnounce.mockClear();

      // Re-render the same status: no announcement.
      fixture.componentInstance.items.set([
        { id: 'a', name: 'a.pdf', size: 4, status: 'done' },
      ]);
      fixture.detectChanges();
      expect(liveAnnounce).not.toHaveBeenCalled();
    });
  });

  describe('transient rejection rows', () => {
    it('auto-dismisses inline rejection rows after the timeout', () => {
      vi.useFakeTimers();
      try {
        const fixture = setup();
        fixture.componentInstance.accept.set('.pdf');
        fixture.detectChanges();

        drop(fixture, file('note.txt', 'text/plain'));
        expect(
          root(fixture).querySelectorAll('[data-slot="item"][data-status="rejected"]').length,
        ).toBe(1);

        vi.advanceTimersByTime(6000);
        fixture.detectChanges();
        expect(
          root(fixture).querySelectorAll('[data-slot="item"][data-status="rejected"]').length,
        ).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('part style map', () => {
    it('merges consumer refinements over the root recipe', () => {
      const fixture = setup();
      fixture.componentInstance.ui.set({ root: 'gap-hell-8' });
      fixture.detectChanges();
      const host = root(fixture);

      expect(host.classList.contains('gap-hell-8')).toBe(true);
      expect(host.classList.contains('gap-hell-4')).toBe(false);
      expect(host.classList.contains('flex')).toBe(true);
    });
  });
});

function query<T extends HTMLElement = HTMLElement>(host: HTMLElement, selector: string): T {
  const element = host.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}

function text(element: HTMLElement): string {
  return element.textContent?.trim() ?? '';
}

function fileList(files: readonly File[]): FileList {
  const list: Partial<FileList> & { [index: number]: File } = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
  };
  files.forEach((file, index) => {
    list[index] = file;
  });
  return list as FileList;
}
