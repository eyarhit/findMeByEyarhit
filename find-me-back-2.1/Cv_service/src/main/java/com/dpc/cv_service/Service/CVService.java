package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.*;
import com.dpc.cv_service.Repository.*;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class CVService implements ICVService {

    private final CvRepo cvRepo;
    private final CompetenceRepo competenceRepo;
    private final LangueRepo langueRepo;
    private final ExperienceRepo experienceRepo;
    private final EducationRepo educationRepo;
    private final ExperienceService experienceService;

    @Override
    public Cv creer(Cv cv) {
        if (cvRepo.findByUserId(cv.getUserId()) != null) {
            throw new RuntimeException("Ce user a déjà un CV !");
        }


        cv.setEducations(Optional.ofNullable(cv.getEducations()).orElse(new ArrayList<>()));
        cv.setExperiences(Optional.ofNullable(cv.getExperiences()).orElse(new ArrayList<>()));
        cv.setLangues(Optional.ofNullable(cv.getLangues()).orElse(new ArrayList<>()));
        cv.setCompetences(Optional.ofNullable(cv.getCompetences()).orElse(new ArrayList<>()));


        for (Education edu : cv.getEducations()) {
            edu.setCv(cv);
        }
        for (Experience exp : cv.getExperiences()) {
            exp.setCv(cv);
        }

        return cvRepo.save(cv);
    }

    @Override
    public Cv getCVsByUserId(Long userId) {
        return cvRepo.findByUserId(userId);
    }

    public Cv getCompleteCV(Long idCv) {
        return cvRepo.findById(idCv)
                .orElseThrow(() -> new RuntimeException("CV not found with id: " + idCv));
    }

    @Override
    public Cv modifier(Long id, Cv cv) {
        return cvRepo.findById(id)
                .map(existingCv -> {
                    existingCv.setTitreDeProfil(cv.getTitreDeProfil());
                    return cvRepo.save(existingCv);
                })
                .orElseThrow(() -> new RuntimeException("CV non trouvé !"));
    }

    @Override
    public List<Cv> lire() {
        return cvRepo.findAll();
    }

    @Transactional
    public Cv creerOuMettreAJour(Cv cv) {
        normalizeCvLists(cv);
        Cv existingCv = cvRepo.findByUserId(cv.getUserId());

        if (existingCv != null) {

            if (cv.getTitreDeProfil() != null) {
                existingCv.setTitreDeProfil(cv.getTitreDeProfil());
            }


            if (cv.getCompletedSteps() != null && !cv.getCompletedSteps().isEmpty()) {
                Set<Integer> mergedSteps = new HashSet<>(Optional.ofNullable(existingCv.getCompletedSteps()).orElse(new ArrayList<>()));
                mergedSteps.addAll(cv.getCompletedSteps());
                existingCv.setCompletedSteps(new ArrayList<>(mergedSteps));
            }


            updateEntities(existingCv, cv);

            return cvRepo.save(existingCv);
        }

        prepareNewCvForSave(cv);
        return cvRepo.save(cv);
    }

    private void normalizeCvLists(Cv cv) {
        cv.setEducations(Optional.ofNullable(cv.getEducations()).orElse(new ArrayList<>()));
        cv.setExperiences(Optional.ofNullable(cv.getExperiences()).orElse(new ArrayList<>()));
        cv.setLangues(Optional.ofNullable(cv.getLangues()).orElse(new ArrayList<>()));
        cv.setCompetences(Optional.ofNullable(cv.getCompetences()).orElse(new ArrayList<>()));
        cv.setCompletedSteps(Optional.ofNullable(cv.getCompletedSteps()).orElse(new ArrayList<>()));
    }

    /** First-time save after CV parse — wire JPA relations and drop unknown IDs from other DBs. */
    private void prepareNewCvForSave(Cv cv) {
        for (Education edu : cv.getEducations()) {
            if (edu.getId_education() != null && !educationRepo.existsById(edu.getId_education())) {
                edu.setId_education(null);
            }
            edu.setCv(cv);
        }
        for (Experience exp : cv.getExperiences()) {
            if (exp.getId_experience() != null && !experienceRepo.existsById(exp.getId_experience())) {
                exp.setId_experience(null);
            }
            exp.setCv(cv);
        }
        cv.setLangues(resolveLangues(cv.getLangues()));
        cv.setCompetences(resolveCompetences(cv.getCompetences()));
    }

    private List<Langue> resolveLangues(List<Langue> incoming) {
        List<Langue> resolved = new ArrayList<>();
        for (Langue lang : incoming) {
            if (lang.getName() == null || lang.getName().isBlank() || lang.getNiveau() == null || lang.getNiveau().isBlank()) {
                continue;
            }
            List<Langue> existingLangues = langueRepo.findByNameAndNiveau(lang.getName(), lang.getNiveau());
            if (!existingLangues.isEmpty()) {
                resolved.add(existingLangues.get(0));
            } else {
                lang.setId_langue(null);
                resolved.add(langueRepo.save(lang));
            }
        }
        return resolved;
    }

    private List<Competence> resolveCompetences(List<Competence> incoming) {
        List<Competence> resolved = new ArrayList<>();
        for (Competence comp : incoming) {
            if (comp.getId_competence() != null && competenceRepo.existsById(comp.getId_competence())) {
                resolved.add(competenceRepo.findById(comp.getId_competence()).orElseThrow());
            } else {
                comp.setId_competence(null);
                resolved.add(competenceRepo.save(comp));
            }
        }
        return resolved;
    }

    private void mergeCompetenceFields(Competence target, Competence source) {
        if (source.getLangageBallsage() != null && !source.getLangageBallsage().isBlank()) {
            target.setLangageBallsage(source.getLangageBallsage());
        }
        if (source.getLanguageProgrammation() != null && !source.getLanguageProgrammation().isBlank()) {
            target.setLanguageProgrammation(source.getLanguageProgrammation());
        }
        if (source.getFramework() != null && !source.getFramework().isBlank()) {
            target.setFramework(source.getFramework());
        }
        if (source.getBibliotheque() != null && !source.getBibliotheque().isBlank()) {
            target.setBibliotheque(source.getBibliotheque());
        }
        if (source.getApi() != null && !source.getApi().isBlank()) {
            target.setApi(source.getApi());
        }
        if (source.getDb() != null && !source.getDb().isBlank()) {
            target.setDb(source.getDb());
        }
        if (source.getSystemExploitation() != null && !source.getSystemExploitation().isBlank()) {
            target.setSystemExploitation(source.getSystemExploitation());
        }
        if (source.getConception() != null && !source.getConception().isBlank()) {
            target.setConception(source.getConception());
        }
        if (source.getMethodologie() != null && !source.getMethodologie().isBlank()) {
            target.setMethodologie(source.getMethodologie());
        }
        if (source.getDesignPattern() != null && !source.getDesignPattern().isBlank()) {
            target.setDesignPattern(source.getDesignPattern());
        }
        if (source.getArchitechture() != null && !source.getArchitechture().isBlank()) {
            target.setArchitechture(source.getArchitechture());
        }
        if (source.getOutils() != null && !source.getOutils().isBlank()) {
            target.setOutils(source.getOutils());
        }
    }

    private void updateEntities(Cv existingCv, Cv cv) {

        // null = partial save (steps only); [] = import cleared that section
        if (cv.getEducations() != null) {
            existingCv.getEducations().clear();
            for (Education incoming : cv.getEducations()) {
                Education managed = resolveEducation(incoming);
                copyEducationFields(managed, incoming);
                managed.setCv(existingCv);
                existingCv.getEducations().add(managed);
            }
        }


        if (cv.getExperiences() != null) {
            existingCv.getExperiences().clear();
            for (Experience incoming : cv.getExperiences()) {
                Experience managed = resolveExperience(incoming);
                copyExperienceFields(managed, incoming);
                managed.setCv(existingCv);
                existingCv.getExperiences().add(managed);
            }
        }


        if (cv.getLangues() != null) {
            existingCv.getLangues().clear();
            for (Langue lang : cv.getLangues()) {
                List<Langue> existingLangues = langueRepo.findByNameAndNiveau(lang.getName(), lang.getNiveau());
                if (!existingLangues.isEmpty()) {
                    existingCv.getLangues().add(existingLangues.get(0));
                } else {
                    langueRepo.save(lang);
                    existingCv.getLangues().add(lang);
                }
            }
        }


        if (cv.getCompetences() != null) {
            existingCv.getCompetences().clear();
            for (Competence newComp : cv.getCompetences()) {
                if (newComp.getId_competence() != null) {
                    Competence existing = competenceRepo.findById(newComp.getId_competence()).orElse(null);
                    if (existing != null) {
                        mergeCompetenceFields(existing, newComp);
                        competenceRepo.save(existing);
                        existingCv.getCompetences().add(existing);
                    } else {
                        competenceRepo.save(newComp);
                        existingCv.getCompetences().add(newComp);
                    }
                } else {
                    competenceRepo.save(newComp);
                    existingCv.getCompetences().add(newComp);
                }
            }
        }
    }

    private Education resolveEducation(Education incoming) {
        if (incoming.getId_education() != null) {
            return educationRepo.findById(incoming.getId_education()).orElse(new Education());
        }
        return new Education();
    }

    private void copyEducationFields(Education target, Education source) {
        target.setUniversity(source.getUniversity());
        target.setDiplome(source.getDiplome());
        target.setDateDebut(source.getDateDebut());
        target.setDateFin(source.getDateFin());
    }

    private Experience resolveExperience(Experience incoming) {
        if (incoming.getId_experience() != null) {
            return experienceRepo.findById(incoming.getId_experience()).orElse(new Experience());
        }
        return new Experience();
    }

    private static final int MAX_EXPERIENCE_TEXT = 4000;

    private void copyExperienceFields(Experience target, Experience source) {
        target.setEntreprise(truncate(source.getEntreprise(), 255));
        target.setDateDebut(source.getDateDebut());
        target.setDateFin(source.getDateFin());
        target.setPoste(truncate(source.getPoste(), 255));
        target.setNomProjet(truncate(source.getNomProjet(), 255));
        target.setClient(truncate(source.getClient(), 255));
        target.setEquipe(truncate(source.getEquipe(), 255));
        target.setDescription(truncate(source.getDescription(), MAX_EXPERIENCE_TEXT));
        target.setTravailRealise(truncate(source.getTravailRealise(), MAX_EXPERIENCE_TEXT));
        target.setEnvironnement(truncate(source.getEnvironnement(), 500));
    }

    private static String truncate(String value, int maxLen) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLen) {
            return trimmed;
        }
        return trimmed.substring(0, maxLen - 3) + "...";
    }


    public int calculerTotalAnneesExperience(Long userId) {
        List<Experience> experiences = experienceService.getExperiencesByUserId(userId);
        return calculerTotalAnneesExperience(experiences);
    }


    public int calculerTotalAnneesExperience(List<Experience> experiences) {
        int total = 0;
        for (Experience exp : experiences) {
            if (exp.getDateDebut() != null && exp.getDateFin() != null) {
                total += java.time.Period.between(exp.getDateDebut(), exp.getDateFin()).getYears();
            }
        }
        return total;
    }


