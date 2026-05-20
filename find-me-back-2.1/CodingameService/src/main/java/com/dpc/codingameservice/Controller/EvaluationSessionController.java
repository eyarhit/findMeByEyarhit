package com.dpc.codingameservice.Controller;


import com.dpc.codingameservice.Entity.EvaluationSession;
import com.dpc.codingameservice.Entity.StartSessionRequest;
import com.dpc.codingameservice.Service.EvaluationSessionService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/v1/evaluation-session")
@AllArgsConstructor
public class EvaluationSessionController {

    private final EvaluationSessionService sessionService;

  /*  @PostMapping("/start")
    public EvaluationSession startSession(@RequestBody StartSessionRequest request) {
        return sessionService.startSession(request);
    } */

    @PostMapping("/start/{userId}")
    public ResponseEntity<EvaluationSession> startSession(
            @RequestBody StartSessionRequest request,
            @PathVariable Long userId
    ) {
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }

        EvaluationSession session = sessionService.startSession(request, userId);
        return ResponseEntity.ok(session);
    }








}
