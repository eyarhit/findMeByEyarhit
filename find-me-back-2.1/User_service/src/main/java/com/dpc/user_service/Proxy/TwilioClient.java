package com.dpc.user_service.Proxy;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@FeignClient(name = "twilio")
public interface TwilioClient {
    @PostMapping("/verifyotp")
    ResponseEntity<String> verifyPhone(@RequestParam("phone") String phone, @RequestParam("otp") String otp);
}