//    public Map<String, Object> getProfileByUserId(Long userId) {
//        Cv cv = cvRepo.findByUserId(userId);
//        if (cv == null) {
//            throw new RuntimeException("Profile not found for user ID: " + userId);
//        }
//
//        Map<String, Object> cvData = new HashMap<>();
//        cvData.put("titreDeProfil", cv.getTitreDeProfil() != null ? cv.getTitreDeProfil() : "");
//        cvData.put("experiences", cv.getExperiences() != null ? cv.getExperiences().stream().map(exp -> {
//            Map<String, Object> expMap = new HashMap<>();
//            expMap.put("entreprise", exp.getEntreprise() != null ? exp.getEntreprise() : "");
//            expMap.put("poste", exp.getPoste() != null ? exp.getPoste() : "");
//            expMap.put("dateDebut", exp.getDateDebut() != null ? exp.getDateDebut().toString() : "");
//            expMap.put("dateFin", exp.getDateFin() != null ? exp.getDateFin().toString() : "");
//            expMap.put("description", exp.getDescription() != null ? exp.getDescription() : "");
//            expMap.put("travailRealise", exp.getTravailRealise() != null ? exp.getTravailRealise() : "");
//            expMap.put("environnement", exp.getEnvironnement() != null ? exp.getEnvironnement() : "");
//            return expMap;
//        }).collect(Collectors.toList()) : Collections.emptyList());
//        cvData.put("educations", cv.getEducations() != null ? cv.getEducations().stream().map(edu -> {
//            Map<String, Object> eduMap = new HashMap<>();
//            eduMap.put("university", edu.getUniversity() != null ? edu.getUniversity() : "");
//            eduMap.put("diplome", edu.getDiplome() != null ? edu.getDiplome() : "");
//            eduMap.put("dateDebut", edu.getDateDebut() != null ? edu.getDateDebut().toString() : "");
//            eduMap.put("dateFin", edu.getDateFin() != null ? edu.getDateFin().toString() : "");
//            return eduMap;
//        }).collect(Collectors.toList()) : Collections.emptyList());
//        cvData.put("langues", cv.getLangues() != null ? cv.getLangues().stream().map(lang -> {
//            Map<String, Object> langMap = new HashMap<>();
//            langMap.put("name", lang.getName() != null ? lang.getName() : "");
//            langMap.put("niveau", lang.getNiveau() != null ? lang.getNiveau() : "");
//            return langMap;
//        }).collect(Collectors.toList()) : Collections.emptyList());
//        cvData.put("competences", cv.getCompetences() != null ? cv.getCompetences().stream().map(comp -> {
//            Map<String, Object> compMap = new HashMap<>();
//            compMap.put("langageBallsage", comp.getLangageBallsage() != null ? comp.getLangageBallsage() : "");
//            compMap.put("languageProgrammation", comp.getLanguageProgrammation() != null ? comp.getLanguageProgrammation() : "");
//            compMap.put("framework", comp.getFramework() != null ? comp.getFramework() : "");
//            compMap.put("bibliotheque", comp.getBibliotheque() != null ? comp.getBibliotheque() : "");
//            compMap.put("api", comp.getApi() != null ? comp.getApi() : "");
//            compMap.put("db", comp.getDb() != null ? comp.getDb() : "");
//            compMap.put("systemExploitation", comp.getSystemExploitation() != null ? comp.getSystemExploitation() : "");
//            compMap.put("conception", comp.getConception() != null ? comp.getConception() : "");
//            compMap.put("methodologie", comp.getMethodologie() != null ? comp.getMethodologie() : "");
//            compMap.put("designPattern", comp.getDesignPattern() != null ? comp.getDesignPattern() : "");
//            compMap.put("architecture", comp.getArchitechture() != null ? comp.getArchitechture() : "");
//            compMap.put("outils", comp.getOutils() != null ? comp.getOutils() : "");
//            return compMap;
//        }).collect(Collectors.toList()) : Collections.emptyList());
//
//        return cvData;
//    }


}