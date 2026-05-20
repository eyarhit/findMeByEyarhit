import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface StartSessionRequest {
 
  levelId: number;
  domainId: number;
}

export interface AnswerRequest {
  questionId: number;
  userResponse: string;
}

@Injectable({
  providedIn: 'root'
})
export class CodingameService {
  // private baseUrl = 'https://codingame.dpc.com.tn/api/v1';
 private baseUrl = 'http://localhost:9056/api/v1';

  constructor(private http: HttpClient , private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  

  startSession(request: StartSessionRequest): Observable<any> {
    const userId = this.authService.getUserId(); 
    return this.http.post(`${this.baseUrl}/evaluation-session/start/${userId}`, request, {
      headers: this.getAuthHeaders()
    });
  }
  
  getUserId(): number | null {
    return this.authService.getUserId();
  }

  getQuestions(levelId: number, domainId: number, frameworkId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/codingame/questions?levelId=${levelId}&domainId=${domainId}&frameworkId=${frameworkId}`
    );
  }

  submitAnswer(sessionId: number, answer: AnswerRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/answers/sessions/${sessionId}`, answer);
  }

  finishSession(sessionId: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/results/sessions/${sessionId}/finish`, {});
  }
  getResultsForUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/results/users/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }
  
}
