import { Stream } from 'xstream';
import { creditToken, experimentId, params } from '../config';

export type Client = OtherClient | MTurkClient | SonaClient;
interface OtherClient {
  kind: 'preview' | 'visitor';
  workerId: string;
}
export interface MTurkClient {
  kind: 'mturk';
  workerId: string;
  assignmentId: string;
  turkSubmitTo: string;
}
interface SonaClient {
  kind: 'sona';
  surveyCode: string;
  workerId: string;
}

interface SubmitAction {
  kind: 'submit';
  approve: boolean;
  bonus: number;
}

interface StopPopupAction {
  kind: 'stopPopup';
}

export type Action = SubmitAction | StopPopupAction;

const clientKind = (() => {
  const type = params.get('type');
  switch (type) {
    case 'mturk':
      if (params.get('assignmentId') === 'ASSIGNMENT_ID_NOT_AVAILABLE') {
        return 'preview';
      } else {
        return 'mturk';
      }
    case 'sona':
      return 'sona';
    default:
      return 'visitor';
  }
})();
const popupListener = function (e: BeforeUnloadEvent) {
  e.preventDefault();
  const msg = 'Are you sure you want to leave? You will have to start the experiment over again.';
  e.returnValue = msg;
  return msg;
};
if (clientKind === 'mturk') {
  window.addEventListener('beforeunload', popupListener);
}
export const client = ((): Client => {
  switch (clientKind) {
    case 'mturk':
      return {
        kind: 'mturk',
        workerId: params.get('workerId')!,
        assignmentId: params.get('assignmentId')!,
        turkSubmitTo: params.get('turkSubmitTo')! + '/mturk/externalSubmit'
      };
    case 'sona': {
      const surveyCode = params.get('survey_code')!;
      return {
        kind: 'sona',
        surveyCode,
        workerId: 'sona-' + surveyCode
      };
    }
    default:
      return {
        kind: clientKind,
        workerId: `${clientKind}-${Math.random().toString(36).substr(2, 5)}`
      };
  }
})();

export function ClientDriver(action$: Stream<Action>): void {
  action$.addListener({
    next: a => {
      switch (a.kind) {
        case 'submit':
          switch (client.kind) {
            case 'mturk': {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = client.turkSubmitTo;
              // should be:
              // live:  		https://www.mturk.com/mturk/externalSubmit
              // sandbox: 	https://workersandbox.mturk.com/mturk/externalSubmit

              form.appendChild(addHidden('assignmentId', client.assignmentId));
              form.appendChild(addHidden('bonus', a.bonus.toFixed(2)));
              form.appendChild(addHidden('approve', a.approve ? 'true' : 'false'));
              form.appendChild(addHidden('secretKey', 'superSecureSecretKey'));

              document.body.appendChild(form);
              form.submit();
              break;
            }
            case 'sona': {
              const form = document.createElement('form');
              form.method = 'GET';
              form.action = 'https://ucsd.sona-systems.com/webstudy_credit.aspx';
              // systems.com/services/SonaAPI.svc/WebstudyCredit?experiment_id=123&credit_token=9185d436e5f94b1581b0918162f6d7e8&survey_code=XXXX

              form.appendChild(addHidden('experiment_id', experimentId));
              form.appendChild(addHidden('credit_token', creditToken));
              form.appendChild(addHidden('survey_code', client.surveyCode));

              document.body.appendChild(form);
              form.submit();
              break;
            }
            default:
              window.location.href = "https://www.evullab.org";
          }
          break;
        case 'stopPopup':
          if (clientKind === 'mturk') {
            window.removeEventListener('beforeunload', popupListener);
          }
      }
    }
  });
}

function addHidden(name: string, value: string): HTMLInputElement {
  const input = document.createElement('input');
  input.setAttribute('type', 'hidden');
  input.setAttribute('name', name);
  input.setAttribute('value', value);
  return input;
}