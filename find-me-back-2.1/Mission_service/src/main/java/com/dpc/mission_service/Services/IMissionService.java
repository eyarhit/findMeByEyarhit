package com.dpc.mission_service.Services;

import com.dpc.mission_service.model.Mission;

import java.util.List;
import java.util.Optional;

public interface IMissionService {
    Mission creer (Mission mission);
    Mission modifier(Long id, Mission mission);
    List<Mission> getAllMissions();
    Optional<Mission> getMissionByIdMission(Long idMission);
    List<Mission> getMissionsForUser(Long userId);
    List<Mission> getMissionsForFreelancer(Long userId);

    /**
     * Offres liées à un employé ESN : missions dont {@code user_id} correspond au créateur,
     * filtrées selon l’onglet / espace UI (paramètre {@code espace}).
     */
    List<Mission> getMissionsForEsnEmployee(Long userId, String espace);

    /** Offres ouvertes visibles par toutes les sociétés (vitrine / marché). */
    List<Mission> getOpenMissionsForMarket();
}
