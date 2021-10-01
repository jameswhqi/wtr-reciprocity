import { style } from 'typestyle';
import { blues, grays, reds } from './colors';

export const experimentId = '2160';
export const creditToken = '083dbb8cd3984af1855ba65dd86c283b';

export const params = new URLSearchParams(window.location.search);

export const debug = params.get('debug') === 'true';
const fast = params.get('superFast') === 'true';

export const [minOppLambda, maxOppLambda] = (() => {
  switch (params.get('ver')) {
    case 'yqdu':
      return [-1.25, -.75];
    case 'wgwd':
      return [-.25, .25];
    case 'wklt':
      return [.75, 1.25];
    // case 'ckkm':
    //   return [.5, 1.2];
    default:
      return [-2, 2];
  }
})();

export const speedRatio = fast ? 10 : 1;
export const secondRatio = fast ? 10 : 1000;

export const defaultFontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';

export const nPracticeTrials = fast ? 1 : 5;
export const practiceDiscardTrials = fast ? [] : [3];
export const practiceSelfTrials = fast ? [] : [4];
export const nRealTrials = fast ? 5 : 20;
export const realDiscardTrials = fast ? [3] : [3, 12];
export const realSelfTrials = fast ? [4] : [6, 15];

export const maxPayoff = 10;

// dimensions
export const dFullWidth = 1000;
export const dFullHeight = 680;
export const dBoardOffset = 200;
export const dIconOffset = 270;
export const dBoardSize = 300;
export const dMsgInnerSep = 10;
export const dMsgStrokeWidth = 3;
export const dArrowLength = 50;

// coordinates
export const cSelfBoardX = dFullWidth / 2 - dBoardOffset;
export const cOppBoardX = dFullWidth / 2 + dBoardOffset;
export const cBoardY = dFullHeight / 2;
export const cSelfIconY = cBoardY + dIconOffset;
export const cOppIconY = cBoardY - dIconOffset;

// hues
export const hSelf = reds;
export const hOpp = blues;
export const hDiscard = grays;

// lightnesses
export const lButtonHoverBg = 2;
export const lButtonActiveBg = 4;
export const lButtonDisabled = 4;
export const lBarNumber = 12;

// font sizes
export const fBarNumber = 18;
export const fTotal = 24;
export const fMsg = 20;

// styles
export const sButton = style({
  border: '2px solid black',
  margin: '1em 0',
  padding: '.3em 1em',
  fontSize: 24,
  backgroundColor: 'white',
  $nest: {
    '&:hover': {
      backgroundColor: grays[lButtonHoverBg].toString()
    },
    '&:active': {
      backgroundColor: grays[lButtonActiveBg].toString()
    },
    '&:disabled': {
      backgroundColor: 'white',
      color: grays[lButtonDisabled].toString(),
      borderColor: grays[lButtonDisabled].toString()
    }
  }
});
export const sQuestionLabel = style({ margin: '.5em 0' });
export const sError = style({ color: 'red', fontSize: 12 });