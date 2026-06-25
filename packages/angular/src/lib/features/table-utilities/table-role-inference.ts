export type HellTableInferredRole =
  | 'table'
  | 'grid'
  | 'rowgroup'
  | 'row'
  | 'columnheader'
  | 'cell'
  | 'gridcell';

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

export function hellHostExplicitRole(host: unknown): string | null {
  if (host == null || typeof host !== 'object') return null;
  const getAttribute = (host as HellTableRoleHost).getAttribute;
  if (typeof getAttribute !== 'function') return null;
  const role = getAttribute.call(host, 'role');
  return typeof role === 'string' && role.trim().length ? role : null;
}

export function hellTableInferredRoleForHost(
  host: unknown,
  nativeElementNames: readonly string[],
  inferredRole: HellTableInferredRole,
  explicitRole: string | null = hellHostExplicitRole(host),
): HellTableInferredRole | null {
  const elementName = hellHostElementName(host);
  if (elementName === null) return null;
  if (nativeElementNames.includes(elementName)) return null;
  if (explicitRole !== null) return null;
  return inferredRole;
}
