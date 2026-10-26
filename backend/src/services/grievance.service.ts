import { prisma } from '../lib/prisma';
import { aiAnalysisService, ExistingCaseSummary } from './aiAnalysis.service';
import { auditService } from './audit.service';
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

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGrievanceById(id: string) {
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

    return { ...grievance, auditLogs };
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
      district: c.location.district,
      locality: c.location.locality,
      latitude: c.location.latitude,
      longitude: c.location.longitude,
      incidentClusterId: c.incidentClusterId,
    }));

    // 2. Run Modular AI Analysis
    const aiResult = aiAnalysisService.analyzeComplaint(
      input.title,
      input.description,
      input.district,
      input.locality,
      input.latitude,
      input.longitude,
      caseSummaries
    );

    const category = input.category || aiResult.category;
    const severity = input.severity || aiResult.priority;

    // 3. Find default department for category if not specified
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

    // 4. Calculate SLA deadline based on severity
    const hours = severity === 'CRITICAL' ? 12 : severity === 'HIGH' ? 24 : severity === 'MEDIUM' ? 48 : 72;
    const slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    // 5. Verify cluster ID exists if detected
    let assignedClusterId: string | null = null;
    if (aiResult.duplicateCheck.clusterCandidateId) {
      const clusterExists = await prisma.incidentCluster.findUnique({
        where: { id: aiResult.duplicateCheck.clusterCandidateId },
      });
      if (clusterExists) {
        assignedClusterId = clusterExists.id;
      }
    }

    // 6. Create Location
    const location = await prisma.location.create({
      data: {
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        locality: input.locality,
        landmark: input.landmark || null,
        district: input.district,
        pincode: input.pincode || null,
        confidence: 0.95,
      },
    });

    // 7. Create Grievance
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
        locationId: location.id,
        departmentId: departmentId || null,
        incidentClusterId: assignedClusterId,
        slaDeadline,
      },
    });

    // 8. Store AI Analysis record
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
      },
    });

    // 8. Log Audit Record
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
      },
    });

    // 9. If Critical, spawn an Alert
    if (severity === 'CRITICAL') {
      await prisma.alert.create({
        data: {
          title: `CRITICAL ALERT: ${input.title}`,
          message: `Immediate response required at ${input.locality}, ${input.district}. ${aiResult.priorityReason}`,
          severity: 'CRITICAL',
          type: 'SEVERITY_SURGE',
          district: input.district,
          metadata: JSON.stringify({ grievanceId: grievance.id, trackingId }),
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
}

export const grievanceService = new GrievanceService();
