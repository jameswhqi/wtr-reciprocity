import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import dedent from 'dedent';
import { always, concat, find, flatten, includes, map, propEq, unnest, update } from 'ramda';
import xs, { Stream as S } from 'xstream';
import delay from 'xstream/extra/delay';
import sc from 'xstream/extra/sampleCombine';
import { black, grays, white } from '../colors';
import { cBoardY, cOppBoardX, cSelfBoardX, cSelfIconY, dArrowLength, dBoardSize, dFullHeight, dFullWidth, dMsgInnerSep, dMsgStrokeWidth, fMsg, secondRatio } from '../config';
import { CanvasElement, CanvasMouseEvent, HAnchor, VAnchor } from '../drivers/canvas';
import { client } from '../drivers/client';
import { kindIs, renameTargets, rotateVector, Show, strictR, Target, vectorLength } from '../utils';
import { Stage as AppStage } from './app';
import { PayoffReceiver } from './board';
import { Button, State as ButtonState, TargetName as ButtonTargetName } from './button';
import { EventIn as TrialEventIn, EventOut as TrialEventOut, State as TrialState, TargetName as TrialTargetName, Trial, Unit as TrialUnit } from './trial';

interface Props {
  appStage: AppStage;
}
export interface EventIn {
  kind: 'startTutorial';
}
export interface State {
  trial?: TrialState;
  prevButton?: ButtonState;
  nextButton?: ButtonState;
  step: number;
  readyForNext: boolean;
  trialStates: Partial<TrialState[]>;
  visited: boolean[];
}
interface EventOut {
  kind: 'endTutorial';
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

interface Step {
  name: string;
  trialShow: Show<TrialUnit>;
  oppReceiver?: PayoffReceiver;
  trialEventStart?: TrialEventIn;
  message: Message | Callout;
  proceed: ProceedAfterWait | ProceedOnEvent;
  trialEventEnd?: TrialEventIn;
}
export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type Anchor = Direction | 'c';
interface Message {
  kind: 'message';
  x: number;
  y: number;
  text: string;
  anchor: Anchor;
  dim: boolean;
}
type TargetName = TrialTargetName | 'prevButton' | 'nextButton';
interface Callout {
  kind: 'callout';
  targetName: TargetName;
  sep: number;
  text: string;
  anchor: Anchor;
  direction: Direction;
}
interface ProceedAfterWait {
  kind: 'wait';
  duration: number;
}
interface ProceedOnEvent {
  kind: 'event';
  predicate: (e: TrialEventOut) => boolean;
}

const steps: Step[] =
  [{
    name: 'stepButtons',
    trialShow: 'none',
    trialEventStart: {
      kind: 'newTrial',
      selfBoardConfig: { vertexSelf: .5, vertexOpp: .5, scale: .3 },
      oppBoardConfig: { vertexSelf: .5, vertexOpp: .5, scale: .3 }
    },
    message: {
      kind: 'callout',
      targetName: 'prevButton',
      sep: 10,
      text: dedent`
        In this tutorial,
        use these two buttons
        to step forward/backward.
      `,
      anchor: 'nw',
      direction: 'se'
    },
    proceed: {
      kind: 'wait',
      duration: 0
    }
  }, {
    name: 'selfIcon',
    trialShow: ['selfIcon'],
    message: {
      kind: 'callout',
      targetName: 'selfIcon',
      sep: 0,
      text: dedent`
        In this experiment,
        you are the [self b|red] player.
      `,
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'wait',
      duration: 1.5
    }
  }, {
    name: 'selfTotal',
    trialShow: ['selfIcon', 'selfTotal'],
    message: {
      kind: 'callout',
      targetName: 'selfTotal',
      sep: 0,
      text: 'You start with a total reward of $0.00.',
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'wait',
      duration: 1.5
    }
  }, {
    name: 'oppIcon',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal'],
    message: {
      kind: 'callout',
      targetName: 'oppIcon',
      sep: 0,
      text: dedent`
        You will play a multi-round game
        with a [opp b|blue] player (we will call it [opp|Blue]).
        [opp|Blue] also starts with a total reward of $0.00,
        but their total is hidden from you.
        [opp|Blue] will be a person randomly paired with you,
        and they walk through exactly the same tutorial
        as you do now.
      `,
      anchor: 'sw',
      direction: 'ne'
    },
    proceed: {
      kind: 'wait',
      duration: 5
    }
  }, {
    name: 'board',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard'],
    message: {
      kind: 'callout',
      targetName: 'selfBoard',
      sep: 10,
      text: 'There is a [b|board] in front of you.',
      anchor: 'e',
      direction: 'w'
    },
    proceed: {
      kind: 'wait',
      duration: 1
    }
  }, {
    name: 'curve',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider'],
    trialEventStart: {
      kind: 'setStage',
      stage: 'act'
    },
    message: {
      kind: 'callout',
      targetName: 'selfSlider',
      sep: -40,
      text: dedent`
        There is a [b|curve] on the board.
        Now click somewhere on the curve.
      `,
      anchor: 'e',
      direction: 'w'
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('selfTouched')
    }
  }, {
    name: 'thumb',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider'],
    message: {
      kind: 'callout',
      targetName: 'selfThumb',
      sep: 5,
      text: dedent`
        The curve is actually a slider track.
        Now try sliding the “handle” along the track.
      `,
      anchor: 'e',
      direction: 'w'
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('selfTouched')
    }
  }, {
    name: 'selfSelfPay',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider', 'selfSelfPay'],
    message: {
      kind: 'callout',
      targetName: 'selfSelfBarNumber',
      sep: 10,
      text: dedent`
        The [b|horizontal] location of the handle
        corresponds to a [self b|reward for you],
        which is proportional to the length of the [self b|red bar].
        Now slide the handle to see how the reward changes.
      `,
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('selfTouched')
    }
  }, {
    name: 'selfOppPay',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider', 'selfOppPay'],
    message: {
      kind: 'callout',
      targetName: 'selfOppBarNumber',
      sep: 10,
      text: dedent`
        The [b|vertical] location of the handle
        corresponds to a [opp b|reward for Blue],
        which is proportional to the length of the [opp b|blue bar].
        Now slide the handle to see how the reward changes.
      `,
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('selfTouched')
    }
  }, {
    name: 'selfPays',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider', 'selfSelfPay', 'selfOppPay'],
    message: {
      kind: 'message',
      x: cSelfBoardX + dBoardSize / 2 + 20,
      y: cBoardY,
      text: dedent`
        Now slide the handle to see
        how both rewards change simultaneously.
      `,
      anchor: 'w',
      dim: false
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('selfTouched')
    }
  }, {
    name: 'confirm',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider', 'selfSelfPay', 'selfOppPay', 'confirmButton'],
    message: {
      kind: 'callout',
      targetName: 'confirmButton',
      sep: 10,
      text: dedent`
        Slide the handle to the position
        where the [b|two rewards] look the best to you.
        After that, click the “Confirm” button.
      `,
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('stageDone')
    },
    trialEventEnd: {
      kind: 'setStage',
      stage: 'postAct'
    }
  }, {
    name: 'oppBoard',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider', 'selfSelfPay', 'selfOppPay', 'confirmButton', 'oppBoard'],
    message: {
      kind: 'callout',
      targetName: 'oppBoard',
      sep: 10,
      text: dedent`
        [opp|Blue] also has a board
        and a slider in front of them.
        The same time [self|you] decide
        the location of [self|your handle],
        [opp|Blue] also needs to decide
        the location of [opp|their handle].
      `,
      anchor: 'w',
      direction: 'e'
    },
    proceed: {
      kind: 'wait',
      duration: 4
    }
  }, {
    name: 'oppThinking',
    trialShow: 'all',
    message: {
      kind: 'callout',
      targetName: 'oppStatus',
      sep: 5,
      text: dedent`
        When [opp|Blue] is thinking,
        this icon will be displayed.
      `,
      anchor: 'sw',
      direction: 'ne'
    },
    proceed: {
      kind: 'wait',
      duration: 1.5
    }
  }, {
    name: 'oppDecided',
    trialShow: 'all',
    trialEventStart: {
      kind: 'oppAct',
      lambda: 0
    },
    message: {
      kind: 'callout',
      targetName: 'oppStatus',
      sep: 5,
      text: dedent`
        When [opp|Blue] has made a decision,
        the icon will change to a check mark.
      `,
      anchor: 'sw',
      direction: 'ne'
    },
    proceed: {
      kind: 'wait',
      duration: 2
    }
  }, {
    name: 'oppChoose',
    trialShow: 'all',
    trialEventStart: {
      kind: 'setStage',
      stage: 'showOpp'
    },
    message: {
      kind: 'callout',
      targetName: 'oppThumb',
      sep: 10,
      text: dedent`
        The location of [opp|Blue]’s handle also corresponds to
        a [opp|reward for Blue] and a [self|reward for you].
        When [self|you] are making your decision,
        you don’t see [opp|Blue]’s decision.
        Similarly, when [opp|Blue] is making their decision,
        they don’t see [self|your] decision.
      `,
      anchor: 'w',
      direction: 'e'
    },
    proceed: {
      kind: 'wait',
      duration: 5
    }
  }, {
    name: 'collect',
    trialShow: 'all',
    trialEventStart: {
      kind: 'setStage',
      stage: 'collect'
    },
    message: {
      kind: 'message',
      x: 400,
      y: 100,
      text: dedent`
        After [opp|Blue]’s decision is revealed to [self|you]
        (and [self|your] decision is revealed to [opp|Blue]),
        the 4 rewards will be added
        to [self|your total] and [opp|Blue’s total].
      `,
      anchor: 'c',
      dim: false
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('stageDone')
    }
  }, {
    name: 'review',
    trialShow: 'all',
    trialEventStart: {
      kind: 'setStage',
      stage: 'review'
    },
    message: {
      kind: 'callout',
      targetName: 'oppThumb',
      sep: 5,
      text: dedent`
        After the rewards are collected,
        you can drag [opp|Blue’s handle] to see
        what options have been available to them.
        Once you release the mouse,
        the handle will return to [opp|Blue’s actual decision].
        You can do the same thing with [self|your handle].
        Now try dragging [opp|Blue’s handle].
      `,
      anchor: 'w',
      direction: 'e'
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('oppTouched')
    }
  }, {
    name: 'bonus',
    trialShow: 'all',
    trialEventStart: {
      kind: 'setStage',
      stage: 'postReview'
    },
    message: {
      kind: 'callout',
      targetName: 'selfTotal',
      sep: 0,
      text: includes(client.kind, ['mturk', 'prolific']) ? dedent`
        At the end of the experiment,
        you will be given a [b|real monetary bonus]
        according to your total reward
        (not the exact amount, but a transformation of it).
        The higher your total reward is,
        the higher your bonus will be.
      ` : dedent`
        The total reward you accumulate
        will not become any real-world reward,
        but try to imagine that [self|your total reward] and [opp|Blue’s total reward]
        will actually be given to [self|you] and to [opp|Blue], respectively.
      `,
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'wait',
      duration: 5
    }
  }, {
    name: 'recap',
    trialShow: 'all',
    message: {
      kind: 'message',
      x: dFullWidth / 2,
      y: dFullHeight / 2 - 50,
      text: dedent`
        To recap, in every round,
        [self|you] (1) make a decision on [self|your slider],
        (2) click “Confirm”,
        (3) see [opp|Blue]’s decision on [opp|their slider],
        (4) see the 4 rewards collected,
        (5) review the available options for [self|you] and for [opp|Blue],
        and (6) go to the next round.
      `,
      anchor: 'c',
      dim: true
    },
    proceed: {
      kind: 'wait',
      duration: 6
    }
  }, {
    name: 'sliderLocation',
    trialShow: 'all',
    message: {
      kind: 'message',
      x: dFullWidth / 2,
      y: dFullHeight / 2 - 50,
      text: dedent`
        The [b|locations] of [self|your slider] and [opp|Blue’s slider] change from round to round,
        which means the possible combinations of the [self|reward for you]
        and the [opp|reward for blue] are different across rounds.
        So pay attention to how the actual rewards
        compare with the available options [b|in each round].
      `,
      anchor: 'c',
      dim: true
    },
    proceed: {
      kind: 'wait',
      duration: 6
    }
  }, {
    name: 'special',
    trialShow: 'all',
    message: {
      kind: 'message',
      x: dFullWidth / 2,
      y: dFullHeight / 2 - 50,
      text: dedent`
        There are 3 types of [b|special rounds] interspersed among all the rounds,
        which are explained in the next 3 steps of this tutorial.
      `,
      anchor: 'c',
      dim: true
    },
    proceed: {
      kind: 'wait',
      duration: 2
    }
  }, {
    name: 'discardOpp',
    trialShow: 'all',
    oppReceiver: 'discard',
    message: {
      kind: 'callout',
      targetName: 'selfOppBarNumber',
      sep: 10,
      text: dedent`
        In the first type of special rounds,
        the color of the “vertical” reward will be [b discard|gray],
        which indicates that this reward will be [b|discarded]
        instead of being given to [opp|Blue].
        The same thing will happen to [opp|Blue’s board].
      `,
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'wait',
      duration: 5
    }
  }, {
    name: 'oppToSelf',
    trialShow: 'all',
    oppReceiver: 'self',
    message: {
      kind: 'callout',
      targetName: 'selfOppBarNumber',
      sep: 10,
      text: dedent`
        In the second type of special rounds,
        the color of the “vertical” reward will be [b self|red],
        which indicates that this reward will be given to [b self|you] instead of [opp|Blue],
        in addition to the usual “horizontal” reward.
        The same thing will happen to [opp|Blue’s board].
      `,
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'wait',
      duration: 5
    }
  }, {
    name: 'memory1',
    trialShow: 'all',
    message: {
      kind: 'message',
      x: dFullWidth / 2,
      y: dFullHeight / 2 - 50,
      text: dedent`
        In the third type of special rounds (called [b|Memory Checks]), after you click “Next round”,
        you will be asked to reproduce the locations of [self|your handle] and [opp|Blue’s handle] on the sliders.
        The reproduced locations don’t have to be exactly the same as the true locations,
        but try to be as close as possible to what you remember.
        [b|We reserve the right to reject your data if the errors in the reproductions are too large.]
        [opp|Blue] has the same [b|Memory Check] rounds as you.
      `,
      anchor: 'c',
      dim: true
    },
    proceed: {
      kind: 'wait',
      duration: 8
    }
  }, {
    name: 'memory2',
    trialShow: 'all',
    trialEventStart: {
      kind: 'setStage',
      stage: 'memory'
    },
    message: {
      kind: 'message',
      x: 400,
      y: 100,
      text: dedent`
        Now try to reproduce the locations
        of the two handles you just saw.
        (This one doesn’t count.)
      `,
      anchor: 'c',
      dim: false
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('bothTouched')
    }
  }];

const cStepCounterX = 100;
const cStepCounterY = 75;

function calcAnchor(a: Anchor): [HAnchor, VAnchor, number, number] {
  switch (a) {
    case 'n':
      return ['c', 'n', 0, 1];
    case 'ne':
      return ['r', 'n', -1, 1];
    case 'e':
      return ['r', 'c', -1, 0];
    case 'se':
      return ['r', 's', -1, -1];
    case 's':
      return ['c', 's', 0, -1];
    case 'sw':
      return ['l', 's', 1, -1];
    case 'w':
      return ['l', 'c', 1, 0];
    case 'nw':
      return ['l', 'n', 1, 1];
    case 'c':
      return ['c', 'c', 0, 0];
  }
}

export function buildCallout<T extends string>(target: Target<T>, anchor: Anchor, direction: Direction, sep: number, text: string): CanvasElement[] {
  const [_1, _2, anchorShiftX, anchorShiftY] = calcAnchor(anchor);
  const [hAnchor, vAnchor, dirShiftX, dirShiftY] = calcAnchor(direction);
  const actualAnchorShiftX = -anchorShiftX * target.width / 2;
  const actualAnchorShiftY = -anchorShiftY * target.height / 2;
  const [rotatedAnchorShiftX, rotatedAnchorShiftY] = target.rotate
    ? rotateVector(actualAnchorShiftX, actualAnchorShiftY, target.rotate)
    : [actualAnchorShiftX, actualAnchorShiftY];
  const dirShiftLength = vectorLength(dirShiftX, dirShiftY);
  const arrowEndX = target.x + rotatedAnchorShiftX + sep * dirShiftX / dirShiftLength;
  const arrowEndY = target.y + rotatedAnchorShiftY + sep * dirShiftY / dirShiftLength;
  const arrowStartX = arrowEndX + dArrowLength * dirShiftX / dirShiftLength;
  const arrowStartY = arrowEndY + dArrowLength * dirShiftY / dirShiftLength;
  return [{
    kind: 'arrow',
    layer: 10,
    x: arrowStartX,
    y: arrowStartY,
    endX: arrowEndX,
    endY: arrowEndY,
    stroke: black,
    strokeWidth: dMsgStrokeWidth,
    fill: black
  }, {
    kind: 'text',
    layer: 10,
    x: arrowStartX + dirShiftX * dMsgInnerSep,
    y: arrowStartY + dirShiftY * dMsgInnerSep,
    text: text,
    hAnchor, vAnchor,
    fontSize: fMsg,
    shape: {
      kind: 'rect',
      stroke: black,
      strokeWidth: dMsgStrokeWidth,
      fill: white,
      margin: dMsgInnerSep
    }
  }];
}

export function Tutorial(sources: Sources): Sinks {
  // intent 1
  const state$ = sources.state.stream;
  const props$ = sources.props;
  const ps$ = xs.combine(props$, state$);
  const currentStep$ = state$.map(s => steps[s.step]);
  const startTutorial$ = sources.event;

  // children 1
  const prevButton = isolate(Button, 'prevButton')({
    ...sources,
    props: state$.map(s => ({
      show: s.readyForNext,
      x: cOppBoardX - 70,
      y: cSelfIconY,
      width: 120,
      height: 50,
      text: 'Previous'
    }))
  });
  const nextButton = isolate(Button, 'nextButton')({
    ...sources,
    props: ps$.map(([p, s]) => ({
      show: s.readyForNext && (s.step !== steps.length - 1 || p.appStage === 'tutorial'),
      x: cOppBoardX + 70,
      y: cSelfIconY,
      width: 120,
      height: 50,
      text: s.step === steps.length - 1 ? 'Finish' : 'Next'
    }))
  });

  // intent 2
  const endTutorial$ = nextButton.event
    .compose(sc(state$))
    .filter(([_, s]) => s.step === steps.length - 1);
  const prevStep$ = prevButton.event;
  const firstStep$ = xs.merge(startTutorial$, endTutorial$).mapTo([0, steps[0]] as const);
  const nextStep$ = nextButton.event
    .compose(sc(state$))
    .filter(([_, s]) => s.step < steps.length - 1)
    .map(([_, s]) => [s.step + 1, steps[s.step + 1]] as const);

  // children 2
  const trialEventStart$ = xs.merge(firstStep$, nextStep$)
    .map(([_, s]) => s.trialEventStart)
    .filter((e): e is TrialEventIn => e !== undefined);
  const trialEventEnd$ = xs.create<TrialEventIn>();
  const trial = isolate(Trial, 'trial')({
    ...sources,
    props: currentStep$.map(s => ({
      show: s.trialShow,
      oppReceiver: s.oppReceiver || 'opp'
    })),
    event: xs.merge(
      trialEventStart$,
      trialEventEnd$,
      endTutorial$.mapTo({ kind: 'reset' })
    )
  });

  // intent 3
  const waited$ = xs.merge(firstStep$, nextStep$)
    .filter(([_, step]) => kindIs('wait')(step.proceed))
    .compose(sc(state$))
    .map(([[i, step], s]) => xs.of(null).compose(delay(s.visited[i] ? 0 : (step.proceed as ProceedAfterWait).duration * secondRatio)))
    .flatten();
  const proceed$ = xs.merge(
    trial.event
      .compose(sc(state$))
      .filter(([e, s]) => {
        const proceed = steps[s.step].proceed;
        return kindIs('event')(proceed) && proceed.predicate(e);
      })
      .mapTo(null),
    waited$
  );
  trialEventEnd$.imitate(proceed$
    .compose(sc(state$))
    .filter(([_, s]) => !s.readyForNext)
    .map(([_, s]) => steps[s.step].trialEventEnd)
    .filter((e): e is TrialEventIn => e !== undefined)
  );

  const targets$ = xs.combine(prevButton.value, nextButton.value, trial.value)
    .map(([pv, nv, tv]) => unnest([
      renameTargets<ButtonTargetName, TargetName>({
        button: 'prevButton'
      }, pv.targets),
      renameTargets<ButtonTargetName, TargetName>({
        button: 'nextButton'
      }, nv.targets),
      tv.targets
    ]));

  // model
  const initR$ = xs.of(always<State>({
    step: 0,
    readyForNext: false,
    trialStates: map(always(undefined), steps),
    visited: map(always(false), steps)
  }));
  const startTutorialR$ = startTutorial$
    .mapTo(strictR<State>(s => ({
      ...s,
      step: 0,
      readyForNext: false,
      trialStates: map(always(undefined), steps),
      visited: map(always(false), steps)
    })));
  const nextStepR$ = nextStep$
    .mapTo(strictR<State>(s => ({ ...s, step: s.step + 1, readyForNext: false })));
  const readyForNextR$ = proceed$
    .mapTo(strictR<State>(s => ({
      ...s,
      readyForNext: true,
      trialStates: update(s.step, s.trial, s.trialStates),
      visited: update(s.step, true, s.visited)
    })));
  const prevStepR$ = prevStep$
    .mapTo(strictR<State>(s => {
      if (s.step === 0) {
        return s;
      } else {
        return {
          ...s,
          step: s.step - 1,
          trial: s.trialStates[s.step - 1]
        };
      }
    }));
  const endTutorialR$ = endTutorial$
    .mapTo(strictR<State>(s => ({
      ...s,
      step: 0,
      readyForNext: false,
      trialStates: map(always(undefined), steps)
    })));

  // view
  const canvas$ = xs.combine(state$, targets$).map<CanvasElement[]>(([s, t]) => {
    const stepCounter: CanvasElement[] = [{
      kind: 'rect',
      layer: 8,
      x: cStepCounterX,
      y: cStepCounterY,
      width: 110,
      height: 75,
      fill: white,
      stroke: grays[15],
      strokeWidth: 2,
      radius: 10
    }, {
      kind: 'text',
      layer: 9,
      x: cStepCounterX,
      y: cStepCounterY - 13,
      text: 'Tutorial',
      textColor: grays[15],
      fontSize: 24
    }, {
      kind: 'text',
      layer: 9,
      x: cStepCounterX,
      y: cStepCounterY + 15,
      text: `Step ${s.step + 1}/${steps.length}`,
      textColor: grays[15],
      fontSize: 18
    }];
    const m = steps[s.step].message;
    switch (m.kind) {
      case 'message': {
        const [hAnchor, vAnchor, shiftX, shiftY] = calcAnchor(m.anchor);
        return unnest<CanvasElement[][]>([
          stepCounter,
          [{
            kind: 'text',
            layer: 10,
            x: m.x + shiftX * dMsgInnerSep,
            y: m.y + shiftY * dMsgInnerSep,
            text: m.text,
            hAnchor, vAnchor,
            fontSize: fMsg,
            shape: {
              kind: 'rect',
              stroke: black,
              strokeWidth: dMsgStrokeWidth,
              fill: white,
              margin: dMsgInnerSep
            }
          }],
          m.dim ? [{
            kind: 'rect',
            layer: 7,
            x: dFullWidth / 2,
            y: dFullHeight / 2,
            width: dFullWidth,
            height: dFullHeight,
            fill: white.fade(.7)
          }] : []
        ]);
      }
      case 'callout': {
        const target = find<Target<TargetName>>(propEq('name', m.targetName), t);
        if (target) {
          return concat(
            stepCounter,
            buildCallout(target, m.anchor, m.direction, m.sep, m.text)
          );
        } else {
          return stepCounter;
        }
      }
    }
  });
  const endTutorialE$ = endTutorial$.mapTo<EventOut>({ kind: 'endTutorial' });

  return {
    state: xs.merge(initR$, startTutorialR$, nextStepR$, readyForNextR$, prevStepR$, endTutorialR$, <SRS>prevButton.state, <SRS>nextButton.state, <SRS>trial.state),
    canvas: xs.combine(canvas$, prevButton.canvas, nextButton.canvas, trial.canvas).map(flatten),
    event: endTutorialE$
  };
}
