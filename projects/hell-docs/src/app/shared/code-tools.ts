import { angular } from '@codemirror/lang-angular';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';

export function hdCodeExtensions(code: string): Extension {
  const trimmed = code.trimStart();
  return trimmed.startsWith('<') ? angular() : [javascript({ typescript: true })];
}

export async function hdCopyTextToClipboard(text: string): Promise<void> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
}
