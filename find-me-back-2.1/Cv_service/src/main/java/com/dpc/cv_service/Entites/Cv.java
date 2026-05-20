package com.dpc.cv_service.Entites;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Cv implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_cv;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    private String createdBy;

    private String titreDeProfil;

    @ElementCollection
    @CollectionTable(name = "cv_completed_steps", joinColumns = @JoinColumn(name = "cv_id"))
    @Column(name = "step_number")
    private List<Integer> completedSteps = new ArrayList<>();

    @Column(unique = true)
    @JsonAlias({"idUser", "user_id", "userid"})
    private Long userId;

    @OneToMany(mappedBy = "cv", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Experience> experiences;

    @OneToMany(mappedBy = "cv", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Education> educations;

    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(
            name = "cv_langue",
            joinColumns = @JoinColumn(name = "cv_id"),
            inverseJoinColumns = @JoinColumn(name = "langue_id")
    )
    private List<Langue> langues;



    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(
            name = "cv_competence",
            joinColumns = @JoinColumn(name = "cv_id"),
            inverseJoinColumns = @JoinColumn(name = "competence_id")
    )
    private List<Competence> competences;



}
