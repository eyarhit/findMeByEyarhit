import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentServiceService {

  private apiUrl = 'http://localhost:9068/api/document';
  // private apiUrl = 'https://find-me.2.1-user.dpc.com.tn/api/document';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Upload document
  uploadDocument(file: File, fileName: string, type?: string, email?: string): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    if (type) {
        formData.append('type-document', type);
    }
    if (email) {
        formData.append('email', email);
    }
    const userId = this.authService.getUserId();

    if (userId === null || userId === undefined) {
        formData.append('idUser', "-1");
    } else {
        formData.append('idUser', userId.toString());
    }

    return this.http.post(this.apiUrl, formData);
}


  // Get documents by user ID
  getDocumentsByUser(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  // Delete document by file URL
  deleteDocument(documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${documentId}`).pipe(
        catchError(this.handleError)
    );
}

  // Get document by file name
  getDocumentByFileName(fileName: string): Observable<any> {
    const params = new HttpParams().set('fileName', fileName);
    return this.http.get(`${this.apiUrl}/by-filename`, { params });
  }

  // Get document or presigned URL by document ID
  getDocument(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
  getDocumentsByIds(ids: number[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/by-ids`, ids).pipe(
      catchError(this.handleError)
    );
  }
  getDocumentsByUserAndFolder(userId: number, folder: string): Observable<any> {
    const url = `${this.apiUrl}/${userId}/folder`;

    const params = new HttpParams().set('folder', folder);

    return this.http.get<any>(url, { params });
  }

  // Error handling method
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
}
