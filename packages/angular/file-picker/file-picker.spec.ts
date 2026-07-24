import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from 'hell-ui/core';

import {
  HellFilePicker,
  HELL_FILE_PICKER_LABELS,
  type HellFileSelection,
  type HellFileValidator,
} from './file-picker';
import { expectUiRouting } from '../spec-helpers';

@Component({
  imports: [HellFilePicker],
  template: `
    <div
      id="picker"
      hellFilePicker
      #picker="hellFilePicker"
      aria-label="Add attachments"
      [accept]="accept()"
      [multiple]="multiple()"
      [maxBytes]="maxBytes()"
      [maxFiles]="maxFiles()"
      [disabled]="disabled()"
      [validate]="validate()"
      [ui]="ui()"
      (selection)="selections.push($event)"
    >
      <span id="child">Drop files here</span>
      <span id="ordinary-child">Choose from this text</span>
      <button id="nested-button" type="button" (click)="nestedClicks += 1">
        <span id="nested-button-child">Nested action</span>
      </button>
      <input id="child-input" />
    </div>

    <button id="open" type="button" (click)="picker.open()">Browse</button>
  `,
})
class FilePickerHost {
  readonly accept = signal<string | null>(null);
  readonly multiple = signal(true);
  readonly maxBytes = signal<number | null>(null);
  readonly maxFiles = signal<number | null>(null);
  readonly disabled = signal(false);
  readonly validate = signal<HellFileValidator | null>(null);
  readonly ui = signal<string | null>(null);
  readonly selections: HellFileSelection[] = [];
  nestedClicks = 0;
}

