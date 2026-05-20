package com.dpc.mission_service.Repository;

import com.dpc.mission_service.model.Mission;
import com.dpc.mission_service.model.StatusMission;
import com.dpc.mission_service.model.TypeContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission,Long> {
    @Query("SELECT m FROM Mission m " +
            "WHERE m.pays.nom = :countryName " +
            "OR m.ville.pays.nom = :countryName")
    List<Mission> findMissionsByCountryName(@Param("countryName") String countryName);


    /** Missions publiées par l'utilisateur ESN (société / recruteur), plus récentes en premier. */
    @Query("SELECT m FROM Mission m WHERE m.user_id = :userId ORDER BY m.createdAt DESC")
    List<Mission> findMissionsByPublisherUserId(@Param("userId") Long userId);

    /**
     * Toutes les offres encore visibles sur le marché (entreprises + candidats),
     * sans filtre sur le créateur.
     */
    @Query("""
            SELECT DISTINCT m FROM Mission m
            WHERE m.statusMission = :open
            AND (m.archived = false OR m.archived IS NULL)
            ORDER BY m.createdAt DESC
            """)
    List<Mission> findAllOpenNonArchived(@Param("open") StatusMission open);

    /**
     * Base pour le filtre candidat / freelance : offres ouvertes + types de contrat.
     */
    @Query("""
            SELECT DISTINCT m FROM Mission m
            INNER JOIN m.descrip_mission d
            WHERE m.statusMission = :open
            AND (m.archived = false OR m.archived IS NULL)
            AND d.typeContrat IN :contrats
            ORDER BY m.createdAt DESC
            """)
    List<Mission> findOpenNonArchivedByContractTypes(
            @Param("open") StatusMission open,
            @Param("contrats") List<TypeContrat> contrats);


//    List<Mission> findByStatusMissionNotAndArchivedFalse(String status);



}
