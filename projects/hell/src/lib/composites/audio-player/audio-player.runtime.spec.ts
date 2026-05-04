import { HellAudioRuntime, type HellAudioMediaAdapter } from './audio-player.runtime';

class FakeAudioAdapter implements HellAudioMediaAdapter {
  currentTime = 0;
  duration = 0;
  readonly play = vi.fn();
  readonly pause = vi.fn();
  readonly applyAudioState = vi.fn();

  setCurrentTime(value: number): void {
    this.currentTime = value;
  }
}

describe('HellAudioRuntime playback state', () => {
  it('applies volume, muted state, and playback rate to the media adapter', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();

    runtime.setVolumePercent(50);
    runtime.toggleMute();
    runtime.cyclePlaybackRate();
    runtime.syncMedia(media);

    expect(media.applyAudioState).toHaveBeenCalledWith({
      volume: 0.5,
      muted: true,
      playbackRate: 1.25,
    });
  });

  it('derives volume level from volume and muted state', () => {
    const runtime = new HellAudioRuntime();

    expect(runtime.volumeLevel()).toBe('high');

    runtime.setVolumePercent(50);
    expect(runtime.volumeLevel()).toBe('mid');

    runtime.setVolumePercent(20);
    expect(runtime.volumeLevel()).toBe('low');

    runtime.setVolumePercent(0);
    expect(runtime.muted()).toBe(true);
    expect(runtime.volumeLevel()).toBe('mute');
  });

  it('clamps seeks and reports timeline resets only when the media time changes', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();
    media.currentTime = 10;
    media.duration = 60;
    runtime.updateCurrentTime(media);

    expect(runtime.seekTo(media, 15)).toEqual({
      changed: true,
      currentTime: 15,
      resetTimeline: true,
    });
    expect(media.currentTime).toBe(15);
    expect(runtime.currentTime()).toBe(15);

    expect(runtime.seekTo(media, 15.005)).toEqual({
      changed: false,
      currentTime: 15,
      resetTimeline: false,
    });

    expect(runtime.seekTo(media, 100)).toEqual({
      changed: true,
      currentTime: 60,
      resetTimeline: true,
    });
    expect(media.currentTime).toBe(60);
  });

  it('resets captions when playback starts at the beginning or after ending', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();

    media.currentTime = 0.2;
    expect(runtime.markPlayed(media).resetTimeline).toBe(true);

    media.currentTime = 10;
    expect(runtime.markPlayed(media).resetTimeline).toBe(false);

    runtime.markEnded();
    expect(runtime.playing()).toBe(false);
    expect(runtime.markPlayed(media).resetTimeline).toBe(true);
    expect(runtime.playing()).toBe(true);
  });

  it('toggles playback through the media adapter', () => {
    const runtime = new HellAudioRuntime();
    const media = new FakeAudioAdapter();

    runtime.togglePlayback(media);
    expect(media.play).toHaveBeenCalledTimes(1);

    runtime.markPlayed(media);
    runtime.togglePlayback(media);
    expect(media.pause).toHaveBeenCalledTimes(1);
  });
});
