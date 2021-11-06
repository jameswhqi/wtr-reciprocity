import { Reducer as R, StateSource } from '@cycle/state';
import { always } from 'ramda';
import xs, { Stream as S } from 'xstream';
import sc from 'xstream/extra/sampleCombine';
import { ColorSet, white } from '../colors';
import { fBarNumber, fTotal, lBarNumber, speedRatio } from '../config';
import { CanvasElement } from '../drivers/canvas';
import { strictR, vectorLength } from '../utils';

interface Props {
  value: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  hue: ColorSet;
}
interface EventIn {
  kind: 'collect';
}
export interface State {
  x: number;
  y: number;
  speed: number;
  collected: boolean;
}
interface EventOut {
  kind: 'collected';
  value: number;
}
interface Sources {
  props: S<Props>;
  state: StateSource<State>;
  event: S<EventIn>;
}
interface Sinks {
  canvas: S<CanvasElement[]>;
  state: S<R<State>>;
  event: S<EventOut>;
}

const timeStep = 3 * speedRatio;

export function BarNumber(sources: Sources): Sinks {
  // intent
  const props$ = sources.props;
  const state$ = sources.state.stream;

  const collect$ = sources.event;
  const collectedProxy$ = xs.create<undefined>();
  const update$ = collect$
    .mapTo(xs.periodic(20).endWhen(collectedProxy$))
    .flatten();
  const collected$ = update$
    .compose(sc(state$))
    .filter(([_, s]) => s.collected)
    .mapTo(undefined);
  collectedProxy$.imitate(collected$);

  // model
  const initR$ = xs.of(always<State>({
    x: 0,
    y: 0,
    speed: 1,
    collected: true
  }));
  const collectR$ = collect$
    .compose(sc(props$))
    .map(([_, p]) => always<State>({
      x: p.startX,
      y: p.startY,
      speed: 1,
      collected: false
    }));
  const updateR$ = update$
    .compose(sc(props$))
    .map(([n, p]) => strictR<State>(s => {
      const distance = vectorLength(p.endX - p.startX, p.endY - p.startY);
      const vecX = (p.endX - p.startX) / distance;
      const vecY = (p.endY - p.startY) / distance;
      const t = n * timeStep;
      const a = .03;
      const v1 = 1;
      const v2 = fTotal / fBarNumber;
      const vMax = 4;
      const vPeak = Math.sqrt(a * distance + (v1 * v1 + v2 * v2) / 2);
      const [tTotal, traveled, v] = (() => {
        if (vPeak <= v2) {
          const aNew = (v2 * v2 - v1 * v1) / 2 / distance;
          return [(v2 - v1) / aNew, v1 * t + aNew * t * t / 2, v1 + aNew * t];
        } else if (vPeak > vMax) {
          const t1 = (vMax - v1) / a;
          const s1 = (v1 + vMax) * t1 / 2;
          const t3 = (vMax - v2) / a;
          const s3 = (vMax + v2) * t3 / 2;
          const t2 = (distance - s1 - s3) / vMax;
          const tTotal = t1 + t2 + t3;
          if (t <= t1) {
            return [tTotal, v1 * t + a * t * t / 2, v1 + a * t];
          } else if (t <= t1 + t2) {
            return [tTotal, s1 + (t - t1) * vMax, vMax];
          } else {
            const tt = t - t1 - t2;
            return [tTotal, s1 + t2 * vMax + vMax * tt - a * tt * tt / 2, vMax - a * tt];
          }
        } else {
          const t1 = (vPeak - v1) / a;
          const tTotal = t1 + (vPeak - v2) / a;
          if (t <= t1) {
            return [tTotal, v1 * t + a * t * t / 2, v1 + a * t];
          } else {
            const tt = t - t1;
            return [tTotal, (v1 + vPeak) * t1 / 2 + vPeak * tt - a * tt * tt / 2, vPeak - a * tt];
          }
        }
      })();
      if (t > tTotal) {
        return { ...s, collected: true };
      } else {
        return {
          ...s,
          x: p.startX + vecX * traveled,
          y: p.startY + vecY * traveled,
          speed: v
        };
      }
    }));

  // view
  const canvas$ = xs.combine(props$, state$)
    .map(([p, s]) => (s.collected ? [] : [{
      kind: 'text',
      layer: 2,
      x: s.x,
      y: s.y,
      text: '$' + p.value.toFixed(2),
      fontSize: s.speed * fBarNumber,
      textColor: p.hue[lBarNumber],
      shape: {
        kind: 'rect',
        margin: s.speed * 5,
        radius: s.speed * 5,
        fill: white
      }
    }]) as CanvasElement[]);
  const collectedE$ = collected$
    .compose(sc(props$))
    .map(([_, p]) => ({ kind: 'collected' as const, value: p.value }));

  return {
    canvas: canvas$,
    state: xs.merge(initR$, collectR$, updateR$),
    event: collectedE$
  };
}