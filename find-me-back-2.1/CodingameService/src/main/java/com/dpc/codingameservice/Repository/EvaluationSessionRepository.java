package com.dpc.codingameservice.Repository;

import com.dpc.codingameservice.Entity.EvaluationSession;
import com.dpc.codingameservice.Entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EvaluationSessionRepository extends JpaRepository<EvaluationSession, Long> {
    EvaluationSession findByUserId(Long userId);
}
