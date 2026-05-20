package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Experience;

import java.util.List;

public interface IExperienceService {
    List<Experience> getExperiencesByUserId(Long userId);
    Experience updateExperience(Long idExperience, Experience experience);

    List<Experience> mergeExperiencesForUser(Long userId, List<Experience> experiences);

    double calculerTotalAnneesExperience(Long userId);


}
