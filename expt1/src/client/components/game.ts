import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import dedent from 'dedent';
import { always, append, assoc, equals, find, flatten, includes, max, min, prepend, prop, propEq, unnest, __ } from 'ramda';
import xs, { Stream as S } from 'xstream';
import delay from 'xstream/extra/delay';
import sc from 'xstream/extra/sampleCombine';
import { black, grays, white } from '../colors';
import { cOppBoardX, cSelfIconY, dFullHeight, dFullWidth, dMsgInnerSep, dMsgStrokeWidth, fMsg, maxOppLambda, maxPayoff, minOppLambda, nPracticeTrials, nRealTrials, practiceDiscardTrials, practiceMemoryTrials, practiceSelfTrials, realDiscardTrials, realMemoryTrials, realSelfTrials, secondRatio, speedRatio } from '../config';
import { CanvasElement, CanvasMouseEvent } from '../drivers/canvas';
import { client } from '../drivers/client';
import { kindIs, nextStage, randomUnif, strictR, Target } from '../utils';
import { TargetName as AppTargetName } from './app';
import { BoardConfig, calcPayoffs, generateConfig, PayoffReceiver } from './board';
import { Button, State as ButtonState } from './button';
import { EventIn as TrialEventIn, EventOut as TrialEventOut, Stage as TrialStage, stages as trialStages, State as TrialState, Trial } from './trial';
import { Anchor, buildCallout, Direction } from './tutorial';

type Stage = typeof stages[number];

export interface Props {
  targets: Target<AppTargetName>[];
}
export interface EventIn {
  kind: 'startGame';
}
type TrialData = {
  kind: 'normal';
  trialNumber: number;
  oppReceiver: PayoffReceiver;
  selfConfig: BoardConfig;
  selfLambda: number;
  oppConfig: BoardConfig;
  oppLambda: number;
  actTime: number;
  reviewTime: number;
} | {
  kind: 'memory';
  trialNumber: number;
  selfLambda: number;
  oppLambda: number;
};
export interface State {
  trial?: TrialState;
  button?: ButtonState;
  stage: Stage;
  trialNumber: number;
  readyForNext: boolean;
  oppLambda?: number;
  minTotal: number;
  maxTotal: number;
  bonus?: number;
  history: TrialData[];
}
interface EventOut {
  kind: 'endGame';
}
interface Sources {
  props: S<Props>;
  state: StateSource<State>;
  canvas: S<CanvasMouseEvent>;
  event: S<EventIn>;
}
interface Sinks {
  state: S<R<State>>;
  canvas: S<CanvasElement[]>;
  event: S<EventOut>;
}

type SRS = S<R<State>>;

interface Message {
  kind: 'message';
  text: (s: State) => string;
}
type TargetName = AppTargetName;
interface Callout {
  kind: 'callout';
  targetName: TargetName;
  sep: number;
  text: (s: State) => string;
  anchor: Anchor;
  direction: Direction;
}

const stages = ['prePractice', 'tutorialButton', 'practice', 'donePractice', 'pairing', 'paired', 'real', 'doneReal', 'preview'] as const;

const minPairingTime = 5;
const maxPairingTime = 30;

const messages: Partial<Record<Stage, Message | Callout>> = {
  prePractice: {
    kind: 'message',
    text: always(dedent`
      The following are ${nPracticeTrials} practice rounds.
      [opp|Blue] will be a bot, so it will make decisions very quickly.
      After the practice rounds, you will be paired with a human to play the real game.
    `),
  },
  tutorialButton: {
    kind: 'callout',
    targetName: 'tutorialButton',
    sep: 10,
    text: always(dedent`
      You can click the “Tutorial” button
      to review the tutorial any time.
    `),
    anchor: 'nw',
    direction: 'se',
  },
  donePractice: {
    kind: 'message',
    text: always(dedent`
      Good job!
      Now you will be paired with a human to play the real game.
    ` + (includes(client.kind, ['mturk', 'prolific']) ? dedent`
      \nAs a reminder, at the end of the experiment,
      you will be given a bonus according to your total reward.
      The higher your total reward is, the higher your bonus will be.
      The same thing will happen to [opp|Blue].
    ` : '')),
  },
  pairing: {
    kind: 'message',
    text: always(dedent`
      Waiting for another participant...
      (The wait time is usually ${minPairingTime}–${maxPairingTime} seconds.)
    `)
  },
  paired: {
    kind: 'message',
    text: always(dedent`
      Pairing success!
      You will play ${nRealTrials} rounds of the game with the other participant.
    `)
  },
  doneReal: {
    kind: 'message',
    text: s => 'Congratulations! You have completed the game.' + (!includes(client.kind, ['mturk', 'prolific']) || s.bonus === undefined ? '' : s.bonus === 0 ? dedent`
      \nUnfortunately, you didn’t receive a bonus
      because your total reward is too low.
    ` : dedent`
      \nYour bonus for the total reward is [b|$${s.bonus.toFixed(2)}].
      It will be sent to your account
      after the experiment finishes.
    `)
  },
  preview: {
    kind: 'message',
    text: always(dedent`
      Error: You are currently in preview mode.
      Please accept the HIT to play the real game.
    `)
  }
};

