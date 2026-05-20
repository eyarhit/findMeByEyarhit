import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Experience } from '../_model/Experience';

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {
  private apiUrl = 'http://localhost:9158/api/v1/experiences';
  // private apiUrl = 'https://find-me.2.1-cv.dpc.com.tn/api/v1/experiences'; 


  constructor(private http: HttpClient) {}

  getExperiencesByUserId(userId: number): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.apiUrl}/${userId}`);
  }

  updateExperiencesForUser(userId: number, experiences: Experience[]): Observable<Experience[]> {
    return this.http.put<Experience[]>(`${this.apiUrl}/merge/${userId}`, experiences);
  }

  getTotalExperienceYears(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/total-annees/${userId}`);
  }
}
