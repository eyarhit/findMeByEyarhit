package com.dpc.user_service.DTO;

import lombok.Data;

import java.util.Date;

@Data
public class UserRegistrationDTO {
    private Long userId;
    private String firstName;
    private String lastName;
    private String address;
    private String password;
    private String email;
    private String phone;
    private Date dateOfBirth;
    private String sexe;
    private String nomSociete;
    private String linkedinUrl;
    private String role ;
    private String country;
    private String targetmarket;
    private String residencetype;

}
