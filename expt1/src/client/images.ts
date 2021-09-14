import { map } from 'ramda';
import happyMac from './images/happy-mac.png';

const imageData = { happyMac };

export const images = map((data: string) => {
  const img = new Image();
  img.src = data;
  return img;
}, imageData) as { [key: string]: HTMLImageElement };
