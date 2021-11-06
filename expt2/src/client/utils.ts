import { Reducer } from '@cycle/state';
import { equals, filter, find, findIndex, flatten, has, includes, map, max, min, prop, reduce, reject, without, __ } from 'ramda';
import {
  CanvasElement, CanvasMouseEvent, complexConfig, FullRegion, imageConfig, measureText, Region
} from './drivers/canvas';

export type Show<T> = 'all' | 'none' | readonly T[];

export function rectCorner<T extends Region>(e: T): T & FullRegion {
  return {
    ...e,
    nwX: e.x - e.width / 2,
    nwY: e.y - e.height / 2,
    seX: e.x + e.width / 2,
    seY: e.y + e.height / 2
  };
}

export function mouseInRegion(event: CanvasMouseEvent, region: Region): boolean {
  const r = rectCorner(region);
  return event.x > r.nwX && event.x < r.seX && event.y > r.nwY && event.y < r.seY;
}

export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
}

export function filterElements<T extends string, U extends T>(
  show: Show<T>,
  units: readonly U[],
  getElement: (e: U) => CanvasElement | CanvasElement[]
): CanvasElement[] {
  if (show === 'all') {
    return flatten(map(getElement, units));
  } else if (show === 'none') {
    return [];
  } else {
    return flatten(map(getElement, filter(includes(__, units), show)));
  }
}

export interface Target<T extends string> {
  name: T;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate?: number;
}

export function elementsToTargets<T extends string>(targets: readonly T[]) {
  return (elements: CanvasElement[]): Target<T>[] => {
    return reject(equals(undefined), map((t): Target<T> | undefined => {
      const e = find(e => !!e.name && e.name === t, elements);
      if (e) {
        switch (e.kind) {
          case 'rect':
            return { name: t, x: e.x, y: e.y, width: e.width, height: e.height, rotate: e.rotate };
          case 'circle':
            return { name: t, x: e.x, y: e.y, width: e.size, height: e.size };
          case 'ellipse':
            return { name: t, x: e.x, y: e.y, width: e.radiusX * 2, height: e.radiusY * 2, rotate: e.rotate };
          case 'line':
          case 'arrow':
            return {
              name: t, x: (e.x + e.endX) / 2, y: (e.y + e.endY) / 2,
              width: Math.abs(e.x - e.endX), height: Math.abs(e.y - e.endY), rotate: e.rotate
            };
          case 'bezier': {
            const xs = [e.x, e.cp1X, e.cp2X, e.endX];
            const ys = [e.y, e.cp1Y, e.cp2Y, e.endY];
            const minX = listMin(xs);
            const maxX = listMax(xs);
            const minY = listMin(ys);
            const maxY = listMax(ys);
            return { name: t, x: (minX + maxX) / 2, y: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY, rotate: e.rotate };
          }
          case 'text': {
            const m = measureText(e);
            return {
              name: t, x: m.centerX, y: m.centerY,
              width: m.totalWidth, height: m.totalHeight, rotate: e.rotate
            };
          }
          case 'image': {
            const { width, height } = imageConfig(e);
            return { name: t, x: e.x, y: e.y, width, height, rotate: e.rotate };
          }
          case 'complex': {
            const { width, height } = complexConfig(e);
            return { name: t, x: e.x, y: e.y, width, height, rotate: e.rotate };
          }
        }
      } else {
        return undefined;
      }
    }, targets)) as Target<T>[];
  };
}

export function renameTargets<T extends string, U extends string>(mapping: Partial<Record<T, U>>, targets: Target<T>[]): Target<U>[] {
  return reject(equals(undefined), map(t => {
    if (has(t.name, mapping)) {
      return { ...t, name: mapping[t.name] };
    } else {
      return undefined;
    }
  }, targets)) as Target<U>[];
}

export function mapUnits<T extends string, U extends string>(
  parentShow: Show<T>,
  mapping: Partial<Record<T, U | U[]>>
): Show<U> {
  if (typeof parentShow === 'string') {
    return parentShow;
  } else {
    return flatten(without([undefined], map(prop(__, mapping), parentShow)));
  }
}

export function showOrNot<T>(show: Show<T>, unit: T): boolean {
  if (show === 'all') {
    return true;
  } else if (show === 'none') {
    return false;
  } else {
    return includes(unit, show);
  }
}

export function strictR<T>(r: (state: T) => T): Reducer<T> {
  return s => {
    if (s === undefined) {
      return undefined;
    } else {
      return r(s);
    }
  };
}

// export function kindIs<K extends string>(kind: K) {
//   return <T extends Record<'kind', any>>(
//     obj: T & Record<'kind', K extends T['kind'] ? T['kind'] : K>
//   ): obj is T & Record<'kind', K> =>
//     obj.kind === kind;
// }

export function kindIs<T extends Record<'kind', string>, K extends T['kind']>(kind: K) {
  return (obj: T): obj is T & Record<'kind', K> => obj.kind === kind;
}

// export function kindIsNot<K extends string>(kind: K) {
//   return <T extends Record<'kind', any>>(
//     obj: T & Record<'kind', K extends T['kind'] ? T['kind'] : K>
//   ): obj is Exclude<T, Record<'kind', K>> =>
//     obj.kind !== kind;
// }

export function randomUnif(lower: number, upper: number): number {
  return lower + (upper - lower) * Math.random();
}

export function rotateVector(x: number, y: number, degrees: number): [number, number] {
  const radian = degrees * Math.PI / 180;
  return [Math.cos(radian) * x - Math.sin(radian) * y, Math.sin(radian) * x + Math.cos(radian) * y];
}

export function vectorLength(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

export function listMax(l: number[]): number {
  return reduce<number, number>(max, -Infinity, l);
}

export function listMin(l: number[]): number {
  return reduce<number, number>(min, Infinity, l);
}

export function nextStage<T extends string>(stages: readonly T[], stage: T): T {
  const i = findIndex(equals(stage), stages);
  const j = i + 1 === stages.length ? 0 : i + 1;
  return stages[j];
}

export function propsClass(className: string): { props: { className: string; }; } {
  return { props: { className } };
}
