import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Education } from '../_model/Education';

@Injectable({
  providedIn: 'root'
})
export class EducationService {
  // private apiUrl = 'https://find-me.2.1-cv.dpc.com.tn/api/v1/educations'; 
 private apiUrl = 'http://localhost:9158/api/v1/educations'; 

  constructor(private http: HttpClient) {}

  getEducationsByUserId(userId: number): Observable<Education[]> {
    return this.http.get<Education[]>(`${this.apiUrl}/${userId}`);
  }

  updateEducationsForUser(userId: number, educations: Education[]): Observable<Education[]> {
    return this.http.put<Education[]>(`${this.apiUrl}/bulk-update/${userId}`, educations);
  }
}
