import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import { always, concat, find, flatten, map, propEq, unnest, update } from 'ramda';
import xs, { Stream as S } from 'xstream';
import delay from 'xstream/extra/delay';
import sc from 'xstream/extra/sampleCombine';
import { black, grays, white } from '../colors';
import { cBoardY, cOppBoardX, cSelfBoardX, cSelfIconY, dArrowLength, dBoardSize, dFullHeight, dFullWidth, dMsgInnerSep, dMsgStrokeWidth, fMsg, secondRatio } from '../config';
import { CanvasElement, CanvasMouseEvent, HAnchor, VAnchor } from '../drivers/canvas';
import { kindIs, renameTargets, rotateVector, Show, strictR, Target, vectorLength } from '../utils';
import { Stage as AppStage } from './app';
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

type SRS = S<R<State>>

interface Step {
  name: string;
  trialShow: Show<TrialUnit>;
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
      text: 'In this tutorial,\nuse these two buttons\nto step forward/backward.',
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
      text: 'In this experiment,\nyou are the [self b|red] player.',
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
      text: 'You will play a multi-round game\nwith a [opp b|blue] player (we will call it [opp|Blue]).\n[opp|Blue] also starts with a total reward of $0.00.',
      anchor: 'sw',
      direction: 'ne'
    },
    proceed: {
      kind: 'wait',
      duration: 4
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
      kind: 'nextStage'
    },
    message: {
      kind: 'callout',
      targetName: 'selfSlider',
      sep: -40,
      text: 'There is a [b|curve] on the board.\nNow click somewhere on the curve.',
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
      text: 'The curve is actually a slider track.\nNow try sliding the “handle” along the track.',
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
      text: 'The [b|horizontal] location of the handle\ncorresponds to a [self b|reward for you],\nwhich is proportional to the length of the [self b|red bar].\nNow slide the handle to see how the reward changes.',
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
      text: 'The [b|vertical] location of the handle\ncorresponds to a [opp b|reward for Blue],\nwhich is proportional to the length of the [opp b|blue bar].\nNow slide the handle to see how the reward changes.',
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
      text: 'Now slide the handle to see\nhow both rewards change simultaneously.',
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
      text: 'Slide the handle to the position\nwhere the [b|two rewards] look the best to you.\nAfter that, click the “Confirm” button.',
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'event',
      predicate: kindIs('stageDone')
    },
    trialEventEnd: {
      kind: 'nextStage'
    }
  }, {
    name: 'oppBoard',
    trialShow: ['selfIcon', 'selfTotal', 'oppIcon', 'oppTotal', 'selfBoard', 'selfSlider', 'selfSelfPay', 'selfOppPay', 'confirmButton', 'oppBoard'],
    message: {
      kind: 'callout',
      targetName: 'oppBoard',
      sep: 10,
      text: '[opp|Blue] also has a board\nand a slider in front of them.\nThe same time [self|you] decide\nthe location of [self|your handle],\n[opp|Blue] also needs to decide\nthe location of [opp|their handle].',
      anchor: 'w',
      direction: 'e'
    },
    proceed: {
      kind: 'wait',
      duration: 5
    }
  }, {
    name: 'oppThinking',
    trialShow: 'all',
    message: {
      kind: 'callout',
      targetName: 'oppStatus',
      sep: 5,
      text: 'When [opp|Blue] is thinking,\nthis icon will be displayed.',
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
      text: 'When [opp|Blue] has made a decision,\nthe icon will change to a check mark.',
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
      kind: 'nextStage'
    },
    message: {
      kind: 'callout',
      targetName: 'oppThumb',
      sep: 10,
      text: 'The location of [opp|Blue]’s handle also corresponds to\na [opp|reward for Blue] and a [self|reward for you].\nWhen [self|you] are making your decision,\nyou don’t see [opp|Blue]’s decision.\n' +
        'Similarly, when [opp|Blue] is making their decision,\nthey don’t see [self|your] decision.',
      anchor: 'w',
      direction: 'e'
    },
    proceed: {
      kind: 'wait',
      duration: 6
    }
  }, {
    name: 'collect',
    trialShow: 'all',
    trialEventStart: {
      kind: 'nextStage'
    },
    message: {
      kind: 'message',
      x: 400,
      y: 100,
      text: 'After [opp|Blue]’s decision is revealed to [self|you]\n(and [self|your] decision is revealed to [opp|Blue]),\n' +
        'the 4 rewards will be added\nto [self|your total] and [opp|Blue’s total].',
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
      kind: 'nextStage'
    },
    message: {
      kind: 'callout',
      targetName: 'oppThumb',
      sep: 5,
      text: 'After the rewards are collected,\nyou can drag [opp|Blue’s handle] to see\nwhat options have been available to them.\nOnce you release the mouse,\nthe handle will return to [opp|Blue’s actual decision].\nYou can do the same thing with [self|your handle].\nNow try dragging [opp|Blue’s handle].',
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
      kind: 'nextStage'
    },
    message: {
      kind: 'callout',
      targetName: 'selfTotal',
      sep: 0,
      text: 'At the end of the experiment,\nyou will be given a [b|real monetary bonus]\naccording to your total reward\n(not the exact amount, but a transformation of it).\nThe higher your total reward is,\nthe higher your bonus will be.',
      anchor: 'ne',
      direction: 'sw'
    },
    proceed: {
      kind: 'wait',
      duration: 6
    }
  }, {
    name: 'recap',
    trialShow: 'all',
    message: {
      kind: 'message',
      x: dFullWidth / 2,
      y: dFullHeight / 2 - 50,
      text: 'To recap, in every round,\n[self|you] (1) make a decision on [self|your slider],\n(2) click “Confirm”,\n(3) see [opp|Blue]’s decision on [opp|their slider],\n(4) see the 4 rewards collected,\n(5) review the available options for [self|you] and for [opp|Blue],\nand (6) go to the next round.',
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
      text: 'The [b|locations] of [self|your slider] and [opp|Blue’s slider] change from round to round,\nwhich means the possible combinations of the [self|reward for you]\nand the [opp|reward for blue] are different across rounds.\nSo pay attention to how the actual rewards\ncompare with the available options [b|in each round].',
      anchor: 'c',
      dim: true
    },
    proceed: {
      kind: 'wait',
      duration: 6
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
  const actualAnchorShiftX = -anchorShiftX * target.width / 2
  const actualAnchorShiftY = -anchorShiftY * target.height / 2
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
    .filter((e): e is TrialEventIn => e !== undefined)
  const trialEventEnd$ = xs.create<TrialEventIn>();
  const trial = isolate(Trial, 'trial')({
    ...sources,
    props: currentStep$.map(s => ({ show: s.trialShow })),
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
        return kindIs('event')(proceed) && proceed.predicate(e)
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
  }
}
