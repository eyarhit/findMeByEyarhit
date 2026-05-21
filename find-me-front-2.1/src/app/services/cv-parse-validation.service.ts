import { Injectable } from '@angular/core';

export interface ParseValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseCVResponse {
  data: {
    personal_info?: {
      full_name?: string;
      email?: string;
      phone?: string;
      job_title?: string;
      linkedin?: string;
      location?: string;
      confidence?: number;
    };
    education?: Array<{
      degree?: string;
      institution?: string;
      start_date?: string;
      end_date?: string;
      confidence?: number;
    }>;
    technical_skills?: Record<string, string[] | number>;
    languages?: Array<{ language?: string; proficiency?: string; confidence?: number }>;
    work_experiences?: Array<{
      company?: string;
      position?: string;
      start_date?: string;
      end_date?: string;
      description?: string;
      confidence?: number;
    }>;
    projects?: Array<{
      title?: string;
      client_name?: string;
      team_composition?: string;
      start_date?: string;
      end_date?: string;
      confidence?: number;
    }>;
  };
  metadata?: {
    extraction_method?: string;
    extraction_source?: string;
    ocr_used?: boolean;
    ocr_quality_score?: number;
    ocr_acceptable?: boolean;
    overall_confidence?: number;
    warnings?: string[];
    grounded_fields_removed?: number;
  };
  validation?: {
    is_valid?: boolean;
    can_save?: boolean;
    issues?: ParseValidationIssue[];
  };
}

@Injectable({ providedIn: 'root' })
export class CvParseValidationService {
  /** Client-side gate before POST /api/v1/save */
  canSaveToDatabase(response: ParseCVResponse): { allowed: boolean; messages: string[] } {
    const messages: string[] = [];
    const validation = response.validation;

    if (validation && !validation.can_save) {
      validation.issues?.forEach((i) => {
        if (i.severity === 'error') {
          messages.push(i.message);
        }
      });
    }

    const conf = response.metadata?.overall_confidence ?? 0;
    if (conf < 0.15 && !this.hasAnyExtractedField(response)) {
      messages.push(
        'Confiance d\'extraction trop faible. Complétez le CV manuellement.'
      );
    }

    if (response.metadata?.ocr_acceptable === false) {
      messages.push('Texte OCR illisible — import PDF natif recommandé.');
    }

    return { allowed: messages.length === 0, messages };
  }

  private hasAnyExtractedField(r: ParseCVResponse): boolean {
    const d = r.data;
    if (!d) return false;
    return !!(
      d.personal_info?.email ||
      d.personal_info?.full_name ||
      (d.education && d.education.length) ||
      (d.work_experiences && d.work_experiences.length) ||
      (d.languages && d.languages.length) ||
      this.hasSkills(d.technical_skills)
    );
  }

  private hasSkills(ts?: Record<string, string[] | number>): boolean {
    if (!ts) return false;
    const keys = [
      'programming_languages', 'frameworks', 'tools', 'databases',
    ];
    return keys.some((k) => {
      const v = ts[k];
      return Array.isArray(v) && v.length > 0;
    });
  }
}
