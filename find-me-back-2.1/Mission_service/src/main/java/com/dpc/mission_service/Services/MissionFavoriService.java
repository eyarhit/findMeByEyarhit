package com.dpc.mission_service.Services;

import com.dpc.mission_service.Repository.MissionFavoriRepository;
import com.dpc.mission_service.Repository.MissionRepository;
import com.dpc.mission_service.model.Mission;
import com.dpc.mission_service.model.MissionFavori;
import com.dpc.mission_service.model.UserType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MissionFavoriService {

    private final MissionFavoriRepository repository;
    private final MissionRepository missionRepository;

    public MissionFavoriService(MissionFavoriRepository repository, MissionRepository missionRepository) {
        this.repository = repository;
        this.missionRepository = missionRepository;
    }

    public MissionFavori ajouterFavori(Long userId, Long missionId, UserType userType) {
        if (repository.existsByUserIdAndMission_IdMission(userId, missionId)) {
            throw new RuntimeException("Mission déjà en favoris");
        }

        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new RuntimeException("Mission non trouvée"));

        MissionFavori favori = new MissionFavori();
        favori.setUserId(userId);
        favori.setMission(mission);
        favori.setUserType(userType);

        return repository.save(favori);
    }
    @Transactional
    public void supprimerFavori(Long userId, Long missionId) {
        repository.deleteByUserIdAndMission_IdMission(userId, missionId);
    }

    public List<Mission> getFavorisParUtilisateur(Long userId, UserType userType) {
        return repository.findByUserIdAndUserType(userId, userType).stream()
                .map(MissionFavori::getMission)
                .toList();
    }
}
