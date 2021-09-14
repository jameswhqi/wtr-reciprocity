import * as fs from 'fs';
import * as util from 'util';
import * as AWS from 'aws-sdk';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { convert, create } from 'xmlbuilder2';
import { qualAnswerKeys, qualTests } from './qualTypes';
import {
  compose, concat, filter, find, forEach, fromPairs, has, includes, insert, join, length, map, max, prop, propEq,
  reduce,
  transpose, zip
} from 'ramda';
import { F } from 'ts-toolbelt';
import MT = AWS.MTurk;

interface Config {
  live: boolean;
  hits: { [k in string]: Hit };
  qualTypes: { [k in string]: QualType };
}
interface Hit {
  url: string;
  frameHeight: number;
  title: string;
  description: string;
  reward: number;
  duration: number;
  lifetime: number;
  keywords: string;
  assignments: number;
  autoApproval: number;
  bonusReason?: string;
  quals?: QualRequirement[];
  review?: ReviewPolicy;
}
interface QualType {
  description: string;
  retryDelay?: number;
  active: boolean;
  test?: string;
  duration?: number;
  answerKey?: string;
}
interface QualRequirement {
  name: string;
  comparator: MT.Comparator;
  integers?: number[];
  locales?: Locale[];
  actionsGuarded?: MT.HITAccessActions;
}
interface Locale {
  country: string;
  subdivision?: string;
}
interface ReviewPolicy {
  rejectReason: string;
  extend?: {
    maxAssignments: number;
    time: number;
  }
}
interface SavedHit {
  HIT: MT.HIT;
  assignments: MT.AssignmentList;
  bonusPayments: MT.BonusPaymentList;
}

const config = yaml.load(fs.readFileSync('config.yaml', 'utf8')) as Config;
// console.log('Config:', fullDepth(config));
const command = process.argv[2];

AWS.config.getCredentials(function(err) {
  if (err) {
    console.log(err, err.stack);
  } else {
    console.log('Access key:', (AWS.config.credentials as AWS.Credentials).accessKeyId);
  }
});
AWS.config.region = 'us-east-1';

const mt = new MT({
  endpoint: config.live ?
    'https://mturk-requester.us-east-1.amazonaws.com' :
    'https://mturk-requester-sandbox.us-east-1.amazonaws.com'
});

interface MTurk {
  associateQualificationWithWorker: (a: MT.AssociateQualificationWithWorkerRequest) => Promise<MT.AssociateQualificationWithWorkerResponse>;
  createHIT: (a: MT.CreateHITRequest) => Promise<MT.CreateHITResponse>;
  createQualificationType: (a: MT.CreateQualificationTypeRequest) => Promise<MT.CreateQualificationTypeResponse>;
  deleteHIT: (a: MT.DeleteHITRequest) => Promise<MT.DeleteHITResponse>;
  deleteQualificationType: (a: MT.DeleteQualificationTypeRequest) => Promise<MT.DeleteQualificationTypeResponse>;
  getAccountBalance: (a: MT.GetAccountBalanceRequest) => Promise<MT.GetAccountBalanceResponse>;
  getHIT: (a: MT.GetHITRequest) => Promise<MT.GetHITResponse>;
  listAssignmentsForHIT: (a: MT.ListAssignmentsForHITRequest) => Promise<MT.ListAssignmentsForHITResponse>;
  listBonusPayments: (a: MT.ListBonusPaymentsRequest) => Promise<MT.ListBonusPaymentsResponse>;
  listHITs: (a: MT.ListHITsRequest) => Promise<MT.ListHITsResponse>;
  listQualificationTypes: (a: MT.ListQualificationTypesRequest) => Promise<MT.ListQualificationTypesResponse>;
  listWorkersWithQualificationType: (a: MT.ListWorkersWithQualificationTypeRequest) => Promise<MT.ListWorkersWithQualificationTypeResponse>;
  sendBonus: (a: MT.SendBonusRequest) => Promise<MT.SendBonusResponse>;
  updateExpirationForHIT: (a: MT.UpdateExpirationForHITRequest) => Promise<MT.UpdateExpirationForHITResponse>;
}
const fns = [
  'associateQualificationWithWorker',
  'createHIT',
  'createQualificationType',
  'deleteHIT',
  'deleteQualificationType',
  'getAccountBalance',
  'getHIT',
  'listAssignmentsForHIT',
  'listBonusPayments',
  'listHITs',
  'listQualificationTypes',
  'listWorkersWithQualificationType',
  'sendBonus',
  'updateExpirationForHIT'
] as const;
const mturk = fromPairs(map(key => [key, util.promisify(mt[key]).bind(mt)], fns)) as unknown as MTurk;

