package com.dpc.user_service.Proxy;


import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "QuizService")
public interface QuizClient {
    @GetMapping("/api/v1/quiz/result/{userId}")
    ResponseEntity<Map<String, Object>> getQuizResult(@PathVariable Long userId);
}
