package com.dpc.user_service.Repository;

import com.dpc.user_service.Entities.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

    @Repository
    public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, Long> {
        Optional<BlacklistedToken> findByToken(String Token);

    }
