import { hellPartStyler, type HellRecipe, type HellUiInput } from './styleable';
import { hellTwMerge } from './part-style-merge';

/**
 * Central ownership of the Part-Class Pipeline contract.
 *
 * This spec is the single place that proves merge semantics for
 * `hellPartStyler` and `hellTwMerge`: string shorthand vs part maps,
 * default-part routing, deterministic conflict resolution, empty values, and
 * Hell's custom Tailwind class groups. Component specs must not re-verify
 * these semantics through individual utility-class membership assertions.
 *
 * A converted component spec instead asserts:
 * - behavior and state attributes (`data-slot`, `data-*` state, ARIA), and
 * - that a rendered part's class equals the shared pipeline output for the
 *   component's exported recipe (`hellTwMerge(recipe.part, uiEntry)`), and
 * - a recipe snapshot that pins the default classes without bootstrapping the
 *   component.
 *
 * See `card.spec.ts` and `separator.spec.ts` for the conversion template.
 */
describe('Part-Class Pipeline', () => {
  describe('hellTwMerge custom class groups', () => {
    it('merges Hell token utility groups deterministically', () => {
      expect(hellTwMerge('rounded-hell-md rounded-hell-pill')).toBe('rounded-hell-pill');
      expect(hellTwMerge('shadow-hell-sm shadow-hell-lg')).toBe('shadow-hell-lg');
      expect(hellTwMerge('h-hell-control-md h-hell-control-lg')).toBe('h-hell-control-lg');
      expect(hellTwMerge('px-hell-4 px-hell-7')).toBe('px-hell-7');
    });

    it('resolves conflicts between Hell token classes and stock utilities in one group', () => {
      expect(hellTwMerge('rounded-hell-lg', 'rounded-sm')).toBe('rounded-sm');
      expect(hellTwMerge('rounded-lg', 'rounded-hell-pill')).toBe('rounded-hell-pill');
      expect(hellTwMerge('shadow-hell-xs', 'shadow-none')).toBe('shadow-none');
      expect(hellTwMerge('px-hell-6', 'px-2')).toBe('px-2');
      expect(hellTwMerge('h-10', 'h-hell-control-sm')).toBe('h-hell-control-sm');
      expect(hellTwMerge('gap-2', 'gap-hell-3')).toBe('gap-hell-3');
    });

    it('keeps non-conflicting classes from both sides in order', () => {
      expect(hellTwMerge('flex border border-hell-border', 'rounded-hell-md')).toBe(
        'flex border border-hell-border rounded-hell-md',
      );
      expect(hellTwMerge('text-sm text-hell-foreground', 'text-xs')).toBe(
        'text-hell-foreground text-xs',
      );
    });

    it('does not let base classes clobber variant-scoped recipe classes', () => {
      expect(hellTwMerge('shadow-hell-xs data-[elevation=2]:shadow-hell-md', 'shadow-none')).toBe(
        'data-[elevation=2]:shadow-hell-md shadow-none',
      );
      expect(
        hellTwMerge(
          'data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px',
          'bg-hell-danger',
        ),
      ).toBe('data-[orientation=horizontal]:h-px data-[orientation=vertical]:w-px bg-hell-danger');
    });

    it('keeps font-family inheritance independent of font-weight utilities', () => {
      // Recipes spell font-family inheritance as `font-[family-name:inherit]`:
      // the bare `font-[inherit]` form is classified into the font-weight
      // group and silently dropped next to `font-medium` (#317).
      expect(hellTwMerge('font-[family-name:inherit] font-medium')).toBe(
        'font-[family-name:inherit] font-medium',
      );
      expect(hellTwMerge('font-[family-name:inherit] font-medium', 'font-semibold')).toBe(
        'font-[family-name:inherit] font-semibold',
      );
      expect(hellTwMerge('font-[family-name:inherit]', 'font-sans')).toBe('font-sans');
    });

    it('deduplicates repeated classes in favor of the last occurrence', () => {
      expect(hellTwMerge('flex', 'flex')).toBe('flex');
      expect(hellTwMerge('px-hell-4 flex px-hell-4')).toBe('flex px-hell-4');
    });
  });

  describe('hellPartStyler', () => {
    type TestPart = 'root' | 'label';

    const recipe: HellRecipe<TestPart> = {
      root: 'flex rounded-hell-md px-hell-4 shadow-hell-sm',
      label: 'text-sm font-medium text-hell-foreground',
    };

    function stylerFor(ui: HellUiInput<TestPart>, defaultPart: TestPart = 'root') {
      return hellPartStyler<TestPart>(() => ui, { defaultPart, recipe: () => recipe });
    }

    describe('empty values', () => {
      it('returns the pure recipe when ui is undefined', () => {
        const part = stylerFor(undefined);
        expect(part('root')).toBe(recipe.root);
        expect(part('label')).toBe(recipe.label);
      });

      it('returns the pure recipe when ui is null', () => {
        const part = stylerFor(null);
        expect(part('root')).toBe(recipe.root);
        expect(part('label')).toBe(recipe.label);
      });

      it('returns the pure recipe for an empty string shorthand', () => {
        const part = stylerFor('');
        expect(part('root')).toBe(recipe.root);
        expect(part('label')).toBe(recipe.label);
      });

      it('returns the pure recipe for an empty part map', () => {
        const part = stylerFor({});
        expect(part('root')).toBe(recipe.root);
        expect(part('label')).toBe(recipe.label);
      });

      it('returns the pure recipe for undefined or empty map entries', () => {
        const part = stylerFor({ root: undefined, label: '' });
        expect(part('root')).toBe(recipe.root);
        expect(part('label')).toBe(recipe.label);
      });
    });

    describe('string shorthand and the default part', () => {
      it('applies string shorthand to the default part only', () => {
        const part = stylerFor('px-hell-2');
        expect(part('root')).toBe('flex rounded-hell-md shadow-hell-sm px-hell-2');
        expect(part('label')).toBe(recipe.label);
      });

      it('routes string shorthand to the configured default part, not a hardcoded root', () => {
        const part = stylerFor('text-xs', 'label');
        expect(part('root')).toBe(recipe.root);
        expect(part('label')).toBe('font-medium text-hell-foreground text-xs');
      });

      it('resolves Hell custom-group conflicts between shorthand and recipe', () => {
        const part = stylerFor('rounded-hell-pill shadow-none');
        expect(part('root')).toBe('flex px-hell-4 rounded-hell-pill shadow-none');
      });
    });

    describe('part maps', () => {
      it('routes map entries to their matching parts', () => {
        const part = stylerFor({ root: 'rounded-hell-pill', label: 'text-hell-danger' });
        expect(part('root')).toBe('flex px-hell-4 shadow-hell-sm rounded-hell-pill');
        expect(part('label')).toBe('text-sm font-medium text-hell-danger');
      });

      it('leaves parts without a map entry on the pure recipe', () => {
        const part = stylerFor({ label: 'text-xs' });
        expect(part('root')).toBe(recipe.root);
        expect(part('label')).toBe('font-medium text-hell-foreground text-xs');
      });

      it('lets a map entry target the default part explicitly', () => {
        const part = stylerFor({ root: 'px-hell-2' });
        expect(part('root')).toBe('flex rounded-hell-md shadow-hell-sm px-hell-2');
      });

      it('appends non-conflicting consumer classes after surviving recipe classes', () => {
        const part = stylerFor({ root: 'border border-hell-border' });
        expect(part('root')).toBe(
          'flex rounded-hell-md px-hell-4 shadow-hell-sm border border-hell-border',
        );
      });
    });

    describe('lazy reads', () => {
      it('re-reads ui on every call', () => {
        let ui: HellUiInput<TestPart> = undefined;
        const part = hellPartStyler<TestPart>(() => ui, {
          defaultPart: 'root',
          recipe: () => recipe,
        });

        expect(part('root')).toBe(recipe.root);

        ui = 'px-hell-2';
        expect(part('root')).toBe('flex rounded-hell-md shadow-hell-sm px-hell-2');
      });

      it('re-reads the recipe on every call', () => {
        let current: HellRecipe<TestPart> = recipe;
        const part = hellPartStyler<TestPart>(() => undefined, {
          defaultPart: 'root',
          recipe: () => current,
        });

        expect(part('root')).toBe(recipe.root);

        current = { root: 'grid p-hell-2', label: 'text-xs' };
        expect(part('root')).toBe('grid p-hell-2');
        expect(part('label')).toBe('text-xs');
      });
    });
  });
});
