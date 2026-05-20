package com.dpc.codingameservice.Service;

import com.dpc.codingameservice.Entity.AnswerRequest;
import com.dpc.codingameservice.Entity.EvaluationSession;
import com.dpc.codingameservice.Entity.Question;
import com.dpc.codingameservice.Entity.UserAnswer;
import com.dpc.codingameservice.Repository.EvaluationSessionRepository;
import com.dpc.codingameservice.Repository.QuestionRepository;
import com.dpc.codingameservice.Repository.UserAnswerRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class UserAnswerService {

    private final UserAnswerRepository answerRepo;
    private final QuestionRepository questionRepo;
    private final EvaluationSessionRepository sessionRepo;

    public UserAnswer saveAnswer(Long sessionId, AnswerRequest req) {
        Question question = questionRepo.findById(req.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        EvaluationSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // TODO: logique plus évoluée
        boolean correct = req.getUserResponse().equalsIgnoreCase(question.getCorrectAnswer());


        UserAnswer answer = new UserAnswer();
        answer.setSession(session);
        answer.setQuestion(question);
        answer.setUserResponse(req.getUserResponse());
        answer.setCorrect(correct);

        return answerRepo.save(answer);
    }
}
