package com.dpc.codingameservice.Repository;

import com.dpc.codingameservice.Entity.Experiencelevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExperienceLevelRepository extends JpaRepository<Experiencelevel, Long> {
}
