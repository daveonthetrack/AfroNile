import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artistName: string;
  coverImageUrl: string;
  audioUrl: string;
  durationSeconds: number;
}

interface AudioState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Track[];
  currentTrackIndex: number;
  
  playTrack: (track: Track) => void;
  playPlaylist: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentTrackIndex: -1,

  playTrack: (track) => {
    set({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: track.durationSeconds,
      queue: [track],
      currentTrackIndex: 0,
    });
  },

  playPlaylist: (tracks, startIndex = 0) => {
    if (tracks.length === 0) return;
    const activeTrack = tracks[startIndex] || tracks[0];
    set({
      queue: tracks,
      currentTrackIndex: startIndex,
      currentTrack: activeTrack,
      isPlaying: true,
      currentTime: 0,
      duration: activeTrack.durationSeconds,
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),

  nextTrack: () => {
    const { queue, currentTrackIndex } = get();
    if (queue.length === 0 || currentTrackIndex === -1) return;
    const nextIndex = (currentTrackIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    if (nextTrack) {
      set({
        currentTrackIndex: nextIndex,
        currentTrack: nextTrack,
        isPlaying: true,
        currentTime: 0,
        duration: nextTrack.durationSeconds,
      });
    }
  },

  prevTrack: () => {
    const { queue, currentTrackIndex } = get();
    if (queue.length === 0 || currentTrackIndex === -1) return;
    const prevIndex = currentTrackIndex === 0 ? queue.length - 1 : currentTrackIndex - 1;
    const prevTrack = queue[prevIndex];
    if (prevTrack) {
      set({
        currentTrackIndex: prevIndex,
        currentTrack: prevTrack,
        isPlaying: true,
        currentTime: 0,
        duration: prevTrack.durationSeconds,
      });
    }
  },
}));
