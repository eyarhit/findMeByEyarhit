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
public class Education implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)

    private Long id_education;
    private String university;
    private String diplome;
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    private LocalDate dateDebut;
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    private LocalDate dateFin;

    @ManyToOne
    @JsonIgnore
    private Cv cv;
}
