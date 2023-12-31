import { useEffect, useMemo, useState } from 'react';
import { WindowTunnel } from 'ow-libs';

import { kRecordingReaderWriterName } from '../constants/config';
import { RecordingReaderWriter } from '../services/recording-writer';
import { RecordingTimeline } from '../constants/types';
import { filterTimeline } from '../utils';

// get RecordingReaderWriter instance from background window
const reader = WindowTunnel.get<RecordingReaderWriter>(
  kRecordingReaderWriterName
);

const timelinePromises = new Map<string, Promise<RecordingTimeline | null>>();

const loadTimeline = (uid: string): Promise<RecordingTimeline | null> => {
  let promise = timelinePromises.get(uid);

  if (!promise) {
    console.log('loadTimeline(): not cached:', uid);
    promise = reader.getTimeline(uid);
    timelinePromises.set(uid, promise);
  }

  return promise;
};

const unloadTimeline = (uid: string) => {
  // console.log('unloadTimeline():', uid);
  timelinePromises.delete(uid);
};

export function useTimeline(
  uid: string,
  typesFilter: string[] | null = null,
  featuresFilter: string[] | null = null
) {
  const [timeline, setTimeline] = useState<RecordingTimeline | null>(null);

  useEffect(() => {
    setTimeline(null);

    if (uid) {
      loadTimeline(uid)
        .then(setTimeline)
        .catch(() => setTimeline(null));
    }

    return () => {
      if (uid) {
        setTimeline(null);
        unloadTimeline(uid);
      }
    };
  }, [uid]);

  return useMemo(
    () => filterTimeline(timeline, typesFilter ?? [], featuresFilter ?? []),
    [timeline, featuresFilter, typesFilter]
  );
}
