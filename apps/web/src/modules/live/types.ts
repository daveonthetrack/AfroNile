export interface LiveSong {
  id: string;
  title: string;
  trackNumber: number;
  durationSeconds: number;
  progressSeconds: number;
}

export interface LiveStatusResponse {
  eventId: string;
  venueName: string;
  venueAddress: string;
  tourName: string;
  currentSong: LiveSong | null;
  setlistProgress: {
    current: number;
    total: number;
  };
}

export interface LiveFeedItem {
  id: string;
  type: 'SUPPORT' | 'MERCHANDISE' | 'ALBUM';
  text: string;
  timestamp: string;
}

export interface JourneyProgress {
  percentage: number;
  milestone: string;
}
