package com.dpc.codingameservice.Service;

import com.dpc.codingameservice.Entity.*;
import com.dpc.codingameservice.Repository.EvaluationResultRepository;
import com.dpc.codingameservice.Repository.EvaluationSessionRepository;
import com.dpc.codingameservice.Repository.UserAnswerRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class EvaluationResultService {

    private final EvaluationResultRepository resultRepo;
    private final UserAnswerRepository answerRepo;
    private final EvaluationSessionRepository sessionRepo;


    public List<EvaluationResult> generateResults(EvaluationSession session) {
        List<UserAnswer> answers = answerRepo.findBySessionId(session.getId());

        // Grouper par framework
        Map<Framework, List<UserAnswer>> groupedByFramework = answers.stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getFramework()));

        double totalScore = 0.0;

        for (Map.Entry<Framework, List<UserAnswer>> entry : groupedByFramework.entrySet()) {
            Framework framework = entry.getKey();
            List<UserAnswer> answersForFramework = entry.getValue();

            long correctCount = answersForFramework.stream()
                    .filter(UserAnswer::isCorrect)
                    .count();

            double score = (double) correctCount / answersForFramework.size() * 100.0;

            EvaluationResult result = new EvaluationResult();
            result.setSession(session);
            result.setFramework(framework);
            result.setScore(score);

            resultRepo.save(result);
            totalScore += score;
        }

        // Mise à jour du score global dans la session (moyenne par framework)
        session.setTotalScore(totalScore / groupedByFramework.size());

        return resultRepo.findBySessionId(session.getId());
    }
    public List<CodingameResultDto> getResultsByUser(Long userId) {
        List<EvaluationSession> sessions = sessionRepo.findAll()
                .stream()
                .filter(session -> session.getUserId() != null && session.getUserId().equals(userId))
                .toList();

        List<CodingameResultDto> results = new ArrayList<>();

        for (EvaluationSession session : sessions) {
            List<EvaluationResult> evaluationResults = resultRepo.findBySessionId(session.getId());

            for (EvaluationResult result : evaluationResults) {
                CodingameResultDto dto = new CodingameResultDto(
                        session.getEndTime() != null ? session.getEndTime() : session.getStartTime(),
                        session.getDuration(),
                        result.getFramework().getName(),
                        result.getScore(),
                        session.getLevel().getName(),
                        session.getDomain().getName()
                );
                results.add(dto);
            }
        }

        return results;
    }

}
