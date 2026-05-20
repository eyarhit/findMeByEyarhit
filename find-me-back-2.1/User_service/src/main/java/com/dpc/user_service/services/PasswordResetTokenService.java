package com.dpc.user_service.services;


import com.dpc.user_service.Entities.PasswordResetToken;
import com.dpc.user_service.Entities.User;
import com.dpc.user_service.Repository.PasswordResetTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PasswordResetTokenService {
    private final PasswordResetTokenRepository PasswordResetTokenRepository;

    @Autowired
    public PasswordResetTokenService(PasswordResetTokenRepository passwordResetTokenDAO) {
        this.PasswordResetTokenRepository = passwordResetTokenDAO;
    }


    public PasswordResetToken findByToken(String token) {
        return PasswordResetTokenRepository.findByToken(token).orElse(null);
    }


    public PasswordResetToken save(PasswordResetToken passwordResetToken) {
        return PasswordResetTokenRepository.save(passwordResetToken);
    }

    public PasswordResetToken findByUser(User user) {
        return PasswordResetTokenRepository.findByUser(user).orElse(null);
    }

    @Transactional
    public void deleteByUser(User user) {
        PasswordResetTokenRepository.deleteByUser(user);
    }
}
