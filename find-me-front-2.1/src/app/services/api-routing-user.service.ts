import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { User } from '../_model/User';

@Injectable({
  providedIn: 'root'
})
export class ApiRoutingServiceUser {
    // private apiUrl = 'https://find-me.2.1-user.dpc.com.tn/api/v1/users'; 

   private apiUrl = 'http://localhost:9068/api/v1/users';


  constructor(private http: HttpClient) { }

  // Implemented updateUserByEmail method
  updateUserByEmail(
    email: string,
    updatedUserData: {
      firstName: string;
      lastName: string;
      address: string;
      phone: string;
      linkedinUrl: string;
      dateOfBirth: string;
      sexe: string;
      nomSociete: string;
    },
    token: string
  ): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
  
    const encodedEmail = encodeURIComponent(email); 
    
    const url = `${this.apiUrl}/update?email=${encodedEmail}`;
  
    return this.http.put(url, updatedUserData, { headers });
  }
  
  

  // Request API POST method
  requestApi(urlPath: string, body: any, params?: HttpParams): Observable<string> {
    return this.http.post<string>(
      this.apiUrl + urlPath,
      body, 
      {
        params: params,
        responseType: 'text' as 'json'
      }
    );
  }
getUsersByRole(role: string,accountId:number ): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/by-societe?role=${role}&idSociete=${accountId}`);
}
  // Request API GET method
  requestGetApi(urlPath: string, params?: HttpParams): Observable<any> {
    return this.http.get(
      this.apiUrl + urlPath,
      {
        params: params,
        responseType: 'json'
      }
    );
  }

  // Get user by email (uses token for authorization)
  getUserByEmail(email: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': '*/*'
    });
    const params = new HttpParams().set('email', email);
    return this.http.get(`${this.apiUrl}/by-email`, { headers, params });
  }

  // Login API POST method
  requestLoginApi(urlPath: string, body: any, params?: HttpParams): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + urlPath,
      body, 
      {
        params: params,
        responseType: 'json' // Keep response in JSON format
      }
    );
  }
  requestPutApi(endpoint: string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}${endpoint}?status=${status}`, {});
  }
deleteUser(deletedUserId: number, userId: number): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/${deletedUserId}?userId=${userId}`,
    {
      responseType: 'text' as 'json'
    }
  );
}
  getUsersBySocieteId(idSociete: number): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/by-societe/${idSociete}`);
  }
  getUsersByUserId(userId: number): Observable<User> {
  return this.http.get<User>(`${this.apiUrl}/${userId}`).pipe(
    catchError(error => {
      console.error('Erreur dans getUsersByUserId', error);
      return throwError(() => new Error('Une erreur est survenue'));
    })
  );
}

  
}
