import { ColorHelper } from 'csx';
import {
  append, equals, forEach, init, last, map, max, mergeAll, mergeRight, nth, pick, prop, propEq,
  reduce, sortBy, sum, until, zip
} from 'ramda';
import { style } from 'typestyle';
import xs, { Listener, Stream as S } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sampleCombine from 'xstream/extra/sampleCombine';
import { defaultFontFamily, dFullHeight, dFullWidth, hDiscard, hOpp, hSelf } from '../config';
import { images } from '../images';
import { Stencil, StencilName, stencils } from '../stencils';
import { hashCode, listMin, rectCorner, rotateVector, vectorLength } from '../utils';

type Ctx = CanvasRenderingContext2D;

export interface CanvasConfig {
  show: boolean;
}

export interface CanvasData {
  config: CanvasConfig;
  elements: CanvasElement[];
}

interface BaseElement {
  name?: string;
  layer: number;
  x: number;
  y: number;
  rotate?: number;
}

interface Shadow {
  color: ColorHelper;
  blur: number;
  offsetX: number;
  offsetY: number;
}

interface ShapeProps {
  stroke?: ColorHelper;
  strokeWidth?: number;
  fill?: ColorHelper;
  lineDash?: number[];
  shadow?: Shadow;
}

type Shape = BaseElement & ShapeProps;

interface Rect extends Shape, Region {
  kind: 'rect';
  radius?: number;
}

interface Circle extends Shape {
  kind: 'circle';
  size: number;
}

interface Ellipse extends Shape {
  kind: 'ellipse';
  radiusX: number;
  radiusY: number;
}

interface Line extends Shape {
  kind: 'line';
  endX: number;
  endY: number;
}

interface Arrow extends Shape {
  kind: 'arrow';
  endX: number;
  endY: number;
  arrowSize?: number;
}

interface Bezier extends Shape {
  kind: 'bezier';
  cp1X: number;
  cp1Y: number;
  cp2X: number;
  cp2Y: number;
  endX: number;
  endY: number;
}

interface Image extends BaseElement {
  kind: 'image';
  image: string;
  width?: number;
  height?: number;
}

interface ComplexShape extends Shape {
  kind: 'complex';
  stencil: StencilName;
  width?: number;
  height?: number;
  rotate?: number;
}

export type CanvasElement = Rect | Circle | Ellipse | Line | Arrow | Bezier | Text | Image | ComplexShape;

export type MouseEventKind = 'mousemove' | 'mouseup' | 'mousedown';

export interface CanvasMouseEvent {
  kind: MouseEventKind;
  x: number;
  y: number;
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FullRegion extends Region {
  nwX: number;
  nwY: number;
  seX: number;
  seY: number;
}

export interface Text extends BaseElement {
  kind: 'text';
  text: string;
  fontSize: number;
  fontFamily?: string;
  align?: 'l' | 'c' | 'r';
  hAnchor?: HAnchor;
  vAnchor?: VAnchor;
  textColor?: ColorHelper;
  lineSkip?: number;
  lineSpacing?: number;
  width?: number;
  shape?: TextShape;
}
export type HAnchor = 'l' | 'c' | 'r';
export type VAnchor = 'n' | 'f' | 'c' | 'l' | 's';

interface TextRect {
  kind: 'rect';
  margin?: number;
  radius?: number;
}

type TextShape = TextRect & ShapeProps;

interface TextFragment {
  text: string;
  font: string;
  textColor: string;
  metrics: TextMetrics;
}

interface TextStyle {
  textColor?: ColorHelper;
  fontFamily?: string;
  fontSize?: number;
  fontSizeRatio?: number;
  fontStretch?: string;
  fontStyle?: string;
  fontWeight?: string;
}

type Path = (e: Shape) => void;

const canvasContainerClass = style({ margin: 'auto' });
const canvasClass = style({
  backgroundColor: '#fafafa',
  width: '100%',
  height: '100%'
});

const canvasContainer = document.querySelector('#canvasContainer') as HTMLElement;
canvasContainer.classList.add(canvasContainerClass);
const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
canvas.classList.add(canvasClass);
export const ctx = canvas.getContext('2d') as Ctx;
const dpr = window.devicePixelRatio || 1;
resizeCanvas();
canvas.width = dFullWidth * dpr;
canvas.height = dFullHeight * dpr;
ctx.scale(dpr, dpr);
const draw = makeDraw();

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
  const scale = listMin([window.innerWidth / dFullWidth, window.innerHeight / dFullHeight, 1]);
  canvasContainer.style.width = `${dFullWidth * scale}px`;
  canvasContainer.style.height = `${dFullHeight * scale}px`;
}

