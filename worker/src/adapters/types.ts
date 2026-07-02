import { type Environment } from '../environment.ts';
import {
  type CanonicalRequest,
  type CanonicalResponse,
} from 'shared/canonical';
import { type Psp } from 'shared/psps';

export type PspAdapter = {
  readonly authorize: (
    request: CanonicalRequest,
    environment: Environment,
  ) => Promise<CanonicalResponse>;
  readonly id: Psp;
};
