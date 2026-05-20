import { Competence } from "./Competence";
import { Education } from "./Education";
import { Langue } from "./Langue";
import { Experience } from "./Experience";

export interface Cv {
  id_cv?: number;
  userId: number;
  titreDeProfil?: string;
  completedSteps?: number[]; // Add this new field


  competences: Competence[];
  educations: Education[];
  experiences: Experience[];
  langues: Langue[];     
}
