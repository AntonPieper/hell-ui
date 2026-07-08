import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { HellUiInput } from '@hell-ui/angular/core';
import { HellAudioPlayer, type HellAudioPlayerPart, type HellAudioPlayerUi } from './audio-player';
import {
  HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
  type HellAudioTranscriptRuntime,
} from '@hell-ui/angular/internal/audio-transcript';

class FakeTranscriptRuntime implements HellAudioTranscriptRuntime {
  readonly transcript = signal('');
  readonly interim = signal('');
  readonly transcribing = signal(false);
  readonly error = signal<string | null>(null);
  readonly copied = signal(false);
  readonly speechSupported = signal(true);
  readonly startRecognition = vi.fn();
  readonly stopRecognition = vi.fn(() => this.transcribing.set(false));
  readonly resetTranscriptState = vi.fn(() => {
    this.transcript.set('');
    this.interim.set('');
    this.error.set(null);
    this.copied.set(false);
  });
  readonly copyTranscript = vi.fn(async () => undefined);
  readonly destroy = vi.fn();

  private recognizing = false;

  isRecognizing(): boolean {
    return this.recognizing;
  }

  setRecognizing(value: boolean): void {
    this.recognizing = value;
  }
}

@Component({
  imports: [HellAudioPlayer],
  template: `
    <hell-audio-player
      src="/test-audio.mp3"
      title="Daily standup"
      date="2026-06-29"
      allowSpeechTranscript
      [ui]="ui()"
    />
  `,
})
class AudioPlayerPartStyleHost {
  readonly objectUi = {
    root: 'max-w-[420px] rounded-none',
    transport: 'gap-hell-4',
    captionToggle: 'text-hell-danger',
    captions: 'rounded-none border-hell-danger',
    captionsStatus: 'text-hell-danger',
    captionsBody: 'bg-hell-surface-muted',
    captionsText: 'font-semibold',
    captionsEmpty: 'text-hell-danger',
  } satisfies HellAudioPlayerUi;
  readonly ui = signal<HellUiInput<HellAudioPlayerPart>>('max-w-[360px]');
}

