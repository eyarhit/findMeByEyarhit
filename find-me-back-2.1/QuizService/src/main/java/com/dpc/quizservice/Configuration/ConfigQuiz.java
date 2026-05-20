package com.dpc.quizservice.Configuration;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
@EnableWebSecurity
public class ConfigQuiz {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Désactiver CSRF pour les appels API
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/api/v1/**"
                        ).permitAll() // Autoriser Swagger et les APIs du quiz
                        .anyRequest().permitAll() // Autoriser toutes les requêtes sans authentification
                )
                .formLogin(form -> form.disable()) // Désactiver complètement le formulaire de connexion
                .httpBasic(httpBasic -> httpBasic.disable()) // Désactiver l’authentification HTTP Basic
                .logout(logout -> logout.disable()); // Désactiver le logout

        return http.build();
    }

}

