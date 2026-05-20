package com.dpc.user_service.services;

import com.dpc.user_service.DTO.UserBasicDTO;
import com.dpc.user_service.DTO.UserInfoDTO;
import com.dpc.user_service.DTO.UserProfileDTO;
import com.dpc.user_service.DTO.UserRegistrationDTO;
import com.dpc.user_service.Entities.*;
import com.dpc.user_service.Proxy.QuizClient;
import com.dpc.user_service.Proxy.TwilioClient;
import com.dpc.user_service.Repository.DocumentRepository;
import com.dpc.user_service.Repository.OtpRepository;
import com.dpc.user_service.Repository.RoleRepository;
import com.dpc.user_service.Repository.UserRepository;
import com.dpc.user_service.file.FileUtils;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final QuizClient quizClient;
    private final TwilioClient twilioClient;
    private final String uploadDir = "user-images/";
    @Autowired // Ensure this annotation is present
    private OtpService otpService;
    @Autowired
    DocumentRepository documentRepository;
    private final EmailService emailService;
    @Autowired
    FileStorageService fileStorageService;
    @Autowired
    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, QuizClient quizClient, TwilioClient twilioClient, EmailService emailService, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.quizClient = quizClient;
        this.twilioClient = twilioClient;
        this.emailService = emailService;
    }

    // Send Email de confiramrion
    public ResponseEntity<String> processConfirmEmail(String email) {
        User user = findByEmail(email);
        Mail mail = new Mail();
        mail.setFrom("no-reply@FindMe.com");
        mail.setTo(user.getEmail());
        mail.setSubject("Confirmation Création compte");
        Map<String, Object> mailModel = new HashMap<>();
        mailModel.put("user", user);
        mailModel.put("signature", "http://FindMe.com");
        mail.setModel(mailModel);
        emailService.sendConfiramtionEmail(mail);
        return ResponseEntity.ok("Confiramtion Email is sent with sucess...");
    }

    // ✅ Vérifier si l'utilisateur a réussi le quiz
    private boolean hasPassedQuiz(Long userId) {
        ResponseEntity<Map<String, Object>> response = quizClient.getQuizResult(userId);
        return response.getBody() != null && (Boolean) response.getBody().get("passed");
    }

    public void updateUser(User user) {
        userRepository.save(user);
    }


    // Vérifier si le numéro de téléphone est validé avec Twilio
    private boolean isEmailVerified(String email,String otp) {
        return otpService.validateOtp(email,otp);
    }

    public User registerUser(UserRegistrationDTO dto, String otp) throws Exception {
        // Vérifier si l'email est déjà utilisé
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new Exception("Email déjà utilisé");
        }

        ERole roleEnum;
        try {
            roleEnum = ERole.valueOf(dto.getRole().trim().toUpperCase()); // Vérification stricte du rôle
        } catch (IllegalArgumentException e) {
            throw new Exception(
                    "Rôle non valide. Valeurs acceptées (enum ERole) : CANDIDAT, ADMIN, FREELANCER, ESN_ADMIN, ESN_COMMARCIAL, INTERCONTRAT, CHARGEDERECRUTEMENT.");
        }

        // Récupérer le rôle en base; s'il n'existe pas encore, on le crée.
        Role userRole = roleRepository.findByRole(roleEnum)
                .orElseGet(() -> roleRepository.save(new Role(roleEnum)));
        // ✅ Vérifier si le numéro de téléphone est validé via Twilio

        if (!isEmailVerified(dto.getEmail(),otp)) {
            throw new Exception("Invalid Otp");

        }
        // Création de l'utilisateur
        User user = new User();

// Set user details from DTO
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setAddress(dto.getAddress());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setDateOfBirth(dto.getDateOfBirth());
        user.setSexe(dto.getSexe());
        user.setNomSociete(dto.getNomSociete());
        user.setLinkedinUrl(dto.getLinkedinUrl());
        user.setCountry(dto.getCountry());
        user.setTargetmarket(dto.getTargetmarket());
        user.setResidencetype(dto.getResidencetype());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setStatus(Status.PENDING); // Default to pending
        user.setRole(userRole);

        // return userRepository.save(user);
