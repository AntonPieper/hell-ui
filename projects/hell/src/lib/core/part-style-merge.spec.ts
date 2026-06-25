import { hellTwMerge } from './part-style-merge';

describe('hellTwMerge', () => {
  it('merges Hell token utility groups deterministically', () => {
    expect(hellTwMerge('rounded-hell-md rounded-hell-pill')).toBe('rounded-hell-pill');
    expect(hellTwMerge('shadow-hell-sm shadow-hell-lg')).toBe('shadow-hell-lg');
    expect(hellTwMerge('h-hell-control-md h-hell-control-lg')).toBe('h-hell-control-lg');
    expect(hellTwMerge('px-hell-4 px-hell-7')).toBe('px-hell-7');
  });
});
