import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ModelCvComponent } from '../model-cv/model-cv.component';
import { Subscription } from 'rxjs';
import { TemplateService } from '../../services/template.service';


@Component({
  selector: 'app-sauvegarde-cv',
  templateUrl: './sauvegarde-cv.component.html',
  styleUrl: './sauvegarde-cv.component.scss'
})
export class SauvegardeCvComponent implements OnInit, OnDestroy {
  selectedTemplate: any;
  private templateSubscription?: Subscription;

  constructor(private templateService: TemplateService) {}

  ngOnInit(): void {
    this.templateSubscription = this.templateService.selectedTemplate$.subscribe(template => {
      this.selectedTemplate = template;
    });
  }

  ngOnDestroy(): void {
    if (this.templateSubscription) {
      this.templateSubscription.unsubscribe();
    }
  }
}