// Save user and process confirmation email
        User savedUser = userRepository.save(user);
        processConfirmEmail(dto.getEmail());
        return savedUser;
    }

    //Aziz Add this to email part
    public User findByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    @Modifying
    public void updatePassword(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
    }

    public void uploadImage(User user, MultipartFile file) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        user.setProfileImage(fileName);

        // Save the user with the updated image name
        userRepository.save(user);

        // Save the file to the file system
        saveFile(uploadDir + user.getUserId(), fileName, file);
    }

    private void saveFile(String uploadPath, String fileName, org.springframework.web.multipart.MultipartFile file) throws IOException {
        Path uploadPathPath = Paths.get(uploadPath);
        if (!uploadPathPath.toFile().exists()) {
            uploadPathPath.toFile().mkdirs();
        }
        Path filePath = uploadPathPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    }

    public User getUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public UserInfoDTO getUserInfoByEmail(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            Long uid = user.getUserId();
            return new UserInfoDTO(
                    user.getFirstName(),
                    user.getLastName(),
                    user.getAddress(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getDateOfBirth(),
                    user.getSexe(),
                    user.getLinkedinUrl(),
                    uid,
                    uid
            );
        }

        throw new RuntimeException("User not found with email: " + email);
    }
    /**
     * Aligne les libellés front (ex. ESN_COMMERCIAL, ENTREPRISE) sur l'enum ERole côté base.
     */
    public ERole parseRoleString(String role) {
        if (!StringUtils.hasText(role)) {
            throw new IllegalArgumentException("Invalid role: empty");
        }
        String r = role.trim().toUpperCase();
        if ("ENTREPRISE".equals(r)) {
            return ERole.ESN_ADMIN;
        }
        if ("ESN_COMMERCIAL".equals(r)) {
            return ERole.ESN_COMMARCIAL;
        }
        return ERole.valueOf(r);
    }

    public List<UserBasicDTO> getUsersByRoleName(String role) {
        ERole eRole = parseRoleString(role);
        Role re = roleRepository.findByRole(eRole)
                .orElseGet(() -> roleRepository.save(new Role(eRole)));
        return getUsersByRole(re);
    }

    public List<UserBasicDTO> getUsersInSameSociete(Long idSociete) {
        User anchor = userRepository.findById(idSociete)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + idSociete));
        if (!StringUtils.hasText(anchor.getNomSociete())) {
            return mapUsersToBasicDtos(List.of(anchor));
        }
        return mapUsersToBasicDtos(userRepository.findByNomSociete(anchor.getNomSociete()));
    }

    public List<UserBasicDTO> getUsersBySocieteAndRole(Long idSociete, String role) {
        User anchor = userRepository.findById(idSociete)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + idSociete));
        ERole eRole = parseRoleString(role);
        // Pas besoin de la ligne roles : la requête JPA filtre sur l’enum (évite 400 si la table roles est désalignée).
        if (!StringUtils.hasText(anchor.getNomSociete())) {
            if (anchor.getRole() != null && anchor.getRole().getRole() == eRole) {
                return mapUsersToBasicDtos(List.of(anchor));
            }
            return List.of();
        }
        return mapUsersToBasicDtos(userRepository.findByRole_RoleAndNomSociete(eRole, anchor.getNomSociete()));
    }

    public List<UserBasicDTO> getUsersByRole(Role role) {
        return mapUsersToBasicDtos(userRepository.findByRole(role));
    }

    private List<UserBasicDTO> mapUsersToBasicDtos(List<User> users) {
        return users.stream()
                .map(user -> {
                    List<Document> documents = documentRepository.findAllByUserId(user.getUserId());
                    String objectName = documents.stream()
                            .filter(doc -> doc.getFilePath() != null && doc.getFilePath().startsWith("ProfileImage"))
                            .findFirst()
                            .map(Document::getFilePath)
                            .orElse(null);
                    String presignedUrl = objectName != null ? fileStorageService.getPresignedUrl(objectName) : null;
                    return new UserBasicDTO(
                            user.getUserId(),
                            user.getFirstName(),
                            user.getLastName(),
                            user.getEmail(),
                            user.getPhone(),
                            presignedUrl,
                            user.getStatus()
                    );
                })
                .collect(Collectors.toList());
    }
    public void updateUserStatus(Long userId, Status newStatus) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(newStatus);
        userRepository.save(user);  // Save the updated user
    }

}