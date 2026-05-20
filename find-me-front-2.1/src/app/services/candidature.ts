import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
 private apiUrl = 'http://localhost:9055/api/v1/candidatures';
    // private apiUrl = 'https://find-me.2.1-mission.dpc.com.tn/api/v1/candidatures';

  private candidateStateSubject = new BehaviorSubject<boolean>(false);
  candidateStateChange = this.candidateStateSubject.asObservable();
  constructor(private http: HttpClient) {
    this.candidateStateSubject.next(true);
  }

createCandidature(candidatId: number, missionId: number, dossiercompetence?: number[]): Observable<any> {
    if (!candidatId || !missionId || isNaN(missionId)) {
      throw new Error(`Invalid candidature params: candidatId=${candidatId}, missionId=${missionId}`);
    }
    const candidatureRequest = {
      candidatId: candidatId,
      mission: { idMission: missionId },
      dossiercompetence: dossiercompetence || [],
    };
    console.log('[createCandidature] payload:', candidatureRequest);
    return this.http.post(`${this.apiUrl}/creercandidature`, candidatureRequest);
}

  getAllCandidatures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/allCondidature`);
  }

  deleteCandidature(idCandidature: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idCandidature}`);
  }

  getCandidaturesByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/CandidatureByCandidat/${userId}`);
  }

  getCandidaturesByMissionOwner(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getcandidaturebymissionowner/${userId}`);
  }
   notifyCandidateUpdate(): void {
    this.candidateStateSubject.next(true);
  }

    getCandidatureByCandidateAndMission(candidatId: number, missionId: number): Observable<any> {
    const params = new HttpParams()
      .set('candidatId', candidatId.toString())
      .set('missionId', missionId.toString());

    return this.http.get<any>(`${this.apiUrl}/by-candidate-and-mission`, { params });
  }
    getCandidaturesByMissionId(missionId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-mission/${missionId}`);
  }
updateCandidatureStatus(id: number, status: string): Observable<any> {
  return this.http.patch(
    `${this.apiUrl}/${id}/status`, 
    { status: status }
  );
}

}
