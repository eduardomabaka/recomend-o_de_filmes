import { animate, query, sequence, style, transition, trigger } from '@angular/animations';

const reduced =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as unknown as { matchMedia?: (q: string) => MediaQueryList }).matchMedia === 'function' &&
  globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

const enterMs = reduced ? 1 : 280;
const leaveMs = reduced ? 1 : 220;

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'absolute', left: 0, right: 0, width: '100%' }), {
      optional: true,
    }),
    sequence([
      query(
        ':leave',
        [style({ opacity: 1 }), animate(`${leaveMs}ms ease`, style({ opacity: 0 }))],
        { optional: true }
      ),
      query(
        ':enter',
        [
          style({ opacity: 0, transform: 'translateX(18px)' }),
          animate(`${enterMs}ms ease`, style({ opacity: 1, transform: 'none' })),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);
