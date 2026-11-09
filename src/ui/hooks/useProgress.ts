import { useSyncExternalStore } from 'react';
import { progress } from '../../core/progress';

export function useProgress() {
  return useSyncExternalStore(progress.subscribe, progress.getState);
}
