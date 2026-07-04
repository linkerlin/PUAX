#!/usr/bin/env node
/**
 * MCP Tool: puax_quality_compass
 * High-Agency 正向激励：Quality Compass + Trust + Recovery + Calibration
 */

import { z } from 'zod';
import {
  runQualityCompass,
  assessTrustLevel,
  getRecoveryProtocol,
  calibrateRequirements,
  QUALITY_COMPASS_QUESTIONS,
} from '../core/high-agency.js';

const QualityCompassInputSchema = z.object({
  answers: z.record(z.string()).describe('5 问自检答案，key: intent/evidence/alternatives/verification/residual_risk'),
  trust_metrics: z.object({
    consecutive_successes: z.number().default(0),
    confidence_gate_pass_rate: z.number().min(0).max(1).default(0),
    diagnosis_compliance_rate: z.number().min(0).max(1).default(0),
  }).optional(),
  failure_count: z.number().default(0),
  pressure_level: z.number().default(0),
  requirements: z.array(z.object({
    item: z.string(),
    level: z.enum(['must', 'should', 'could']).optional(),
  })).optional(),
});

export const qualityCompassTool = {
  name: 'puax_quality_compass',
  description: 'High-Agency 正向激励：5 问 Quality Compass + Trust Level T1-T3 + Recovery Protocol + Calibration 分级。',
  inputSchema: QualityCompassInputSchema,

  handler: (args: z.infer<typeof QualityCompassInputSchema>) => {
    const compass = runQualityCompass(args.answers);
    const trust = assessTrustLevel(args.trust_metrics || {
      consecutive_successes: 0,
      confidence_gate_pass_rate: 0,
      diagnosis_compliance_rate: 0,
    });
    const recovery = getRecoveryProtocol(args.failure_count, args.pressure_level);
    const calibration = args.requirements
      ? calibrateRequirements(args.requirements)
      : undefined;

    return {
      quality_compass: compass,
      trust_level: trust,
      recovery_protocol: recovery,
      calibration,
      questions: QUALITY_COMPASS_QUESTIONS,
      can_proceed_to_confidence_gate: compass.passed,
    };
  },
};
