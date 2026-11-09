import type { SoundProfile } from '../../core/audio';

// Original compositions for woody marimba: a slow pastoral menu loop in F major
// and a brighter C major adventure theme. One chord per bar of 8 eighth notes.
export const voxelSound: SoundProfile = {
  voice: 'marimba',
  music: {
    menu: {
      bpm: 84,
      melody: [
        72, null, 69, null, 65, 67, 69, null,
        74, null, 72, 69, null, 67, 65, null,
        70, null, 74, null, 72, 70, 69, null,
        67, null, null, 69, 72, null, null, null,
        77, null, 76, 74, 72, null, 69, null,
        76, null, 72, null, 69, null, 67, 69,
        70, 72, 74, null, 72, null, 67, null,
        65, null, 69, null, 65, null, null, null,
      ],
      chords: [[65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67], [65, 69, 72], [57, 60, 64], [58, 62, 65], [60, 65, 69]],
      bass: [41, 38, 34, 36, 41, 33, 34, 41],
      shaker: false,
    },
    game: {
      bpm: 120,
      melody: [
        72, 76, 79, 76, 74, null, 72, null,
        69, 72, 74, 72, 69, null, 67, null,
        65, 69, 72, 69, 74, null, 72, 71,
        67, 71, 74, 71, 67, null, 62, null,
        76, null, 79, null, 81, 79, 76, 74,
        72, 74, 76, null, 74, 72, 69, null,
        65, 69, 72, 74, 76, 74, 72, 71,
        72, null, 67, null, 72, null, null, null,
      ],
      chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 60, 64]],
      bass: [36, 33, 41, 43, 36, 33, 41, 36],
      shaker: true,
    },
  },
};