describe('HellAudioPlayer', () => {
  async function createPlayer(options: { provideTranscript?: boolean } = {}) {
    const transcriptRuntime = new FakeTranscriptRuntime();
    const providers =
      options.provideTranscript === false
        ? []
        : [
            {
              provide: HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
              useValue: () => transcriptRuntime,
            },
          ];

    await TestBed.configureTestingModule({
      imports: [HellAudioPlayer],
      providers,
    }).compileComponents();

    const fixture = TestBed.createComponent(HellAudioPlayer);
    fixture.componentRef.setInput('src', '/test-audio.mp3');
    fixture.componentRef.setInput('allowSpeechTranscript', true);
    fixture.detectChanges();

    const component = fixture.componentInstance as HellAudioPlayer & {
      captions: () => boolean;
      playing: () => boolean;
      transcript: { (): string; set(value: string): void };
      interim: { (): string; set(value: string): void };
      error: { (): string | null; set(value: string | null): void };
      currentTime: { (): number; set(value: number): void };
      onVolume(value: number): void;
      toggleMute(): void;
      cyclePlaybackRate(): void;
    };

    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    return { fixture, component, audio, transcriptRuntime };
  }

  it('defaults audio crossorigin to anonymous', async () => {
    const { audio } = await createPlayer();

    expect(audio.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('forwards use-credentials audio crossorigin mode', async () => {
    const { fixture, audio } = await createPlayer();

    fixture.componentRef.setInput('crossorigin', 'use-credentials');
    fixture.detectChanges();

    expect(audio.getAttribute('crossorigin')).toBe('use-credentials');
  });

  it('omits audio crossorigin when configured with null', async () => {
    const { fixture, audio } = await createPlayer();

    fixture.componentRef.setInput('crossorigin', null);
    fixture.detectChanges();

    expect(audio.hasAttribute('crossorigin')).toBe(false);
  });

  it('applies Part Style Map shorthand and object classes to controls and captions', async () => {
    const transcriptRuntime = new FakeTranscriptRuntime();
    await TestBed.configureTestingModule({
      imports: [AudioPlayerPartStyleHost],
      providers: [
        {
          provide: HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
          useValue: () => transcriptRuntime,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AudioPlayerPartStyleHost);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('hell-audio-player') as HTMLElement;
    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.className).toContain('max-w-[360px]');

    fixture.componentInstance.ui.set(fixture.componentInstance.objectUi);
    fixture.detectChanges();

    expect(root.className).toContain('max-w-[420px]');
    expect(root.className).toContain('rounded-none');
    expect(root.className).not.toContain('rounded-hell-md');

    const transport = root.querySelector('[data-slot="transport"]') as HTMLElement;
    expect(transport.className).toContain('gap-hell-4');

    const times = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="time"]'));
    expect(times.map((time) => time.dataset['time'])).toEqual(['elapsed', 'duration']);

    const seek = root.querySelector('[data-slot="seek"]') as HTMLElement;
    const seekSlider = seek.querySelector('hell-slider') as HTMLElement;
    const volume = root.querySelector('[data-slot="volume"]') as HTMLElement;
    const volumeSlider = volume.querySelector('hell-slider') as HTMLElement;
    expect(seek.className).toContain('flex-1');
    expect(volume.className).toContain('min-w-[7.5rem]');
    expect(seekSlider.getAttribute('data-slot')).toBe('root');
    expect(volumeSlider.getAttribute('data-slot')).toBe('root');

    const captionToggle = root.querySelector('[data-slot="captionToggle"]') as HTMLButtonElement;
    expect(captionToggle.className).toContain('text-hell-danger');

    captionToggle.click();
    fixture.detectChanges();

    const captions = root.querySelector('[data-slot="captions"]') as HTMLElement;
    expect(captions.getAttribute('role')).toBe('dialog');
    expect(captions.className).toContain('rounded-none');
    expect(captions.className).toContain('border-hell-danger');
    expect(captions.querySelector('[data-slot="captionsStatus"]')?.className).toContain(
      'text-hell-danger',
    );
    expect(captions.querySelector('[data-slot="captionsBody"]')?.className).toContain(
      'bg-hell-surface-muted',
    );
    expect(captions.querySelector('[data-slot="captionsEmpty"]')?.className).toContain(
      'text-hell-danger',
    );

    transcriptRuntime.transcript.set('Existing transcript');
    fixture.detectChanges();

    const captionsText = captions.querySelector('[data-slot="captionsText"]') as HTMLElement;
    expect(captionsText.className).toContain('font-semibold');
  });

  it('marks the committed transcript text with a captionsText Public Part', async () => {
    const { fixture, component } = await createPlayer();

    const transcriptButton = fixture.nativeElement.querySelector(
      '[data-slot="captionToggle"]',
    ) as HTMLButtonElement;
    transcriptButton.click();
    fixture.detectChanges();

    component.transcript.set('Committed words');
    fixture.detectChanges();

    const captionsText = fixture.nativeElement.querySelector(
      '[data-slot="captionsText"]',
    ) as HTMLElement;
    expect(captionsText).toBeInstanceOf(HTMLSpanElement);
    expect(captionsText.textContent).toBe('Committed words');

    // Default recipe for captionsText is empty; a Part Style Map entry should
    // still merge in and win deterministically through the pipeline.
    fixture.componentRef.setInput('ui', { captionsText: 'text-hell-primary' });
    fixture.detectChanges();

    expect(captionsText.className).toContain('text-hell-primary');
  });

  it('does not start playback when the speech transcript is toggled while paused', async () => {
    const { fixture, component } = await createPlayer();
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    const transcriptButton = fixture.nativeElement.querySelector(
      '[data-slot="captionToggle"]',
    ) as HTMLButtonElement;

    transcriptButton.click();
    fixture.detectChanges();

    expect(playSpy).not.toHaveBeenCalled();
    expect(component.captions()).toBe(true);
    expect(component.playing()).toBe(false);

    playSpy.mockRestore();
  });

  it('names the speech transcript flyout independently from trigger action labels', async () => {
    const { fixture, component } = await createPlayer();

    const transcriptButton = fixture.nativeElement.querySelector(
      '[data-slot="captionToggle"]',
    ) as HTMLButtonElement;
    transcriptButton.click();
    fixture.detectChanges();

    const flyout = fixture.nativeElement.querySelector('[data-slot="captions"]') as HTMLElement;
    expect(transcriptButton.getAttribute('aria-label')).toBe('Hide speech transcript');
    expect(flyout.getAttribute('role')).toBe('dialog');
    expect(flyout.getAttribute('aria-modal')).toBe('false');
    expect(flyout.getAttribute('aria-label')).toBe('Speech transcript');

    component.error.set('Speech error: network');
    component.transcript.set('Existing transcript');
    fixture.detectChanges();

    expect(flyout.getAttribute('aria-label')).toBe('Speech transcript');
  });

  it('keeps the experimental speech transcript toggle opt-in', async () => {
    await TestBed.configureTestingModule({
      imports: [HellAudioPlayer],
      providers: [
        {
          provide: HELL_AUDIO_TRANSCRIPT_RUNTIME_FACTORY,
          useValue: () => new FakeTranscriptRuntime(),
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(HellAudioPlayer);
    fixture.componentRef.setInput('src', '/test-audio.mp3');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="captionToggle"]')).toBeNull();
  });

  it('hides the transcript toggle without the optional feature provider', async () => {
    const { fixture } = await createPlayer({ provideTranscript: false });

    expect(fixture.nativeElement.querySelector('[data-slot="captionToggle"]')).toBeNull();
  });

  it('hides the transcript toggle when speech transcripts are disabled', async () => {
    const { fixture } = await createPlayer();

    expect(fixture.nativeElement.querySelector('[data-slot="captionToggle"]')).toBeInstanceOf(
      HTMLButtonElement,
    );

    fixture.componentRef.setInput('allowSpeechTranscript', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="captionToggle"]')).toBeNull();
  });

  it('does not Date.parse ambiguous display date strings', async () => {
    const { fixture } = await createPlayer();

    fixture.componentRef.setInput('date', '04/05/2026');
    fixture.detectChanges();

    const date = fixture.nativeElement.querySelector('[data-slot="date"]') as HTMLElement;
    expect(date.textContent?.trim()).toBe('04/05/2026');
  });

  it('formats timeline durations as mm:ss or h:mm:ss', async () => {
    const { component } = await createPlayer();

    const format = (value: number) =>
      (component as unknown as { format(value: number): string }).format(value);

    expect(format(0)).toBe('00:00');
    expect(format(59)).toBe('00:59');
    expect(format(61)).toBe('01:01');
    expect(format(3600)).toBe('1:00:00');
    expect(format(3661)).toBe('1:01:01');
    expect(format(NaN)).toBe('--:--');
  });

  it('applies volume, mute, and playback-rate state to the audio element', async () => {
    const { fixture, component, audio } = await createPlayer();

    component.onVolume(50);
    fixture.detectChanges();

    expect(audio.volume).toBe(0.5);
    expect(audio.muted).toBe(false);

    component.toggleMute();
    fixture.detectChanges();

    expect(audio.muted).toBe(true);

    component.cyclePlaybackRate();
    fixture.detectChanges();

    expect(audio.playbackRate).toBe(1.25);
  });

  it('clears transcript when seeking to a different point', async () => {
    const { fixture, component, audio } = await createPlayer();
    Object.defineProperty(audio, 'duration', { value: 60, configurable: true });
    audio.currentTime = 10;
    component.currentTime.set(10);
    component.transcript.set('Existing transcript');
    component.interim.set('still listening');
    component.error.set('Speech error: network');
    fixture.detectChanges();

    const seekSlider = fixture.nativeElement.querySelector(
      '[data-slot="seek"] hell-slider',
    ) as HTMLElement;
    seekSlider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(audio.currentTime).toBe(15);
    expect(component.currentTime()).toBe(15);
    expect(component.transcript()).toBe('');
    expect(component.interim()).toBe('');
    expect(component.error()).toBeNull();
  });

  it('clears transcript when playback restarts after ending', async () => {
    const { fixture, component, audio } = await createPlayer();
    component.transcript.set('Old transcript');
    component.interim.set('pending words');
    component.error.set('Speech error: network');
    fixture.detectChanges();

    audio.dispatchEvent(new Event('ended'));
    fixture.detectChanges();

    audio.dispatchEvent(new Event('play'));
    fixture.detectChanges();

    expect(component.transcript()).toBe('');
    expect(component.interim()).toBe('');
    expect(component.error()).toBeNull();
  });
});
