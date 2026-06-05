import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleName: string;
  status: string;
  nomSociete?: string;
  country?: string;
  presignedUrl?: string;
}

export interface AdminUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  nomSociete?: string;
  country?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:9068/api/v1/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/admin/all`);
  }

  createUser(payload: AdminUserForm): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/create`, payload);
  }

  updateUser(userId: number, payload: Partial<AdminUserForm>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/${userId}/admin`, payload);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }

  updateUserStatus(userId: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/status?status=${status}`, {});
  }
}
