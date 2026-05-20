package com.dpc.user_service.Repository;

import com.dpc.user_service.Entities.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    Otp findByEmail(String email);
    void deleteByExpirationTimeLessThan(long currentTime);
}

