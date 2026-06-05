import { HellRowDraftController, hellTableRowsFromData } from './table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

const [ada, grace] = hellTableRowsFromData<Person>([
  { id: 'ada', name: 'Ada', role: 'Admin' },
  { id: 'grace', name: 'Grace', role: 'Editor' },
]);

describe('HellRowDraftController', () => {
  it('isolates drafts, dirty, touched, disabled, patch, and reset by row key', () => {
    const controller = new HellRowDraftController<Person>();

    controller.field<string>(ada, 'name').patch('Ada draft');
    controller.field<string>(ada, 'name').touch();
    controller.patch(grace, { role: 'Reviewer' });
    controller.setDisabled(grace, true);

    expect(controller.draft(ada)).toEqual({ id: 'ada', name: 'Ada draft', role: 'Admin' });
    expect(controller.draft(grace)).toEqual({ id: 'grace', name: 'Grace', role: 'Reviewer' });
    expect(controller.dirty(ada)).toBe(true);
    expect(controller.dirty(grace)).toBe(true);
    expect(controller.touched(ada, 'name')).toBe(true);
    expect(controller.touched(grace)).toBe(false);
    expect(controller.disabled(ada)).toBe(false);
    expect(controller.disabled(grace)).toBe(true);
    expect(controller.field<string>(ada, 'name')).toEqual(
      expect.objectContaining({ value: 'Ada draft', dirty: true, touched: true, disabled: false }),
    );

    controller.reset(ada, { id: 'ada', name: 'Ada reset', role: 'Admin' });

    expect(controller.draft(ada)).toEqual({ id: 'ada', name: 'Ada reset', role: 'Admin' });
    expect(controller.dirty(ada)).toBe(false);
    expect(controller.touched(ada)).toBe(false);
    expect(controller.draft(grace)).toEqual({ id: 'grace', name: 'Grace', role: 'Reviewer' });
  });

  it('recovers from async save failure while preserving the dirty draft', async () => {
    let resolveSave!: () => void;
    let rejectSave!: (error: unknown) => void;
    const attempts: string[] = [];
    const controller = new HellRowDraftController<Person>({
      save: (draft, row) => {
        attempts.push(`${row.key}:${draft.name ?? ''}`);
        return new Promise<void>((resolve, reject) => {
          resolveSave = resolve;
          rejectSave = reject;
        });
      },
    });

    controller.patch(ada, { name: 'Ada failing' });
    const failedSave = controller.save(ada);

    expect(controller.saveStatus(ada)).toBe('saving');
    expect(controller.disabled(ada)).toBe(true);

    const failure = new Error('network down');
    rejectSave(failure);
    await expect(failedSave).resolves.toBe(false);

    expect(controller.saveStatus(ada)).toBe('error');
    expect(controller.saveError(ada)).toBe(failure);
    expect(controller.disabled(ada)).toBe(false);
    expect(controller.dirty(ada)).toBe(true);
    expect(controller.draft(ada)).toEqual({ id: 'ada', name: 'Ada failing', role: 'Admin' });

    controller.patch(ada, { name: 'Ada saved' });
    const successfulSave = controller.save(ada);
    resolveSave();
    await expect(successfulSave).resolves.toBe(true);

    expect(attempts).toEqual(['ada:Ada failing', 'ada:Ada saved']);
    expect(controller.saveStatus(ada)).toBe('saved');
    expect(controller.saveError(ada)).toBeNull();
    expect(controller.dirty(ada)).toBe(false);
    expect(controller.draft(ada)).toEqual({ id: 'ada', name: 'Ada saved', role: 'Admin' });
  });

  it('does not mark edits made during a pending save as clean', async () => {
    let resolveSave!: () => void;
    const savedDrafts: Partial<Person>[] = [];
    const controller = new HellRowDraftController<Person>({
      save: (draft) => {
        savedDrafts.push({ ...draft });
        return new Promise<void>((resolve) => {
          resolveSave = resolve;
        });
      },
    });

    controller.patch(ada, { name: 'Persisted first' });
    const pendingSave = controller.save(ada);
    controller.patch(ada, { name: 'Unsaved second' });

    resolveSave();
    await expect(pendingSave).resolves.toBe(false);

    expect(savedDrafts).toEqual([{ id: 'ada', name: 'Persisted first', role: 'Admin' }]);
    expect(controller.saveStatus(ada)).toBe('idle');
    expect(controller.draft(ada)).toEqual({ id: 'ada', name: 'Unsaved second', role: 'Admin' });
    expect(controller.dirty(ada)).toBe(true);
  });

  it('rolls cancel back to the baseline and clears transient errors', () => {
    const controller = new HellRowDraftController<Person>();

    controller.patch(ada, { name: 'Changed' });
    controller.touch(ada, 'name');
    controller.setValidationErrors(ada, { name: ['Name is invalid'] });

    controller.cancel(ada);

    expect(controller.draft(ada)).toEqual({ id: 'ada', name: 'Ada', role: 'Admin' });
    expect(controller.dirty(ada)).toBe(false);
    expect(controller.touched(ada)).toBe(false);
    expect(controller.validationErrors(ada)).toEqual({});
    expect(controller.saveStatus(ada)).toBe('idle');
  });

  it('stores validation errors and blocks save until they are resolved', async () => {
    let saves = 0;
    const controller = new HellRowDraftController<Person>({
      validate: (draft) => (draft.name?.trim() ? null : { name: ['Name is required'] }),
      save: () => {
        saves += 1;
      },
    });

    controller.patch(ada, { name: '' });

    expect(controller.validate(ada)).toBe(false);
    expect(controller.validationErrors(ada)).toEqual({ name: ['Name is required'] });
    await expect(controller.save(ada)).resolves.toBe(false);
    expect(saves).toBe(0);
    expect(controller.saveStatus(ada)).toBe('error');
    expect(controller.field<string>(ada, 'name').errors).toEqual(['Name is required']);

    controller.field<string>(ada, 'name').patch('Ada valid');
    await expect(controller.save(ada)).resolves.toBe(true);

    expect(saves).toBe(1);
    expect(controller.validationErrors(ada)).toEqual({});
    expect(controller.saveStatus(ada)).toBe('saved');
  });

  it('cleans draft state when rows disappear', () => {
    const controller = new HellRowDraftController<Person>();

    controller.patch(ada, { name: 'Ada draft' });
    controller.patch(grace, { name: 'Grace draft' });

    expect(controller.keys()).toEqual(['ada', 'grace']);

    controller.cleanupRows([grace]);

    expect(controller.has(ada)).toBe(false);
    expect(controller.has(grace)).toBe(true);
    expect(controller.keys()).toEqual(['grace']);
  });
});
