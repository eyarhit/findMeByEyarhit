package com.dpc.mission_service.Services;

import com.dpc.mission_service.Repository.CandidatureRepository;
import com.dpc.mission_service.Repository.MissionRepository;
import com.dpc.mission_service.feign.UserClient;
import com.dpc.mission_service.model.Candidature;
import com.dpc.mission_service.model.Mission;
import com.dpc.mission_service.model.StatusCandidature;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CandidatureService implements ICandidatureService {

    private static final ObjectMapper OM = new ObjectMapper();

    @Autowired
    private CandidatureRepository candidatureRepository;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private UserClient userClient;

    @PersistenceContext
    private EntityManager entityManager;

    public Candidature creerCandidature(Long candidatId, Long missionId, List<Long> documentIds) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("Mission not found with ID: " + missionId));
        Candidature candidature = new Candidature();
        candidature.setCandidatId(candidatId);
        candidature.setMission(mission);
        candidature.setStatutCandidature(StatusCandidature.ENCOURS);
        if (documentIds != null && !documentIds.isEmpty()) {
            try {
                candidature.setDossierCompetenceJson(OM.writeValueAsString(documentIds));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to serialize dossier documents", e);
            }
            candidature.setIdDocumentCv(String.valueOf(documentIds.get(0)));
        }
        return candidatureRepository.save(candidature);
    }

    @Transactional
    public Candidature updateStatut(Long idCandidature, StatusCandidature statut) {
        Candidature candidature = candidatureRepository.findById(idCandidature)
                .orElseThrow(() -> new EntityNotFoundException("Candidature not found: " + idCandidature));
        candidature.setStatutCandidature(statut);
        return candidatureRepository.save(candidature);
    }

    public List<Candidature> getAllCandidatures() {
        return candidatureRepository.findAll();
    }

    public List<Candidature> getCandidaturesByUserId(Long candidatId) {
        return candidatureRepository.findByCandidatId(candidatId);
    }

    public List<Candidature> findCandidaturesWhereUserIdMatchesMission(Long UserId) {
        return candidatureRepository.findCandidaturesWhereUserIdMatchesMission(UserId);
    }

    @Transactional
    public void deleteCandidature(Long idCandidature) {
        Candidature candidature = candidatureRepository.findById(idCandidature)
                .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + idCandidature));

        // Détacher du côté Mission pour éviter la contrainte FK
        Mission mission = candidature.getMission();
        if (mission != null) {
            candidature.setMission(null);
            entityManager.merge(candidature);
            entityManager.flush();
        }

        entityManager.remove(entityManager.contains(candidature)
                ? candidature
                : entityManager.merge(candidature));
        entityManager.flush();
    }

    public List<Candidature> getCandidatureByCandidateAndMission(Long candidatId, Long missionId) {
        return candidatureRepository.findByCandidatIdAndMission_IdMission(candidatId, missionId);
    }

    public List<Candidature> getCandidaturesByMissionId(Long missionId) {
        return candidatureRepository.findByMission_IdMission(missionId);
    }
}
