export const qualTests: { [k in string]: object } = {
  test: {
    QuestionForm: {
      '@xmlns': 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2017-11-06/QuestionForm.xsd',
      '#': [
        {
          Overview: {
            Title: 'Title',
            Text: 'Normal text 1'
          }
        },
        {
          Question: {
            QuestionIdentifier: 'likelytowin',
            DisplayName: 'The Next Move',
            IsRequired: true,
            QuestionContent: {
              Text: 'How likely is it that player "X" will win this game?'
            },
            AnswerSpecification: {
              SelectionAnswer: {
                StyleSuggestion: 'radiobutton',
                Selections: {
                  Selection: [
                    {
                      SelectionIdentifier: 'notlikely',
                      Text: 'Not likely'
                    },
                    {
                      SelectionIdentifier: 'unsure',
                      Text: 'It could go either way'
                    },
                    {
                      SelectionIdentifier: 'likely',
                      Text: 'Likely'
                    }
                  ]
                }
              }
            }
          }
        }
      ]
    }
  }
};

export const qualAnswerKeys: { [k in string]: object } = {
  test: {
    AnswerKey: {
      '@xmlns': 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/AnswerKey.xsd',
      Question: {
        QuestionIdentifier: 'likelytowin',
        AnswerOption: {
          SelectionIdentifier: 'likely',
          AnswerScore: 1
        }
      }
    }
  }
}