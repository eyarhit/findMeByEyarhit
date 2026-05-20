package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Education;

import java.util.List;

public interface IEducationService {
    List<Education> getEducationsByUserId(Long userId);
    Education updateEducation(Long idEducation, Education updatedEducation);
    List<Education> updateEducationsForUser(Long userId, List<Education> newEducations);


}
