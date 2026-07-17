import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellDialpad } from '@hell-ui/angular/features/dialpad';
import { HellChip } from '@hell-ui/angular/chip';

type CallState = 'idle' | 'dialing' | 'connected';

@Component({
  selector: 'app-dialpad-call-console-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellDialpad, HellChip, ...HELL_CARD_IMPORTS],
  template: `
    <div hellCard class="max-w-[340px]" [elevation]="1">
      <div hellCardHeader>
        <span>Call console</span>
        <span
          hellChip
          [variant]="callState() === 'connected' ? 'success' : callState() === 'dialing' ? 'warning' : 'default'"
        >
          {{ statusLabel() }}
        </span>
      </div>

      <div hellCardBody>
        <hell-dialpad
          [value]="number()"
          [readOnly]="callState() !== 'idle'"
          (valueChange)="number.set($event)"
          (call)="startCall($event)"
        />
      </div>

      <div hellCardFooter>
        @if (callState() === 'idle') {
          <button hellButton variant="ghost" type="button" [disabled]="!number()" (click)="startCall(number())">
            Dial
          </button>
        } @else {
          <button hellButton variant="danger" type="button" (click)="hangUp()">Hang up</button>
        }
      </div>
    </div>
  `,
})
export class DialpadCallConsoleExample {
  protected readonly number = signal('5550137');
  private readonly callStateInput = signal<CallState>('idle');
  protected readonly callState = this.callStateInput.asReadonly();
  protected readonly statusLabel = computed(() => {
    switch (this.callState()) {
      case 'connected':
        return 'Connected';
      case 'dialing':
        return 'Dialing…';
      default:
        return 'Idle';
    }
  });

  protected startCall(value: string): void {
    if (!value) return;
    this.callStateInput.set('dialing');
    setTimeout(() => this.callStateInput.set('connected'), 900);
  }

  protected hangUp(): void {
    this.callStateInput.set('idle');
  }
}
