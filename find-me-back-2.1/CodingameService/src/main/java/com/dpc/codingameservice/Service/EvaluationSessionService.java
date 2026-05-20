package com.dpc.codingameservice.Service;

import com.dpc.codingameservice.Entity.Domain;
import com.dpc.codingameservice.Entity.EvaluationSession;
import com.dpc.codingameservice.Entity.Experiencelevel;
import com.dpc.codingameservice.Entity.StartSessionRequest;
import com.dpc.codingameservice.Repository.DomainRepository;
import com.dpc.codingameservice.Repository.EvaluationSessionRepository;
import com.dpc.codingameservice.Repository.ExperienceLevelRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@AllArgsConstructor
public class EvaluationSessionService {

    private final EvaluationSessionRepository repository;
    private final ExperienceLevelRepository levelRepo;
    private final DomainRepository domainRepo;

    public EvaluationSession startSession(StartSessionRequest request, Long userId) {
        EvaluationSession session = new EvaluationSession();

        session.setUserId(userId); //  liaison de l'utilisateur à la session

        // Récupérer les entités liées depuis leurs IDs
        Experiencelevel level = levelRepo.findById(request.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid levelId"));
        Domain domain = domainRepo.findById(request.getDomainId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid domainId"));

        session.setLevel(level);
        session.setDomain(domain);
        session.setStartTime(LocalDateTime.now());
        session.setTotalScore(0.0); // Initialisation du score

        return repository.save(session);
    }



}
