package com.dpc.user_service.DTO;

import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Builder
@Getter
@Setter
public class UserProfileDTO {
    private String firstname;
    private String lastname;
    private String email;
    private  byte[] profilePicture ;
    private List<byte[]> documents; // Liste des documents en bytes
}
