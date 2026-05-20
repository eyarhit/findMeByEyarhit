package com.dpc.cv_service.Repository;

import com.dpc.cv_service.Entites.Competence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface CompetenceRepo extends JpaRepository<Competence,Long> {
}
