package com.dpc.cv_service.Repository;

import com.dpc.cv_service.Entites.Cv;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CvRepo extends JpaRepository<Cv,Long> {
    @EntityGraph(attributePaths = {"competences", "educations", "experiences", "langues"})
    Cv findByUserId(Long userId);

}
