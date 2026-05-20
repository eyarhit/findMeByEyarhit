import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Cv } from '../_model/Cv';
import { Observable, Subject, BehaviorSubject  } from 'rxjs'; // Ajout de Subject ici



@Injectable({ 
  providedIn: 'root'
})
export class CvService {

   
//  private apiUrl = 'https://find-me.2.1-cv.dpc.com.tn/api/v1'; 
 private apiUrl = 'http://localhost:9158/api/v1';


  public cvUpdated = new Subject<Cv>();

  public titreProfilSubject= new BehaviorSubject<string | null>(null)


  constructor(private http: HttpClient , private authService: AuthService) {}

   
  
    getCvByUserId(userId: number): Observable<Cv | null> {
      return this.http.get<Cv | null>(`${this.apiUrl}/CVs/${userId}`);
    }
    createCv(userId: number, cvData: Cv): Observable<Cv> {
      
      return this.http.post<Cv>(`${this.apiUrl}/create/Cv/${userId}`, cvData);
    }
    
    

 // Méthode pour mettre à jour un CV
 updateCV(id: number, cv: Cv): Observable<Cv> {
  return this.http.put<Cv>(`${this.apiUrl}/update/${id}`, cv);
}

  //  Récupérer tous les CV
  getAllCvs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/read`);
  }



  // Ajout partiel (on peut ajouter seuelment un attribut, pas essentillement tous le cv)
  saveCv(userId: number,cvData: Cv): Observable<Cv> {
    return this.http.post<Cv>(`${this.apiUrl}/save`, cvData);
  }



  
}