describe('HellFilePicker', () => {
  const announce = vi.fn(() => Promise.resolve());

  beforeEach(async () => {
    announce.mockClear();
    await TestBed.configureTestingModule({
      imports: [FilePickerHost],
      providers: [{ provide: LiveAnnouncer, useValue: { announce } }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes one accessible root Public Part and exportAs open action', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    expect(picker.getAttribute('data-slot')).toBe('root');
    expect(picker.getAttribute('role')).toBe('button');
    expect(picker.getAttribute('tabindex')).toBe('0');
    expect(picker.getAttribute('aria-label')).toBe('Add attachments');

    button(fixture.nativeElement, 'open').click();

    expect(click).toHaveBeenCalledOnce();
    expect(fileInput(picker).ownerDocument).toBe(picker.ownerDocument);
  });

  it('merges string shorthand into the root Part Style Map', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    fixture.detectChanges();
    const defaultClassName = pickerElement(fixture.nativeElement).className;

    fixture.componentInstance.ui.set(
      'grid min-h-hell-10 border-hell-danger bg-hell-danger-soft text-hell-danger',
    );
    fixture.detectChanges();

    expectUiRouting(
      defaultClassName,
      pickerElement(fixture.nativeElement).className,
      'grid min-h-hell-10 border-hell-danger bg-hell-danger-soft text-hell-danger',
    );
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(FilePickerHost);
      fixture.detectChanges();

      expect({
        root: pickerElement(fixture.nativeElement).className.split(/\s+/).filter(Boolean).sort(),
      }).toMatchSnapshot('filePicker');
    });
  });

  it('opens from the host and ordinary content without hijacking nested controls', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    picker.click();
    element(fixture.nativeElement, 'ordinary-child').click();
    element(fixture.nativeElement, 'nested-button-child').click();

    expect(click).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.nestedClicks).toBe(1);
  });

  it('gates native, focusable, editable, ARIA-action, and shadow-tree descendants', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    const ownerDocument = picker.ownerDocument;
    const MouseEventCtor = ownerDocument.defaultView?.MouseEvent;
    if (!MouseEventCtor) throw new Error('Expected an owner-window MouseEvent constructor.');

    const nativeControls = ['a', 'input', 'select', 'textarea', 'summary'] as const;
    for (const tagName of nativeControls) {
      const control = ownerDocument.createElement(tagName);
      if (tagName === 'a') control.setAttribute('href', '#picker');
      picker.append(control);
      control.dispatchEvent(
        new MouseEventCtor('click', { bubbles: true, cancelable: true, composed: true }),
      );
    }

    const editable = ownerDocument.createElement('div');
    editable.setAttribute('contenteditable', 'true');
    const focusable = ownerDocument.createElement('div');
    focusable.tabIndex = -1;
    const ariaAction = ownerDocument.createElement('div');
    ariaAction.setAttribute('role', 'switch');
    for (const control of [editable, focusable, ariaAction]) {
      picker.append(control);
      control.dispatchEvent(
        new MouseEventCtor('click', { bubbles: true, cancelable: true, composed: true }),
      );
    }

    const shadowHost = ownerDocument.createElement('span');
    const shadowButton = ownerDocument.createElement('button');
    const shadowContent = ownerDocument.createElement('span');
    shadowButton.append(shadowContent);
    shadowHost.attachShadow({ mode: 'open' }).append(shadowButton);
    picker.append(shadowHost);
    shadowContent.dispatchEvent(
      new MouseEventCtor('click', { bubbles: true, cancelable: true, composed: true }),
    );

    expect(click).not.toHaveBeenCalled();
  });

  it('keeps accept, multiple, and disabled synchronized on the internal input', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.accept.set(' image/*,.PDF ');
    fixture.detectChanges();

    pickerElement(fixture.nativeElement).click();
    const input = fileInput(pickerElement(fixture.nativeElement));
    expect(input.hidden).toBe(true);
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.accept).toBe('image/*,.PDF');
    expect(input.multiple).toBe(true);
    expect(input.disabled).toBe(false);

    host.accept.set(null);
    host.multiple.set(false);
    host.disabled.set(true);
    fixture.detectChanges();

    expect(input.hasAttribute('accept')).toBe(false);
    expect(input.multiple).toBe(false);
    expect(input.disabled).toBe(true);
  });

  it('emits the same structured result for browse and drop acquisitions', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.accept.set('.txt');
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    picker.click();
    const accepted = file('notes.TXT', 'text/plain');
    const rejected = file('photo.png', 'image/png');
    setFiles(fileInput(picker), [accepted, rejected]);
    fileInput(picker).dispatchEvent(new Event('change', { bubbles: true }));
    dispatchDrop(picker, accepted, rejected);

    expect(host.selections).toHaveLength(2);
    expect(host.selections[0]).toEqual(host.selections[1]);
    expect(host.selections[0]).toEqual({
      accepted: [accepted],
      rejected: [
        {
          file: rejected,
          reason: 'type',
          message: 'photo.png is not an accepted file type',
        },
      ],
    });
  });

  it('matches extensions, exact MIME types, and wildcard MIME families', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.accept.set('.tar.gz,application/pdf,image/*');
    fixture.detectChanges();

    const archive = file('BACKUP.TAR.GZ');
    const pdf = file('report.bin', 'application/pdf');
    const image = file('photo.bin', 'image/webp');
    const text = file('notes.txt', 'text/plain');
    dispatchDrop(pickerElement(fixture.nativeElement), archive, pdf, image, text);

    expect(host.selections).toEqual([
      {
        accepted: [archive, pdf, image],
        rejected: [expect.objectContaining({ file: text, reason: 'type' })],
      },
    ]);
  });

  it('rejects only files above maxBytes and keeps a size reason', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.maxBytes.set(3);
    fixture.detectChanges();

    const boundary = new File(['abc'], 'boundary.txt', { type: 'text/plain' });
    const large = new File(['abcd'], 'large.txt', { type: 'text/plain' });
    dispatchDrop(pickerElement(fixture.nativeElement), boundary, large);

    expect(host.selections[0]).toEqual({
      accepted: [boundary],
      rejected: [
        {
          file: large,
          reason: 'size',
          message: 'large.txt is larger than the 3 B limit',
        },
      ],
    });
  });

  it('applies custom validation after type and size without losing specific reasons', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    const validate = vi.fn<HellFileValidator>((candidate) =>
      candidate.name.includes('blocked') ? 'This file is blocked by policy' : null,
    );
    host.accept.set('text/plain');
    host.maxBytes.set(4);
    host.validate.set(validate);
    fixture.detectChanges();

    const wrongType = file('blocked.png', 'image/png');
    const tooLarge = new File(['12345'], 'blocked.txt', { type: 'text/plain' });
    const custom = file('blocked.txt', 'text/plain');
    const valid = file('valid.txt', 'text/plain');
    dispatchDrop(pickerElement(fixture.nativeElement), wrongType, tooLarge, custom, valid);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(host.selections[0]).toEqual({
      accepted: [valid],
      rejected: [
        expect.objectContaining({ file: wrongType, reason: 'type' }),
        expect.objectContaining({ file: tooLarge, reason: 'size' }),
        {
          file: custom,
          reason: 'custom',
          message: 'This file is blocked by policy',
        },
      ],
    });
  });

  it('accepts the first valid files and rejects deterministic per-batch overflow', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.accept.set('.txt');
    host.maxFiles.set(2);
    fixture.detectChanges();

    const first = file('first.txt');
    const invalid = file('invalid.png', 'image/png');
    const second = file('second.txt');
    const overflow = file('overflow.txt');
    dispatchDrop(pickerElement(fixture.nativeElement), first, invalid, second, overflow);

    expect(host.selections[0]).toEqual({
      accepted: [first, second],
      rejected: [
        expect.objectContaining({ file: invalid, reason: 'type' }),
        {
          file: overflow,
          reason: 'count',
          message: 'overflow.txt exceeds the per-batch limit of 2 files',
        },
      ],
    });

    host.selections.length = 0;
    dispatchDrop(pickerElement(fixture.nativeElement), overflow);
    expect(host.selections[0]).toEqual({ accepted: [overflow], rejected: [] });
  });

  it('uses multiple=false as an effective one-file batch limit', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.multiple.set(false);
    host.maxFiles.set(5);
    fixture.detectChanges();

    const first = file('first.txt');
    const second = file('second.txt');
    dispatchDrop(pickerElement(fixture.nativeElement), first, second);

    expect(host.selections[0]).toEqual({
      accepted: [first],
      rejected: [
        {
          file: second,
          reason: 'count',
          message: 'second.txt exceeds the per-batch limit of 1 file',
        },
      ],
    });
  });

  it('emits exactly once for all-rejected and empty enabled acquisitions', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.accept.set('image/*');
    fixture.detectChanges();

    const rejected = file('notes.txt', 'text/plain');
    dispatchDrop(pickerElement(fixture.nativeElement), rejected);
    dispatchDrop(pickerElement(fixture.nativeElement));

    expect(host.selections).toHaveLength(2);
    expect(host.selections[0]).toEqual({
      accepted: [],
      rejected: [expect.objectContaining({ file: rejected, reason: 'type' })],
    });
    expect(host.selections[1]).toEqual({ accepted: [], rejected: [] });
  });

  it('resets the native input so the same file can be selected again', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    picker.click();
    const input = fileInput(picker);
    const same = file('same.txt');
    setFiles(input, [same]);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(input.value).toBe('');

    setFiles(input, [same]);
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(host.selections).toEqual([
      { accepted: [same], rejected: [] },
      { accepted: [same], rejected: [] },
    ]);
  });

  it('activates from Enter and Space but does not steal child keyboard events', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    picker.dispatchEvent(enter);
    const space = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    picker.dispatchEvent(space);
    const childKey = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input(fixture.nativeElement, 'child-input').dispatchEvent(childKey);

    expect(enter.defaultPrevented).toBe(true);
    expect(space.defaultPrevented).toBe(true);
    expect(childKey.defaultPrevented).toBe(false);
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('keeps drag state stable across child boundaries and clears it on drop', () => {
    const fixture = TestBed.createComponent(FilePickerHost);
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    const child = element(fixture.nativeElement, 'child');
    picker.dispatchEvent(dragEvent('dragenter'));
    fixture.detectChanges();
    expect(picker.getAttribute('data-dragging')).toBe('true');

    child.dispatchEvent(dragEvent('dragleave', [], picker));
    fixture.detectChanges();
    expect(picker.getAttribute('data-dragging')).toBe('true');

    const drop = dispatchDrop(picker);
    fixture.detectChanges();
    expect(drop.defaultPrevented).toBe(true);
    expect(picker.hasAttribute('data-dragging')).toBe(false);
  });

  it('does not open, intercept drops, or emit while disabled', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.disabled.set(true);
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    picker.click();
    const over = dragEvent('dragover');
    picker.dispatchEvent(over);
    const drop = dispatchDrop(picker, file('ignored.txt'));
    fixture.detectChanges();

    expect(picker.getAttribute('data-disabled')).toBe('true');
    expect(picker.getAttribute('aria-disabled')).toBe('true');
    expect(picker.getAttribute('tabindex')).toBe('-1');
    expect(picker.querySelector('input[type="file"]')).toBeNull();
    expect(over.defaultPrevented).toBe(false);
    expect(drop.defaultPrevented).toBe(false);
    expect(picker.hasAttribute('data-dragging')).toBe(false);
    expect(click).not.toHaveBeenCalled();
    expect(host.selections).toEqual([]);
  });

  it('uses Label Contract messages and announces one combined batch outcome', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [FilePickerHost],
      providers: [
        { provide: LiveAnnouncer, useValue: { announce } },
        provideHellLabels(HELL_FILE_PICKER_LABELS, {
          rejectedType: (name) => `Wrong type: ${name}`,
          acceptedAnnouncement: (count) => `Accepted ${count}`,
          rejectedAnnouncement: (count) => `Rejected ${count}`,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    host.accept.set('.txt');
    fixture.detectChanges();
    const accepted = file('ok.txt');
    const rejected = file('no.png', 'image/png');
    dispatchDrop(pickerElement(fixture.nativeElement), accepted, rejected);

    expect(host.selections[0].rejected[0]?.message).toBe('Wrong type: no.png');
    expect(announce).toHaveBeenCalledOnce();
    expect(announce).toHaveBeenCalledWith('Accepted 1. Rejected 1', 'polite');
  });

  it('removes the internal input and listeners on destroy', () => {
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const fixture = TestBed.createComponent(FilePickerHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const picker = pickerElement(fixture.nativeElement);
    picker.click();
    const nativeInput = fileInput(picker);
    fixture.destroy();

    expect(nativeInput.ownerDocument.contains(nativeInput)).toBe(false);
    setFiles(nativeInput, [file('stale.txt')]);
    nativeInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(host.selections).toEqual([]);
  });
});

function file(name: string, type = 'text/plain'): File {
  return new File(['a'], name, { type });
}

function pickerElement(root: HTMLElement): HTMLElement {
  const picker = root.querySelector('[hellFilePicker]');
  if (!(picker instanceof HTMLElement)) throw new Error('Expected File Picker host.');
  return picker;
}

function fileInput(picker: HTMLElement): HTMLInputElement {
  const nativeInput = picker.querySelector('input[type="file"]');
  if (!(nativeInput instanceof HTMLInputElement)) throw new Error('Expected native file input.');
  return nativeInput;
}

function button(root: HTMLElement, id: string): HTMLButtonElement {
  const candidate = root.querySelector(`#${id}`);
  if (!(candidate instanceof HTMLButtonElement)) throw new Error(`Expected button #${id}.`);
  return candidate;
}

function input(root: HTMLElement, id: string): HTMLInputElement {
  const candidate = root.querySelector(`#${id}`);
  if (!(candidate instanceof HTMLInputElement)) throw new Error(`Expected input #${id}.`);
  return candidate;
}

function element(root: HTMLElement, id: string): HTMLElement {
  const candidate = root.querySelector(`#${id}`);
  if (!(candidate instanceof HTMLElement)) throw new Error(`Expected element #${id}.`);
  return candidate;
}

function setFiles(input: HTMLInputElement, files: readonly File[]): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: fileList(files),
  });
}

function dragEvent(
  type: string,
  files: readonly File[] = [],
  relatedTarget: EventTarget | null = null,
): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    value: { files: fileList(files) },
  });
  if (relatedTarget !== null) {
    Object.defineProperty(event, 'relatedTarget', { value: relatedTarget });
  }
  return event;
}

function dispatchDrop(picker: HTMLElement, ...files: File[]): DragEvent {
  const event = dragEvent('drop', files);
  picker.dispatchEvent(event);
  return event;
}

function fileList(files: readonly File[]): FileList {
  const list: Partial<FileList> & { [index: number]: File } = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
  };
  files.forEach((candidate, index) => {
    list[index] = candidate;
  });
  return list as FileList;
}
