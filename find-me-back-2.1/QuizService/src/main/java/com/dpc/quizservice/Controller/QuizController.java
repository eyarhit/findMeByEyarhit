package com.dpc.quizservice.Controller;

import com.dpc.quizservice.Service.QuizService;
import com.dpc.quizservice.model.QuizQuestion;
import com.dpc.quizservice.model.UserQuizResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/quiz")
public class QuizController {
    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }
    @GetMapping("/questions")
    public ResponseEntity<List<QuizQuestion>> getQuestions(@RequestParam(required = false) String type) {
        if (type != null && !type.isEmpty()) {
            return ResponseEntity.ok(quizService.getQuizQuestionsByType(type));
        }
        return ResponseEntity.ok(quizService.getQuizQuestions());
    }
    @PostMapping("/add-questions")
    public QuizQuestion addQuiz(@RequestBody QuizQuestion quiz) {
        return quizService.addQuiz(quiz);
    }


}
