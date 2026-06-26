import { AdminUser } from '../services/admin.service';
import { Cv } from '../_model/Cv';

function splitCompetences(input: string | string[] | undefined | null): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter((item) => item.length > 0);
  }
  return String(input)
    .split(/[,;|/•\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function competenceRecordHasData(competences: any): boolean {
  const source = Array.isArray(competences) ? competences[0] : competences;
  if (!source || typeof source !== 'object') {
    return false;
  }
  const fields = [
    'langageBallsage', 'languageProgrammation', 'framework', 'bibliotheque',
    'api', 'db', 'systemExploitation', 'conception', 'methodologie',
    'designPattern', 'architechture', 'outils',
  ];
  return fields.some((key) => {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return typeof value === 'string' && value.trim().length > 0;
  });
}

function formatEducationYear(dateDebut: string | null | undefined, dateFin: string | null | undefined): string {
  if (!dateDebut && !dateFin) return '';
  const startYear = dateDebut ? new Date(dateDebut).getFullYear() : '';
  const endYear = dateFin ? new Date(dateFin).getFullYear() : 'Présent';
  return startYear ? `${startYear} - ${endYear}` : String(endYear);
}

function formatExperiencePeriod(dateDebut: string | null | undefined, dateFin: string | null | undefined): string {
  if (!dateDebut && !dateFin) return '';
  const frenchMonths = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  const startDate = dateDebut ? new Date(dateDebut) : null;
  const endDate = dateFin ? new Date(dateFin) : null;
  const startMonth = startDate ? frenchMonths[startDate.getMonth()] : '';
  const startYear = startDate ? startDate.getFullYear() : '';
  const endMonth = endDate ? frenchMonths[endDate.getMonth()] : '';
  const endYear = endDate ? endDate.getFullYear() : '';
  const startStr = startDate ? `${startMonth} ${startYear}` : '';
  const endStr = endDate ? `${endMonth} ${endYear}` : 'Présent';
  return startStr ? `${startStr} - ${endStr}` : endStr;
}

/** Même structure que le preview candidat (modèle DevOps). */
export function buildCvPreviewTemplate(cv: Cv | null, user: AdminUser | null): any {
  const competenceSource = Array.isArray(cv?.competences) ? cv?.competences[0] : cv?.competences;
  const emptyCompetences = {
    langages_balisage: [] as string[],
    programmation: [] as string[],
    frameworks: [] as string[],
    bibliotheques: [] as string[],
    api: [] as string[],
    base_donnees: [] as string[],
    systeme_exploitation: [] as string[],
    conception: [] as string[],
    methodologies: [] as string[],
    design_patterns: [] as string[],
    architectures: [] as string[],
    outils: [] as string[],
  };

  const competences = competenceSource && competenceRecordHasData([competenceSource])
    ? {
        langages_balisage: splitCompetences(competenceSource.langageBallsage),
        programmation: splitCompetences(competenceSource.languageProgrammation),
        frameworks: splitCompetences(competenceSource.framework),
        bibliotheques: splitCompetences(competenceSource.bibliotheque),
        api: splitCompetences(competenceSource.api),
        base_donnees: splitCompetences(competenceSource.db),
        systeme_exploitation: splitCompetences(competenceSource.systemExploitation),
        conception: splitCompetences(competenceSource.conception),
        methodologies: splitCompetences(competenceSource.methodologie),
        design_patterns: splitCompetences(competenceSource.designPattern),
        architectures: splitCompetences(competenceSource.architechture),
        outils: splitCompetences(competenceSource.outils),
      }
    : emptyCompetences;

  const cvData = {
    user: {
      firstname: user?.firstName ?? '',
      lastname: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      address: '',
      linkedin: '',
      github: '',
    },
    title: cv?.titreDeProfil ?? '',
    profil: cv?.titreDeProfil ?? '',
    competences,
    languages: (cv?.langues ?? []).map((lang) => ({
      name: lang.name,
      level: lang.niveau,
    })),
    educations: (cv?.educations ?? []).map((edu) => ({
      diploma: edu.diplome,
      institution: edu.university,
      year: formatEducationYear(edu.dateDebut, edu.dateFin),
      dateDebut: edu.dateDebut,
      dateFin: edu.dateFin,
    })),
    experiences: (cv?.experiences ?? []).map((exp: any) => ({
      company: exp.entreprise || '',
      client: exp.client || '',
      position: exp.poste || '',
      period: formatExperiencePeriod(exp.dateDebut, exp.dateFin),
      projects: [
        {
          name: exp.nomProjet || '',
          description: exp.description || '',
          workDone: exp.travailRealise || '',
          environment: exp.environnement || '',
          technologies: exp.technologies || '',
          equipe: exp.equipe || '',
        },
      ],
    })),
  };

  return {
    thumbnail: 'devops',
    cvData,
  };
}