const cRoundCounterX = 150;
const cRoundCounterY = 80;

export function calcBonus(s: State): number {
  return Math.round(min(max((s.trial!.selfBoard!.total - s.minTotal) / (s.maxTotal - s.minTotal), 0), 1) * 100) / 100;
}

function makeTrialData(s: State): TrialData {
  return s.trial!.stage === 'memory' ? {
    kind: 'memory',
    trialNumber: s.trialNumber,
    selfLambda: s.trial!.selfBoard!.lambda!,
    oppLambda: s.trial!.oppBoard!.lambda!
  } : {
    kind: 'normal',
    trialNumber: s.trialNumber,
    oppReceiver: getOppReceiver(s.stage, s.trialNumber),
    selfConfig: s.trial!.selfBoardConfig,
    selfLambda: s.trial!.selfBoard!.fixedLambda!,
    oppConfig: s.trial!.oppBoardConfig,
    oppLambda: s.trial!.oppBoard!.fixedLambda!,
    actTime: (s.trial!.times.endAct! - s.trial!.times.startAct!) / 1000,
    reviewTime: (Date.now() - s.trial!.times.startReview!) / 1000
  };
}

function getActTime(trial: number): number {
  const minTime = (trial === 1 ? 10 : max(20 - trial, 10)) + (includes(trial, realMemoryTrials) ? 5 : 0);
  return randomUnif(minTime, minTime + 5);
}

function getOppReceiver(stage: Stage, trial: number): PayoffReceiver {
  const [discardTrials, selfTrials] = includes(stage, ['paired', 'real', 'doneReal']) ? [realDiscardTrials, realSelfTrials] : [practiceDiscardTrials, practiceSelfTrials];
  return includes(trial, discardTrials) ? 'discard' : includes(trial, selfTrials) ? 'self' : 'opp';
}

