import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Job } from '../_model/Job';

@Injectable({
  providedIn: 'root'
})
export class JobPostingService {
  private currentJob = new BehaviorSubject<Job>(this.getDefaultJob());
  currentJob$ = this.currentJob.asObservable();

  constructor() {}

  updateJob(job: Partial<Job>) {
    this.currentJob.next({...this.currentJob.value, ...job});
  }

  getCurrentJob(): Job {
    return this.currentJob.value;
  }

  private getDefaultJob(): Job {
    return {
      companyName: '',
      jobTitle: '',
      startDate: null,
      endDate: null,
      position: '',
      location: '',
      workType: 'on-site',
      experienceYears: 0,
      requirements: '',
      status: '',
      salary: '',
      recruitersNumber: 0,
      benefits: '',
      tasks: '',
      skills: [],
      description: '',
      responsibilities: '',
      qualifications: '',
      language: '',
      title: '',
      advantages: '',
      recruiters: '',
      requirement: '',
      contractType: '',
    };
  }

  resetJob() {
    this.currentJob.next(this.getDefaultJob());
  }
}