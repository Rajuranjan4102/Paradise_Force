import {
  PipelineInput,
  PipelineExecutionResult,
  StageTelemetry,
} from './types';
import { runIngestStage, runNormaliseStage } from './stages/normalise';
import { runClassifyStage } from './stages/classify';
import { runExtractStage } from './stages/extract';
import { runMatchStage, ExistingIncidentCandidate } from './stages/match';
import { runScoreStage, ScoreContext } from './stages/score';
import { runRouteStage } from './stages/route';
import { runAlertStage, AlertEvaluationContext } from './stages/alert';

export class IntelligencePipelineOrchestrator {
  /**
   * Executes the full 8-stage grievance intelligence pipeline:
   * INGEST -> NORMALISE -> CLASSIFY -> EXTRACT -> MATCH -> SCORE -> ROUTE -> ALERT
   */
  public execute(
    rawInput: PipelineInput,
    existingCases: ExistingIncidentCandidate[] = [],
    scoreContext: ScoreContext = {},
    alertContext: AlertEvaluationContext = {}
  ): PipelineExecutionResult {
    const pipelineStart = performance.now();
    const telemetry: StageTelemetry[] = [];

    // Stage 1: INGEST
    const { input: sanitizedInput, telemetry: ingestTel } = runIngestStage(rawInput);
    telemetry.push(ingestTel);

    // Stage 2: NORMALISE
    const { data: normalised, telemetry: normTel } = runNormaliseStage(sanitizedInput);
    telemetry.push(normTel);

    // Stage 3: CLASSIFY
    const { result: classify, telemetry: classTel } = runClassifyStage(normalised);
    telemetry.push(classTel);

    // Stage 4: EXTRACT
    const { entities, telemetry: extTel } = runExtractStage(normalised, sanitizedInput);
    telemetry.push(extTel);

    // Stage 5: MATCH
    const { result: match, telemetry: matchTel } = runMatchStage(
      normalised,
      sanitizedInput,
      classify,
      existingCases
    );
    telemetry.push(matchTel);

    // Stage 6: SCORE
    const { score, telemetry: scoreTel } = runScoreStage(classify, entities, match, scoreContext);
    telemetry.push(scoreTel);

    // Stage 7: ROUTE
    const isCritical = score.priority === 'CRITICAL';
    const { recommendation: route, telemetry: routeTel } = runRouteStage(
      classify,
      sanitizedInput,
      isCritical
    );
    telemetry.push(routeTel);

    // Stage 8: ALERT
    const { alertResult: alert, telemetry: alertTel } = runAlertStage(
      sanitizedInput,
      classify,
      entities,
      match,
      score,
      alertContext
    );
    telemetry.push(alertTel);

    const totalPipelineDurationMs = Number((performance.now() - pipelineStart).toFixed(2));

    return {
      ingest: sanitizedInput,
      normalise: normalised,
      classify,
      extract: entities,
      match,
      score,
      route,
      alert,
      telemetry,
      pipelineExecutionDurationMs: totalPipelineDurationMs,
    };
  }
}

export const pipelineOrchestrator = new IntelligencePipelineOrchestrator();