const systemQualTypes: { [k in string]: string } = {
  masters: config.live ? '2F1QJWKUDD8XADTFD2Q0G6UTO95ALH' : '2ARFPLSP75KLA8M8DH1HTEQVJT3SY6',
  numberHitsApproved: '00000000000000000040',
  locale: '00000000000000000071',
  adult: '00000000000000000060',
  percentAssignmentsApproved: '000000000000000000L0'
}

main()
  .then(() => process.exit())
  .catch(err => {
    console.log(err);
    process.exit();
  });


function buildXml(obj: object): string {
  return create({ encoding: 'UTF-8' }, obj).end({ prettyPrint: true })
}

function fullDepth(obj: object): string {
  return util.inspect(obj, { depth: null, colors: true });
}

async function main(): Promise<void> {
  switch (command) {
    case 'balance':
      await mturk.getAccountBalance({}).then(console.log);
      break;
    case 'hits':
      console.log(await mturk.listHITs({}));
      break;
    case 'createHit':
      await createHit(mturk, config, process.argv[3])
        .then(() => console.log('Created successfully.'));
      break;
    case 'getHit':
      const hit = await getHit(mturk, process.argv[3]);
      if (hit) {
        console.log(fullDepth(hit));
      } else {
        throw 'HIT not created!';
      }
      break;
    case 'expireHit':
      await expireHit(mturk, process.argv[3])
        .then(() => console.log('Expired successfully.'));
      break;
    case 'deleteHit':
      await deleteHit(mturk, process.argv[3])
        .then(() => console.log('Deleted successfully.'));
      break;
    case 'qualTypes':
      await mturk.listQualificationTypes({
        MustBeRequestable: false,
        MustBeOwnedByCaller: true,
        MaxResults: 100
      }).then(console.log);
      break;
    case 'createQualType':
      await createQualType(mturk, config, process.argv[3])
        .then(() => console.log('Created successfully.'));
      break;
    case 'workersWithQualType':
      const workers = await workersWithQualType(mturk, process.argv[3]);
      console.log(`Number of workers: ${workers.length}`);
      forEach(console.log, workers);
      break;
    case 'deleteQualType':
      await deleteQualType(mturk, process.argv[3])
        .then(() => console.log('Deleted successfully.'));
      break;
    case 'assignments':
      await listAssignments(mturk, process.argv[3]);
      break;
    case 'sendBonuses':
      await sendBonuses(mturk, process.argv[3])
        .then(() => console.log('Bonuses sent.'));
      break;
    case 'saveHit':
      await saveHit(mturk, process.argv[3], process.argv[4])
        .then(path => console.log(`HIT saved to "${path}".`));
      break;
    case 'assignQualType':
      await assignQualType(mturk, process.argv[3], process.argv[4])
        .then(() => console.log('Qualification type assigned.'));
      break;
    default:
      throw `Unknown command: ${command}`;
  }
}

async function createHit(mturk: MTurk, config: Config, name?: string): Promise<void> {
  if (!name) {
    throw 'HIT name is empty!';
  }
  const spec = config.hits[name];
  if (!spec) {
    throw 'No HIT found with the given name!';
  } else if (await getHit(mturk, name)) {
    throw 'HIT already created!';
  } else {
    const params: MT.CreateHITRequest = {
      Title: spec.title,
      Description: spec.description,
      Question: buildXml({
        ExternalQuestion: {
          '@xmlns': 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd',
          ExternalURL: spec.url,
          FrameHeight: spec.frameHeight
        }
      }),
      Reward: spec.reward.toFixed(2),
      AssignmentDurationInSeconds: spec.duration,
      LifetimeInSeconds: spec.lifetime,
      Keywords: spec.keywords,
      MaxAssignments: spec.assignments,
      AutoApprovalDelayInSeconds: spec.autoApproval,
      RequesterAnnotation: name
    };
    if (spec.quals) {
      params.QualificationRequirements = await Promise.all(map(async qual => {
        let id: string;
        if (has(qual.name, systemQualTypes)) {
          id = systemQualTypes[qual.name];
        } else if (has(qual.name, config.qualTypes)) {
          const qualType = await getQualType(mturk, qual.name);
          if (qualType) {
            id = qualType.QualificationTypeId as string;
          } else {
            throw `Qualification type "${qual.name}" not created!`;
          }
        } else {
          throw `Qualification type "${qual.name}" doesn't exist!`;
        }
        const req: MT.QualificationRequirement = {
          QualificationTypeId: id,
          Comparator: qual.comparator,
          IntegerValues: qual.integers,
          ActionsGuarded: qual.actionsGuarded
        };
        if (qual.locales) {
          req.LocaleValues = map(l => ({ Country: l.country, Subdivision: l.subdivision }), qual.locales)
        }
        return req;
      }, spec.quals)) as MT.QualificationRequirementList;
    }
    if (spec.review) {
      const reviewParams = [
        { Key: 'AnswerKey', MapEntries: [{ Key: 'approve', Values: ['true'] }, { Key: 'secretKey', Values: ['superSecureSecretKey'] }] },
        { Key: 'ApproveIfKnownAnswerScoreIsAtLeast', Values: ['100'] },
        { Key: 'RejectIfKnownAnswerScoreIsLessThan', Values: ['100'] },
        { Key: 'RejectReason', Values: [spec.review.rejectReason] }
      ];
      if (spec.review.extend) {
        reviewParams.push(
          { Key: 'ExtendIfKnownAnswerScoreIsLessThan', Values: ['100'] },
          { Key: 'ExtendMaximumAssignments', Values: [spec.review.extend.maxAssignments.toString()] },
          { Key: 'ExtendMinimumTimeInSeconds', Values: [spec.review.extend.time.toString()] }
        )
      }
      params.AssignmentReviewPolicy = {
        PolicyName: 'ScoreMyKnownAnswers/2011-09-01',
        Parameters: reviewParams
      }
    }
    await mturk.createHIT(params);
  }
}

