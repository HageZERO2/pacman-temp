import type { SoundProfile } from '../../core/audio';

// Original compositions in minor keys, one chord per bar of 8 eighth notes.
export const cyberpunkSound: SoundProfile = {
  voice: 'synth',
  music: {
    // A minor, slow synthwave cruise: Am – F – C – G – Am – F – Dm – E.
    menu: {
      bpm: 96,
      melody: [
        69, null, 72, 76, 74, null, 72, null, 72, null, 69, null, 65, 69, 72, null,
        76, null, 79, 76, 74, null, 72, null, 71, null, 74, null, 79, null, null, null,
        81, null, 79, 76, 77, null, 76, null, 72, null, 74, 76, 72, null, 69, null,
        74, null, 77, 74, 72, null, 69, null, 68, null, 71, null, 76, null, null, null,
      ],
      chords: [[57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62], [57, 60, 64], [57, 60, 65], [57, 62, 65], [56, 59, 64]],
      bass: [45, 41, 36, 43, 45, 41, 38, 40],
      shaker: false,
    },
    // E minor chase with a driving kick: Em – Em – C – D – Em – C – Am – B.
    game: {
      bpm: 134,
      melody: [
        76, 71, 79, 71, 76, 71, 83, 81, 79, null, 76, null, 74, 76, 79, null,
        72, 76, 79, 76, 84, null, 83, 79, 78, null, 74, 78, 81, null, 78, null,
        76, 79, 83, 79, 88, null, 86, 83, 84, null, 79, null, 76, 79, 84, null,
        81, 76, 72, 76, 81, null, 84, null, 83, null, 78, 75, 71, null, null, null,
      ],
      chords: [[64, 67, 71], [64, 67, 71], [60, 64, 67], [62, 66, 69], [64, 67, 71], [60, 64, 67], [57, 60, 64], [59, 63, 66]],
      bass: [40, 40, 36, 38, 40, 36, 45, 47],
      shaker: true,
      kick: true,
    },
  },
};
