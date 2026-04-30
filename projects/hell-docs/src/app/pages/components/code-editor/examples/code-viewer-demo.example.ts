import { Component } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { HellCodeEditor } from 'hell/features/code-editor';

@Component({
  selector: 'app-code-viewer-demo',
  imports: [HellCodeEditor],
  template: `
    <hell-code-editor [value]="viewerCode" [extensions]="javascriptExtensions" readOnly />
  `,
})
export class CodeViewerDemo {
  readonly javascriptExtensions: Extension = javascript({ jsx: true, typescript: true });
  readonly viewerCode = `<button hellButton variant="primary">Save</button>
`;
}
