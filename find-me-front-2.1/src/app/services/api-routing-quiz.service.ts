import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiRoutingServiceQuiz {
  // private apiUrl = 'https://find-me.2.1-quiz.dpc.com.tn';
  private apiUrl = 'http://localhost:9074';
  constructor(private http: HttpClient) { }

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
  requestApiGet(urlPath: string, params?: HttpParams): Observable<string> {
    return this.http.get<string>(
      this.apiUrl + urlPath,
      {
        params: params,
        responseType: 'text' as 'json' // Specify the response type
      }
    );
  }
  
}
