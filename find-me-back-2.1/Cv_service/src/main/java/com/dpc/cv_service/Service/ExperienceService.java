package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Cv;
import com.dpc.cv_service.Entites.Experience;
import com.dpc.cv_service.Repository.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor

public class ExperienceService implements IExperienceService{

    private final CvRepo cvRepo;
    private final ExperienceRepo experienceRepo;



    @Override
    public List<Experience> getExperiencesByUserId(Long userId) {
        Cv cv = cvRepo.findByUserId(userId);
        return (cv != null) ? cv.getExperiences() : List.of();
    }

    @Override
    public Experience updateExperience(Long idExperience, Experience updated) {
        return experienceRepo.findById(idExperience)
                .map(existing -> {
                    existing.setEntreprise(updated.getEntreprise());
                    existing.setDateDebut(updated.getDateDebut());
                    existing.setDateFin(updated.getDateFin());
                    existing.setPoste(updated.getPoste());
                    existing.setNomProjet(updated.getNomProjet());
                    existing.setClient(updated.getClient());
                    existing.setEquipe(updated.getEquipe());
                    existing.setDescription(updated.getDescription());
                    existing.setTravailRealise(updated.getTravailRealise());
                    existing.setEnvironnement(updated.getEnvironnement());
                    return experienceRepo.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Expérience non trouvée avec l'ID : " + idExperience));
    }

    @Override
    @Transactional
    public List<Experience> mergeExperiencesForUser(Long userId, List<Experience> input) {
        Cv cv = cvRepo.findByUserId(userId);
        if (cv == null) {
            throw new RuntimeException("CV non trouvé pour l'utilisateur : " + userId);
        }

        List<Experience> result = new ArrayList<>();
        for (Experience exp : input) {
            if (exp.getId_experience() != null) {
                Experience existing = experienceRepo.findById(exp.getId_experience())
                        .orElseThrow(() -> new RuntimeException("Expérience non trouvée avec ID: " + exp.getId_experience()));
                existing.setEntreprise(exp.getEntreprise());
                existing.setDateDebut(exp.getDateDebut());
                existing.setDateFin(exp.getDateFin());
                existing.setPoste(exp.getPoste());
                existing.setNomProjet(exp.getNomProjet());
                existing.setClient(exp.getClient());
                existing.setEquipe(exp.getEquipe());
                existing.setDescription(exp.getDescription());
                existing.setTravailRealise(exp.getTravailRealise());
                existing.setEnvironnement(exp.getEnvironnement());
                result.add(experienceRepo.save(existing));
            } else {
                exp.setCv(cv);
                result.add(experienceRepo.save(exp));
            }
        }

        return result;
    }

    @Override
    public double calculerTotalAnneesExperience(Long userId) {
        Cv cv = cvRepo.findByUserId(userId);
        if (cv == null || cv.getExperiences() == null) return 0.0;

        double total = 0.0;

        for (Experience exp : cv.getExperiences()) {
            if (exp.getDateDebut() != null && exp.getDateFin() != null) {
                java.time.Period period = java.time.Period.between(exp.getDateDebut(), exp.getDateFin());
                int years = period.getYears();
                int months = period.getMonths();

                total += years + (months / 12.0);
            }
        }

        return total;
    }





}
