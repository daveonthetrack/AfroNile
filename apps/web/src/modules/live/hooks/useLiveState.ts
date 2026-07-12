'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LiveStatusResponse, LiveFeedItem } from '../types';

export function useLiveState(initialEventId?: string) {
  const searchParams = useSearchParams();
  const [liveStatus, setLiveStatus] = useState<LiveStatusResponse | null>(null);
  const [feedItems, setFeedItems] = useState<LiveFeedItem[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Parse QR parameters
  const showParam = searchParams.get('show');
  const songParam = searchParams.get('song');
  const sourceParam = searchParams.get('source');

  // 1. Connect to SSE event stream
  useEffect(() => {
    const eventSource = new EventSource('/api/live/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.liveStatus) {
          if (songParam && data.liveStatus.currentSong) {
            data.liveStatus.currentSong.id = songParam;
          }
          setLiveStatus(data.liveStatus);
        }

        if (Array.isArray(data.comments)) {
          const items: LiveFeedItem[] = data.comments.map((c: any) => ({
            id: c.id,
            type: 'SUPPORT',
            text: `Vibe: "${c.comment}"`,
            timestamp: new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setFeedItems(items.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [songParam]);

  // 2. Perform background check-in when show QR parameter is matched
  useEffect(() => {
    const targetShowId = showParam || initialEventId;
    if (!targetShowId || checkedIn || checkingIn) return;

    async function triggerCheckIn() {
      setCheckingIn(true);
      setCheckInError(null);
      try {
        const res = await fetch('/api/live/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: targetShowId }),
        });
        if (res.ok) {
          setCheckedIn(true);
        } else {
          const data = await res.json();
          setCheckInError(data.error || 'Failed to check in.');
        }
      } catch (err) {
        console.error('Check-in request failed:', err);
        setCheckInError('Network error during check-in.');
      } finally {
        setCheckingIn(false);
      }
    }

    triggerCheckIn();
  }, [showParam, initialEventId]);

  return {
    liveStatus,
    feedItems,
    checkedIn,
    checkingIn,
    checkInError,
    source: sourceParam,
  };
}
