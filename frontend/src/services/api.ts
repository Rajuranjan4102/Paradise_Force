import {
  GrievanceModel,
  DashboardMetrics,
  IncidentClusterModel,
  DepartmentModel,
  AlertModel,
  AuditLogModel,
  UserModel,
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
    const res = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
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
}

export const api = new ApiService();
