import { Component } from '@angular/core';
import { Job } from '../../_model/Job';
import { JobPostingService } from '../../services/job-posting.service';

@Component({
  selector: 'app-show-mission',
  templateUrl: './show-mission.component.html',
  styleUrl: './show-mission.component.scss'
})
export class ShowMissionComponent {

  job: Job;

  constructor(private jobService: JobPostingService) {
    this.job = this.jobService.getCurrentJob();
  }

  getWorkTypeText(): string {
    switch (this.job.workType) {
      case 'on-site': return 'Sur site';
      case 'hybrid': return 'Hybride';
      case 'remote': return 'À distance';
      default: return this.job.workType;
    }
  }
}