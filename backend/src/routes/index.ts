import { Router } from 'express';
import { grievanceController } from '../controllers/grievance.controller';
import { metricsController } from '../controllers/metrics.controller';
import { clusterController } from '../controllers/cluster.controller';
import { alertController } from '../controllers/alert.controller';
import { departmentController } from '../controllers/department.controller';
import { auditController } from '../controllers/audit.controller';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'JANRAKSHA AI Command Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0-hackathon',
  });
});

// Authentication / Personas (Demo switcher)
router.get('/auth/personas', authController.getPersonas);
router.get('/auth/me', authenticate, authController.getMe);

// Grievance Endpoints
router.get('/grievances', authenticate, grievanceController.list);
router.post('/grievances', authenticate, grievanceController.create);
router.get('/grievances/:id', authenticate, grievanceController.getById);

// Protected Status & Assignment Mutations (Role Restricted)
router.post(
  '/grievances/:id/assign',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER'),
  grievanceController.assign
);

router.post(
  '/grievances/:id/status',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER', 'FIELD_INVESTIGATOR'),
  grievanceController.updateStatus
);

router.post(
  '/grievances/:id/resolve',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER'),
  grievanceController.resolve
);

router.post('/grievances/:id/notes', authenticate, grievanceController.addNote);

// Priority Review & Official Override (Role Restricted)
router.post(
  '/grievances/:id/priority-override',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER'),
  grievanceController.overridePriority
);

// Duplicate Candidate Management (Confirm / Reject / Audit)
router.get('/duplicates', authenticate, grievanceController.listDuplicates);
router.post(
  '/duplicates/:id/confirm',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER'),
  grievanceController.confirmDuplicate
);
router.post(
  '/duplicates/:id/reject',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER'),
  grievanceController.rejectDuplicate
);

// Metrics & Analytics
router.get('/metrics/dashboard', authenticate, metricsController.getDashboard);

// Incident Clusters
router.get('/clusters', authenticate, clusterController.list);
router.get('/clusters/:id', authenticate, clusterController.getById);
router.post(
  '/clusters/:id/status',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE'),
  clusterController.updateStatus
);
router.post(
  '/clusters/:id/merge',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE'),
  clusterController.mergeCases
);
router.delete(
  '/clusters/cases/:grievanceId',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE'),
  clusterController.removeCase
);

// Alerts Feed
router.get('/alerts', authenticate, alertController.list);
router.patch('/alerts/:id/read', authenticate, alertController.markAsRead);

// Departments, Workload & Routing Recommendation
router.get('/departments/recommend', authenticate, departmentController.recommend);
router.get('/departments', authenticate, departmentController.list);
router.get('/departments/:id', authenticate, departmentController.getById);

// Audit Trail Viewer (Authorized roles only)
router.get(
  '/audit',
  authenticate,
  authorize('SUPER_ADMIN', 'DISTRICT_MAGISTRATE'),
  auditController.list
);

export default router;
