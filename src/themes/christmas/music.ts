import type { SoundProfile } from '../../core/audio';

// Original compositions (G major, pentatonic-leaning), one chord per bar of 8 eighth notes.
export const christmasSound: SoundProfile = {
  voice: 'bell',
  music: {
    menu: {
      bpm: 92,
      melody: [
        74, null, 76, 74, 71, null, 67, null, 69, 71, 74, null, 71, null, null, null,
        76, null, 79, 76, 74, null, 71, null, 69, null, 71, 69, 67, null, null, null,
        71, null, 74, 71, 69, null, 64, null, 67, 69, 71, null, 74, null, 76, null,
        79, null, 76, 74, 71, null, 74, null, 69, null, 66, 69, 67, null, null, null,
      ],
      chords: [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69], [64, 67, 71], [60, 64, 67], [60, 64, 67], [62, 66, 69]],
      bass: [43, 40, 36, 38, 40, 36, 36, 38],
      shaker: false,
    },
    game: {
      bpm: 128,
      melody: [
        67, 71, 74, 71, 76, null, 74, null, 72, 76, 79, 76, 74, null, 71, null,
        69, 72, 76, 72, 74, null, 71, 69, 67, null, 71, null, 69, null, null, null,
        67, 71, 74, 71, 79, null, 76, null, 72, 76, 81, 79, 76, null, 74, null,
        72, 71, 69, 72, 71, 69, 67, 66, 67, null, 74, null, 67, null, null, null,
      ],
      chords: [[67, 71, 74], [60, 64, 67], [60, 64, 69], [62, 66, 69], [67, 71, 74], [60, 64, 67], [62, 66, 69], [55, 62, 67]],
      bass: [43, 36, 45, 38, 43, 36, 38, 43],
      shaker: true,
    },
  },
};
