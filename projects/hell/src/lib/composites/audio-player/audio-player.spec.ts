import { TestBed } from '@angular/core/testing';

import { HellAudioPlayer } from './audio-player';

describe('HellAudioPlayer', () => {
  async function createPlayer() {
    await TestBed.configureTestingModule({
      imports: [HellAudioPlayer],
    }).compileComponents();

    const fixture = TestBed.createComponent(HellAudioPlayer);
    fixture.componentRef.setInput('src', '/test-audio.mp3');
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

  it('does not start playback when captions are toggled while paused', async () => {
    const { fixture, component } = await createPlayer();
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    const ccButton = fixture.nativeElement.querySelector(
      '[data-slot="cc-toggle"]',
    ) as HTMLButtonElement;

    ccButton.click();
    fixture.detectChanges();

    expect(playSpy).not.toHaveBeenCalled();
    expect(component.captions()).toBe(true);
    expect(component.playing()).toBe(false);

    playSpy.mockRestore();
  });

  it('hides the captions toggle when live captions are disabled', async () => {
    const { fixture } = await createPlayer();

    expect(fixture.nativeElement.querySelector('[data-slot="cc-toggle"]')).toBeInstanceOf(
      HTMLButtonElement,
    );

    fixture.componentRef.setInput('allowLiveCaptions', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="cc-toggle"]')).toBeNull();
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
