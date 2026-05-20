package com.dpc.mission_service.feign;


import com.dpc.mission_service.configuration.FeignClientConfig;
import com.dpc.mission_service.model.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", configuration = FeignClientConfig.class)
public interface UserClient {
    @GetMapping("/api/v1/users/{id}")
    User getUserById(@PathVariable("id") Long id);
}
