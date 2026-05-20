package com.dpc.mission_service.Services;
import com.dpc.mission_service.model.Candidature;
import com.dpc.mission_service.model.StatusCandidature;

import java.util.List;

public interface ICandidatureService {
    Candidature creerCandidature(Long userId, Long missionId, List<Long> documentIds);
    Candidature updateStatut(Long idCandidature, StatusCandidature statut);
    List<Candidature> getAllCandidatures();
    void deleteCandidature(Long idCandidature);
}
