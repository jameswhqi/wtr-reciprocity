import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import { always, assoc, concat, flatten } from 'ramda';
import xs, { Stream as S } from 'xstream';
import sc from 'xstream/extra/sampleCombine';
import { ColorSet } from '../colors';
import { cBoardY, cOppBoardX, cOppIconY, cSelfBoardX, cSelfIconY, dBoardSize, fBarNumber, fTotal, hDiscard, hOpp, hSelf, lBarNumber } from '../config';
import { CanvasElement, CanvasMouseEvent, measureText, Text } from '../drivers/canvas';
import { elementsToTargets, filterElements, kindIs, mouseInRegion, randomUnif, Show, strictR, Target } from '../utils';
import { BarNumber, State as BarNumberState } from './barnumber';

export interface BoardConfig {
  vertexSelf: number;
  vertexOpp: number;
  scale: number;
}
export type Unit = typeof units[number];
export type PayoffReceiver = 'self' | 'opp' | 'discard';
interface Props {
  show: Show<Unit>;
  config: BoardConfig;
  enable: boolean;
  oppReceiver: PayoffReceiver;
}
export type EventIn = {
  kind: 'setLambda';
  lambda?: number;
} | {
  kind: 'fixLambda' | 'collect' | 'resetTotal';
} | {
  kind: 'otherBoardCollected';
  value: number;
};
export interface State {
  selfBarNumber?: BarNumberState;
  oppBarNumber?: BarNumberState;
  total: number;
  lambda?: number;
  fixedLambda?: number;
  collected: number;
  mouseOver: boolean;
  mouseDownHere: boolean;
  mouseDownElsewhere: boolean;
}
export type TargetName = typeof targets[number];
interface Value {
  targets: Target<TargetName>[];
}
export type EventOut = {
  kind: 'oppCollected';
  value: number;
} | {
  kind: 'bothCollected' | 'touched';
};
interface Sources {
  props: S<Props>;
  event: S<EventIn>;
  state: StateSource<State>;
  canvas: S<CanvasMouseEvent>;
}
interface Sinks {
  state: S<R<State>>;
  canvas: S<CanvasElement[]>;
  event: S<EventOut>;
  value: S<Value>;
}

type SRS = S<R<State>>;

const units = ['board', 'icon', 'oppPay', 'selfPay', 'slider', 'thumb', 'total'] as const;
const targets = ['icon', 'board', 'slider', 'thumb', 'selfBarNumber', 'oppBarNumber', 'total'] as const;

const dBarWidth = 30;
const dBarSep = 30;
const dLeaderWidth = 1;
const dLeaderDash = [5, 5];
const dSelfBarNumberSep = 5;
const dOppBarNumberSep = 18;
const dTotalOffset = 130;

export function calcPayoffs(config: BoardConfig, lambda: number): {
  payoffSelf: number;
  payoffOpp: number;
} {
  const c = config;
  const payoffSelf = c.vertexSelf - lambda * lambda / 4 * c.scale;
  const payoffOpp = c.vertexOpp + lambda / 2 * c.scale;
  return { payoffSelf, payoffOpp };
}

function parabolaCalc(config: BoardConfig): Record<'startX' | 'startY' | 'endX' | 'endY' | 'cp1X' | 'cp1Y' | 'cp2X' | 'cp2Y' | 'lambdaMin' | 'lambdaMax', number> {
  const c = config;
  const x0 = c.vertexSelf - Math.pow(c.vertexOpp / c.scale, 2) * c.scale;
  const startX = x0 >= 0 ? x0 : 0;
  const startY = x0 >= 0 ? 0 : c.vertexOpp - Math.sqrt(c.vertexSelf * c.scale);
  const x1 = c.vertexSelf - Math.pow((1 - c.vertexOpp) / c.scale, 2) * c.scale;
  const endX = x1 >= 0 ? x1 : 0;
  const endY = x1 >= 0 ? 1 : c.vertexOpp + Math.sqrt(c.vertexSelf * c.scale);
  const cpX = startX + (c.vertexOpp - startY) / c.scale * (endY - startY);
  const cpY = (startY + endY) / 2;
  return {
    startX, startY, endX, endY,
    cp1X: (startX + cpX * 2) / 3,
    cp1Y: (startY + cpY * 2) / 3,
    cp2X: (endX + cpX * 2) / 3,
    cp2Y: (endY + cpY * 2) / 3,
    lambdaMin: (startY - c.vertexOpp) / c.scale * 2,
    lambdaMax: (endY - c.vertexOpp) / c.scale * 2
  };
}

