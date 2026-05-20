package com.dpc.codingameservice.Controller;

import com.dpc.codingameservice.Entity.Question;
import com.dpc.codingameservice.Service.QuestionService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/codingame")
@AllArgsConstructor
public class QuestionController {

    @Autowired
    private final QuestionService questionService ;


    @GetMapping("/questions")
    public List<Question> getQuestions(
            @RequestParam Long levelId,
            @RequestParam Long domainId,
            @RequestParam Long frameworkId) {
        return questionService.getFilteredQuestions(levelId, domainId, frameworkId);
    }
}