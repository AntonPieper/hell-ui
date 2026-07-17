import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAudioPlayer } from '@hell-ui/angular/audio-player';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellChip } from '@hell-ui/angular/chip';

interface Voicemail {
  readonly caller: string;
  readonly number: string;
  readonly receivedAt: Date;
  readonly durationLabel: string;
  readonly src: string;
  readonly unread: boolean;
  readonly urgent?: boolean;
}

@Component({
  selector: 'app-audio-player-voicemail-inbox-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAudioPlayer, HellChip, ...HELL_CARD_IMPORTS],
  template: `
    <div hellCard class="max-w-xl">
      <div hellCardHeader>
        <span>Voicemail</span>
        <span hellChip variant="info">{{ unreadCount }} new</span>
      </div>
      <ul hellCardBody class="m-0 flex list-none flex-col gap-hell-4 p-0">
        @for (mail of voicemails; track mail.src) {
          <li class="flex flex-col gap-hell-2">
            <div class="flex items-center gap-hell-2">
              <span class="text-sm font-semibold text-hell-foreground">{{ mail.caller }}</span>
              @if (mail.unread) {
                <span hellChip variant="primary">Unread</span>
              }
              @if (mail.urgent) {
                <span hellChip variant="danger">Urgent</span>
              }
              <span class="ms-auto text-xs tabular-nums text-hell-foreground-muted">
                {{ mail.durationLabel }}
              </span>
            </div>
            <hell-audio-player
              [src]="mail.src"
              [title]="mail.number"
              [date]="mail.receivedAt"
              [allowDownload]="false"
            />
          </li>
        }
      </ul>
    </div>
  `,
})
export class AudioPlayerVoicemailInboxExample {
  protected readonly voicemails: readonly Voicemail[] = [
    {
      caller: 'Dana Okafor',
      number: '+1 (415) 555-0148',
      receivedAt: new Date(2026, 6, 6),
      durationLabel: '0:42',
      src: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg',
      unread: true,
      urgent: true,
    },
    {
      caller: 'Billing team',
      number: '+1 (628) 555-0117',
      receivedAt: new Date(2026, 6, 5),
      durationLabel: '1:18',
      src: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg',
      unread: true,
    },
    {
      caller: 'Sam Rivera',
      number: '+1 (212) 555-0193',
      receivedAt: new Date(2026, 6, 3),
      durationLabel: '0:27',
      src: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg',
      unread: false,
    },
  ];

  protected readonly unreadCount = this.voicemails.filter((mail) => mail.unread).length;
}
