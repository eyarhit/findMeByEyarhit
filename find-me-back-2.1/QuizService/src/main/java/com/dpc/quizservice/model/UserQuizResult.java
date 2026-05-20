package com.dpc.quizservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "user_quiz_results")
public class UserQuizResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId; // On stocke l'ID utilisateur (envoyé depuis user-service)
    private int score;
    private boolean passed; // true si l'utilisateur a réussi le quiz
}



