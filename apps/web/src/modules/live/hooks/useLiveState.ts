'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LiveStatusResponse, LiveFeedItem } from '../types';
import { MOCK_FEED_EVENTS } from '../constants';

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

  // 1. Fetch live status periodically
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/live/status');
        if (res.ok) {
          const data: LiveStatusResponse = await res.json();
          // If songParam overrides the default track, we adjust
          if (songParam && data.currentSong) {
            data.currentSong.id = songParam;
          }
          setLiveStatus(data);
        }
      } catch (err) {
        console.error('Failed to poll live status:', err);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Poll every 3s
    return () => clearInterval(interval);
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

  // 3. Populate and roll mock feed items simulating SSE/WebSockets
  useEffect(() => {
    // Initial static items
    const initialItems: LiveFeedItem[] = [
      {
        id: '1',
        type: 'SUPPORT',
        text: 'A fan just supported tonight’s performance.',
        timestamp: 'Just now',
      },
      {
        id: '2',
        type: 'MERCHANDISE',
        text: 'Someone purchased the Nile Waves Tour Tee.',
        timestamp: '2m ago',
      },
      {
        id: '3',
        type: 'ALBUM',
        text: 'A fan just purchased the Nile Waves digital album.',
        timestamp: '5m ago',
      },
    ];
    setFeedItems(initialItems);

    const feedInterval = setInterval(() => {
      const randomEventText = MOCK_FEED_EVENTS[Math.floor(Math.random() * MOCK_FEED_EVENTS.length)];
      const newItem: LiveFeedItem = {
        id: Math.random().toString(36).substring(2, 9),
        type: randomEventText.includes('purchase') || randomEventText.includes('Tee') || randomEventText.includes('vinyl')
          ? 'MERCHANDISE'
          : randomEventText.includes('album')
          ? 'ALBUM'
          : 'SUPPORT',
        text: randomEventText,
        timestamp: 'Just now',
      };

      setFeedItems((prev) => {
        // Keep only the 5 most recent feed items
        const updated = [newItem, ...prev.map(item => {
          if (item.timestamp === 'Just now') return { ...item, timestamp: '1m ago' };
          if (item.timestamp === '1m ago') return { ...item, timestamp: '3m ago' };
          return { ...item, timestamp: '5m ago' };
        })];
        return updated.slice(0, 5);
      });
    }, 12000); // Add item every 12s

    return () => clearInterval(feedInterval);
  }, []);

  return {
    liveStatus,
    feedItems,
    checkedIn,
    checkingIn,
    checkInError,
    source: sourceParam,
  };
}
