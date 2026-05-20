package com.dpc.user_service.services;

import com.dpc.user_service.Entities.Mail;
import com.dpc.user_service.Entities.Otp;
import com.dpc.user_service.Entities.User;
import com.dpc.user_service.Repository.OtpRepository;
import com.dpc.user_service.Repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @Autowired
    private UserService userService;

    @Value("${spring.mail.username}")
    private String mailFrom;

    public ResponseEntity<String> generateOtp(String email) {
        try {
            // Check if the email is already associated with a user
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email est déja utiliser");
            }

            // Check for existing OTP and delete it if present
            Otp existingOtp = otpRepository.findByEmail(email);
            if (existingOtp != null) {
                otpRepository.delete(existingOtp);
            }

            // Generate a new OTP
            String otp = String.valueOf(100000 + new Random().nextInt(900000));
            Otp otpEntity = new Otp();
            otpEntity.setEmail(email);
            otpEntity.setOtp(otp);
            otpEntity.setExpirationTime(System.currentTimeMillis() + 240000); // 4 minutes
            otpRepository.save(otpEntity);

            // Prepare the model for the email
            Map<String, Object> model = new HashMap<>();
            User user = userService.findByEmail(email);
            model.put("user", user != null ? user : new User());
            model.put("otp", otp);

            Mail mail = new Mail();
            mail.setTo(email);
            mail.setFrom(mailFrom);
            mail.setSubject("Code de Vérification");
            mail.setModel(model);

            sendOtpEmail(mail); // Send the email with the model

            return ResponseEntity.ok("OTP sent successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred while generating OTP.");
        }
    }



    public void sendOtpEmail(Mail mail) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());
            Context context = new Context();
            context.setVariables(mail.getModel());
            String html = templateEngine.process("email/Otp-template", context);
            helper.setTo(mail.getTo());
            helper.setFrom(mail.getFrom());
            helper.setSubject(mail.getSubject());
            helper.setText(html, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
    public boolean validateOtp(String email, String otp) {
        Otp otpEntity = otpRepository.findByEmail(email);

        if (otpEntity == null) {
            throw new RuntimeException("Aucun code OTP trouvé pour cet email.");
        }
        if (!otpEntity.getOtp().equals(otp)) {
            throw new RuntimeException("Code OTP incorrect.");
        }
        if (System.currentTimeMillis() > otpEntity.getExpirationTime()) {
            throw new RuntimeException("Code OTP expiré.");
        }
        otpRepository.delete(otpEntity);

        return true;
    }
    public void deleteExpiredOtps() {
        long currentTime = System.currentTimeMillis();
        otpRepository.deleteByExpirationTimeLessThan(currentTime);
    }
}