export function Game(sources: Sources): Sinks {
  // intent 1
  const props$ = sources.props;
  const state$ = sources.state.stream;
  const startGames$ = sources.event;
  const targets$ = props$.map(prop('targets'));

  // children 1
  const button = isolate(Button, 'button')({
    ...sources,
    props: state$.map(s => ({
      show: s.readyForNext,
      x: cOppBoardX,
      y: cSelfIconY,
      width: 150,
      height: 50,
      text: (() => {
        switch (s.stage) {
          case 'prePractice':
          case 'tutorialButton':
          case 'donePractice':
          case 'paired':
          case 'doneReal':
            return 'OK';
          case 'practice':
            return s.trialNumber === nPracticeTrials ? 'Finish' : 'Next round';
          case 'real':
            return s.trialNumber === nRealTrials ? 'Finish' : 'Next round';
          default:
            return '';
        }
      })()
    }))
  });

  // intent 2
  const nextStage$ = xs.merge(
    button.event
      .compose(sc(state$))
      .filter(([_, s]) => !includes(s.stage, ['practice', 'donePractice', 'real', 'doneReal'])
        || s.stage === 'practice' && s.trialNumber === nPracticeTrials && (!includes(s.trialNumber, practiceMemoryTrials) || s.trial!.stage === 'memory')
        || s.stage === 'real' && s.trialNumber === nRealTrials && (!includes(s.trialNumber, realMemoryTrials) || s.trial!.stage === 'memory')
        || s.stage === 'donePractice' && client.kind !== 'preview')
      .map(([_, s]) => nextStage(stages, s.stage)),
    button.event
      .compose(sc(state$))
      .filter(([_, s]) => s.stage === 'donePractice' && client.kind !== 'preview')
      .map(_ => xs.of<Stage>('paired').compose(delay(randomUnif(minPairingTime, maxPairingTime) * 1000 / speedRatio)))
      .flatten(),
    xs.of<Stage>('paired').compose(delay(100)),
    xs.of<Stage>('real').compose(delay(3000))
  );
  const goToPreview$ = button.event
    .compose(sc(state$))
    .filter(([_, s]) => s.stage === 'donePractice' && client.kind === 'preview')
    .mapTo<Stage>('preview');

  const trialStageDone$ = xs.create<TrialEventOut & { kind: 'stageDone'; }>();
  const oppAct$ = xs.create<number>();
  const trialSetStage$ = xs.merge(
    xs.merge(
      trialStageDone$
        .compose(sc(state$))
        .filter(([e, s]) => e.stage === 'postAct' && s.oppLambda !== undefined || e.stage === 'showOpp')
        .map(([e, _]) => e)
        .compose(delay(1000 / speedRatio)),
      trialStageDone$
        .compose(sc(state$))
        .filter(([e, s]) => e.stage === 'preAct' && includes(s.stage, ['practice', 'real']) || includes(e.stage, ['act', 'collect']))
        .map(([e, _]) => e)
    ).map(e => nextStage(trialStages, e.stage)),
    nextStage$
      .filter(s => includes(s, ['practice', 'real']))
      .mapTo<TrialStage>('act'),
    nextStage$
      .filter(s => includes(s, ['donePractice', 'doneReal']))
      .mapTo<TrialStage>('postReview'),
    oppAct$
      .compose(sc(state$))
      .filter(([_, s]) => (s.trial as TrialState).stage === 'postAct')
      .mapTo<TrialStage>('showOpp')
      .compose(delay(1000 / speedRatio)),
    button.event
      .compose(sc(state$))
      .filter(([_, s]) => s.stage === 'practice' && includes(s.trialNumber, practiceMemoryTrials) && s.trial!.stage !== 'memory'
        || s.stage === 'real' && includes(s.trialNumber, realMemoryTrials) && s.trial!.stage !== 'memory')
      .mapTo<TrialStage>('memory')
      .compose(delay(0))
  );
  oppAct$.imitate(xs.merge(
    // practice
    trialSetStage$
      .compose(sc(state$))
      .filter(([ts, s]) => ts === 'act' && includes(s.stage, ['tutorialButton', 'practice']))
      .compose(delay(200))
      .map(_ => randomUnif(-2, 2)),
    xs.merge(
      // paired
      nextStage$
        .filter(equals('paired'))
        .map(_ => xs.of(getOppReceiver('real', 1)).compose(delay(getActTime(1) * 1000 / speedRatio)))
        .flatten(),
      // collected
      trialStageDone$
        .compose(sc(state$))
        .filter(([e, s]) => e.stage === 'collect' && s.stage === 'real' && s.trialNumber !== nRealTrials)
        .map(([_, s]) => xs.of(getOppReceiver('real', s.trialNumber + 1)).compose(delay(getActTime(s.trialNumber + 1) * 1000 / speedRatio)))
        .flatten()
    ).map(or => {
      switch (or) {
        case 'self':
          return randomUnif(.8, 1.2);
        case 'opp':
          return randomUnif(minOppLambda, maxOppLambda);
        case 'discard':
          return randomUnif(-.1, .1);
      }
    })
  ));
  const trialOppAct$ = xs.merge(
    // oppAct
    oppAct$
      .compose(sc(state$))
      .filter(([_, s]) => includes(s.trial?.stage, ['preAct', 'act', 'postAct']))
      .map(([l, _]) => l),
    // new trial
    trialSetStage$
      .compose(sc(state$))
      .filter(([ts, s]) => ts === 'act' && s.oppLambda !== undefined)
      .map(([_, s]) => s.oppLambda as number)
  )
    .map<TrialEventIn>(lambda => ({ kind: 'oppAct', lambda }));

  const saveTrial$ = button.event
    .compose(sc(state$))
    .filter(([_, s]) => s.stage === 'real');
  const nextTrial$ = button.event
    .compose(sc(state$))
    .filter(([_, s]) => s.stage === 'practice' && s.trialNumber !== nPracticeTrials && (!includes(s.trialNumber, practiceMemoryTrials) || s.trial!.stage === 'memory')
      || s.stage === 'real' && s.trialNumber !== nRealTrials && (!includes(s.trialNumber, realMemoryTrials) || s.trial!.stage === 'memory'))
    .compose(delay(0));

  const startReal$ = nextStage$
    .filter(equals('paired'));

  const endGame$ = button.event
    .compose(sc(state$))
    .filter(([_, s]) => s.stage === 'doneReal');

  // children 2
  const trial = isolate(Trial, 'trial')({
    ...sources,
    props: state$.map(s => ({
      show: 'all',
      oppReceiver: getOppReceiver(s.stage, s.trialNumber)
    })),
    event: xs.merge(
      xs.merge(startGames$, startReal$, nextTrial$).map(_ => ({
        kind: 'newTrial',
        selfBoardConfig: generateConfig(),
        oppBoardConfig: generateConfig()
      })),
      trialSetStage$.map(stage => ({ kind: 'setStage', stage })),
      trialOppAct$,
      startReal$.mapTo({ kind: 'reset' })
    )
  });
  trialStageDone$.imitate(trial.event.filter(kindIs('stageDone')));

  // model
  const initR$ = xs.of(always<State>({
    stage: 'pairing',
    trialNumber: 1,
    readyForNext: false,
    minTotal: 0,
    maxTotal: 0,
    history: []
  }));
  const changeStageR$ = xs.merge(nextStage$, goToPreview$)
    .map(stage => strictR<State>(s => ({
      ...s,
      stage,
      readyForNext: false
    })));
  const readyR$ = xs.merge(
    startGames$
      .map(_ => xs.of(null).compose(delay(4 * secondRatio)))
      .flatten(),
    nextStage$
      .filter(includes(__, ['tutorialButton', 'donePractice', 'paired', 'doneReal']))
      .map(stage => xs.of(null).compose(delay(((<Partial<Record<Stage, number>>>{
        tutorialButton: 1,
        donePractice: includes(client.kind, ['mturk', 'prolific']) ? 5 : 2,
        paired: 2,
        doneReal: includes(client.kind, ['mturk', 'prolific']) ? 4 : 1
      })[stage] as number) * secondRatio)))
      .flatten(),
    trialStageDone$
      .filter(propEq('stage', 'collect'))
  )
    .mapTo<R<State>>(assoc('readyForNext', true));
  const saveTrialR$ = saveTrial$.mapTo(strictR<State>(s => ({
    ...s,
    history: append(makeTrialData(s), s.history)
  })));
  const nextTrialR$ = nextTrial$.mapTo(strictR<State>(s => ({
    ...s,
    trialNumber: s.trialNumber + 1,
    readyForNext: false
  })));
  const goToMemoryR$ = trialSetStage$
    .filter(equals('memory'))
    .mapTo<R<State>>(assoc('readyForNext', false));
  const bothTouchedR$ = trial.event.filter(kindIs('bothTouched'))
    .mapTo(strictR<State>(s => ({ ...s, readyForNext: s.trial!.stage === 'memory' ? true : s.readyForNext })));
  const addTotalR$ = trialStageDone$
    .compose(sc(state$))
    .filter(([ts, s]) => s.stage === 'real' && ts.stage === 'collect')
    .mapTo(strictR<State>(s => {
      const oppReceiver = getOppReceiver(s.stage, s.trialNumber);
      const selfMax = oppReceiver === 'self'
        ? (ps => ps.payoffSelf + ps.payoffOpp)(calcPayoffs(s.trial!.selfBoardConfig, 1))
        : calcPayoffs(s.trial!.selfBoardConfig, 0).payoffSelf;
      const selfMin = oppReceiver === 'self'
        ? (ps => ps.payoffSelf + ps.payoffOpp)(calcPayoffs(s.trial!.selfBoardConfig, 0))
        : calcPayoffs(s.trial!.selfBoardConfig, 1.2).payoffSelf;
      const opp = oppReceiver === 'opp'
        ? calcPayoffs(s.trial!.oppBoardConfig, s.trial!.oppLambda!).payoffOpp
        : 0;
      return {
        ...s,
        minTotal: s.minTotal + (selfMin + opp) * maxPayoff,
        maxTotal: s.maxTotal + (selfMax + opp) * maxPayoff
      };
    }));
  const oppActR$ = oppAct$.map(l => strictR<State>(assoc('oppLambda', l)));
  const resetOppLambdaR$ = trialSetStage$
    .filter(equals('collect'))
    .mapTo(strictR<State>(assoc('oppLambda', undefined)));
  const startRealR$ = startReal$.mapTo(strictR<State>(assoc('trialNumber', 1)));
  const bonusR$ = nextStage$
    .filter(equals('doneReal'))
    .mapTo(strictR<State>(s => ({ ...s, bonus: calcBonus(s) })));
  const endGameR$ = endGame$.mapTo(strictR<State>(s => ({
    ...s,
    readyForNext: false
  })));

  // view
  const canvas$ = xs.combine(state$, targets$).map<CanvasElement[]>(([s, t]) => {
    const practice = includes(s.stage, ['prePractice', 'tutorialButton', 'practice', 'donePractice', 'pairing', 'preview']);
    const roundCounter: CanvasElement[] = [{
      kind: 'rect',
      layer: 0,
      x: cRoundCounterX,
      y: cRoundCounterY,
      width: 150,
      height: practice ? 80 : 50,
      fill: white,
      stroke: grays[15],
      strokeWidth: 2,
      radius: 10
    }, {
      kind: 'text',
      layer: 1,
      x: cRoundCounterX,
      y: cRoundCounterY,
      text: `${practice ? 'Practice\n' : ''}Round ${s.trialNumber}/${practice ? nPracticeTrials : nRealTrials}`,
      textColor: grays[15],
      fontSize: 24
    }];
    const dim: CanvasElement = {
      kind: 'rect',
      layer: 7,
      x: dFullWidth / 2,
      y: dFullHeight / 2,
      width: dFullWidth,
      height: dFullHeight,
      fill: white.fade(.7)
    };
    const message: CanvasElement[] = (() => {
      const m = messages[s.stage];
      if (m) {
        if (m.kind === 'message') {
          return [
            dim,
            {
              kind: 'text',
              layer: 10,
              x: dFullWidth / 2,
              y: dFullHeight / 2 - 50,
              text: m.text(s),
              fontSize: fMsg,
              shape: {
                kind: 'rect',
                stroke: black,
                strokeWidth: dMsgStrokeWidth,
                fill: white,
                margin: dMsgInnerSep
              }
            }
          ] as CanvasElement[];
        } else {
          const target = find<Target<TargetName>>(propEq('name', m.targetName), t);
          if (target) {
            return prepend(
              dim,
              buildCallout(target, m.anchor, m.direction, m.sep, m.text(s))
            );
          } else {
            return [dim];
          }
        }
      } else {
        return [];
      }
    })();
    const memory: CanvasElement[] = s.trial!.stage === 'memory' ? [{
      kind: 'text',
      layer: 10,
      x: 400,
      y: 90,
      text: dedent`
        [b|**Memory Check**]
        Please reproduce the locations
        of the two handles.
      `,
      fontSize: fMsg,
      shape: {
        kind: 'rect',
        stroke: black,
        strokeWidth: dMsgStrokeWidth,
        fill: white,
        margin: dMsgInnerSep
      }
    }] : [];
    return unnest([roundCounter, message, memory]);
  });

  const endGameE$ = endGame$.mapTo<EventOut>({ kind: 'endGame' });

  return {
    state: xs.merge(initR$, changeStageR$, readyR$, saveTrialR$, nextTrialR$, goToMemoryR$, bothTouchedR$, addTotalR$,
      oppActR$, resetOppLambdaR$, startRealR$, bonusR$, endGameR$, <SRS>button.state, <SRS>trial.state),
    canvas: xs.combine(canvas$, button.canvas, trial.canvas).map(flatten),
    event: endGameE$
  };
}
