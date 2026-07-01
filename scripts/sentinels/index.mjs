/**
 * Sentinel registry — maps each `.claude/orchestration.json` sentinel key to its
 * scan function. Adding a sentinel = drop a scanner in this dir + one line here +
 * one config entry. The orchestrator loops over the enabled ones.
 *
 * Every scan() returns an array of findings: { id, label:'proposal'|'priority',
 * title, body }. `id` is the stable idempotency key (the runner marks issues with
 * `<!-- sentinel:ID -->` so a finding is never duplicated).
 */

import { scanFeatured } from './data-quality.mjs'
import { scanHonestyRegression } from './honesty-regression.mjs'
import { scanSecurity } from './security.mjs'
import { scanDocsDrift } from './docs-drift.mjs'
import { scanRepoHygiene } from './repo-hygiene.mjs'
import { scanStalePlans } from './stale-plans.mjs'

export const SENTINELS = {
  'data-quality-sentinel': scanFeatured,
  'honesty-regression-sentinel': scanHonestyRegression,
  'security-sentinel': scanSecurity,
  'docs-drift-sentinel': scanDocsDrift,
  'repo-hygiene-sentinel': scanRepoHygiene,
  'stale-plans-sentinel': scanStalePlans,
}
