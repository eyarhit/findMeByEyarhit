package com.dpc.cv_service.Configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")  // Applique CORS à toutes les routes
                        .allowedOrigins("http://localhost:4200", "https://dev.find-me-2.1.dpc.com.tn/")  // Autorise le frontend Angular
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // Autorise ces méthodes
                        .allowedHeaders("*")  // Autorise tous les headers
                        .allowCredentials(true);  // Autorise les cookies et l'authentification
            }
        };
    }
}
