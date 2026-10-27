import {
  GrievanceModel,
  DashboardMetrics,
  IncidentClusterModel,
  DepartmentModel,
  AlertModel,
  AuditLogModel,
  UserModel,
  ConnectorStatus,
  EvaluationResults,
  SystemStatusData,
  DemoStepResult,
  DemoOverview,
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private activeRole: string = 'SUPER_ADMIN';
  private activeEmail: string = 'admin@biharpolice.gov.in';

  public setPersona(role: string, email: string) {
    this.activeRole = role;
    this.activeEmail = email;
    localStorage.setItem('janraksha_persona_role', role);
    localStorage.setItem('janraksha_persona_email', email);
  }

  public getPersona() {
    return {
      role: localStorage.getItem('janraksha_persona_role') || this.activeRole,
      email: localStorage.getItem('janraksha_persona_email') || this.activeEmail,
    };
  }

  private getHeaders(): HeadersInit {
    const persona = this.getPersona();
    return {
      'Content-Type': 'application/json',
      'x-user-role': persona.role,
      'x-user-email': persona.email,
    };
  }

  async fetchDashboardMetrics(district?: string): Promise<DashboardMetrics> {
    const url = district && district !== 'ALL'
      ? `${API_BASE}/metrics/dashboard?district=${encodeURIComponent(district)}`
      : `${API_BASE}/metrics/dashboard`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch metrics');
    return data.data;
  }

  async fetchGrievances(params: {
    search?: string;
    status?: string;
    severity?: string;
    category?: string;
    district?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: GrievanceModel[]; pagination: { total: number; page: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.severity && params.severity !== 'ALL') query.set('severity', params.severity);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.district && params.district !== 'ALL') query.set('district', params.district);
    if (params.departmentId && params.departmentId !== 'ALL') query.set('departmentId', params.departmentId);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/grievances?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch grievances');
    return data.data;
  }

  async fetchGrievanceById(id: string): Promise<GrievanceModel> {
    const res = await fetch(`${API_BASE}/grievances/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch grievance details');
    return data.data;
  }

  async createGrievance(payload: any): Promise<GrievanceModel> {
    const persona = this.getPersona();
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const headers: HeadersInit = {
      'x-user-role': persona.role,
      'x-user-email': persona.email,
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers,
      body: isFormData ? payload : JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to create grievance');
    return data.data;
  }

  async assignGrievance(
    id: string,
    departmentId: string,
    assignedOfficerId?: string | null,
    note?: string
  ): Promise<GrievanceModel> {
    const res = await fetch(`${API_BASE}/grievances/${id}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ departmentId, assignedOfficerId, note }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to assign grievance');
    return data.data;
  }

  async updateStatus(id: string, status: string, note?: string): Promise<GrievanceModel> {
    const res = await fetch(`${API_BASE}/grievances/${id}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to update status');
    return data.data;
  }

  async resolveGrievance(id: string, resolutionNote: string): Promise<GrievanceModel> {
    const res = await fetch(`${API_BASE}/grievances/${id}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ resolutionNote }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to resolve grievance');
    return data.data;
  }

  async addCaseNote(id: string, noteText: string, isInternal: boolean = true) {
    const res = await fetch(`${API_BASE}/grievances/${id}/notes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ noteText, isInternal }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to add note');
    return data.data;
  }

  async fetchClusters(district?: string): Promise<IncidentClusterModel[]> {
    const url = district && district !== 'ALL'
      ? `${API_BASE}/clusters?district=${encodeURIComponent(district)}`
      : `${API_BASE}/clusters`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch clusters');
    return data.data;
  }

  async updateClusterStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/clusters/${id}/status`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to update cluster status');
    return data.data;
  }

  async fetchAlerts(): Promise<AlertModel[]> {
    const res = await fetch(`${API_BASE}/alerts`, { headers: this.getHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch alerts');
    return data.data;
  }

  async markAlertRead(id: string): Promise<AlertModel> {
    const res = await fetch(`${API_BASE}/alerts/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to mark alert as read');
    return data.data;
  }

  async fetchDepartments(): Promise<DepartmentModel[]> {
    const res = await fetch(`${API_BASE}/departments`, { headers: this.getHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch departments');
    return data.data;
  }

  async fetchAuditLogs(limit = 50): Promise<AuditLogModel[]> {
    const res = await fetch(`${API_BASE}/audit?limit=${limit}`, { headers: this.getHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch audit logs');
    return data.data;
  }

  async fetchPersonas(): Promise<UserModel[]> {
    const res = await fetch(`${API_BASE}/auth/personas`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch personas');
    return data.data;
  }

  // Phase 2: Priority Override with Mandatory Reason
  async overridePriority(id: string, priority: string, reason: string): Promise<GrievanceModel> {
    const res = await fetch(`${API_BASE}/grievances/${id}/priority-override`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ priority, reason }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to override priority');
    return data.data;
  }

  // Phase 2: Duplicate Candidates Review Queue
  async fetchDuplicateCandidates(status?: string): Promise<any[]> {
    const url = status && status !== 'ALL' ? `${API_BASE}/duplicates?status=${status}` : `${API_BASE}/duplicates`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch duplicate candidates');
    return data.data;
  }

  async confirmDuplicate(id: string, clusterTitle?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/duplicates/${id}/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ clusterTitle }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to confirm duplicate candidate');
    return data.data;
  }

  async rejectDuplicate(id: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/duplicates/${id}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to reject duplicate candidate');
    return data.data;
  }

  // Phase 2: Cluster Case Merging & Removal
  async mergeCasesIntoCluster(clusterId: string, grievanceIds: string[]): Promise<IncidentClusterModel> {
    const res = await fetch(`${API_BASE}/clusters/${clusterId}/merge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ grievanceIds }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to merge cases into cluster');
    return data.data;
  }

  async removeCaseFromCluster(grievanceId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/clusters/cases/${grievanceId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to remove case from cluster');
    return data.data;
  }

  // Phase 2: Department Recommendation
  async fetchDepartmentRecommendation(category: string, district?: string): Promise<any> {
    const url = `${API_BASE}/departments/recommend?category=${encodeURIComponent(category)}&district=${encodeURIComponent(district || 'Patna Central')}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch recommendation');
    return data.data;
  }

  // Phase 3: Multimodal Evidence Official Verification
  async verifyMedia(id: string, verified: boolean, note?: string): Promise<GrievanceModel> {
    const res = await fetch(`${API_BASE}/grievances/${id}/media-verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ verified, note }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to verify media');
    return data.data;
  }

  // Phase 3: Social & Feed Connectors
  async fetchConnectors(): Promise<ConnectorStatus[]> {
    const res = await fetch(`${API_BASE}/ingestion/connectors`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch connector statuses');
    return data.data;
  }

  async importBatch(formDataOrJson: FormData | { csvText?: string; records?: any[]; source?: string }): Promise<any> {
    const persona = this.getPersona();
    const isFormData = typeof FormData !== 'undefined' && formDataOrJson instanceof FormData;
    const headers: HeadersInit = {
      'x-user-role': persona.role,
      'x-user-email': persona.email,
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}/ingestion/import`, {
      method: 'POST',
      headers,
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Batch import failed');
    return data.data;
  }

  async fetchIngestionHistory(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/ingestion/history`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch import history');
    return data.data;
  }

  // Phase 3: Benchmark & Evaluation Runner
  async runBenchmarkEvaluation(): Promise<EvaluationResults> {
    const res = await fetch(`${API_BASE}/evaluation/benchmark`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Benchmark evaluation failed');
    return data.data;
  }

  async fetchBenchmarkDataset(): Promise<any> {
    const res = await fetch(`${API_BASE}/evaluation/dataset`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch benchmark dataset');
    return data.data;
  }

  // Phase 4: System Status & Health Diagnostics
  async fetchSystemStatus(): Promise<SystemStatusData> {
    const res = await fetch(`${API_BASE}/system/status`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch system status');
    return data.data;
  }

  // Phase 4: Guided Demonstration & Environment Reset
  async fetchDemoOverview(): Promise<DemoOverview> {
    const res = await fetch(`${API_BASE}/demo/overview`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch demo overview');
    return data.data;
  }

  async runDemoStep(step: number): Promise<DemoStepResult> {
    const res = await fetch(`${API_BASE}/demo/step`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ step }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || `Failed to execute demo step ${step}`);
    return data.data;
  }

  async resetDemoData(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to reset demo data');
    return data.data;
  }
}

export const api = new ApiService();
