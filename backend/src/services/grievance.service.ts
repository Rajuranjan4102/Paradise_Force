import { prisma } from '../lib/prisma';
import { aiAnalysisService, ExistingCaseSummary } from './aiAnalysis.service';
import { auditService } from './audit.service';
import { geocodingService } from './geospatial/geocodingService';
import { privacyService } from './privacy/privacyService';
import {
  CreateGrievanceInput,
  GrievanceFilterQuery,
  UpdateStatusInput,
  AssignCaseInput,
  ResolveCaseInput,
  AddNoteInput,
} from '../schemas/grievance.schema';
import { AuthUser } from '../middleware/auth';

export class GrievanceService {
  async listGrievances(query: GrievanceFilterQuery, user?: AuthUser) {
    const {
      search,
      status,
      severity,
      category,
      district,
      departmentId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based scoping: Department officers only see their department cases
    if (user && user.role === 'DEPARTMENT_OFFICER' && user.departmentId) {
      where.departmentId = user.departmentId;
    } else if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (district && district !== 'ALL') {
      where.location = {
        district: district,
      };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { trackingId: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { complainantName: { contains: q } },
        { location: { locality: { contains: q } } },
        { location: { address: { contains: q } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.grievance.count({ where }),
      prisma.grievance.findMany({
        where,
        include: {
          location: true,
          department: true,
          assignedOfficer: {
            select: { id: true, name: true, email: true, role: true, badgeNumber: true },
          },
          aiAnalysis: true,
          incidentCluster: {
            select: { id: true, clusterCode: true, title: true, severity: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    const sanitizedItems = items.map(item => privacyService.sanitizeGrievanceForDisplay(item, user?.role));

    return {
      items: sanitizedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGrievanceById(id: string, user?: AuthUser) {
    const grievance = await prisma.grievance.findUnique({
      where: { id },
      include: {
        location: true,
        department: {
          include: {
            officers: {
              select: { id: true, name: true, role: true, email: true, badgeNumber: true },
            },
          },
        },
        assignedOfficer: {
          select: { id: true, name: true, email: true, role: true, badgeNumber: true, phone: true },
        },
        aiAnalysis: true,
        incidentCluster: {
          include: {
            grievances: {
              where: { id: { not: id } },
              select: {
                id: true,
                trackingId: true,
                title: true,
                severity: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        sourceDuplicates: {
          include: {
            targetGrievance: {
              select: { id: true, trackingId: true, title: true, severity: true, status: true, location: true },
            },
          },
        },
        targetDuplicates: {
          include: {
            sourceGrievance: {
              select: { id: true, trackingId: true, title: true, severity: true, status: true, location: true },
            },
          },
        },
      },
    });

    if (!grievance) {
      throw new Error(`Grievance with ID ${id} not found`);
    }

    // Fetch related audit logs for this grievance
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'GRIEVANCE',
        entityId: id,
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    const sanitized = privacyService.sanitizeGrievanceForDisplay(grievance, user?.role);
    return { ...sanitized, auditLogs };
  }

  async createGrievance(input: CreateGrievanceInput, user?: AuthUser) {
    // Generate unique tracking code (JAN-YYYY-XXXX)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `JAN-2026-${randomSuffix}`;

    // 1. Fetch recent open cases to supply to AI duplicate & cluster detector
    const recentCases = await prisma.grievance.findMany({
      where: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      },
      take: 50,
      include: { location: true },
    });

    const caseSummaries: ExistingCaseSummary[] = recentCases.map(c => ({
      id: c.id,
      trackingId: c.trackingId,
      title: c.title,
      description: c.description,
      category: c.category,
      district: c.location?.district || 'Patna Central',
      locality: c.location?.locality || 'Urban Ward',
      latitude: c.location?.latitude || 25.5941,
      longitude: c.location?.longitude || 85.1376,
      incidentClusterId: c.incidentClusterId,
    }));

    // 2. Resolve Geospatial Coordinates with Provenance
    const geoResult = geocodingService.resolveLocation(
      `${input.title} ${input.description}`,
      input.district,
      input.locality,
      input.latitude ?? undefined,
      input.longitude ?? undefined
    );

    // 3. Privacy Redaction
    const { redactedText } = privacyService.redactPII(input.description);

    // 4. Run Modular AI Analysis
    const resolvedLat = geoResult.latitude ?? 25.5941;
    const resolvedLng = geoResult.longitude ?? 85.1376;
    const aiResult = aiAnalysisService.analyzeComplaint(
      input.title,
      input.description,
      geoResult.district || input.district || 'Patna Central',
      geoResult.locality || input.locality || 'Urban Ward',
      resolvedLat,
      resolvedLng,
      caseSummaries
    );

    const category = input.category || aiResult.category;
    const severity = input.severity || aiResult.priority;

    // 5. Find default department for category if not specified
    let departmentId = input.departmentId;
    if (!departmentId) {
      const categoryDeptMap: Record<string, string> = {
        ROAD_DAMAGE: 'PWD',
        WATERLOGGING: 'DRAINAGE',
        GARBAGE_WASTE: 'SWM',
        WATER_SUPPLY: 'WSS',
        ELECTRICITY: 'ELEC',
        PUBLIC_SAFETY: 'POLICE',
        HEALTH_SANITATION: 'DRAINAGE',
      };
      const deptCode = categoryDeptMap[category] || 'PWD';
      const dept = await prisma.department.findUnique({ where: { code: deptCode } });
      if (dept) {
        departmentId = dept.id;
      }
    }

    // 6. Calculate SLA deadline based on severity
    const hours = severity === 'CRITICAL' ? 12 : severity === 'HIGH' ? 24 : severity === 'MEDIUM' ? 48 : 72;
    const slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    // 7. Verify cluster ID exists if detected
    let assignedClusterId: string | null = null;
    if (aiResult.duplicateCheck.clusterCandidateId) {
      const clusterExists = await prisma.incidentCluster.findUnique({
        where: { id: aiResult.duplicateCheck.clusterCandidateId },
      });
      if (clusterExists) {
        assignedClusterId = clusterExists.id;
      }
    }

    // 8. Create Location (only if resolved coordinates exist)
    let locationId: string | null = null;
    if (geoResult.latitude !== null && geoResult.longitude !== null) {
      const location = await prisma.location.create({
        data: {
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          address: input.address || `${geoResult.locality}, ${geoResult.district}`,
          locality: geoResult.locality || input.locality || 'Unknown',
          landmark: input.landmark || null,
          district: geoResult.district || input.district || 'Patna Central',
          pincode: input.pincode || null,
          confidence: geoResult.confidence,
        },
      });
      locationId = location.id;
    }

    // 9. Create Grievance
    const grievance = await prisma.grievance.create({
      data: {
        trackingId,
        title: input.title,
        description: input.description,
        originalLanguage: input.originalLanguage || 'en',
        category,
        severity,
        status: 'OPEN',
        complainantName: input.complainantName,
        complainantPhone: input.complainantPhone,
        isAnonymous: input.isAnonymous || false,
        locationId,
        locationProvenance: input.locationProvenance || geoResult.provenance,
        locationConfidence: input.locationConfidence || geoResult.confidence,
        departmentId: departmentId || null,
        incidentClusterId: assignedClusterId,
        slaDeadline,
        mediaUrl: input.mediaUrl || null,
        mediaType: input.mediaType || 'NONE',
        mediaAnalysisJson: input.mediaAnalysisJson || null,
        sourcePlatform: input.sourcePlatform || 'CITIZEN_PORTAL',
        sourceReference: input.sourceReference || null,
        sourceAuthorHandle: input.sourceAuthorHandle || null,
        redactedDescription: redactedText,
      },
    });

    // 10. Store AI Analysis record with 8-stage pipeline telemetry
    await prisma.aIAnalysis.create({
      data: {
        grievanceId: grievance.id,
        category: aiResult.category,
        categoryConfidence: aiResult.categoryConfidence,
        priority: aiResult.priority,
        priorityReason: aiResult.priorityReason,
        sentiment: aiResult.sentiment,
        sentimentScore: aiResult.sentimentScore,
        urgencyScore: aiResult.urgencyScore,
        entitiesJson: JSON.stringify(aiResult.entities),
        duplicateScore: aiResult.duplicateCheck.similarityScore,
        isDuplicateCandidate: aiResult.duplicateCheck.isPotentialDuplicate,
        duplicateReason: aiResult.duplicateCheck.matchReason || null,
        engineMode: aiResult.engineMode,
        modelProvider: aiResult.modelProvider || 'LOCAL_TFIDF_RULES',
        modelVersion: aiResult.modelVersion || 'v3.2-bilingual',
        languageDetected: aiResult.languageDetected || 'en',
        sentimentLabel: aiResult.sentiment || 'Neutral',
        pipelineMetaJson: JSON.stringify({
          telemetry: aiResult.pipelineTelemetry || [],
          scoreBreakdown: aiResult.scoreBreakdown || null,
          routeRecommendation: aiResult.routeRecommendation || null,
        }),
      },
    });

    // 9. If duplicate match candidate detected, record auditable candidate relationship
    if (aiResult.duplicateCheck.isPotentialDuplicate && aiResult.duplicateCheck.matchedGrievanceId) {
      await prisma.duplicateCandidate.create({
        data: {
          sourceGrievanceId: grievance.id,
          targetGrievanceId: aiResult.duplicateCheck.matchedGrievanceId,
          similarityScore: aiResult.duplicateCheck.similarityScore,
          evidenceJson: JSON.stringify(aiResult.duplicateCheck.evidence || { reason: aiResult.duplicateCheck.matchReason }),
          status: 'PENDING',
        },
      });
    }

    // 10. Log Audit Record
    await auditService.record({
      action: 'GRIEVANCE_CREATED',
      actorId: user?.id || 'citizen-portal',
      actorName: user?.name || input.complainantName,
      actorRole: user?.role || 'CITIZEN',
      entityType: 'GRIEVANCE',
      entityId: grievance.id,
      newValues: {
        trackingId,
        category,
        severity,
        district: input.district,
        engineMode: aiResult.engineMode,
      },
    });

    // 11. Spawn alerts from pipeline alert stage or critical severity
    if (aiResult.triggeredAlerts && aiResult.triggeredAlerts.length > 0) {
      for (const tAlert of aiResult.triggeredAlerts) {
        await prisma.alert.create({
          data: {
            title: tAlert.title,
            message: tAlert.message,
            severity: tAlert.severity,
            type: tAlert.type,
            district: tAlert.district,
            metadata: JSON.stringify({
              grievanceId: grievance.id,
              trackingId,
              trigger: tAlert.trigger,
              supportingCaseIds: tAlert.supportingCaseIds,
            }),
          },
        });
      }
    } else if (severity === 'CRITICAL') {
      await prisma.alert.create({
        data: {
          title: `CRITICAL ALERT: ${input.title}`,
          message: `Immediate response required at ${input.locality}, ${input.district}. ${aiResult.priorityReason}`,
          severity: 'CRITICAL',
          type: 'SEVERITY_SURGE',
          district: input.district,
          metadata: JSON.stringify({ grievanceId: grievance.id, trackingId, trigger: 'CRITICAL_SEVERITY_INGEST' }),
        },
      });
    }

    return this.getGrievanceById(grievance.id);
  }

  async assignGrievance(id: string, input: AssignCaseInput, user: AuthUser) {
    const existing = await prisma.grievance.findUnique({
      where: { id },
      include: { department: true, assignedOfficer: true },
    });

    if (!existing) {
      throw new Error(`Grievance ${id} not found`);
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        departmentId: input.departmentId,
        assignedOfficerId: input.assignedOfficerId || null,
        status: existing.status === 'OPEN' ? 'ASSIGNED' : existing.status,
      },
      include: {
        department: true,
        assignedOfficer: true,
      },
    });

    if (input.note) {
      await prisma.caseNote.create({
        data: {
          grievanceId: id,
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          noteText: `Assignment change note: ${input.note}`,
          isInternal: true,
        },
      });
    }

    await auditService.record({
      action: 'CASE_ASSIGNED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'GRIEVANCE',
      entityId: id,
      oldValues: {
        department: existing.department?.name,
        assignedOfficer: existing.assignedOfficer?.name,
        status: existing.status,
      },
      newValues: {
        departmentId: input.departmentId,
        assignedOfficerId: input.assignedOfficerId,
        status: updated.status,
      },
    });

    return this.getGrievanceById(id);
  }

  async updateStatus(id: string, input: UpdateStatusInput, user: AuthUser) {
    const existing = await prisma.grievance.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Grievance ${id} not found`);
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        status: input.status,
      },
    });

    if (input.note) {
      await prisma.caseNote.create({
        data: {
          grievanceId: id,
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          noteText: `Status updated to ${input.status}: ${input.note}`,
          isInternal: true,
        },
      });
    }

    await auditService.record({
      action: 'STATUS_UPDATED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'GRIEVANCE',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: input.status, note: input.note },
    });

    return this.getGrievanceById(id);
  }

  async resolveGrievance(id: string, input: ResolveCaseInput, user: AuthUser) {
    const existing = await prisma.grievance.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Grievance ${id} not found`);
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolutionNote: input.resolutionNote,
        resolvedAt: new Date(),
      },
    });

    await prisma.caseNote.create({
      data: {
        grievanceId: id,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        noteText: `OFFICIAL RESOLUTION: ${input.resolutionNote}`,
        isInternal: false,
      },
    });

    await auditService.record({
      action: 'CASE_RESOLVED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'GRIEVANCE',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: 'RESOLVED', resolutionNote: input.resolutionNote },
    });

    return this.getGrievanceById(id);
  }

  async addCaseNote(id: string, input: AddNoteInput, user: AuthUser) {
    const note = await prisma.caseNote.create({
      data: {
        grievanceId: id,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        noteText: input.noteText,
        isInternal: input.isInternal,
      },
    });

    await auditService.record({
      action: 'NOTE_ADDED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'GRIEVANCE',
      entityId: id,
      newValues: { noteId: note.id, isInternal: input.isInternal },
    });

    return note;
  }

  /**
   * Phase 2: Official priority review & override with mandatory documented justification
   */
  async overridePriority(id: string, newPriority: string, reason: string, user: AuthUser) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason is required for an official priority override');
    }

    const existing = await prisma.grievance.findUnique({ where: { id } });
    if (!existing) throw new Error(`Grievance ${id} not found`);

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        severity: newPriority,
        priorityOverridden: true,
        priorityOverrideReason: reason,
        priorityOverriddenBy: `${user.name} (${user.role})`,
      },
    });

    // Record internal case note
    await prisma.caseNote.create({
      data: {
        grievanceId: id,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        noteText: `PRIORITY OVERRIDE: Changed from ${existing.severity} to ${newPriority}. Justification: ${reason}`,
        isInternal: true,
      },
    });

    // Immutable audit record
    await auditService.record({
      action: 'PRIORITY_OVERRIDDEN',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'GRIEVANCE',
      entityId: id,
      oldValues: { severity: existing.severity },
      newValues: { severity: newPriority, reason, overriddenBy: user.name },
    });

    return this.getGrievanceById(id);
  }

  /**
   * Phase 2: Duplicate candidate detection review & management
   */
  async listDuplicateCandidates(status?: string) {
    return prisma.duplicateCandidate.findMany({
      where: status && status !== 'ALL' ? { status } : {},
      include: {
        sourceGrievance: {
          include: { location: true },
        },
        targetGrievance: {
          include: { location: true },
        },
      },
      orderBy: { similarityScore: 'desc' },
      take: 50,
    });
  }

  async confirmDuplicateCandidate(candidateId: string, user: AuthUser, clusterTitle?: string) {
    const candidate = await prisma.duplicateCandidate.findUnique({
      where: { id: candidateId },
      include: {
        sourceGrievance: { include: { location: true } },
        targetGrievance: { include: { location: true } },
      },
    });

    if (!candidate) throw new Error('Duplicate candidate not found');

    // 1. Determine or create cluster
    let clusterId =
      candidate.sourceGrievance.incidentClusterId ||
      candidate.targetGrievance.incidentClusterId;

    if (!clusterId) {
      // Create new incident cluster from these twin cases
      const loc = candidate.sourceGrievance.location;
      const districtName = loc?.district || 'Patna Central';
      const localityName = loc?.locality || 'Urban Ward';
      const newCluster = await prisma.incidentCluster.create({
        data: {
          clusterCode: `CLUST-${districtName.replace(/\s+/g, '').toUpperCase().slice(0, 5)}-${Math.floor(100 + Math.random() * 900)}`,
          title: clusterTitle || `Incident Cluster: ${candidate.sourceGrievance.title.slice(0, 60)}`,
          description: `Grouped reports for verified incident at ${localityName}`,
          category: candidate.sourceGrievance.category,
          district: districtName,
          locality: localityName,
          rootCause: `Multi-complainant civic disruption: confirmed correlation between ${candidate.sourceGrievance.trackingId} and ${candidate.targetGrievance.trackingId}`,
          severity: candidate.sourceGrievance.severity === 'CRITICAL' || candidate.targetGrievance.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          status: 'INVESTIGATING',
          centerLat: loc?.latitude ?? 25.5941,
          centerLng: loc?.longitude ?? 85.1376,
          radiusMeters: 400,
        },
      });
      clusterId = newCluster.id;
    }

    // 2. Link both grievances to cluster without deleting any reports
    await Promise.all([
      prisma.grievance.update({
        where: { id: candidate.sourceGrievanceId },
        data: { incidentClusterId: clusterId },
      }),
      prisma.grievance.update({
        where: { id: candidate.targetGrievanceId },
        data: { incidentClusterId: clusterId },
      }),
    ]);

    // 3. Mark candidate as CONFIRMED
    const updatedCandidate = await prisma.duplicateCandidate.update({
      where: { id: candidateId },
      data: {
        status: 'CONFIRMED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: `Confirmed by ${user.name} (${user.role}). Associated with Cluster ID ${clusterId}.`,
      },
    });

    // 4. Audit Log
    await auditService.record({
      action: 'DUPLICATE_CONFIRMED_MERGED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'DUPLICATE_CANDIDATE',
      entityId: candidateId,
      newValues: {
        clusterId,
        sourceTrackingId: candidate.sourceGrievance.trackingId,
        targetTrackingId: candidate.targetGrievance.trackingId,
        similarityScore: candidate.similarityScore,
      },
    });

    return updatedCandidate;
  }

  async rejectDuplicateCandidate(candidateId: string, notes: string, user: AuthUser) {
    const candidate = await prisma.duplicateCandidate.findUnique({
      where: { id: candidateId },
      include: { sourceGrievance: true, targetGrievance: true },
    });

    if (!candidate) throw new Error('Duplicate candidate not found');

    const updated = await prisma.duplicateCandidate.update({
      where: { id: candidateId },
      data: {
        status: 'REJECTED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: notes || `Rejected by ${user.name}: records represent distinct incidents.`,
      },
    });

    await auditService.record({
      action: 'DUPLICATE_REJECTED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      entityType: 'DUPLICATE_CANDIDATE',
      entityId: candidateId,
      newValues: {
        sourceTrackingId: candidate.sourceGrievance.trackingId,
        targetTrackingId: candidate.targetGrievance.trackingId,
        notes,
      },
    });

    return updated;
  }

  async verifyMedia(id: string, verified: boolean, note?: string, user?: AuthUser) {
    const grievance = await prisma.grievance.findUnique({ where: { id } });
    if (!grievance) {
      throw new Error(`Grievance with ID ${id} not found`);
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data: {
        mediaVerified: verified,
        mediaVerifiedBy: user?.name || 'Authorized Officer',
        mediaVerifiedAt: new Date(),
        mediaVerificationNote: note || null,
      },
    });

    await auditService.record({
      action: 'MEDIA_VERIFIED',
      actorId: user?.id || 'officer',
      actorName: user?.name || 'Authorized Officer',
      actorRole: user?.role || 'DEPARTMENT_OFFICER',
      entityType: 'MEDIA',
      entityId: id,
      newValues: {
        mediaVerified: verified,
        mediaVerifiedBy: user?.name || 'Authorized Officer',
        mediaVerificationNote: note,
      },
    });

    return updated;
  }
}

export const grievanceService = new GrievanceService();
