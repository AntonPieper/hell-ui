import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

export function useLazyGlobalStyleLink(id: string, href: string): void {
  const documentRef = inject(DOCUMENT);

  if (documentRef.getElementById(id)) return;

  const link = documentRef.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = new URL(href, documentRef.baseURI).toString();
  documentRef.head.appendChild(link);
}
