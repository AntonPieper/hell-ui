import { extendTailwindMerge } from 'tailwind-merge';

/** Merge Tailwind classes with Hell design-token class groups. */
export const hellTwMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['hell-xs', 'hell-sm', 'hell-md', 'hell-lg', 'hell-xl', 'hell-pill'],
      shadow: ['hell-xs', 'hell-sm', 'hell-md', 'hell-lg'],
      spacing: [
        'hell-1',
        'hell-2',
        'hell-3',
        'hell-4',
        'hell-5',
        'hell-6',
        'hell-7',
        'hell-8',
        'hell-9',
        'hell-10',
        'hell-control-xs',
        'hell-control-sm',
        'hell-control-md',
        'hell-control-lg',
        'hell-control-xl',
      ],
    },
  },
});
