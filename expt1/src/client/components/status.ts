import { Reducer as R, StateSource } from '@cycle/state';
import { always, map, prepend, range } from 'ramda';
import xs, { Stream as S } from 'xstream';
import sc from 'xstream/extra/sampleCombine';
import { cOppBoardX, cOppIconY, hOpp } from '../config';
import { CanvasElement } from '../drivers/canvas';
import { elementsToTargets, rotateVector, strictR, Target } from '../utils';

interface Props {
  show: boolean;
  chosen: boolean;
}
export interface State {
  loadingStep: number;
}
export type TargetName = typeof targets[number];
interface Value {
  targets: Target<TargetName>[];
}
interface Sources {
  props: S<Props>;
  state: StateSource<State>;
}
interface Sinks {
  canvas: S<CanvasElement[]>;
  state: S<R<State>>;
  value: S<Value>;
}

const targets = ['status'] as const;

const dCheckSize = 40;
const dLoadingRadius = 20;
const cCenterX = cOppBoardX - 80;
const cCenterY = cOppIconY;

export function Status(sources: Sources): Sinks {
  // intent
  const state$ = sources.state.stream;
  const props$ = sources.props;

  // model
  const initR$ = xs.of(always<State>({
    loadingStep: 0
  }));
  const stepR$ = xs.periodic(200)
    .compose(sc(props$))
    .filter(([_, p]) => p.show && !p.chosen)
    .mapTo(strictR<State>(s => ({ ...s, loadingStep: s.loadingStep + 1 })));

  // view
  const canvas$ = xs.combine(props$, state$).map<CanvasElement[]>(([p, s]) => {
    if (p.show) {
      if (p.chosen) {
        return [{
          name: 'status',
          kind: 'complex',
          layer: 0,
          stencil: 'check',
          x: cCenterX,
          y: cCenterY,
          width: dCheckSize,
          height: dCheckSize,
          fill: hOpp[10]
        }];
      } else {
        return prepend(
          {
            name: 'status',
            kind: 'rect',
            layer: 0,
            x: cCenterX,
            y: cCenterY,
            width: dCheckSize,
            height: dCheckSize
          },
          map<number, CanvasElement>(i => {
            const [shiftX, shiftY] = rotateVector(0, 1, (s.loadingStep + i) * 45);
            return {
              kind: 'circle',
              layer: 0,
              size: 5 + i * .5,
              x: cCenterX + shiftX * dLoadingRadius,
              y: cCenterY + shiftY * dLoadingRadius,
              fill: hOpp[i + 2],
            }
          }, range(0, 8))
        )
      }
    } else {
      return [];
    }
  });

  const targets$ = canvas$.map(elementsToTargets(targets));

  return {
    canvas: canvas$,
    state: xs.merge(initR$, stepR$),
    value: targets$.map(ts => ({ targets: ts }))
  }
}