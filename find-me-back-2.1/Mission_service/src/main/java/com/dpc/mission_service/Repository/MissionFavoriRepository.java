package com.dpc.mission_service.Repository;

import com.dpc.mission_service.model.MissionFavori;
import com.dpc.mission_service.model.UserType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MissionFavoriRepository extends JpaRepository<MissionFavori, Long> {

    List<MissionFavori> findByUserIdAndUserType(Long userId, UserType userType);
    boolean existsByUserIdAndMission_IdMission(Long userId, Long missionId);
    void deleteByUserIdAndMission_IdMission(Long userId, Long missionId);


}
