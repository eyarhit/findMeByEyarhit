package com.dpc.user_service.validator;

import com.dpc.user_service.DTO.AdminUserUpdateDTO;
import com.dpc.user_service.DTO.UserRegistrationDTO;
import com.dpc.user_service.Entities.Status;
import org.springframework.util.StringUtils;

import java.util.Set;
import java.util.regex.Pattern;

public final class AdminInputValidator {

    private static final Pattern PERSON_NAME = Pattern.compile("^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s'\\-]{1,48}$");
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final Pattern PHONE = Pattern.compile("^(\\+216[259]\\d{7}|\\+33[1-9]\\d{8}|[259]\\d{7}|0[1-9]\\d{8})$");
    private static final Pattern PASSWORD = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{4,}$");
    private static final Set<String> ADMIN_ROLES = Set.of("CANDIDAT", "ESN_ADMIN", "ADMIN");

    private AdminInputValidator() {
    }

    public static void validateCreate(UserRegistrationDTO dto) throws Exception {
        validateRequiredName(dto.getFirstName(), "Prénom");
        validateRequiredName(dto.getLastName(), "Nom");
        validateRequiredEmail(dto.getEmail());
        validatePhoneOptional(dto.getPhone());
        validateAdminRole(dto.getRole());
        validatePasswordOptional(dto.getPassword());
        validateCompanyOptional(dto.getNomSociete());
        validateCountryOptional(dto.getCountry());
        validateStatusOptional(dto.getStatus());
    }

    public static void validateUpdate(AdminUserUpdateDTO dto) throws Exception {
        if (dto.getFirstName() != null) {
            validateRequiredName(dto.getFirstName(), "Prénom");
        }
        if (dto.getLastName() != null) {
            validateRequiredName(dto.getLastName(), "Nom");
        }
        if (dto.getEmail() != null) {
            validateRequiredEmail(dto.getEmail());
        }
        if (dto.getPhone() != null) {
            validatePhoneOptional(dto.getPhone());
        }
        if (dto.getRole() != null) {
            validateAdminRole(dto.getRole());
        }
        if (dto.getStatus() != null) {
            validateStatusRequired(dto.getStatus());
        }
        if (dto.getPassword() != null) {
            validatePasswordOptional(dto.getPassword());
        }
        if (dto.getNomSociete() != null) {
            validateCompanyOptional(dto.getNomSociete());
        }
        if (dto.getCountry() != null) {
            validateCountryOptional(dto.getCountry());
        }
    }

    private static void validateRequiredName(String value, String label) throws Exception {
        if (!StringUtils.hasText(value) || !PERSON_NAME.matcher(value.trim()).matches()) {
            throw new Exception(label + " invalide (2 à 50 caractères, lettres uniquement).");
        }
    }

    private static void validateRequiredEmail(String value) throws Exception {
        if (!StringUtils.hasText(value) || !EMAIL.matcher(value.trim()).matches()) {
            throw new Exception("Adresse e-mail invalide.");
        }
    }

    private static void validatePhoneOptional(String value) throws Exception {
        if (!StringUtils.hasText(value)) {
            return;
        }
        String cleaned = value.replaceAll("[\\s.\\-()]", "");
        if (!PHONE.matcher(cleaned).matches()) {
            throw new Exception("Numéro de téléphone invalide (ex. +216XXXXXXXX ou +33XXXXXXXXX).");
        }
    }

    private static void validateAdminRole(String value) throws Exception {
        if (!StringUtils.hasText(value) || !ADMIN_ROLES.contains(value.trim().toUpperCase())) {
            throw new Exception("Rôle invalide. Valeurs acceptées : CANDIDAT, ESN_ADMIN, ADMIN.");
        }
    }

    private static void validatePasswordOptional(String value) throws Exception {
        if (!StringUtils.hasText(value)) {
            return;
        }
        if (!PASSWORD.matcher(value).matches()) {
            throw new Exception("Mot de passe invalide : au moins 4 caractères, une majuscule, une minuscule et un chiffre.");
        }
    }

    private static void validateCompanyOptional(String value) throws Exception {
        if (value != null && value.trim().length() > 100) {
            throw new Exception("Nom de société trop long (100 caractères maximum).");
        }
    }

    private static void validateCountryOptional(String value) throws Exception {
        if (value != null && value.trim().length() > 80) {
            throw new Exception("Pays trop long (80 caractères maximum).");
        }
    }

    private static void validateStatusOptional(String value) throws Exception {
        if (!StringUtils.hasText(value)) {
            return;
        }
        try {
            Status.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new Exception("Statut invalide. Valeurs acceptées : ACTIVE, INACTIVE, PENDING.");
        }
    }

    private static void validateStatusRequired(Status status) throws Exception {
        if (status == null) {
            throw new Exception("Statut invalide.");
        }
    }
}
