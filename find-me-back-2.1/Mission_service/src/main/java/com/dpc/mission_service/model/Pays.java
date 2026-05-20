package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pays implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nom; // ex : "France", "Tunisie"

    @JsonIgnore
    @OneToMany(mappedBy = "pays", cascade = CascadeType.ALL)
    private Set<Ville> villes;
}
