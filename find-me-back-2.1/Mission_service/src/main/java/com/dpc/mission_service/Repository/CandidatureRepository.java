package com.dpc.mission_service.Repository;

import com.dpc.mission_service.model.Candidature;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    List<Candidature> findByCandidatId(Long candidatId);

    @Query("SELECT c FROM Candidature c WHERE c.mission.user_id = :UserId")
    List<Candidature> findCandidaturesWhereUserIdMatchesMission(@Param("UserId") Long UserId);

    List<Candidature> findByCandidatIdAndMission_IdMission(Long candidatId, Long missionId);

    List<Candidature> findByMission_IdMission(Long missionId);

    @Modifying
    @Query(value = "UPDATE candidature SET mission_id = NULL WHERE id_candidature = :id", nativeQuery = true)
    void detachMission(@Param("id") Long id);

    @Modifying
    @Query(value = "DELETE FROM candidature WHERE id_candidature = :id", nativeQuery = true)
    void deleteByIdNative(@Param("id") Long id);
}

