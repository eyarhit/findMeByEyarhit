package com.dpc.user_service.DTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Date;

@Data
@AllArgsConstructor
public class UserInfoDTO {
    private String firstName;
    private String lastName;
    private String address;
    private String email;
    private String phone;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private Date dateOfBirth;

    private String sexe;
    private String linkedinUrl;

    /**
     * Identifiant compte (front / JWT) — le front l’utilise si {@code id_societer} est absent.
     */
    private Long userId;
    /**
     * Côtier « entreprise » attendu par le front (même valeur que l’id du compte recruteur le plus souvent en démo).
     */
    private Long id_societer;
}
