package com.dpc.cv_service.Entites;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Competence implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)

    private Long id_competence;
    private String langageBallsage;
    private String languageProgrammation;
    private String framework;
    private String bibliotheque;
    private String api;
    private String db;
    private String systemExploitation;
    private String conception;
    private String methodologie;
    private String designPattern;
    private String architechture;
    private String outils;

    @ManyToMany
    @JoinTable(
            name = "competence_cv",
            joinColumns = @JoinColumn(name = "competence_id"),
            inverseJoinColumns = @JoinColumn(name = "cv_id")
    )
    @JsonIgnore
    private List<Cv> cvs = new ArrayList<>();
}
