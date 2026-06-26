/**
 * Type guards and DOM helpers that remain valid across document realms.
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

export function isDocumentPositionFollowing(
  host: Node,
  target: Node,
  ownerWindow: Window | null | undefined,
): boolean {
  if (!isNodeLike(host) || !isNodeLike(target)) {
    return false;
  }

  const typedWindow = ownerWindow as (Window & { Node: typeof Node }) | null | undefined;
  const positionValue = typedWindow?.Node?.DOCUMENT_POSITION_FOLLOWING;
  if (typeof positionValue !== 'number') {
    return false;
  }

  return (host.compareDocumentPosition(target) & positionValue) !== 0;
}
