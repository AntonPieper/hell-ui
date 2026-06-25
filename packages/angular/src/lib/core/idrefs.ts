export function hellIdRefs(value: string | null | undefined): string[] {
  return value?.trim().split(/\s+/).filter(Boolean) ?? [];
}

export function hellUniqueIdRefs(value: string | null | undefined): string[] {
  return Array.from(new Set(hellIdRefs(value)));
}
