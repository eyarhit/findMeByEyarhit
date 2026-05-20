package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Competence;

import java.util.List;

public interface ICompetenceService {
    List<Competence> getCompetencesByUserId(Long userId);
    Competence updateCompetenceByUserId(Long userId, Competence updatedCompetence);

}
