import { unicodeOf } from './types';

/** Milestone 1 reference characters: 8 basic strokes only, main structures covered. */
export const MILESTONE_CHARS = ['口', '回', '国', '人', '木', '林', '小', '江', '打', '量'] as const;

export const CHAR_NOTES: Record<string, string> = {
  口: 'Simple full enclosure',
  回: 'Nested enclosure',
  国: 'Enclosure with content',
  人: 'Pointed top, sparse',
  木: 'Crossing, symmetry',
  林: 'Positional variant, width split',
  小: 'Vertical hook, sparse',
  江: 'Left-right, water radical',
  打: 'Rising stroke, two hooks',
  量: 'Dense, nine horizontals',
};

export const CHARSET = MILESTONE_CHARS.map((char) => ({ char, unicode: unicodeOf(char), note: CHAR_NOTES[char] }));
