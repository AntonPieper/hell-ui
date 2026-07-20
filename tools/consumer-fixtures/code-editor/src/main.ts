import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellCodeEditor } from '@hell-ui/angular/features/code-editor';

// Code editor boundary: the kept optional CodeMirror feature entry compiles
// and boots only when the CodeMirror peer group is installed.
@Component({
  selector: 'app-root',
  imports: [HellCodeEditor],
  template: `<hell-code-editor [value]="code" readOnly />`,
})
class App {
  protected readonly code = 'console.log("hell")';
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
