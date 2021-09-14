import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import { always, assoc, equals, flatten, includes, pluck, unnest, __ } from 'ramda';
import xs, { Stream as S } from 'xstream';
import delay from 'xstream/extra/delay';
import sc from 'xstream/extra/sampleCombine';
import { cSelfBoardX, cSelfIconY } from '../config';
import { CanvasElement, CanvasMouseEvent } from '../drivers/canvas';
import { kindIs, mapUnits, nextStage, renameTargets, Show, showOrNot, strictR, Target } from '../utils';
import { BoardConfig, EventIn as BoardEventIn, EventOut as BoardEventOut, makeBoard, State as BoardState, TargetName as BoardTargetName, Unit as BoardUnit } from './board';
import { Button, State as ButtonState, TargetName as ButtonTargetName } from './button';
import { State as StatusState, Status, TargetName as StatusTargetName } from './status';

type SRS = S<R<State>>;
export type Stage = typeof stages[number];
export type Unit = typeof units[number];

interface Props {
  show: Show<Unit>;
}
interface NewTrialEvent {
  kind: 'newTrial';
  selfBoardConfig: BoardConfig;
  oppBoardConfig: BoardConfig;
}
interface NextStageEvent {
  kind: 'nextStage';
}
interface OppActEvent {
  kind: 'oppAct';
  lambda: number;
}
interface ResetEvent {
  kind: 'reset';
}
export type EventIn = NewTrialEvent | NextStageEvent | OppActEvent | ResetEvent;
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
  times: Times;
}
export type TargetName = typeof targets[number];
interface Value {
  targets: Target<TargetName>[];
}
export interface StageDoneEvent {
  kind: 'stageDone';
  stage: Stage;
}
interface SelfTouchedEvent {
  kind: 'selfTouched';
}
interface OppTouchedEvent {
  kind: 'oppTouched';
}
export type EventOut = StageDoneEvent | SelfTouchedEvent | OppTouchedEvent;
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

export const stages = ['preAct', 'act', 'postAct', 'showOpp', 'collect', 'review', 'postReview'] as const;
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
  const nextStage$ = sources.event.filter(kindIs('nextStage'))
    .compose(sc(state$))
    .map(([_, s]) => nextStage(stages, s.stage));
  const oppAct$ = sources.event.filter(kindIs('oppAct'));
  const reset$ = sources.event.filter(kindIs('reset'));

  const fixSelfLambda$ = nextStage$
    .filter(equals('postAct'))
    .mapTo<BoardEventIn>({ kind: 'fixLambda' });
  const setOppLambda$ = nextStage$
    .filter(equals('showOpp'))
    .compose(sc(state$))
    .map(([_, s]) => ({
      kind: 'setLambda' as const,
      lambda: s.oppLambda
    }));
  const collect$ = nextStage$
    .filter(equals('collect'))
    .mapTo({ kind: 'collect' as const });
  const resetLambda$ = newTrial$.mapTo<BoardEventIn>({
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
      enable: s.stage === 'act' || s.stage === 'review'
    })),
    event: xs.merge(
      fixSelfLambda$, collect$, resetLambda$, resetTotal$,
      oppBoardE$.filter(kindIs('oppCollected')).map(({ value }) => ({ kind: 'collected', value }))
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
      enable: s.stage === 'review'
    })),
    event: xs.merge(
      setOppLambda$, collect$, resetLambda$, resetTotal$,
      selfBoard.event.filter(kindIs('oppCollected')).map(({ value }) => ({ kind: 'collected', value }))
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

  // model
  const initR$ = xs.of(always<State>({
    stage: 'preAct',
    selfBoardConfig: { vertexSelf: .5, vertexOpp: .5, scale: .3 },
    oppBoardConfig: { vertexSelf: .5, vertexOpp: .5, scale: .3 },
    collected: 0,
    times: {}
  }));
  const newTrialR$ = newTrial$
    .map(e => strictR<State>(s => ({
      ...s,
      stage: 'preAct',
      selfBoardConfig: e.selfBoardConfig,
      oppBoardConfig: e.oppBoardConfig,
      oppLambda: undefined,
      collected: 0
    })));
  const nextStageR$ = nextStage$
    .map(stage => strictR<State>(s => ({
      ...s, stage,
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

  // view
  const stageDoneE$ = xs.merge(
    newTrial$.compose(delay(0)),
    button.event,
    nextStage$.filter(includes(__, ['postAct', 'showOpp'])).compose(delay(0)),
    collected$
      .compose(sc(state$))
      .filter(([_, s]) => s.collected === 1)
  )
    .compose(sc(state$))
    .map<EventOut>(([_, s]) => ({ kind: 'stageDone', stage: s.stage }));
  const selfTouchedE$ = selfBoard.event
    .filter(kindIs('touched'))
    .mapTo<EventOut>({ kind: 'selfTouched' });
  const oppTouchedE$ = oppBoard.event
    .filter(kindIs('touched'))
    .mapTo<EventOut>({ kind: 'oppTouched' });

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
    state: xs.merge(initR$, newTrialR$, nextStageR$, oppActR$, collectedR$, ...pluck('state', children) as SRS[]),
    canvas: xs.combine(...pluck('canvas', children)).map(flatten),
    event: xs.merge(stageDoneE$, selfTouchedE$, oppTouchedE$),
    value: targets$.map<Value>(ts => ({ targets: ts }))
  }
}