package com.dpc.codingameservice.Repository;

import com.dpc.codingameservice.Entity.EvaluationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationResultRepository extends JpaRepository<EvaluationResult, Long> {
    List<EvaluationResult> findBySessionId(Long sessionId);
}
