package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Cv;
import com.dpc.cv_service.Entites.Education;
import com.dpc.cv_service.Repository.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@AllArgsConstructor

public class EducationService implements IEducationService{
    private final CvRepo cvRepo;
    private final EducationRepo educationRepo;



    @Override
    public List<Education> getEducationsByUserId(Long userId) {
        Cv cv = cvRepo.findByUserId(userId);
        return (cv != null) ? cv.getEducations() : List.of();
    }

    @Override
    public Education updateEducation(Long idEducation, Education updatedEducation) {
        return educationRepo.findById(idEducation)
                .map(existingEducation -> {
                    existingEducation.setUniversity(updatedEducation.getUniversity());
                    existingEducation.setDiplome(updatedEducation.getDiplome());
                    existingEducation.setDateDebut(updatedEducation.getDateDebut());
                    existingEducation.setDateFin(updatedEducation.getDateFin());
                    return educationRepo.save(existingEducation);
                })
                .orElseThrow(() -> new RuntimeException("Éducation non trouvée avec l'ID : " + idEducation));
    }


    @Transactional
    public List<Education> updateEducationsForUser(Long userId, List<Education> newEducations) {
        Cv cv = cvRepo.findByUserId(userId);
        if (cv == null) {
            throw new RuntimeException("CV non trouvé pour l'utilisateur : " + userId);
        }

        List<Education> existing = educationRepo.findByCv(cv);
        educationRepo.deleteAllInBatch(existing);

        cv.getEducations().clear();


        for (Education edu : newEducations) {
            edu.setId_education(null);
            edu.setCv(cv);
        }

        return educationRepo.saveAll(newEducations);
    }




}
