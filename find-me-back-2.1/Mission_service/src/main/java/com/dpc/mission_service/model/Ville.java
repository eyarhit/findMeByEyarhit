package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Ville implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idVille;
    private String nomdeville;

    @ManyToOne
    @JoinColumn(name = "pays_id")
    private Pays pays;


    @JsonIgnore
    @OneToMany(mappedBy = "ville", cascade = CascadeType.ALL)
    private Set<Mission> missions;
}
