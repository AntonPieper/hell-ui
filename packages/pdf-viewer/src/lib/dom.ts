/**
 * Type guards and DOM helpers that remain valid across document realms.
 * Kept local so the split PDF package does not import Hell core internals.
 */
export function isNodeLike(target: EventTarget | Node | null | undefined): target is Node {
  return (
    typeof target === 'object' &&
    target != null &&
    typeof (target as Node).nodeType === 'number' &&
    typeof (target as Node).contains === 'function'
  );
}

export function isElementLike(target: EventTarget | Node | null | undefined): target is Element {
  return isNodeLike(target) && target.nodeType === 1;
}

export function containsNode(
  container: EventTarget | Node | null | undefined,
  target: EventTarget | Node | null | undefined,
): boolean {
  return isNodeLike(container) && isNodeLike(target) && container.contains(target);
}
