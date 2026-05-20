package com.dpc.user_service;

import com.dpc.user_service.Entities.ERole;
import com.dpc.user_service.Entities.Role;
import com.dpc.user_service.Entities.Status;
import com.dpc.user_service.Entities.User;
import com.dpc.user_service.Repository.RoleRepository;
import com.dpc.user_service.Repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class UserServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}

