import { color, ColorHelper } from 'csx';

export interface ColorSet {
  [k: number]: ColorHelper
}

export const reds: ColorSet = {
  1: color('#fee8e4'),
  2: color('#fcd2ca'),
  3: color('#ffbbac'),
  4: color('#fea491'),
  5: color('#fa8e79'),
  6: color('#f27a63'),
  7: color('#ea664e'),
  8: color('#df543d'),
  9: color('#d4412c'),
  10: color('#c13925'),
  11: color('#ac3422'),
  12: color('#992e1e'),
  13: color('#872517'),
  14: color('#751f12'),
  15: color('#62180d'),
  16: color('#4f130a'),
  17: color('#3b0d06'),
  18: color('#270502'),
  19: color('#110201')
};

export const greens: ColorSet = {
  1: color('#ebf0e3'),
  2: color('#d2e4c8'),
  3: color('#b7daa9'),
  4: color('#9cd08c'),
  5: color('#82c571'),
  6: color('#6ab959'),
  7: color('#50ae40'),
  8: color('#37a22a'),
  9: color('#13960a'),
  10: color('#078803'),
  11: color('#0d7a06'),
  12: color('#0e6c07'),
  13: color('#035f01'),
  14: color('#035101'),
  15: color('#014400'),
  16: color('#033602'),
  17: color('#022701'),
  18: color('#011900'),
  19: color('#000900')
};

export const blues: ColorSet = {
  1: color('#edeef6'),
  2: color('#d8def2'),
  3: color('#c0cff4'),
  4: color('#a9c1f8'),
  5: color('#92b3fa'),
  6: color('#7da5fb'),
  7: color('#6796fe'),
  8: color('#5388fd'),
  9: color('#3e79fe'),
  10: color('#366dea'),
  11: color('#3162d0'),
  12: color('#2c57b7'),
  13: color('#234ba5'),
  14: color('#1d408e'),
  15: color('#173578'),
  16: color('#122a5f'),
  17: color('#0c1e47'),
  18: color('#051231'),
  19: color('#020616')
};

export const magentas: ColorSet = {
  1: color('#f9e9f2'),
  2: color('#f2d4e9'),
  3: color('#eebde4'),
  4: color('#eaa7e0'),
  5: color('#e590db'),
  6: color('#de7bd5'),
  7: color('#d765d0'),
  8: color('#ce4fc8'),
  9: color('#c535c1'),
  10: color('#b32cb1'),
  11: color('#a02a9e'),
  12: color('#8e268b'),
  13: color('#7e1c7c'),
  14: color('#6c186a'),
  15: color('#5b1259'),
  16: color('#480f47'),
  17: color('#360a35'),
  18: color('#240423'),
  19: color('#0f010e')
};

export const grays: ColorSet = {
  1: color('#f2f2f2'),
  2: color('#e6e6e6'),
  3: color('#d9d9d9'),
  4: color('#cccccc'),
  5: color('#bfbfbf'),
  6: color('#b2b2b2'),
  7: color('#a6a6a6'),
  8: color('#999999'),
  9: color('#8c8c8c'),
  10: color('#808080'),
  11: color('#737373'),
  12: color('#666666'),
  13: color('#595959'),
  14: color('#4c4c4c'),
  15: color('#404040'),
  16: color('#333333'),
  17: color('#262626'),
  18: color('#1a1a1a'),
  19: color('#0d0d0d')
};

export const white = color('#fff');
export const black = color('#000');

export const check = color('#0a0');
export const cross = color('#d22');
