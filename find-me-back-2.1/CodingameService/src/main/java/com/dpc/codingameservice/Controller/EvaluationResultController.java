package com.dpc.codingameservice.Controller;

import com.dpc.codingameservice.Entity.CodingameResultDto;
import com.dpc.codingameservice.Entity.EvaluationResult;
import com.dpc.codingameservice.Entity.EvaluationSession;
import com.dpc.codingameservice.Repository.EvaluationSessionRepository;
import com.dpc.codingameservice.Service.EvaluationResultService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/results")
@AllArgsConstructor
public class EvaluationResultController {

    private final EvaluationResultService resultService;
    private final EvaluationSessionRepository sessionRepo;

    @PostMapping("/sessions/{sessionId}/finish")
    public List<EvaluationResult> finishTest(@PathVariable Long sessionId) {
        EvaluationSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        session.setEndTime(LocalDateTime.now());
        sessionRepo.save(session);

        return resultService.generateResults(session);
    }
    @GetMapping("/users/{userId}")
    public List<CodingameResultDto> getUserResults(@PathVariable Long userId) {
        return resultService.getResultsByUser(userId);
    }

}
