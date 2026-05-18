import { TestBed } from '@angular/core/testing';

import { HellAudioPlayer } from './audio-player';

describe('HellAudioPlayer', () => {
  async function createPlayer() {
    await TestBed.configureTestingModule({
      imports: [HellAudioPlayer],
    }).compileComponents();

    const fixture = TestBed.createComponent(HellAudioPlayer);
    fixture.componentRef.setInput('src', '/test-audio.mp3');
    fixture.componentRef.setInput('allowSpeechTranscript', true);
    fixture.detectChanges();

    const component = fixture.componentInstance as HellAudioPlayer & {
      speechSupported: { set(value: boolean): void };
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
    component.speechSupported.set(true);
    fixture.detectChanges();

    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    return { fixture, component, audio };
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

  it('does not start playback when the speech transcript is toggled while paused', async () => {
    const { fixture, component } = await createPlayer();
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    const transcriptButton = fixture.nativeElement.querySelector(
      '[data-slot="cc-toggle"]',
    ) as HTMLButtonElement;

    transcriptButton.click();
    fixture.detectChanges();

    expect(playSpy).not.toHaveBeenCalled();
    expect(component.captions()).toBe(true);
    expect(component.playing()).toBe(false);

    playSpy.mockRestore();
  });

  it('keeps the experimental speech transcript toggle opt-in', async () => {
    await TestBed.configureTestingModule({ imports: [HellAudioPlayer] }).compileComponents();
    const fixture = TestBed.createComponent(HellAudioPlayer);
    fixture.componentRef.setInput('src', '/test-audio.mp3');

    const component = fixture.componentInstance as HellAudioPlayer & {
      speechSupported: { set(value: boolean): void };
    };
    component.speechSupported.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="cc-toggle"]')).toBeNull();
  });

  it('hides the transcript toggle when speech transcripts are disabled', async () => {
    const { fixture } = await createPlayer();

    expect(fixture.nativeElement.querySelector('[data-slot="cc-toggle"]')).toBeInstanceOf(
      HTMLButtonElement,
    );

    fixture.componentRef.setInput('allowSpeechTranscript', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="cc-toggle"]')).toBeNull();
  });

  it('keeps allowLiveCaptions as a compatibility alias', async () => {
    await TestBed.configureTestingModule({ imports: [HellAudioPlayer] }).compileComponents();
    const fixture = TestBed.createComponent(HellAudioPlayer);
    fixture.componentRef.setInput('src', '/test-audio.mp3');
    fixture.componentRef.setInput('allowLiveCaptions', true);

    const component = fixture.componentInstance as HellAudioPlayer & {
      speechSupported: { set(value: boolean): void };
    };
    component.speechSupported.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="cc-toggle"]')).toBeInstanceOf(
      HTMLButtonElement,
    );
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

    const track = fixture.nativeElement.querySelector('[data-slot="seek"]') as HTMLElement;
    track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
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
