import { z } from 'zod';

export const GrievanceCategoryEnum = z.enum([
  'ROAD_DAMAGE',
  'WATERLOGGING',
  'GARBAGE_WASTE',
  'WATER_SUPPLY',
  'ELECTRICITY',
  'PUBLIC_SAFETY',
  'HEALTH_SANITATION',
]);

export const SeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const GrievanceStatusEnum = z.enum([
  'OPEN',
  'ASSIGNED',
  'IN_PROGRESS',
  'VERIFICATION',
  'RESOLVED',
]);

export const CreateGrievanceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(150),
  description: z.string().min(5, 'Description must be at least 5 characters long'),
  complainantName: z.string().min(2, 'Complainant name must be at least 2 characters'),
  complainantPhone: z.string().min(10, 'Phone number must have at least 10 digits'),
  isAnonymous: z.boolean().optional().default(false),
  originalLanguage: z.enum(['en', 'hi', 'bho']).optional().default('en'),
  
  // Location (supports exact GPS or geocoded resolution; can be omitted for unresolved)
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  address: z.string().optional().default(''),
  locality: z.string().optional().default(''),
  landmark: z.string().optional(),
  district: z.string().optional().default('Patna Central'),
  pincode: z.string().optional(),

  // Optional manual overrides (if not provided, AI engine computes)
  category: GrievanceCategoryEnum.optional(),
  severity: SeverityEnum.optional(),
  departmentId: z.string().optional(),

  // Phase 3 Multimodal & Source Fields
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'NONE']).optional(),
  mediaAnalysisJson: z.string().optional(),
  sourcePlatform: z.string().optional().default('CITIZEN_PORTAL'),
  sourceReference: z.string().optional(),
  sourceAuthorHandle: z.string().optional(),
  locationProvenance: z.string().optional(),
  locationConfidence: z.number().optional(),
});

export const VerifyMediaSchema = z.object({
  verified: z.boolean(),
  note: z.string().optional(),
});

export const UpdateStatusSchema = z.object({
  status: GrievanceStatusEnum,
  note: z.string().optional(),
});

export const AssignCaseSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  assignedOfficerId: z.string().optional().nullable(),
  note: z.string().optional(),
});

export const AddNoteSchema = z.object({
  noteText: z.string().min(3, 'Note must contain at least 3 characters'),
  isInternal: z.boolean().optional().default(true),
});

export const ResolveCaseSchema = z.object({
  resolutionNote: z.string().min(10, 'Resolution note must be detailed (min 10 characters)'),
});

export const GrievanceFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  category: z.string().optional(),
  district: z.string().optional(),
  departmentId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'severity', 'slaDeadline']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateGrievanceInput = z.infer<typeof CreateGrievanceSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type AssignCaseInput = z.infer<typeof AssignCaseSchema>;
export type AddNoteInput = z.infer<typeof AddNoteSchema>;
export type ResolveCaseInput = z.infer<typeof ResolveCaseSchema>;
export type GrievanceFilterQuery = z.infer<typeof GrievanceFilterSchema>;
