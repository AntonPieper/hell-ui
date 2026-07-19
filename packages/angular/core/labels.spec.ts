import { EnvironmentInjector, InjectionToken, createEnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { hellCreateLabels, provideHellLabels } from './labels';

/**
 * Central ownership of the Label Contract override semantics.
 *
 * This spec is the single place that proves how `hellCreateLabels` tokens and
 * `provideHellLabels` behave across injector scopes: default fallback, partial
 * merge over built-in defaults at the root injector, partial merge over the
 * nearest ancestor override in child injectors, and compile-time rejection of
 * tokens the factory did not create. Component specs only prove that their own
 * labels reach the DOM.
 */
interface TestLabels {
  readonly save: string;
  readonly discard: string;
  readonly remove: (label: string) => string;
}

const defaults: TestLabels = {
  save: 'Save',
  discard: 'Discard',
  remove: (label) => `Remove ${label}`,
};

function createTestLabels() {
  return hellCreateLabels<TestLabels>('TEST_LABELS', defaults);
}

describe('Label Contract', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('resolves built-in defaults when nothing is provided', () => {
    const token = createTestLabels();

    expect(TestBed.inject(token)).toBe(defaults);
  });

  it('merges a root-injector override over the built-in defaults', () => {
    const token = createTestLabels();
    TestBed.configureTestingModule({
      providers: [provideHellLabels(token, { save: 'Speichern' })],
    });

    const labels = TestBed.inject(token);
    expect(labels.save).toBe('Speichern');
    expect(labels.discard).toBe('Discard');
    expect(labels.remove('chip')).toBe('Remove chip');
  });

  it('merges a child-injector override over the nearest ancestor value', () => {
    const token = createTestLabels();
    TestBed.configureTestingModule({
      providers: [provideHellLabels(token, { save: 'Speichern', discard: 'Verwerfen' })],
    });

    const child = createEnvironmentInjector(
      [provideHellLabels(token, { remove: (label) => `${label} entfernen` })],
      TestBed.inject(EnvironmentInjector),
    );

    const labels = child.get(token);
    expect(labels.save).toBe('Speichern');
    expect(labels.discard).toBe('Verwerfen');
    expect(labels.remove('Chip')).toBe('Chip entfernen');
  });

  it('keeps ancestor scopes unaffected by child overrides', () => {
    const token = createTestLabels();
    const child = createEnvironmentInjector(
      [provideHellLabels(token, { save: 'Speichern' })],
      TestBed.inject(EnvironmentInjector),
    );

    expect(child.get(token).save).toBe('Speichern');
    expect(TestBed.inject(token).save).toBe('Save');
  });

  it('rejects tokens that hellCreateLabels did not create at compile time', () => {
    const foreign = new InjectionToken<TestLabels>('FOREIGN_LABELS');

    // @ts-expect-error -- provideHellLabels only accepts branded tokens created by hellCreateLabels (#257)
    const provider = provideHellLabels(foreign, { save: 'Nope' });

    expect(provider).toBeDefined();
  });
});
