export interface Job {
  companyName: string;
  jobTitle: string;
  startDate: Date | null;
  endDate: Date | null;
  position: string;
  location: string;
  title: string;
  language: string;
  workType: 'on-site' | 'hybrid' | 'remote';
  experienceYears: number;
  requirements: string;
  status: string;
  salary: string;
  recruitersNumber: number;
  benefits: string;
  tasks: string;
  skills: string[];
  description: string;
  responsibilities: string;
  qualifications: string;
  image?: string;
  advantages: string
  recruiters: string
  requirement: string
  contractType: string
}