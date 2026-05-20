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
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Langue implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id_langue;
    private String name;
    private String niveau;

    @ManyToMany
    @JoinTable(
            name = "langue_cv",
            joinColumns = @JoinColumn(name = "langue_id"),
            inverseJoinColumns = @JoinColumn(name = "cv_id")
    )
    @JsonIgnore
    private List<Cv> cvs = new ArrayList<>();
}
