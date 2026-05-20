package com.dpc.codingameservice.Repository;

import com.dpc.codingameservice.Entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByLevelIdAndDomainIdAndFrameworkId(Long levelId, Long domainId, Long frameworkId);

}
