package com.dpc.cv_service.Repository;

import com.dpc.cv_service.Entites.Cv;
import com.dpc.cv_service.Entites.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface EducationRepo extends JpaRepository<Education,Long> {
    void deleteAllByCv(Cv cv);
    List<Education> findByCv(Cv cv);


}
