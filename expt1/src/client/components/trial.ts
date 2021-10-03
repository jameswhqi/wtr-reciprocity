import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import { always, assoc, equals, flatten, includes, pluck, prop, unnest, __ } from 'ramda';
import xs, { Stream as S } from 'xstream';
import delay from 'xstream/extra/delay';
import sc from 'xstream/extra/sampleCombine';
import { cSelfBoardX, cSelfIconY } from '../config';
import { CanvasElement, CanvasMouseEvent } from '../drivers/canvas';
import { kindIs, mapUnits, renameTargets, Show, showOrNot, strictR, Target } from '../utils';
import { BoardConfig, EventIn as BoardEventIn, EventOut as BoardEventOut, makeBoard, PayoffReceiver, State as BoardState, TargetName as BoardTargetName, Unit as BoardUnit } from './board';
import { Button, State as ButtonState, TargetName as ButtonTargetName } from './button';
import { State as StatusState, Status, TargetName as StatusTargetName } from './status';

type SRS = S<R<State>>;
export type Stage = typeof stages[number];
export type Unit = typeof units[number];

interface Props {
  show: Show<Unit>;
  oppReceiver: PayoffReceiver;
}
interface NewTrialEvent {
  kind: 'newTrial';
  selfBoardConfig: BoardConfig;
  oppBoardConfig: BoardConfig;
}
interface SetStageEvent {
  kind: 'setStage';
  stage: Stage;
}
interface OppActEvent {
  kind: 'oppAct';
  lambda: number;
}
interface ResetEvent {
  kind: 'reset';
}
export type EventIn = NewTrialEvent | SetStageEvent | OppActEvent | ResetEvent;
type Times = Partial<Record<'startAct' | 'endAct' | 'startReview', number>>;
export interface State {
  selfBoard?: BoardState;
  oppBoard?: BoardState;
  button?: ButtonState;
  oppStatus?: StatusState;
  stage: Stage;
  selfBoardConfig: BoardConfig;
  oppBoardConfig: BoardConfig;
  oppLambda?: number;
  collected: number;
  selfTouched: boolean;
  oppTouched: boolean;
  times: Times;
}
export type TargetName = typeof targets[number];
interface Value {
  targets: Target<TargetName>[];
}
export type EventOut = {
  kind: 'stageDone';
  stage: Stage;
} | {
  kind: 'selfTouched' | 'oppTouched' | 'bothTouched';
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

export const stages = ['preAct', 'act', 'postAct', 'showOpp', 'collect', 'review', 'postReview', 'memory'] as const;
const units = ['selfBoard', 'selfIcon', 'selfOppPay', 'selfSelfPay', 'selfSlider', 'selfTotal',
  'oppIcon', 'oppTotal', 'oppBoard', 'confirmButton', 'oppStatus'] as const;
const targets = ['selfIcon', 'selfBoard', 'selfSlider', 'selfThumb', 'selfSelfBarNumber', 'selfOppBarNumber', 'selfTotal',
  'oppIcon', 'oppBoard', 'oppThumb', 'confirmButton', 'oppStatus'] as const;

export function Trial(sources: Sources): Sinks {
  // intent
  const props$ = sources.props;
  const state$ = sources.state.stream;//.debug(s => console.log(s.stage));
  const ps$ = xs.combine(props$, state$);
  const newTrial$ = sources.event.filter(kindIs('newTrial'));
  const setStage$ = sources.event.filter(kindIs('setStage')).map(prop('stage'));
  const oppAct$ = sources.event.filter(kindIs('oppAct'));
  const reset$ = sources.event.filter(kindIs('reset'));

  const fixSelfLambda$ = setStage$
    .filter(equals('postAct'))
    .mapTo<BoardEventIn>({ kind: 'fixLambda' });
  const setOppLambda$ = setStage$
    .filter(equals('showOpp'))
    .compose(sc(state$))
    .map(([_, s]) => ({
      kind: 'setLambda' as const,
      lambda: s.oppLambda
    }));
  const collect$ = setStage$
    .filter(equals('collect'))
    .mapTo({ kind: 'collect' as const });
  const resetLambda$ = xs.merge(
    newTrial$,
    setStage$.filter(equals('memory'))
  ).mapTo<BoardEventIn>({
    kind: 'setLambda',
    lambda: undefined
  });
  const resetTotal$ = reset$.mapTo<BoardEventIn>({
    kind: 'resetTotal'
  });

  // children
  const button = isolate(Button, 'button')({
    ...sources,
    props: ps$.map(([p, s]) => ({
      show: showOrNot<Unit>(p.show, 'confirmButton') && s.stage === 'act' && s.selfBoard?.lambda !== undefined,
      x: cSelfBoardX + 140,
      y: cSelfIconY,
      width: 120,
      height: 50,
      text: 'Confirm'
    }))
  });
  const oppBoardE$ = xs.create<BoardEventOut>();
  const selfBoard = isolate(makeBoard('self'), 'selfBoard')({
    ...sources,
    props: ps$.map(([p, s]) => ({
      show: mapUnits<Unit, BoardUnit>(p.show, {
        selfBoard: 'board',
        selfIcon: 'icon',
        selfOppPay: 'oppPay',
        selfSelfPay: 'selfPay',
        selfSlider: ['slider', 'thumb'],
        selfTotal: 'total'
      }),
      config: s.selfBoardConfig,
      enable: includes(s.stage, ['act', 'review', 'memory']),
      oppReceiver: p.oppReceiver
    })),
    event: xs.merge(
      fixSelfLambda$, collect$, resetLambda$, resetTotal$,
      oppBoardE$.filter(kindIs('oppCollected')).map(({ value }) => ({ kind: 'otherBoardCollected', value }))
    )
  });
  const oppBoard = isolate(makeBoard('opp'), 'oppBoard')({
    ...sources,
    props: ps$.map(([p, s]) => ({
      show: mapUnits<Unit, BoardUnit>(p.show, {
        oppBoard: ['board', 'slider', 'oppPay', 'selfPay', 'thumb'],
        oppIcon: 'icon',
        oppTotal: 'total'
      }),
      config: s.oppBoardConfig,
      enable: includes(s.stage, ['review', 'memory']),
      oppReceiver: p.oppReceiver
    })),
    event: xs.merge(
      setOppLambda$, collect$, resetLambda$, resetTotal$,
      selfBoard.event.filter(kindIs('oppCollected')).map(({ value }) => ({ kind: 'otherBoardCollected', value }))
    )
  });
  oppBoardE$.imitate(oppBoard.event);

  const oppStatus = isolate(Status, 'oppStatus')({
    ...sources,
    props: ps$.map(([p, s]) => ({
      show: showOrNot<Unit>(p.show, 'oppStatus') && s.stage !== 'preAct',
      chosen: s.oppLambda !== undefined
    }))
  });

  const children = [selfBoard, oppBoard, button, oppStatus];

  // intent 2
  const collected$ = xs.merge(
    selfBoard.event.filter(kindIs('bothCollected')),
    oppBoard.event.filter(kindIs('bothCollected'))
  );
  const selfTouched$ = selfBoard.event.filter(kindIs('touched'));
  const oppTouched$ = oppBoard.event.filter(kindIs('touched'));

  // model
  const initR$ = xs.of(always<State>({
    stage: 'preAct',
    selfBoardConfig: { vertexSelf: .5, vertexOpp: .5, scale: .3 },
    oppBoardConfig: { vertexSelf: .5, vertexOpp: .5, scale: .3 },
    collected: 0,
    selfTouched: false,
    oppTouched: false,
    times: {}
  }));
  const newTrialR$ = newTrial$
    .map(e => strictR<State>(s => ({
      ...s,
      stage: 'preAct',
      selfBoardConfig: e.selfBoardConfig,
      oppBoardConfig: e.oppBoardConfig,
      oppLambda: undefined,
      selfTouched: false,
      oppTouched: false,
      collected: 0
    })));
  const setStageR$ = setStage$
    .map(stage => strictR<State>(s => ({
      ...s, stage,
      selfTouched: stage === 'memory' ? false : s.selfTouched,
      oppTouched: stage === 'memory' ? false : s.oppTouched,
      times: {
        ...s.times,
        startAct: stage === 'act' ? Date.now() : s.times.startAct,
        endAct: stage === 'postAct' ? Date.now() : s.times.endAct,
        startReview: stage === 'review' ? Date.now() : s.times.startReview
      }
    })));
  const oppActR$ = oppAct$
    .map<R<State>>(({ lambda }) => assoc('oppLambda', lambda));
  const collectedR$ = collected$
    .mapTo(strictR<State>(s => ({ ...s, collected: s.collected + 1 })));
  const selfTouchedR$ = selfTouched$.mapTo<R<State>>(assoc('selfTouched', true));
  const oppTouchedR$ = oppTouched$.mapTo<R<State>>(assoc('oppTouched', true));

  // view
  const stageDoneE$ = xs.merge(
    newTrial$.compose(delay(0)),
    button.event,
    setStage$.filter(includes(__, ['postAct', 'showOpp'])).compose(delay(0)),
    collected$
      .compose(sc(state$))
      .filter(([_, s]) => s.collected === 1)
  )
    .compose(sc(state$))
    .map<EventOut>(([_, s]) => ({ kind: 'stageDone', stage: s.stage }));
  const selfTouchedE$ = selfTouched$.mapTo<EventOut>({ kind: 'selfTouched' });
  const oppTouchedE$ = oppTouched$.mapTo<EventOut>({ kind: 'oppTouched' });
  const bothTouchedE$ = xs.merge(
    selfTouched$
      .compose(sc(state$))
      .filter(([_, s]) => s.oppTouched),
    oppTouched$
      .compose(sc(state$))
      .filter(([_, s]) => s.selfTouched)
  ).mapTo<EventOut>({ kind: 'bothTouched' });

  const targets$ = xs.combine(selfBoard.value, oppBoard.value, button.value, oppStatus.value)
    .map(([sbv, obv, bv, osv]) => unnest([
      renameTargets<BoardTargetName, TargetName>({
        icon: 'selfIcon',
        board: 'selfBoard',
        slider: 'selfSlider',
        thumb: 'selfThumb',
        selfBarNumber: 'selfSelfBarNumber',
        oppBarNumber: 'selfOppBarNumber',
        total: 'selfTotal'
      }, sbv.targets),
      renameTargets<BoardTargetName, TargetName>({
        icon: 'oppIcon',
        board: 'oppBoard',
        thumb: 'oppThumb'
      }, obv.targets),
      renameTargets<ButtonTargetName, TargetName>({
        button: 'confirmButton'
      }, bv.targets),
      renameTargets<StatusTargetName, TargetName>({
        status: 'oppStatus'
      }, osv.targets)
    ]));

  return {
    state: xs.merge(initR$, newTrialR$, setStageR$, oppActR$, collectedR$, selfTouchedR$, oppTouchedR$, ...pluck('state', children) as SRS[]),
    canvas: xs.combine(...pluck('canvas', children)).map(flatten),
    event: xs.merge(stageDoneE$, selfTouchedE$, oppTouchedE$, bothTouchedE$),
    value: targets$.map<Value>(ts => ({ targets: ts }))
  };
}