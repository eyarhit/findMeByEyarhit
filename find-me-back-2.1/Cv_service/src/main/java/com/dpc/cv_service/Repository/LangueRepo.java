package com.dpc.cv_service.Repository;

import com.dpc.cv_service.Entites.Langue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LangueRepo extends JpaRepository<Langue,Long>  {
    List<Langue> findByNameAndNiveau(String name, String niveau);


}
