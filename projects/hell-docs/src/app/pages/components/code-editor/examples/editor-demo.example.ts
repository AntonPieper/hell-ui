import { Component, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import { type Extension } from '@codemirror/state';
import { HellCodeEditor } from '@hell-ui/angular/features/code-editor';

@Component({
  selector: 'app-editor-demo',
  imports: [HellCodeEditor],
  template: `
    <div class="flex flex-col gap-1 p-2">
      <hell-code-editor
        [value]="snippet()"
        [extensions]="javascriptExtensions"
        (valueChange)="snippet.set($event)"
      />
      <p class="text-sm opacity-70">Length: {{ snippet().length }} chars</p>
    </div>
  `,
})
export class EditorDemo {
  readonly javascriptExtensions: Extension = javascript({ jsx: true, typescript: true });
  readonly snippet = signal(`<section hellCard>
  <div hellCardHeader>Deploy window</div>
  <div hellCardBody>
    Ship frontend assets after tests pass.
  </div>
</section>
`);
}
