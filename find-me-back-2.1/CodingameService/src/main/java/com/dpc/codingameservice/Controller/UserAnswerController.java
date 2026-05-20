package com.dpc.codingameservice.Controller;

import com.dpc.codingameservice.Entity.AnswerRequest;
import com.dpc.codingameservice.Entity.UserAnswer;
import com.dpc.codingameservice.Service.UserAnswerService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/answers")
@AllArgsConstructor
public class UserAnswerController {

    private final UserAnswerService userAnswerService;

    @PostMapping("/sessions/{sessionId}")
    public UserAnswer submitAnswer(@PathVariable Long sessionId,
                                   @RequestBody AnswerRequest request) {
        return userAnswerService.saveAnswer(sessionId, request);
    }
}