export function CanvasDriver(canvasData$: S<CanvasData>): S<CanvasMouseEvent> {
  let canvasLeft: number;
  let canvasTop: number;

  const config$ = canvasData$.map(prop('config')).compose(dropRepeats(equals));

  config$.addListener({
    next(config: CanvasConfig): void {
      canvasContainer.hidden = !config.show;
    }
  });

  const elements$ = xs.periodic(20)
    .compose(sampleCombine(canvasData$))
    .map(nth(1))
    .compose(dropRepeats(equals))
    .map(prop('elements'));

  elements$.addListener({
    next(elements: Array<CanvasElement>): void {
      ctx.clearRect(0, 0, dFullWidth, dFullHeight);
      ctx.imageSmoothingEnabled = false;
      forEach(draw, sortBy(prop('layer'), elements));
    }
  });

  return config$
    .map(prop('show'))
    .compose(dropRepeats())
    .map(show => {
      if (show) {
        const makeMouseEventProducer = () => {
          const events = ['mousemove', 'mouseup', 'mousedown'];
          let eventListeners: Array<EventListener>;

          return {
            start(streamListener: Listener<CanvasMouseEvent>): void {
              const addListener = (kind: MouseEventKind) => {
                const eventListener = (event: MouseEvent) => {
                  const canvasRect = canvas.getBoundingClientRect();
                  streamListener.next({
                    kind,
                    x: (event.clientX - canvasRect.left) / canvasRect.width * dFullWidth,
                    y: (event.clientY - canvasRect.top) / canvasRect.height * dFullHeight
                  });
                };
                window.addEventListener(kind, eventListener);
                return eventListener;
              };
              eventListeners = map(addListener, events);
            },
            stop(): void {
              forEach(([event, listener]) => {
                window.removeEventListener(event, listener);
              }, zip(events, eventListeners));
            }
          };
        };

        return xs.create(makeMouseEventProducer());
      } else {
        return xs.never();
      }
    })
    .flatten();
}

function makeDraw(): (e: CanvasElement) => void {
  const dispatchTable: Record<CanvasElement['kind'], (e: CanvasElement) => void> = {
    rect: drawRect,
    circle: drawCircle,
    ellipse: drawEllipse,
    line: drawLine,
    arrow: drawArrow,
    bezier: drawBezier,
    text: drawText,
    image: drawImage,
    complex: drawComplex
  };

  return e => dispatchTable[e.kind](e);
}

function prepareShape(e: Shape | ComplexShape) {
  if (e.stroke && e.strokeWidth) {
    ctx.strokeStyle = e.stroke.toString();
    ctx.lineWidth = e.strokeWidth;
    if (e.lineDash) {
      ctx.setLineDash(e.lineDash);
    } else {
      ctx.setLineDash([]);
    }
  }
  if (e.fill) {
    ctx.fillStyle = e.fill.toString();
  }
  if (e.shadow) {
    ctx.shadowColor = e.shadow.color.toString();
    ctx.shadowBlur = e.shadow.blur;
    ctx.shadowOffsetX = e.shadow.offsetX;
    ctx.shadowOffsetY = e.shadow.offsetY;
  }
}

function drawShape(path: Path) {
  return (e: Shape) => {
    prepareShape(e);
    if (e.rotate) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rotate * Math.PI / 180);
      ctx.translate(-e.x, -e.y);
    }
    ctx.beginPath();
    path(e);
    if (e.fill) {
      ctx.fill();
    }
    ctx.shadowColor = 'transparent';
    if (e.stroke && e.strokeWidth) {
      ctx.stroke();
    }
    if (e.rotate) {
      ctx.restore();
    }
  };
}

