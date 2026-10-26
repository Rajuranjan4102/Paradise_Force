import { ClassificationResult, PipelineInput, RoutingRecommendation, StageTelemetry } from '../types';

export interface DepartmentRule {
  code: string;
  name: string;
  defaultSlaHours: number;
  criticalSlaHours: number;
  description: string;
}

export const DEPARTMENT_RULES: Record<string, DepartmentRule> = {
  ROAD_DAMAGE: {
    code: 'PWD',
    name: 'Road Construction & Public Works (RCD/PWD)',
    defaultSlaHours: 48,
    criticalSlaHours: 12,
    description: 'Pothole remediation, road cave-in repair, highway asphalt integrity',
  },
  WATERLOGGING: {
    code: 'DRAINAGE',
    name: 'Urban Drainage & Flood Mitigation Division',
    defaultSlaHours: 24,
    criticalSlaHours: 6,
    description: 'Storm culvert unblocking, pump station dispatch, standing water clearance',
  },
  WATER_SUPPLY: {
    code: 'WSS',
    name: 'Water Supply & Public Health Engineering (PHED)',
    defaultSlaHours: 24,
    criticalSlaHours: 12,
    description: 'Potable water main repair, contamination remediation, valve servicing',
  },
  ELECTRICITY: {
    code: 'ELEC',
    name: 'Bihar State Power Holding Company (BSPHCL)',
    defaultSlaHours: 12,
    criticalSlaHours: 4,
    description: '11kV transformer arcing, live wire isolation, feeder maintenance',
  },
  GARBAGE_WASTE: {
    code: 'SWM',
    name: 'Municipal Solid Waste & Sanitation Bureau',
    defaultSlaHours: 36,
    criticalSlaHours: 12,
    description: 'Open dump clearance, community bin sanitization, anti-vector spraying',
  },
  INFRASTRUCTURE: {
    code: 'PWD',
    name: 'Road Construction & Public Works (RCD/PWD)',
    defaultSlaHours: 48,
    criticalSlaHours: 12,
    description: 'Bridges, structural flyovers, culverts, and arterial infrastructure safety',
  },
  OTHER_CIVIC: {
    code: 'POLICE',
    name: 'Bihar Police Civic Order & Traffic Command',
    defaultSlaHours: 6,
    criticalSlaHours: 2,
    description: 'Traffic gridlock clearance, dark-spot patrolling, public safety escort',
  },
};

const JURISDICTION_OFFICES: Record<string, string> = {
  'Patna Central': 'Patna Central Zonal Command (Control Room Bailey Road)',
  'Gaya City': 'Gaya Municipal Division Office (Station Road Circle)',
  'Muzaffarpur North': 'Muzaffarpur North Engineering Cell (Zero Mile Hub)',
  'Bhagalpur East': 'Bhagalpur City Municipal Division (Tilka Manjhi Chowk)',
  'Darbhanga West': 'Darbhanga Zonal Operations Centre (Tower Chowk)',
};

export function runRouteStage(
  classify: ClassificationResult,
  input: PipelineInput,
  isCritical: boolean = false
): { recommendation: RoutingRecommendation; telemetry: StageTelemetry } {
  const start = performance.now();

  const rule = DEPARTMENT_RULES[classify.category] || DEPARTMENT_RULES['OTHER_CIVIC'];
  const slaHours = isCritical ? rule.criticalSlaHours : rule.defaultSlaHours;
  const jurisdictionOffice =
    JURISDICTION_OFFICES[input.district] || `${input.district} Civic Operations Cell`;

  const routingReason = `Category '${classify.category}' maps to ${rule.name}. Designated jurisdiction: ${jurisdictionOffice} with target turnaround of ${slaHours} hours.`;

  const durationMs = performance.now() - start;

  return {
    recommendation: {
      departmentCode: rule.code,
      departmentName: rule.name,
      slaHours,
      routingReason,
      requiresHumanConfirmation: true, // Human-in-the-loop requirement
      jurisdictionOffice,
    },
    telemetry: {
      stage: 'ROUTE',
      timestamp: new Date().toISOString(),
      method: 'DETERMINISTIC_RULES',
      algorithm: 'ConfigurableCategoryJurisdictionRouter',
      confidence: 0.98,
      durationMs: Number(durationMs.toFixed(2)),
      metadata: { departmentCode: rule.code, slaHours, requiresHumanConfirmation: true },
    },
  };
}
