import { Component } from '@angular/core';
import { JobPostingService } from '../../services/job-posting.service';
import { Job } from '../../_model/Job';

@Component({
  selector: 'app-etape1-mission',
  templateUrl: './etape1-mission.component.html',
  styleUrl: './etape1-mission.component.scss'
})
export class Etape1MissionComponent {

  job: Job;
  workTypes = ['on-site', 'hybrid', 'remote'];

  constructor(private jobService: JobPostingService) {
    this.job = this.jobService.getCurrentJob();
  }

  updateJob() {
    this.jobService.updateJob(this.job);
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.job.image = e.target.result;
        this.updateJob();
      };
      reader.readAsDataURL(file);
    }
  }
}