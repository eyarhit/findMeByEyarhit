package com.dpc.quizservice.Service;

import com.dpc.quizservice.Repository.QuizQuestionRepository;
import com.dpc.quizservice.Repository.UserQuizResultRepository;
import com.dpc.quizservice.model.QuizQuestion;
import com.dpc.quizservice.model.UserQuizResult;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service

public class
QuizService {
    private final QuizQuestionRepository quizQuestionRepository;
    private final UserQuizResultRepository userQuizResultRepository;

    public QuizService(QuizQuestionRepository quizQuestionRepository, UserQuizResultRepository userQuizResultRepository) {
        this.quizQuestionRepository = quizQuestionRepository;
        this.userQuizResultRepository = userQuizResultRepository;
    }
    public List<QuizQuestion> getQuizQuestions() {
        return quizQuestionRepository.findAll();
    }

    public QuizQuestion addQuiz(QuizQuestion quiz) {
        return quizQuestionRepository.save(quiz);
    }
    public List<QuizQuestion> getQuizQuestionsByType(String type) {
        return quizQuestionRepository.findByType(type);
    }

    public boolean submitQuiz(Long userId, Map<Long, String> userAnswers) throws Exception {
        List<QuizQuestion> questions = quizQuestionRepository.findAll();
        if (questions.isEmpty()) {
            throw new Exception("Aucune question de quiz disponible");
        }

        int correctAnswers = 0;
        for (QuizQuestion question : questions) {
            if (userAnswers.containsKey(question.getId()) && userAnswers.get(question.getId()).equalsIgnoreCase(question.getCorrectAnswer())) {
                correctAnswers++;
            }
        }

        int passingScore = questions.size() / 2; // Note minimale requise (moitié des questions)
        boolean passed = correctAnswers >= passingScore;

        // Sauvegarde du résultat
        UserQuizResult result = new UserQuizResult(null, userId, correctAnswers, passed);
        userQuizResultRepository.save(result);

        return passed;
    }
    public Optional<UserQuizResult> getUserQuizResult(Long userId) {
        return userQuizResultRepository.findByUserId(userId);
    }

}
