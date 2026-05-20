package com.dpc.codingameservice.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor

public class UserAnswer implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private Long id;

    @ManyToOne
    private EvaluationSession session;

    @ManyToOne
    private Question question;

    @Column(columnDefinition = "TEXT")
    private String userResponse;

    private boolean isCorrect;
}
