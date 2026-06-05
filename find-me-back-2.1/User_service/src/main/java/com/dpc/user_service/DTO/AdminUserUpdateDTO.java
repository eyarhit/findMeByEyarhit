package com.dpc.user_service.DTO;

import com.dpc.user_service.Entities.Status;
import lombok.Data;

@Data
public class AdminUserUpdateDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private Status status;
    private String nomSociete;
    private String country;
    private String password;
}
