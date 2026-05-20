package com.dpc.user_service.DTO;

import com.dpc.user_service.Entities.User;
import lombok.Data;

@Data
public class UserResponseDTO {
    private String firstName;
    private String lastName;
    private String phone;
    private String country;
    private String targetmarket;


    // Constructor from User entity
    public UserResponseDTO(User user) {
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.phone = user.getPhone();
        this.country = user.getCountry();
        this.targetmarket = user.getTargetmarket();
    }

    // Getters (no setters needed if immutable)
}
