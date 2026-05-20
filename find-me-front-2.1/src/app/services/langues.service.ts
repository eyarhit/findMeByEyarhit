import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Langue } from '../_model/Langue';

@Injectable({
  providedIn: 'root'
})
export class LanguesService {
  // private apiUrl = 'https://find-me.2.1-cv.dpc.com.tn/api/v1/langues'; 
 private apiUrl = 'http://localhost:9158/api/v1/langues'; 


  constructor(private http: HttpClient) {}

  getLanguesByUserId(userId: number): Observable<Langue[]> {
    return this.http.get<Langue[]>(`${this.apiUrl}/${userId}`);
  }

  updateLangues(userId: number, langues: Langue[]): Observable<Langue[]> {
    return this.http.put<Langue[]>(`${this.apiUrl}/merge/${userId}`, langues);
  }
}
