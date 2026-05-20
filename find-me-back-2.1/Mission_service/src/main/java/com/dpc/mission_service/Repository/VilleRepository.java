package com.dpc.mission_service.Repository;

import com.dpc.mission_service.model.Ville;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VilleRepository extends JpaRepository<Ville, Long> {

    Optional<Ville> findFirstByNomdevilleIgnoreCaseAndPays_Id(String nomdeville, Long paysId);
}
