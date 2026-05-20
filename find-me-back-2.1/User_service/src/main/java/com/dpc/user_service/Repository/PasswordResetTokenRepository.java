package com.dpc.user_service.Repository;

import com.dpc.user_service.Entities.PasswordResetToken;
import com.dpc.user_service.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken>  findByUser(User user);
    void deleteByUser(User user);
}
