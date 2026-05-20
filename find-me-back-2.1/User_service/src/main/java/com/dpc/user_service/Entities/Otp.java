package com.dpc.user_service.Entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Otp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String otp;
    private long expirationTime;
}

