package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Competence;
import com.dpc.cv_service.Entites.Cv;
import com.dpc.cv_service.Repository.*;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor

public class CompetenceService implements ICompetenceService{

    private final CvRepo cvRepo;
    private final CompetenceRepo competenceRepo;

    @Override
    public List<Competence> getCompetencesByUserId(Long userId) {
        Cv cv = cvRepo.findByUserId(userId);
        return (cv != null) ? cv.getCompetences() : List.of();
    }

    @Override
    public Competence updateCompetenceByUserId(Long userId, Competence updated) {
        Cv cv = cvRepo.findByUserId(userId);
        if (cv == null) {
            throw new RuntimeException("CV non trouvé pour cet utilisateur !");
        }

        List<Competence> competences = cv.getCompetences();

        if (competences.isEmpty()) {
            throw new RuntimeException("Aucune compétence liée à ce CV !");
        }

        Competence existing = competences.get(0); // on suppose 1 seule compétence par CV

        existing.setLangageBallsage(updated.getLangageBallsage());
        existing.setLanguageProgrammation(updated.getLanguageProgrammation());
        existing.setFramework(updated.getFramework());
        existing.setBibliotheque(updated.getBibliotheque());
        existing.setApi(updated.getApi());
        existing.setDb(updated.getDb());
        existing.setSystemExploitation(updated.getSystemExploitation());
        existing.setConception(updated.getConception());
        existing.setMethodologie(updated.getMethodologie());
        existing.setDesignPattern(updated.getDesignPattern());
        existing.setArchitechture(updated.getArchitechture());
        existing.setOutils(updated.getOutils());

        return competenceRepo.save(existing);
    }

}
