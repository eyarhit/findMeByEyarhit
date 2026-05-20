import { Education } from './education.model';
import { Experience } from './experience.model';
import { Langue } from './langue.model';
import { Competence } from './competence.model';


export interface Cv {
  id_cv?: number;
  userId: number;
  createdBy?: string;
  createdAt?: Date;
  titreDeProfil?: string;
  completedSteps?: number[]; // Add this new field


  competences: Competence[];
  educations: Education[];
  experiences: Experience[];
  langues: Langue[];
}
