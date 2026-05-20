import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Cv } from '../_model/Cv';

@Injectable({ 
  providedIn: 'root'
})
export class MissionService {
  private apiUrl = 'http://localhost:9055/api/v1/missions'; 
  // private apiUrl = 'https://find-me.2.1-mission.dpc.com.tn/api/v1/missions';
  constructor(private http: HttpClient) {}

    //  Récupérer un Mission par userId
    getMissionById(userId: number): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/mission/getMissionId/${userId}`); 
    }

  /** Catalogue global (toutes sociétés) — à utiliser pour la liste publique des offres d’emploi. */
  getAllMissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mission/all`).pipe(
      catchError((error) => {
        console.error('Error fetching all missions:', error);
        return throwError(() => error);
      })
    );
  }

  getMissionsForUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mission/for-user/${userId}`);
  }
    
  getMissionsForFreelancer(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mission/for-freelancer/${userId}`);
  }
  // Ajouter la fonction POST pour créer une mission
  createMission(missionData: any, userId: number): Observable<any> {
  const url = `${this.apiUrl}/create/${userId}`;
  return this.http.post<any>(url, missionData).pipe(
    catchError((error) => {
      console.error('Error creating mission:', error);
      return throwError(() => error);
    })
  );
}
  getMissionsForEsnEmployee(userId: number, espace: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mission/for-ESN-Employee/${userId}`, {
      params: { espace }
    }).pipe(
      catchError((error) => {
        console.error('Error fetching missions for ESN employee:', error);
        return throwError(() => error);
      })
    );
  }  

  // Add this new method for updating a mission
  updateMission(id: number, missionData: any): Observable<any> {
    const url = `${this.apiUrl}/update/${id}`;
    return this.http.patch<any>(url, missionData).pipe(
      catchError(error => {
        console.error('Error updating mission:', error);
        return throwError(() => new Error('Failed to update mission'));
      })
    );
  }
  
}
