package com.dpc.cv_service.Entites;

import com.dpc.cv_service.Configuration.FlexibleLocalDateDeserializer;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Experience implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)

    private Long id_experience;
    private String entreprise;
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    private LocalDate dateDebut;
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    private LocalDate dateFin;
    private String poste;
    private String nomProjet;
    private String client;
    private String equipe;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String travailRealise;
    private String environnement;

    @ManyToOne
    @JsonIgnore
    private Cv cv;
}


