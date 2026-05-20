import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/User.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private jwtHelper = new JwtHelperService();

  private roleSubject = new BehaviorSubject<string | null>(null);
  role$ = this.roleSubject.asObservable();

  private authStateSubject = new BehaviorSubject<boolean>(false);
  authStateChange = this.authStateSubject.asObservable();

  private documentUpdateSubject = new BehaviorSubject<boolean>(false);
  documentUpdate$ = this.documentUpdateSubject.asObservable();

  private dataUpdateSubject = new BehaviorSubject<boolean>(false);
  dataUpdate$ = this.dataUpdateSubject.asObservable();

  constructor(private http: HttpClient) {
    if (this.isAuthenticated()) {
      this.documentUpdateSubject.next(true);
      this.authStateSubject.next(true);
      this.roleSubject.next(this.getRole());
      this.dataUpdateSubject.next(true);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;
    return this.jwtHelper.decodeToken(token);
  }

  /** Rôle JWT : plusieurs backends utilisent `role`, `Role`, ou un tableau. */
  private normalizeRoleClaim(raw: unknown): string | null {
    if (raw == null) return null;
    if (typeof raw === 'string') {
      const t = raw.trim();
      if (!t.length) return null;
      return t.replace(/^ROLE_/i, '');
    }
    if (Array.isArray(raw) && raw.length > 0) {
      return this.normalizeRoleClaim(raw[0]);
    }
    return null;
  }

  getRole(): string | null {
    const d = this.getDecodedToken();
    if (!d) return null;
    return (
      this.normalizeRoleClaim(d.role) ??
      this.normalizeRoleClaim(d.Role) ??
      this.normalizeRoleClaim(d.userRole) ??
      this.normalizeRoleClaim(d.roles) ??
      null
    );
  }

  setRole(role: string | null) {
    this.roleSubject.next(role);
  }

  getEmail(): string | null {
    const d = this.getDecodedToken();
    if (!d) return null;
    const candidates = [
      d.email,
      d.Email,
      d.mail,
      d.unique_name,
      d.upn,
      d.preferred_username,
    ];
    for (const c of candidates) {
      if (typeof c === 'string') {
        const t = c.trim();
        if (t.includes('@')) return t;
      }
    }
    return null;
  }

  getUserId(): number | null {
    const d = this.getDecodedToken();
    if (!d) return null;
    const raw =
      d.userId ??
      d.UserId ??
      d.user_id ??
      d.id ??
      d.sub;
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  getCvId(): number | null {
    return this.getDecodedToken()?.id_cv || null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? !this.jwtHelper.isTokenExpired(token) : false;
  }

  login(token: string, password: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      this.setRole(this.getRole());
      this.authStateSubject.next(true); // Notify login
    }
  }

  

  async getUserFullName(): Promise<string> {
    try {
      // First try to get from token
      const token = this.getDecodedToken();
      if (token?.firstName && token?.lastName) {
        return `${token.firstName} ${token.lastName}`.trim();
      }
  
      // Fallback to API call using email if name is not in token
      const email = this.getEmail();
      if (email) {
        // Use the correct API endpoint to fetch user by email
        const user = await this.http.get<User>(`https://find-me.2.1-user.dpc.com.tn/api/v1/users/email/${email}`).toPromise();
        
        if (!user) {
          throw new Error('User data not found');
        }
        
        return `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }
  
      // If no email is found in the token, fallback to userId logic (for completeness)
      const userId = this.getUserId();
      if (!userId) return '';
      
      const user = await this.http.get<User>(`https://find-me.2.1-user.dpc.com.tn/api/v1/users/${userId}`).toPromise();
      
      if (!user) {
        throw new Error('User data not found');
      }
      
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
      
    } catch (error) {
      console.error('Error getting user full name:', error);
      
      // Final fallback - use email prefix if the API fails
      const email = this.getEmail();
      return email?.split('@')[0] || 'CV';
    }
  }
  
  getEmailFromToken(): string {
    const token = this.getToken();
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken?.email || '';
    }
    return '';
  }

  // Logout method: clear token and notify logout
  logout(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('TitreProfile');
      sessionStorage.removeItem('lastName');
      sessionStorage.removeItem('lastName');
      sessionStorage.removeItem('imageProfile');
      localStorage.removeItem('token');
      this.setRole(null);
      this.authStateSubject.next(false); // Notify logout
    }
  }

  // Notify subscribers that profile data has been updated (e.g., image changed)
  notifyProfileUpdate(): void {
    // This can be used to trigger reloads in Navbar or other components
    this.authStateSubject.next(this.isAuthenticated());
  }
      notifyDocumentUpdate(): void {
    this.documentUpdateSubject.next(this.isAuthenticated());
  }
  notifyDataUpdate(): void {
    this.dataUpdateSubject.next(this.isAuthenticated());
  }
  
}