export function makeBoard(role: 'self' | 'opp'): (s: Sources) => Sinks {
  const self = role === 'self';

  const cSelfBoard_X = self ? cSelfBoardX : cOppBoardX;
  const cOppBoard_X = self ? cOppBoardX : cSelfBoardX;
  const cNwX = cSelfBoard_X - dBoardSize / 2;
  const cNwY = cBoardY - dBoardSize / 2;
  const tfX = function (x: number): number { return cNwX + (self ? x : (1 - x)) * dBoardSize; };
  const tfY = function (y: number): number { return cNwY + (self ? (1 - y) : y) * dBoardSize; };
  const cSelfBarY = self ? cNwY + dBoardSize + dBarSep : cNwY - dBarSep;
  const cOppBarX = self ? cNwX - dBarSep : cNwX + dBoardSize + dBarSep;
  const cSelfIcon_Y = self ? cSelfIconY : cOppIconY;
  const cOppIcon_Y = self ? cOppIconY : cSelfIconY;
  const cSelfTotalX = self ? cSelfBoard_X - dTotalOffset : cSelfBoard_X + dTotalOffset;
  const cOppTotalX = self ? cOppBoard_X + dTotalOffset : cOppBoard_X - dTotalOffset;

  const lBarBg = 8;
  const lLeader = 10;

  const [hSelf_, hOpp_] = self ? [hSelf, hOpp] : [hOpp, hSelf];

  const oppHueMap: Record<PayoffReceiver, ColorSet> = {
    self: hSelf_,
    opp: hOpp_,
    discard: hDiscard
  };

  function getSelfBarNumber(p: Props, s: State): Text {
    if (s.lambda === undefined) {
      return {
        name: 'selfBarNumber',
        kind: 'text',
        layer: 0,
        x: 0,
        y: 0,
        text: '',
        fontSize: fBarNumber
      };
    } else {
      const { payoffSelf } = calcPayoffs(p.config, s.lambda);
      return {
        name: 'selfBarNumber',
        kind: 'text',
        layer: 0,
        x: self ? tfX(payoffSelf) + dSelfBarNumberSep : tfX(payoffSelf) - dSelfBarNumberSep,
        y: cSelfBarY,
        text: '$' + (Math.round(payoffSelf * 100) / 10).toFixed(2),
        hAnchor: self ? 'l' : 'r',
        fontSize: fBarNumber,
        textColor: hSelf_[lBarNumber]
      };
    }
  }

  return function Board(sources: Sources): Sinks {
    // intent
    const props$ = sources.props;
    const state$ = sources.state.stream;
    const ps$ = xs.combine(props$, state$);
    const mouse$ = sources.canvas;

    const collect$ = sources.event.filter(kindIs('collect'));
    const setLambda$ = sources.event.filter(kindIs('setLambda'));
    const fixLambda$ = sources.event.filter(kindIs('fixLambda'));
    const resetTotal$ = sources.event.filter(kindIs('resetTotal'));
    const otherBoardCollected$ = sources.event.filter(kindIs('otherBoardCollected'));

    // children
    const selfBarNumber = isolate(BarNumber, 'selfBarNumber')({
      ...sources,
      props: xs.combine(props$, state$)
        .map(([p, s]) => {
          const baseObj = {
            endX: cSelfTotalX,
            endY: cSelfIcon_Y,
            hue: hSelf_
          };
          if (s.lambda === undefined) {
            return {
              ...baseObj,
              value: 0,
              startX: 0,
              startY: 0
            };
          } else {
            const { payoffSelf } = calcPayoffs(p.config, s.lambda);
            const m = measureText(getSelfBarNumber(p, s));
            return {
              ...baseObj,
              value: Math.round(payoffSelf * 100) / 10,
              startX: m.centerX,
              startY: m.centerY
            };
          }
        }),
      event: collect$
    });
    const oppBarNumber = isolate(BarNumber, 'oppBarNumber')({
      ...sources,
      props: ps$.map(([p, s]) => {
        const baseObj = {
          endX: p.oppReceiver === 'self' ? cSelfTotalX : cOppTotalX,
          endY: p.oppReceiver === 'self' ? cSelfIcon_Y : cOppIcon_Y,
          hue: oppHueMap[p.oppReceiver]
        };
        if (s.lambda === undefined) {
          return {
            ...baseObj,
            value: 0,
            startX: 0,
            startY: 0
          };
        } else {
          const { payoffOpp } = calcPayoffs(p.config, s.lambda);
          return {
            ...baseObj,
            value: Math.round(payoffOpp * 100) / 10,
            startX: cOppBarX,
            startY: self ? tfY(payoffOpp) - dOppBarNumberSep : tfY(payoffOpp) + dOppBarNumberSep
          };
        }
      }),
      event: collect$
        .compose(sc(props$))
        .filter(([_, p]) => p.oppReceiver !== 'discard')
        .map(([e, _]) => e)
    });

    // intent
    const collected$ = xs.merge(
      selfBarNumber.event,
      oppBarNumber.event
        .compose(sc(props$))
        .filter(([_, p]) => p.oppReceiver === 'self')
        .map(([e, _]) => e),
      otherBoardCollected$
    );

    // model
    const initR$ = xs.of(always<State>({
      total: 0,
      lambda: undefined,
      fixedLambda: undefined,
      collected: 0,
      mouseOver: false,
      mouseDownHere: false,
      mouseDownElsewhere: false
    }));

    const mouseR$ = mouse$
      .compose(sc(props$))
      .map(([e, p]) => strictR<State>(s => {
        if (p.enable) {
          const mouseOver = mouseInRegion(e, {
            x: cSelfBoard_X,
            y: cBoardY,
            width: dBoardSize,
            height: dBoardSize
          });
          const lambdaRaw = ((self ? dBoardSize - e.y + cNwY : e.y - cNwY) / dBoardSize - p.config.vertexOpp) / p.config.scale * 2;
          const { lambdaMin, lambdaMax } = parabolaCalc(p.config);
          const lambda = lambdaRaw > lambdaMax ? lambdaMax : lambdaRaw < lambdaMin ? lambdaMin : lambdaRaw;
          switch (e.kind) {
            case 'mousemove':
              if (s.mouseDownHere) {
                return { ...s, lambda };
              } else if (s.mouseDownElsewhere) {
                return s;
              } else {
                return { ...s, mouseOver };
              }
            case 'mousedown':
              if (s.mouseOver) {
                return { ...s, mouseDownHere: true, lambda };
              } else {
                return { ...s, mouseDownElsewhere: true };
              }
            case 'mouseup':
              return {
                ...s, mouseDownHere: false, mouseDownElsewhere: false, mouseOver, lambda: s.fixedLambda === undefined ? s.lambda : s.fixedLambda
              };
          }
        } else {
          return {
            ...s, mouseOver: false, mouseDownHere: false, mouseDownElsewhere: false, lambda: s.fixedLambda === undefined ? s.lambda : s.fixedLambda
          };
        }
      }));

    const setLambdaR$ = setLambda$
      .map(({ lambda }) => strictR<State>(s => ({ ...s, lambda, fixedLambda: lambda })));
    const fixLambdaR$ = fixLambda$
      .mapTo(strictR<State>(s => ({ ...s, fixedLambda: s.lambda })));
    const collectR$ = collect$
      .compose(sc(props$))
      .map<R<State>>(([_, p]) => assoc('collected', p.oppReceiver === 'discard' ? 1 : 2));
    const resetTotalR$ = resetTotal$.mapTo<R<State>>(assoc('total', 0));

    const collectedR$ = collected$
      .map(({ value }) => strictR<State>(s => {
        return { ...s, total: s.total + value, collected: s.collected - 1 };
      }));

    // view
    const canvas$ = ps$.map(([p, s]): CanvasElement[] => {
      const c = p.config;
      const units1 = ['board', 'slider', 'icon', 'total'] as const;
      const fixedElements = filterElements<Unit, typeof units1[number]>(p.show, units1, e => {
        switch (e) {
          case 'board':
            return { // board background
              name: 'board',
              kind: 'rect',
              layer: -2,
              x: cSelfBoard_X,
              y: cBoardY,
              width: dBoardSize,
              height: dBoardSize,
              fill: hSelf_[1]
            };
          case 'slider': {
            const pb = parabolaCalc(c);
            return { // slider track
              name: 'slider',
              kind: 'bezier',
              layer: 0,
              x: tfX(pb.startX),
              y: tfY(pb.startY),
              cp1X: tfX(pb.cp1X),
              cp1Y: tfY(pb.cp1Y),
              cp2X: tfX(pb.cp2X),
              cp2Y: tfY(pb.cp2Y),
              endX: tfX(pb.endX),
              endY: tfY(pb.endY),
              stroke: hSelf_[10],
              strokeWidth: p.enable && s.mouseOver ? 4 : 2
            };
          }
          case 'icon':
            return { // player icon
              name: 'icon',
              kind: 'complex',
              layer: 0,
              x: cSelfBoard_X,
              y: cSelfIcon_Y,
              stencil: 'user',
              width: 75,
              fill: hSelf_[7]
            };
          case 'total':
            return [{ // total shape
              name: 'total',
              kind: 'circle',
              layer: 0,
              x: cSelfTotalX,
              y: cSelfIcon_Y,
              size: 100,
              stroke: hSelf_[10],
              strokeWidth: 4,
              fill: hSelf_[2]
            }, { // total text
              kind: 'text',
              layer: 1,
              x: cSelfTotalX,
              y: cSelfIcon_Y,
              text: self ? '$' + s.total.toFixed(2) : '$****',
              fontSize: fTotal,
              textColor: hSelf_[12]
            }];
        }
      });

      if (s.lambda === undefined) {
        return fixedElements;
      } else {
        const { payoffSelf, payoffOpp } = calcPayoffs(p.config, s.lambda);
        const cSliderX = tfX(payoffSelf);
        const cSliderY = tfY(payoffOpp);

        const units2 = ['thumb', 'oppPay', 'selfPay'] as const;
        const newElements = filterElements<Unit, typeof units2[number]>(p.show, units2, e => {
          switch (e) {
            case 'thumb':
              return { // slider thumb
                name: 'thumb',
                kind: 'circle',
                layer: 0,
                x: cSliderX,
                y: cSliderY,
                size: 15,
                fill: hSelf_[3],
                stroke: hSelf_[10],
                strokeWidth: p.enable && s.mouseOver ? 4 : 2
              };
            case 'selfPay':
              return [{ // self bar
                kind: 'rect',
                layer: 0,
                x: self ? (cNwX + cSliderX) / 2 : (cNwX + dBoardSize + cSliderX) / 2,
                y: cSelfBarY,
                width: payoffSelf * dBoardSize,
                height: dBarWidth,
                fill: hSelf_[lBarBg]
              }, { // self bar leader
                kind: 'line',
                layer: -1,
                x: cSliderX,
                y: cSliderY,
                endX: cSliderX,
                endY: self ? cSelfBarY - dBarWidth / 2 : cSelfBarY + dBarWidth / 2,
                stroke: hSelf_[lLeader],
                strokeWidth: dLeaderWidth,
                lineDash: dLeaderDash
              }, getSelfBarNumber(p, s)];
            case 'oppPay':
              return [{ // opp bar
                kind: 'rect',
                layer: 0,
                x: cOppBarX,
                y: self ? (cNwY + dBoardSize + cSliderY) / 2 : (cNwY + cSliderY) / 2,
                width: dBarWidth,
                height: payoffOpp * dBoardSize,
                fill: oppHueMap[p.oppReceiver][lBarBg]
              }, { // opp bar leader
                kind: 'line',
                layer: -1,
                x: cSliderX,
                y: cSliderY,
                endX: self ? cOppBarX + dBarWidth / 2 : cOppBarX - dBarWidth / 2,
                endY: cSliderY,
                stroke: oppHueMap[p.oppReceiver][lLeader],
                strokeWidth: dLeaderWidth,
                lineDash: dLeaderDash
              }, { // opp bar number
                name: 'oppBarNumber',
                kind: 'text',
                layer: 0,
                x: cOppBarX,
                y: self ? cSliderY - dOppBarNumberSep : cSliderY + dOppBarNumberSep,
                text: '$' + (Math.round(payoffOpp * 100) / 10).toFixed(2),
                fontSize: fBarNumber,
                textColor: oppHueMap[p.oppReceiver][lBarNumber]
              }];
          }
        });

        return concat(fixedElements, newElements);
      }
    });

    const targets$ = canvas$.map(elementsToTargets(targets));

    const oppCollectedE$ = oppBarNumber.event
      .compose(sc(props$))
      .filter(([_, p]) => p.oppReceiver === 'opp')
      .map<EventOut>(([{ value }, _]) => ({ kind: 'oppCollected', value }));
    const bothCollectedE$ = collected$
      .compose(sc(state$))
      .filter(([_, s]) => s.collected === 1)
      .mapTo<EventOut>({ kind: 'bothCollected' });
    const touchedE$ = mouse$
      .filter(kindIs('mouseup'))
      .compose(sc(state$))
      .filter(([_, s]) => s.mouseDownHere)
      .mapTo<EventOut>({ kind: 'touched' });

    return {
      state: xs.merge(initR$, mouseR$, setLambdaR$, fixLambdaR$, collectR$, resetTotalR$, collectedR$,
        <SRS>selfBarNumber.state, <SRS>oppBarNumber.state),
      canvas: xs.combine(canvas$, selfBarNumber.canvas, oppBarNumber.canvas).map(flatten),
      event: xs.merge(oppCollectedE$, bothCollectedE$, touchedE$),
      value: targets$.map<Value>(ts => ({ targets: ts }))
    };
  };
}

export function generateConfig(): BoardConfig {
  const scale = randomUnif(.1, .5);
  const vertexSelf = randomUnif(scale, 1);
  const vertexOpp = randomUnif(scale, 1 - scale);
  return { scale, vertexSelf, vertexOpp };
}