async function expireHit(mturk: MTurk, name?: string): Promise<void> {
  const hit = await getHit(mturk, name);
  if (hit) {
    await mturk.updateExpirationForHIT({
      HITId: hit.HITId as string,
      ExpireAt: new Date()
    });
  } else {
    throw 'HIT not created!';
  }
}

async function deleteHit(mturk: MTurk, name?: string): Promise<void> {
  const hit = await getHit(mturk, name);
  if (hit) {
    await mturk.deleteHIT({ HITId: hit.HITId as string });
  } else {
    throw 'HIT not created!';
  }
}

async function getHit(mturk: MTurk, name?: string): Promise<MT.HIT | undefined> {
  if (!name) {
    throw 'HIT name is empty!';
  }
  const hits = await mturk.listHITs({ MaxResults: 100 });
  return find(h => h.RequesterAnnotation === name, hits.HITs as MT.HITList);
}

async function createQualType(mturk: MTurk, config: Config, name?: string): Promise<void> {
  if (!name) {
    throw 'Qualification type is empty!';
  }
  const spec = config.qualTypes[name];
  if (!spec) {
    throw 'No qualification type found with the given name!';
  } else if (await getQualType(mturk, name)) {
    throw 'Qualification type already created!';
  } else {
    const params: MT.CreateQualificationTypeRequest = {
      Name: name,
      Description: spec.description,
      QualificationTypeStatus: spec.active ? 'Active' : 'Inactive'
    };
    if (spec.retryDelay) {
      params.RetryDelayInSeconds = spec.retryDelay;
    }
    if (spec.test) {
      params.Test = buildXml(qualTests[spec.test]);
      params.TestDurationInSeconds = spec.duration;
    }
    if (spec.answerKey) {
      params.AnswerKey = buildXml(qualAnswerKeys[spec.answerKey]);
    }
    await mturk.createQualificationType(params);
  }
}

async function deleteQualType(mturk: MTurk, name?: string): Promise<void> {
  const qualType = await getQualType(mturk, name);
  if (qualType) {
    await mturk.deleteQualificationType({
      QualificationTypeId: qualType.QualificationTypeId as string
    });
  } else {
    throw 'Qualification type not created!';
  }
}

async function workersWithQualType(mturk: MTurk, name?: string): Promise<string[]> {
  const qualType = await getQualType(mturk, name);
  if (qualType) {
    let workers: string[] = [];
    let nextToken: string | undefined = undefined;
    while (true) {
      const response: MT.ListWorkersWithQualificationTypeResponse = await mturk.listWorkersWithQualificationType({
        QualificationTypeId: qualType.QualificationTypeId as string,
        MaxResults: 100,
        NextToken: nextToken
      });
      workers = concat(workers, map(prop('WorkerId'), response.Qualifications!) as string[]);
      if ((response.NumResults as number) < 100) {
        break;
      }
      nextToken = response.NextToken
    }
    return workers;
  } else {
    throw 'Qualification type not created!';
  }
}

async function getQualType(mturk: MTurk, name?: string): Promise<MT.QualificationType | undefined> {
  if (!name) {
    throw 'Qualification type is empty!';
  }
  const qualTypes = await mturk.listQualificationTypes({
    MustBeRequestable: false,
    MustBeOwnedByCaller: true,
    MaxResults: 100
  });
  return find(q => q.Name === name, qualTypes.QualificationTypes as AWS.MTurk.QualificationTypeList);
}

