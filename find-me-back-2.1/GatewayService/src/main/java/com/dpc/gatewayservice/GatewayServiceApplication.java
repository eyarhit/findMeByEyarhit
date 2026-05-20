package com.dpc.gatewayservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;

@Configuration
@SpringBootApplication

public class GatewayServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(
                GatewayServiceApplication.class, args);
    }

}
