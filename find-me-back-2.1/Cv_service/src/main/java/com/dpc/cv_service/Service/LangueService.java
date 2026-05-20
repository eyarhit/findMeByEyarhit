package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Cv;
import com.dpc.cv_service.Entites.Langue;
import com.dpc.cv_service.Repository.CvRepo;
import com.dpc.cv_service.Repository.LangueRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor

public class LangueService implements ILangueService{
    private final CvRepo cvRepo;
    private final LangueRepo langueRepo;


    @Override
    public List<Langue> getLanguesByUserId(Long userId) {
        Cv cv = cvRepo.findByUserId(userId);
        return (cv != null) ? cv.getLangues() : List.of();
    }

    @Override
    public Langue updateLangue(Long idLangue, Langue updated) {
        return langueRepo.findById(idLangue)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setNiveau(updated.getNiveau());
                    return langueRepo.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Langue non trouvée avec l'ID : " + idLangue));
    }

    @Override
    public List<Langue> mergeLanguesForUser(Long userId, List<Langue> langues) {
        Cv cv = cvRepo.findByUserId(userId);
        if (cv == null) throw new RuntimeException("CV non trouvé");


        List<Langue> anciennesLangues = cv.getLangues();
        for (Langue l : anciennesLangues) {
            l.getCvs().remove(cv);
            langueRepo.save(l);
        }
        cv.getLangues().clear();

        List<Langue> result = new ArrayList<>();

        for (Langue lang : langues) {
            Langue langueToSave;
            if (lang.getId_langue() != null) {
                langueToSave = langueRepo.findById(lang.getId_langue())
                        .orElseThrow(() -> new RuntimeException("Langue non trouvée"));
                langueToSave.setName(lang.getName());
                langueToSave.setNiveau(lang.getNiveau());
            } else {
                langueToSave = new Langue();
                langueToSave.setName(lang.getName());
                langueToSave.setNiveau(lang.getNiveau());
            }

            langueToSave.getCvs().add(cv);
            langueRepo.save(langueToSave);
            result.add(langueToSave);
        }


        cv.setLangues(result);
        cvRepo.save(cv);

        return result;
    }

}
