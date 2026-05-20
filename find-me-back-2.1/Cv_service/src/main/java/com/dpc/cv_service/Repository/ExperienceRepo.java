package com.dpc.cv_service.Repository;

import com.dpc.cv_service.Entites.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface ExperienceRepo extends JpaRepository<Experience,Long> {
}
