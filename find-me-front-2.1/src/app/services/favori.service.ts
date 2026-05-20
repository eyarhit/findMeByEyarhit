import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoriService {
  private baseUrl = 'http://localhost:9055/api/v1/missions/favoris';
  // private baseUrl = 'https://find-me.2.1-mission.dpc.com.tn/api/v1/missions/favoris';


  constructor(private http: HttpClient) {}

  addToFavorites(userId: number, missionId: number, userType: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/add`, null, {
      params: { userId, missionId, userType }
    });
  }

  removeFromFavorites(userId: number, missionId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/remove`, {
      params: { userId, missionId }
    });
  }

  getFavorites(userId: number, userType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}`, {
      params: { userType }
    });
  }
}
