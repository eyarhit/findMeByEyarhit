import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class apiRoutingServiceFlusk {
  private apiUrl = 'http://localhost:8000';
//   private apiUrl = 'https://find-me-python.dpc.com.tn';
  constructor(private http: HttpClient) { }

  requestApi(urlPath: string, body: any, params?: HttpParams): Observable<any> { // Change string to any for JSON response
    return this.http.post<any>(
        this.apiUrl + urlPath,
        body, 
        {
            params: params,
            responseType: 'json' // Default response type is json
        }
    );  
}

requestApiGet(urlPath: string, params?: HttpParams): Observable<any> { // Change string to any for JSON response
    return this.http.get<any>(
        this.apiUrl + urlPath,
        {
            params: params,
            responseType: 'json' // Default response type is json
        }
    );
} 
}