function rectPath(eOld: Rect): void {
  const e = rectCorner(eOld);
  if (e.radius) {
    const radius = e.radius;
    ctx.moveTo(e.nwX + radius, e.nwY);
    ctx.arcTo(e.seX, e.nwY, e.seX, e.nwY + radius, radius);
    ctx.arcTo(e.seX, e.seY, e.seX - radius, e.seY, radius);
    ctx.arcTo(e.nwX, e.seY, e.nwX, e.seY - radius, radius);
    ctx.arcTo(e.nwX, e.nwY, e.nwX + radius, e.nwY, radius);
  } else {
    ctx.rect(e.nwX, e.nwY, e.width, e.height);
  }
}
function circlePath(e: Circle): void {
  ctx.arc(e.x, e.y, e.size / 2, 0, 2 * Math.PI);
}
function ellipsePath(e: Ellipse): void {
  ctx.ellipse(e.x, e.y, e.radiusX, e.radiusY, 0, 0, 2 * Math.PI);
}
function linePath(e: Line): void {
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(e.endX, e.endY);
}
function bezierPath(e: Bezier): void {
  ctx.moveTo(e.x, e.y);
  ctx.bezierCurveTo(e.cp1X, e.cp1Y, e.cp2X, e.cp2Y, e.endX, e.endY);
}

function drawRect(e: Rect): void { drawShape(rectPath)(e); }
function drawCircle(e: Circle): void { drawShape(circlePath)(e); }
function drawEllipse(e: Ellipse): void { drawShape(ellipsePath)(e); }
function drawLine(e: Line): void { drawShape(linePath)(e); }
function drawBezier(e: Bezier): void { drawShape(bezierPath)(e); }

function drawArrow(e: Arrow): void {
  prepareShape(e);
  ctx.save();
  if (e.rotate) {
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rotate * Math.PI / 180);
    ctx.translate(-e.x, -e.y);
  }
  const totalLength = vectorLength(e.endX - e.x, e.endY - e.y);
  const arrowSize = e.arrowSize || (e.strokeWidth ? e.strokeWidth * 4 : 5);
  const lineLength = totalLength - arrowSize;
  const jointX = e.x + (e.endX - e.x) * lineLength / totalLength;
  const jointY = e.y + (e.endY - e.y) * lineLength / totalLength;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y);
  ctx.lineTo(jointX, jointY);
  if (e.stroke && e.strokeWidth) {
    ctx.stroke();
  }
  ctx.translate(jointX, jointY);
  ctx.rotate(Math.atan2(e.endY - e.y, e.endX - e.x));
  ctx.scale(arrowSize, arrowSize);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-.5, -.6);
  ctx.lineTo(1, 0);
  ctx.lineTo(-.5, .6);
  ctx.closePath();
  ctx.shadowColor = 'transparent';
  if (e.fill) {
    ctx.fill();
  }
  ctx.restore();
}

export function complexConfig(e: ComplexShape): { st: Stencil, width: number, height: number; } {
  const st = stencils[e.stencil];
  const width = e.width || (e.height ? st.width * e.height / st.height : st.width);
  const height = e.height || (e.width ? st.height * e.width / st.width : st.height);
  return { st, width, height };
}
function drawComplex(e: ComplexShape): void {
  const { st, width, height } = complexConfig(e);
  prepareShape(e);
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.rotate) {
    ctx.rotate((e.rotate * Math.PI) / 180);
  }
  ctx.scale(width / st.width, height / st.height);
  ctx.translate(-st.width / 2, -st.height / 2);
  if (e.fill) {
    ctx.fill(st.path);
  }
  ctx.shadowColor = 'transparent';
  if (e.stroke && e.strokeWidth) {
    ctx.stroke(st.path);
  }
  ctx.restore();
}

export function imageConfig(e: Image): { el: HTMLImageElement, width: number, height: number; } {
  const el = images[e.image];
  const width = e.width || (e.height ? el.naturalWidth * e.height / el.naturalHeight : el.naturalWidth);
  const height = e.height || (e.width ? el.naturalHeight * e.width / el.naturalWidth : el.naturalHeight);
  return { el, width, height };
}
function drawImage(e: Image): void {
  const { el, width, height } = imageConfig(e);
  if (e.rotate) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rotate * Math.PI / 180);
    ctx.drawImage(el, -width / 2, -height / 2, width, height);
    ctx.restore();
  } else {
    ctx.drawImage(el, e.x - width / 2, e.y - height / 2, width, height);
  }
}

