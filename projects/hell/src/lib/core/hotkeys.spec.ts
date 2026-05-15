import { matchHotkey, hellShouldHandleGlobalHotkey } from './hotkeys';

describe('Core Hotkeys', () => {
  it('matches requested modifiers and rejects extra strict modifiers', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), 'ctrl+k')).toBe(
      true,
    );
    expect(
      matchHotkey(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, altKey: true }),
        'ctrl+k',
      ),
    ).toBe(false);
  });

  it('matches aliases and literal keys', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'k', metaKey: true }), 'cmd+k')).toBe(
      true,
    );
    expect(matchHotkey(new KeyboardEvent('keydown', { key: '?' }), '?')).toBe(true);
  });

  it('blocks editor typing unless modifier requested for editable active targets', () => {
    document.body.innerHTML = '<input id="editor">';
    const editor = document.getElementById('editor') as HTMLInputElement;
    editor.focus();

    const plainEvent = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    Object.defineProperty(plainEvent, 'view', { value: document.defaultView });

    expect(hellShouldHandleGlobalHotkey(plainEvent, '/')).toBe(false);

    const withModifierEvent = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(withModifierEvent, 'view', { value: document.defaultView });

    expect(hellShouldHandleGlobalHotkey(withModifierEvent, 'ctrl+k')).toBe(true);
  });
});
