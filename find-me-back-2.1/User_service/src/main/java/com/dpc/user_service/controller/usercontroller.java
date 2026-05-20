package com.dpc.user_service.controller;

import com.dpc.user_service.Auth.AuthenticationRequest;
import com.dpc.user_service.Auth.AuthenticationService;
import com.dpc.user_service.DTO.*;
import com.dpc.user_service.Entities.*;
import com.dpc.user_service.Repository.BlacklistedTokenRepository;
import com.dpc.user_service.Repository.RoleRepository;
import com.dpc.user_service.Repository.UserRepository;
import com.dpc.user_service.services.JwtService;
import com.dpc.user_service.services.OtpService;
import com.dpc.user_service.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.Email;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/users")

public class usercontroller {

    private static ResponseEntity<Map<String, String>> badRequestJson(String message) {
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("error", message));
    }

    @Autowired
    BlacklistedTokenRepository blacklistedTokenRepository;
    @Autowired
    AuthenticationService authenticationService;
    @Autowired
    private JwtService jwtService;
   @Autowired // Ensure this annotation is present
    private OtpService otpService;

   @Autowired
    UserRepository userRepository;
    @Autowired
    RoleRepository roleRepository;

    private final UserService userService;

    public usercontroller(UserService userInfoService) {
        this.userService = userInfoService;
    }


    @PostMapping("/register")
    @CrossOrigin(origins = "https://dev.find-me-2.1")
    public ResponseEntity<?> registerUser(@RequestBody UserRegistrationDTO dto, @RequestParam String otp) {
        try {
            User registeredUser = userService.registerUser(dto, otp);
            return ResponseEntity.ok(registeredUser);
        } catch (Exception e) {
            return badRequestJson(e.getMessage() != null ? e.getMessage() : "Registration failed");
        }
    }
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody AuthenticationRequest request) {
        try {
            return ResponseEntity.ok(authenticationService.authenticate(request));
        } catch (BadCredentialsException e) {
            // Wrong credentials
            Map<String, String> error = new HashMap<>();
            error.put("error", "Email ou mot de passe invalide.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (UsernameNotFoundException e) {
            // User not found
            Map<String, String> error = new HashMap<>();
            error.put("error", "Utilisateur non trouvé.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            // General error
            Map<String, String> error = new HashMap<>();
            error.put("error", "Probleme serveur");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateUserByEmail(@RequestParam String email, @RequestBody UserInfoDTO updatedUserInfo) {
        try {
            // Retrieve the existing user based on the email
            User user = userService.findByEmail(email);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found with email: " + email);
            }

            // Update the user's details
            user.setFirstName(updatedUserInfo.getFirstName());
            user.setLastName(updatedUserInfo.getLastName());
            user.setAddress(updatedUserInfo.getAddress());
            user.setPhone(updatedUserInfo.getPhone());
            user.setDateOfBirth(updatedUserInfo.getDateOfBirth());
            user.setSexe(updatedUserInfo.getSexe());
            user.setLinkedinUrl(updatedUserInfo.getLinkedinUrl());

            // Save the updated user information
            userService.updateUser(user);

            // Return the updated user details as a response
            return ResponseEntity.ok(new UserResponseDTO(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating user: " + e.getMessage());
        }
    }



//    @PostMapping("/logout")
//    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
//        final String authHeader = request.getHeader("Authorization");
//
//        // Vérifier si le token est fourni
//        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//            Map<String, String> response = new HashMap<>();
//            response.put("message", "No token provided.");
//            return ResponseEntity.badRequest().body(response);
//        }
//
//        String token = authHeader.substring(7); // Extraction du token
//
//        try {
//            // Extraire la date d'expiration du token
//            LocalDateTime expiry = jwtService.extractExpirationAsLocalDateTime(token);
//
//            // Ajouter le token à la liste noire
//            BlacklistedToken blacklistedToken = BlacklistedToken.builder()
//                    .token(token)
//                    .expiration(expiry)
//                    .build();
//            blacklistedTokenRepository.save(blacklistedToken);
//
//            // Retourner une réponse claire
//            Map<String, String> response = new HashMap<>();
//            response.put("message", "Logged out successfully!");
//            return ResponseEntity.ok(response);
//
//        } catch (Exception e) {
//            // Gestion des erreurs
//            Map<String, String> response = new HashMap<>();
//            response.put("message", "Error during logout: " + e.getMessage());
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
//        }
//    }


    @GetMapping("/by-email")
    public UserInfoDTO getUserInfoByEmail(@RequestParam String email) {
        return userService.getUserInfoByEmail(email);
    }

    @GetMapping("/by-societe")
    public ResponseEntity<?> getUsersBySociete(
            @RequestParam String role,
            @RequestParam("idSociete") Long idSociete) {
        try {
            return ResponseEntity.ok(userService.getUsersBySocieteAndRole(idSociete, role));
        } catch (IllegalArgumentException e) {
            return badRequestJson(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Error fetching users by societe"));
        }
    }

    @GetMapping("/by-societe/{idSociete}")
    public ResponseEntity<?> getUsersBySocieteIdOnly(@PathVariable Long idSociete) {
        try {
            return ResponseEntity.ok(userService.getUsersInSameSociete(idSociete));
        } catch (IllegalArgumentException e) {
            return badRequestJson(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Error fetching users by societe"));
        }
    }

    @GetMapping("/find-user-by-email")
    public ResponseEntity<?> getUserByEmail(
            @RequestParam String email) {

        // Manual email validation
        if (email == null || !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            return badRequestJson("Invalid email format");
        }

        try {
            User user = userService.findByEmail(email);
            if (user != null) {
                return ResponseEntity.ok(new UserResponseDTO(user));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found with email: " + email);
        } catch (Exception e) {
          //  log.error("Error retrieving user with email: " + email, e);
            return ResponseEntity.internalServerError()
                    .body("Error retrieving user: " + e.getMessage());
        }
    }
    @PostMapping("/generate")
    @Operation(summary = "Générer un code OTP", description = "Envoie un code OTP à l'email spécifié")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Code OTP envoyé avec succès"),
            @ApiResponse(responseCode = "400", description = "Email déjà utilisé"),
            @ApiResponse(responseCode = "500", description = "Erreur interne")
    })
    public ResponseEntity<String> generateOtp(
            @Parameter(description = "Adresse email pour recevoir le code OTP") @RequestParam String email) {
        return otpService.generateOtp(email);
    }

    @PostMapping("/validate")
    @Operation(summary = "Valider un code OTP", description = "Vérifie si le code OTP est valide pour l'email donné")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Code OTP valide"),
            @ApiResponse(responseCode = "400", description = "Code OTP invalide ou expiré"),
            @ApiResponse(responseCode = "500", description = "Erreur interne")
    })
    public ResponseEntity<Boolean> validateOtp(
            @Parameter(description = "Adresse email associée au code OTP") @RequestParam String email,
            @Parameter(description = "Code OTP à valider") @RequestParam String otp) {
        boolean isValid = otpService.validateOtp(email, otp);
        return ResponseEntity.ok(isValid);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        try {
            User user= userRepository.findById(userId).orElse(null);

            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    // Endpoint to get users by role
    @GetMapping("/role/{role}")
    @Operation(
            summary = "Get users by role",
            description = "Fetches all users who have the specified role.",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Users successfully retrieved",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE,
                                    schema = @Schema(implementation = User.class))
                    ),
                    @ApiResponse(
                            responseCode = "400",
                            description = "Invalid role specified",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE)
                    ),
                    @ApiResponse(
                            responseCode = "500",
                            description = "Internal server error",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE)
                    )
            }
    )

    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        try {
            List<UserBasicDTO> users = userService.getUsersByRoleName(role);
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            return badRequestJson("Invalid role: " + role);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("error", "Error fetching users by role."));
        }
    }

    @PutMapping("/{userId}/status")
    public ResponseEntity<Map<String, Object>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam Status status
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Update the user status
            userService.updateUserStatus(userId, status);

            // Successful response
            response.put("status", "success");
            response.put("message", "User status updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log the exception (optional)
            e.printStackTrace();

            // Error response
            response.put("status", "error");
            response.put("message", "Error updating user status");
            return ResponseEntity.status(500).body(response);
        }
    }


}


    /**

     *
      * @param profilePicture
     * @param documents
     * @param userId
     * @return
     */





