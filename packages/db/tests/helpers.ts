export {
  ADMIN_URL,
  APP_URL,
  admin,
  app,
  setTenant,
} from '../src/index.core';

export { enqueue, claimJobs, completeJob, failJob, reapStuck } from '../src/index.js';
export type { Job } from '../src/index.js';

export const TENANT_A = '11111111-1111-1111-1111-111111111111';
export const TENANT_B = '22222222-2222-2222-2222-222222222222';
export const TENANT_C = '44444444-4444-4444-4444-444444444444';
export const TENANT_D = '55555555-5555-5555-5555-555555555555';
export const TENANT_AUDIT = '33333333-3333-3333-3333-333333333333';
export const TENANT_QA = '88888888-8888-8888-8888-888888888881';
export const TENANT_QB = '88888888-8888-8888-8888-888888888882';
