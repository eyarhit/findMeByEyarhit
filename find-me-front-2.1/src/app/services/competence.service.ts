// src/app/services/competence.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Competence } from '../_model/Competence';

@Injectable({ providedIn: 'root' })
export class CompetenceService {
  private baseUrl = 'http://localhost:9158/api/v1/competences';
// private baseUrl = 'https://find-me.2.1-cv.dpc.com.tn/api/v1/competences'; 

  constructor(private http: HttpClient) {}

  getCompetenceByUserId(userId: number): Observable<Competence[]> {
    return this.http.get<Competence[]>(`${this.baseUrl}/${userId}`);
  }
  

  updateCompetenceByUserId(userId: number, competence: Competence): Observable<Competence> {
    return this.http.put<Competence>(`${this.baseUrl}/user/${userId}`, competence);
  }
}