const textCache: { [k: number]: TextFragment[][]; } = {};

const styles: { [k: string]: TextStyle; } = {
  b: {
    fontWeight: 'bold'
  },
  i: {
    fontStyle: 'italic'
  },
  self: {
    textColor: hSelf[10]
  },
  opp: {
    textColor: hOpp[10]
  },
  discard: {
    textColor: hDiscard[10]
  }
};

function drawText(e: Text): void {
  const m = measureText(e);
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.rotate) {
    ctx.rotate(e.rotate * Math.PI / 180);
  }
  ctx.translate(-m.nwToAnchorX, -m.nwToAnchorY);
  if (e.shape) {
    switch (e.shape.kind) {
      case 'rect':
        drawRect({
          layer: e.layer,
          x: m.totalWidth / 2,
          y: m.totalHeight / 2,
          kind: 'rect',
          width: e.shape.margin ? m.totalWidth + e.shape.margin * 2 : m.totalWidth,
          height: e.shape.margin ? m.totalHeight + e.shape.margin * 2 : m.totalHeight,
          ...pick(['radius', 'stroke', 'strokeWidth', 'fill', 'lineDash', 'shadow'], e.shape)
        });
    }
  }
  let x = 0;
  let y = m.textHeight;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const [line, lineWidth] of zip(m.fragments, m.lineWidths)) {
    x = (() => {
      switch (e.align || 'c') {
        case 'l':
          return 0;
        case 'c':
          return (m.totalWidth - lineWidth) / 2;
        case 'r':
          return m.totalWidth - lineWidth;
      }
    })();
    for (const f of line) {
      ctx.font = f.font;
      ctx.fillStyle = f.textColor;
      ctx.fillText(f.text, x, y);
      x += f.metrics.width;
    }
    y += m.lineSkip;
  }
  ctx.restore();
}

interface TextMeasurement {
  fragments: TextFragment[][];
  lineWidths: number[];
  lineSkip: number;
  totalWidth: number;
  totalHeight: number;
  centerX: number;
  centerY: number;
  textHeight: number;
  textDepth: number;
  nwToAnchorX: number;
  nwToAnchorY: number;
}
export function measureText(e: Text): TextMeasurement {
  const fragments = getFragments(e);
  const lineWidths = map(l => sum(map(f => f.metrics.width, l)), fragments);
  const totalWidth = e.width || reduce<number, number>(max, 0, lineWidths);
  const lineSkip = e.lineSkip || (e.lineSpacing ? e.fontSize * e.lineSpacing : e.fontSize * 1.5);
  const totalHeight = lineSkip * (fragments.length - 1) + e.fontSize;
  const textHeight = e.fontSize * .8;
  const textDepth = e.fontSize * .2;
  const nwToAnchorX = (() => {
    switch (e.hAnchor || 'c') {
      case 'l':
        return 0;
      case 'c':
        return totalWidth / 2;
      case 'r':
        return totalWidth;
    }
  })();
  const nwToAnchorY = (() => {
    switch (e.vAnchor || 'c') {
      case 'n':
        return 0;
      case 'f':
        return textHeight;
      case 'c':
        return totalHeight / 2;
      case 'l':
        return totalHeight - textDepth;
      case 's':
        return totalHeight;
    }
  })();
  const anchorToCenterX = totalWidth / 2 - nwToAnchorX;
  const anchorToCenterY = totalHeight / 2 - nwToAnchorY;
  const anchorToCenterRotated = e.rotate ? rotateVector(anchorToCenterX, anchorToCenterY, e.rotate) : [anchorToCenterX, anchorToCenterY] as [number, number];
  const [centerX, centerY] = [e.x + anchorToCenterRotated[0], e.y + anchorToCenterRotated[1]];
  return { fragments, lineWidths, lineSkip, totalWidth, totalHeight, centerX, centerY, textHeight, textDepth, nwToAnchorX, nwToAnchorY };
}

