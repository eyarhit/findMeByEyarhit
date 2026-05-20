import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private templateSource = new BehaviorSubject<any>(null);
  selectedTemplate$ = this.templateSource.asObservable();

  setSelectedTemplate(template: any) {
    this.templateSource.next(template);
  }
}
