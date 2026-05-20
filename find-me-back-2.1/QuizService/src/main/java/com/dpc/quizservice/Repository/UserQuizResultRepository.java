package com.dpc.quizservice.Repository;

import com.dpc.quizservice.model.UserQuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserQuizResultRepository extends JpaRepository<UserQuizResult, Long> {
    Optional<UserQuizResult> findByUserId(Long userId);
}
