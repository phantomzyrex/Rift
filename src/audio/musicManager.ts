/**
 * Background Music Manager for Rift
 * Handles playback of Lyria-generated music tracks with loop, volume control,
 * and seamless coordination with the game soundscape.
 */

export interface MusicTrack {
  id: string;
  title: string;
  prompt: string;
  model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  audioUrl: string;
  mimeType: string;
  createdAt: number;
}

class MusicManager {
  private audio: HTMLAudioElement | null = null;
  private tracks: MusicTrack[] = [];
  private currentTrackId: string | null = null;
  private isPlaying = false;
  private volume = 0.65;
  private isLooping = true;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.loop = this.isLooping;
      this.audio.volume = this.volume;

      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.notify();
      });

      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });

      this.audio.addEventListener('ended', () => {
        if (!this.isLooping) {
          this.isPlaying = false;
          this.notify();
        }
      });

      this.audio.addEventListener('timeupdate', () => {
        this.notify();
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getTracks(): MusicTrack[] {
    return this.tracks;
  }

  public getCurrentTrack(): MusicTrack | null {
    if (!this.currentTrackId) return null;
    return this.tracks.find(t => t.id === this.currentTrackId) || null;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsLooping(): boolean {
    return this.isLooping;
  }

  public getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audio?.duration || 0;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.notify();
  }

  public toggleLoop(): boolean {
    this.isLooping = !this.isLooping;
    if (this.audio) {
      this.audio.loop = this.isLooping;
    }
    this.notify();
    return this.isLooping;
  }

  public async playTrack(trackId: string) {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track || !this.audio) return;

    if (this.currentTrackId !== trackId) {
      this.currentTrackId = trackId;
      this.audio.src = track.audioUrl;
      this.audio.currentTime = 0;
    }

    try {
      await this.audio.play();
      this.isPlaying = true;
      this.notify();
    } catch (err) {
      console.warn('Playback deferred or blocked until user gesture:', err);
    }
  }

  public togglePlayPause() {
    if (!this.audio) return;
    if (this.isPlaying) {
      this.audio.pause();
    } else {
      if (this.currentTrackId) {
        this.audio.play().catch(e => console.warn(e));
      } else if (this.tracks.length > 0) {
        this.playTrack(this.tracks[0].id);
      }
    }
  }

  public pause() {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
    }
  }

  public addTrackFromBase64(
    audioBase64: string,
    mimeType: string,
    title: string,
    prompt: string,
    model: 'lyria-3-clip-preview' | 'lyria-3-pro-preview'
  ): MusicTrack {
    // Decode base64 to binary blob
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const audioUrl = URL.createObjectURL(blob);

    const track: MusicTrack = {
      id: `track_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      prompt,
      model,
      audioUrl,
      mimeType,
      createdAt: Date.now()
    };

    this.tracks.unshift(track);
    this.playTrack(track.id);
    return track;
  }
}

export const musicManager = new MusicManager();
