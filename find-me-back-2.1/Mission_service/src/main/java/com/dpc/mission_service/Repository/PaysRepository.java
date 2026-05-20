package com.dpc.mission_service.Repository;

import com.dpc.mission_service.model.Pays;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaysRepository extends JpaRepository<Pays, Long> {

    Optional<Pays> findFirstByNomIgnoreCase(String nom);
}
