export type HellTableInferredRole = 'table' | 'rowgroup' | 'row' | 'columnheader' | 'cell';

type HellTableRoleHost = {
  readonly tagName?: string;
  readonly nodeName?: string;
  getAttribute?: (name: string) => string | null;
};

export function hellHostElementName(host: unknown): string | null {
  if (host == null || typeof host !== 'object') return null;
  const candidate = host as HellTableRoleHost;
  const name = candidate.tagName ?? candidate.nodeName ?? null;
  return typeof name === 'string' ? name.toUpperCase() : null;
}

function hellHostHasExplicitRole(host: unknown): boolean {
  if (host == null || typeof host !== 'object') return false;
  const getAttribute = (host as HellTableRoleHost).getAttribute;
  if (typeof getAttribute !== 'function') return false;
  return getAttribute.call(host, 'role') !== null;
}

export function hellTableInferredRoleForHost(
  host: unknown,
  nativeElementNames: readonly string[],
  inferredRole: HellTableInferredRole,
): HellTableInferredRole | null {
  const elementName = hellHostElementName(host);
  if (elementName === null) return null;
  if (nativeElementNames.includes(elementName)) return null;
  if (hellHostHasExplicitRole(host)) return null;
  return inferredRole;
}
