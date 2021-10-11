import { button, dd, div, dl, dt, h1, li, MainDOMSource, p, span, ul, VNode } from '@cycle/dom';
import { style } from 'typestyle';
import xs, { Stream as S } from 'xstream';
import { sButton } from '../config';
import { client } from '../drivers/client';

interface EventOut {
  kind: 'endWelcome';
}
interface Sources {
  DOM: MainDOMSource;
}
interface Sinks {
  DOM: S<VNode>;
  event: S<EventOut>;
}

const sWelcomeSona = style({
  margin: '1em 15%',
  lineHeight: 1.4,
  $nest: {
    '& h1': {
      fontSize: 24,
      textAlign: 'center',
      margin: '.2em'
    },
    '& p': {
      fontSize: 18,
      marginBottom: 0
    },
    '& dl': {
      fontSize: 18,
      margin: 0
    },
    '& dt': {
      fontWeight: 'bold',
      marginTop: '.7em',
      display: 'inline-block'
    },
    '& dd': {
      display: 'inline',
      marginLeft: '1em'
    },
    '& dd::after': {
      content: `''`,
      display: 'block'
    },
    '& ul': {
      margin: 0
    },
  }
});
const sWelcomeOther = style({
  margin: '1em 15%',
  lineHeight: 1.4,
  $nest: {
    '& h1': {
      textAlign: 'center',
      margin: '.2em'
    },
    '& p': {
      fontSize: 20,
      marginBottom: 0
    }
  }
});
const sButtonRow = style({ textAlign: 'center' });

export function Welcome(sources: Sources): Sinks {
  // view
  const dom$ = xs.of(client.kind === 'sona' ?
    div({ props: { className: sWelcomeSona } }, [
      h1('University of California, San Diego'),
      h1('Consent to act as a research subject'),
      p('Edward Vul, Ph.D. and his awesome students are conducting a research study to find out more about decision ' +
        'making. You have been asked to participate because you are an undergraduate here at UCSD.'),
      dl([
        dt('Eligibility requirements'),
        dd('You must use a desktop/laptop computer with a mouse/trackpad to complete the experiment.'),
        dt('Procedures'),
        dd([
          'If you agree to participate in this study, the following will happen to you:',
          ul([
            li('You will sit at the computer and play a slider game with another person randomly paired with you.')
          ])
        ]),
        dt('Risks'),
        dd('No potential risks or discomforts are anticipated.'),
        dt('Payment/Remuneration'),
        dd('You will receive half an hour of course credit. The experiment will last approximately 15 minutes.'),
        dt('Rights'),
        dd('You may call the UCSD Human Research Protection Program at 858-657-5100 to ask about your rights as a ' +
          'research subject or to report research-related problems.'),
        dt('Benefits'),
        dd('There will be no direct benefit to you from these procedures. However, the investigators may learn more ' +
          'about basic questions pertaining to memory, perception, cognition, and learning. This knowledge may have ' +
          'benefits to society in fields ranging from education to design of airplane cockpits, but these benefits ' +
          'will be indirect.'),
        dt('Technical problems'),
        dd('If you encounter technical problems that prevent you from completing the experiment, please send a ' +
          'description of the problems to wqi@ucsd.edu.'),
        dt('Explanation'),
        dd('If you have other research-related questions or problems, you may reach Edward Vul at 858-534-4401.'),
        dt('Voluntary nature of participation'),
        dd('Participation in this research is entirely voluntary. You may refuse to participate or withdraw at any ' +
          'time without penalty.'),
        dt('Confidentiality'),
        dd('Research records will be kept confidential to the extent allowed by law. As with all research, there is ' +
          'also the possibility of loss of confidentiality. Information from participants will be identified by a ' +
          'study number. The database which relates the study number to a specific subject will be maintained in ' +
          'the study coordinator’s office.'),
        dt('Copy of consent'),
        dd('Feel free to print this page as a copy.')
      ]),
      div({ props: { className: sButtonRow } }, [
        button({ props: { className: sButton } }, 'Click here to consent and agree to participate')
      ])
    ]) :
    div({ props: { className: sWelcomeOther } }, [
      h1('Welcome!'),
      p([
        'We recommend that you use a desktop/laptop computer with a ',
        span({ style: { fontWeight: 'bold' } }, 'mouse/trackpad'),
        ' to complete this experiment for the best experience.'
      ]),
      client.kind === 'mturk' ? p('If you previously failed to submit the HIT, please email us at evullab@gmail.com.') : null,
      p('You will play a multi-round game with another participant. You will start with a tutorial, and then play the game.'),
      div({ props: { className: sButtonRow } }, [
        button({ props: { className: sButton } }, 'OK')
      ])
    ])
  );

  const event$ = sources.DOM.select(`.${sButton}`).events('click').mapTo({ kind: 'endWelcome' as const });

  return {
    DOM: dom$,
    event: event$
  };
}