import { matchHotkey } from './omnibar';

describe('HellOmnibar hotkey matching', () => {
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

  it('matches aliases and produced literal keys', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'k', metaKey: true }), 'cmd+k')).toBe(
      true,
    );
    expect(matchHotkey(new KeyboardEvent('keydown', { key: '?' }), '?')).toBe(true);
  });
});