async function listAssignments(mturk: MTurk, hitName?: string): Promise<void> {
  const hit = await getHit(mturk, hitName);
  if (hit) {
    const assignments = (await mturk.listAssignmentsForHIT({
      HITId: hit.HITId as string,
      MaxResults: 100
    })).Assignments as MT.AssignmentList;
    const payments = (await mturk.listBonusPayments({
      HITId: hit.HITId as string,
      MaxResults: 100
    })).BonusPayments as MT.BonusPaymentList;
    const paidWorkers = map(prop('WorkerId'), payments);
    const fields = map(a => {
      const bonus = parseBonus(a.Answer as string);
      return map(String, [
        a.WorkerId,
        a.AssignmentStatus,
        bonus,
        Number(bonus) === 0 ? '' : includes(a.WorkerId, paidWorkers)
      ])
    }, assignments);
    console.log(fullDepth(assignments));
    printTable(insert(0, ['Worker ID', 'Status', 'Bonus', 'Paid'], fields));
  } else {
    throw 'HIT not created!';
  }
}

interface Answers {
  QuestionFormAnswers: {
    Answer: Answer[];
  };
}
interface Answer {
  QuestionIdentifier: string;
  FreeText: string;
}
function parseBonus(answer: string): string {
  const obj = convert(answer, { format: 'object' }) as unknown as Answers;
  const f = filter(propEq('QuestionIdentifier', 'bonusss'), obj.QuestionFormAnswers.Answer) as Answer[];
  return f[0].FreeText;
}

function printTable(table: string[][]): void {
  const maxLengths = map(compose(reduce(max, 0), map(length)), transpose(table)) as number[];
  forEach(fields => console.log(join(' ', map(([f, l]) => f.padEnd(l), zip(fields, maxLengths)))), table);
}

async function sendBonuses(mturk: MTurk, hitName?: string): Promise<void> {
  const hit = await getHit(mturk, hitName);
  if (hit) {
    const assignments = (await mturk.listAssignmentsForHIT({
      HITId: hit.HITId as string,
      AssignmentStatuses: ['Approved'],
      MaxResults: 100
    })).Assignments as MT.AssignmentList;
    const payments = (await mturk.listBonusPayments({
      HITId: hit.HITId as string,
      MaxResults: 100
    })).BonusPayments as MT.BonusPaymentList;
    const paidWorkers = map(prop('WorkerId'), payments);
    await Promise.all(map(a => {
      if (includes(a.WorkerId, paidWorkers)) {
        return Promise.resolve() as Promise<unknown>;
      } else {
        const bonus = parseBonus(a.Answer as string);
        if (Number(bonus) === 0) {
          return Promise.resolve() as Promise<unknown>;
        } else {
          return mturk.sendBonus({
            WorkerId: a.WorkerId as string,
            AssignmentId: a.AssignmentId as string,
            BonusAmount: bonus,
            Reason: config.hits[hitName as string].bonusReason || ''
          }) as Promise<unknown>;
        }
      }
    }, assignments));
  } else {
    throw 'HIT not created!';
  }
}

async function saveHit(mturk: MTurk, hitName?: string, fileName?: string): Promise<string> {
  const hit = await getHit(mturk, hitName);
  if (hit) {
    const path = fileName || `${hitName}-${(hit.CreationTime as Date).toISOString().slice(0, 16)}.json`;
    const assignments = (await mturk.listAssignmentsForHIT({
      HITId: hit.HITId as string,
      MaxResults: 100
    })).Assignments as MT.AssignmentList;
    const payments = (await mturk.listBonusPayments({
      HITId: hit.HITId as string,
      MaxResults: 100
    })).BonusPayments as MT.BonusPaymentList;
    fs.writeFileSync(path, JSON.stringify({
      HIT: hit,
      assignments,
      bonusPayments: payments
    } as SavedHit, null, 2));
    return path;
  } else {
    throw 'HIT not created!';
  }
}

async function assignQualType(mturk: MTurk, name?: string, fileName?: string): Promise<void> {
  const qualType = await getQualType(mturk, name);
  if (!fileName) {
    throw 'Saved HIT file name is empty!';
  }
  if (qualType) {
    const data = JSON.parse(fs.readFileSync(path.join('../..', fileName), { encoding: 'utf8' })) as SavedHit;
    const assignedWorkers = await workersWithQualType(mturk, name);
    await Promise.all(map(a => {
      if (includes(a.WorkerId, assignedWorkers)) {
        return Promise.resolve() as Promise<unknown>;
      } else {
        return mturk.associateQualificationWithWorker({
          QualificationTypeId: qualType.QualificationTypeId as string,
          WorkerId: a.WorkerId as string,
          SendNotification: false
        }) as Promise<unknown>;
      }
    }, data.assignments));
  } else {
    throw 'Qualification type not created!';
  }
}