function getFragments(e: Text): TextFragment[][] {
  const key = hashCode(JSON.stringify(e, (k, v) => {
    if (v && v.constructor.name === ColorHelper.name) {
      return v.toString();
    } else {
      return v;
    }
  }));
  if (key in textCache) {
    return textCache[key];
  } else {
    return until(propEq('text', ''), makeParse(e), {
      text: e.text,
      fragments: [[]],
      styleStack: [],
      currentFragment: [],
      ...e.width ? {
        currentWord: [],
        currentWidth: 0
      } : {}
    }).fragments;
  }
}

interface ParseState {
  text: string;
  fragments: TextFragment[][];
  styleStack: TextStyle[];
  currentFragment: string[];
}
interface ParseStateWidth extends ParseState {
  currentWord: TextFragment[];
  currentWidth: number;
}

function makeParse(e: Text) {
  if (!e.width) {
    const addText = function (s: ParseState, text: string): ParseState {
      if (text === '' && s.currentFragment.length === 0) {
        return s;
      } else {
        return {
          ...s,
          fragments: addToLast(s.fragments, createFragment(append(text, s.currentFragment), e, s.styleStack)),
          currentFragment: []
        };
      }
    };

    const doubleBracket = function (s: ParseState, i: number): ParseState {
      const text = s.text.slice(0, i + 1);
      if (s.text.length === i + 2) {
        return {
          ...addText(s, text),
          text: ''
        };
      } else {
        return {
          ...s,
          text: s.text.slice(i + 2),
          currentFragment: append(text, s.currentFragment)
        };
      }
    };

    return function parse(s: ParseState): ParseState {
      // console.log(s);
      const i = s.text.search(/[[\]\n]/);
      if (i === -1) {
        return {
          ...addText(s, s.text),
          text: ''
        };
      } else {
        switch (s.text[i] as '[' | ']' | '\n') {
          case '[':
            if (s.text[i + 1] === '[') {
              return doubleBracket(s, i);
            } else {
              const j = s.text.slice(i + 1).search(/\|/);
              const styleLabels = s.text.slice(i + 1, i + j + 1).split(' ');
              if (i > 0 || s.currentFragment.length > 0) {
                return {
                  ...addText(s, s.text.slice(0, i)),
                  text: s.text.slice(i + j + 2),
                  styleStack: append(mergeAll(styleLabels.map(s => styles[s])), s.styleStack),
                };
              } else {
                return {
                  ...s,
                  text: s.text.slice(i + j + 2),
                  styleStack: append(mergeAll(styleLabels.map(s => styles[s])), s.styleStack),
                };
              }
            }
          case ']':
            if (s.text[i + 1] === ']') {
              return doubleBracket(s, i);
            } else {
              return {
                ...addText(s, s.text.slice(0, i)),
                text: s.text.slice(i + 1),
                styleStack: init(s.styleStack)
              };
            }
          case '\n': {
            const snew = addText(s, s.text.slice(0, i));
            return {
              ...snew,
              text: s.text.slice(i + 1),
              fragments: append([], snew.fragments)
            };
          }
        }
      }
    };
  } else {
    const makeFragment = function (s: ParseStateWidth, text: string): TextFragment {
      return createFragment(append(text, s.currentFragment), e, s.styleStack);
    };

    const exceedsWidth = function (s: ParseStateWidth, fragment: TextFragment): boolean {
      return (last(s.fragments) as TextFragment[]).length !== s.currentWord.length && s.currentWidth + fragment.metrics.width > (e.width as number);
    };

    const addFragment = function (s: ParseStateWidth, fragment: TextFragment): ParseStateWidth {
      if (exceedsWidth(s, fragment)) {
        return {
          ...s,
          fragments: append(append(fragment, s.currentWord), append((last(s.fragments) as TextFragment[]).slice(0, -s.currentWord.length), init(s.fragments))),
          currentFragment: [],
          currentWord: append(fragment, s.currentWord),
          currentWidth: fragment.metrics.width
        };
      } else {
        return {
          ...s,
          fragments: addToLast(s.fragments, fragment),
          currentFragment: [],
          currentWord: append(fragment, s.currentWord),
          currentWidth: s.currentWidth + fragment.metrics.width
        };
      }
    };

    const addText = function (s: ParseStateWidth, text: string): ParseStateWidth {
      const fragment = makeFragment(s, text);
      return addFragment(s, fragment);
    };

    const doubleBracket = function (s: ParseStateWidth, i: number): ParseStateWidth {
      const text = s.text.slice(0, i + 1);
      if (s.text.length === i + 2) {
        return {
          ...addText(s, text),
          text: '',
          styleStack: []
        };
      } else {
        return {
          ...s,
          text: s.text.slice(i + 2),
          currentFragment: append(text, s.currentFragment)
        };
      }
    };

    return function parse(s: ParseStateWidth): ParseStateWidth {
      const i = s.text.search(/[[\]\n]/);
      if (i === -1) {
        return {
          ...addText(s, s.text),
          text: ''
        };
      } else {
        switch (s.text[i] as ' ' | '[' | ']' | '\n') {
          case ' ': {
            const j = s.text.slice(i + 1).search(/[^ ]/);
            const k = j === -1 ? s.text.length : i + j + 1;
            const textWithoutSpace = s.text.slice(0, i);
            const fragmentWithoutSpace = makeFragment(s, textWithoutSpace);
            const textWithSpace = s.text.slice(0, k);
            const fragmentWithSpace = makeFragment(s, textWithSpace);
            if (exceedsWidth(s, fragmentWithoutSpace) && fragmentWithSpace.metrics.width > (e.width as number) || exceedsWidth(s, fragmentWithSpace)) {
              const snew = addText(s, textWithoutSpace);
              return {
                ...snew,
                text: s.text.slice(k),
                fragments: append([], s.fragments),
                currentWord: [],
                currentWidth: 0
              };
            } else {
              const snew = addText(s, textWithSpace);
              return {
                ...snew,
                text: s.text.slice(k),
                currentWord: []
              };
            }
          }
          case '[':
            if (s.text[i + 1] === '[') {
              return doubleBracket(s, i);
            } else {
              const j = s.text.slice(i + 1).search(/\|/);
              const styleLabels = s.text.slice(i + 1, i + j + 1).split(' ');
              if (i > 0 || s.currentFragment.length > 0) {
                return {
                  ...addText(s, s.text.slice(0, i)),
                  text: s.text.slice(i + j + 2),
                  styleStack: append(mergeAll(styleLabels.map(s => styles[s])), s.styleStack)
                };
              } else {
                return {
                  ...s,
                  text: s.text.slice(i + j + 2),
                  styleStack: append(mergeAll(styleLabels.map(s => styles[s])), s.styleStack)
                };
              }
            }
          case ']':
            if (s.text[i + 1] === ']') {
              return doubleBracket(s, i);
            } else {
              return {
                ...addText(s, s.text.slice(0, i)),
                text: s.text.slice(i + 1),
                styleStack: init(s.styleStack)
              };
            }
          case '\n': {
            const snew = addText(s, s.text.slice(0, i));
            return {
              ...snew,
              text: s.text.slice(i + 1),
              fragments: append([], s.fragments),
              currentWord: [],
              currentWidth: 0
            };
          }
        }
      }
    };
  }
}

function addToLast<T>(a: T[][], b: T): T[][] {
  return append(append(b, last(a) as T[]), init(a));
}

function createFragment(currentFragment: string[], e: Text, styles: TextStyle[]): TextFragment {
  const s = mergeRight(e, mergeAll(styles));
  const text = currentFragment.join('');
  const font = (s.fontStyle ? s.fontStyle + ' ' : '') +
    (s.fontWeight ? s.fontWeight + ' ' : '') +
    (s.fontSizeRatio ? s.fontSize * s.fontSizeRatio : s.fontSize) + 'px ' +
    (s.fontStretch ? s.fontStretch + ' ' : '') +
    (s.fontFamily || defaultFontFamily);
  const textColor = s.textColor ? s.textColor.toString() : 'black';
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText(text);
  return { text, font, textColor, metrics };
}
