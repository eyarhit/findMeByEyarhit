package com.dpc.codingameservice.Service;

import com.dpc.codingameservice.Entity.Question;
import com.dpc.codingameservice.Repository.QuestionRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class QuestionService {

    public final QuestionRepository questionRepository ;


    public List<Question> getFilteredQuestions(Long levelId, Long domainId, Long frameworkId) {
        return questionRepository.findByLevelIdAndDomainIdAndFrameworkId(levelId, domainId, frameworkId);
    }
}