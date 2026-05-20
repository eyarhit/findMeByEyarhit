package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProfilDemande implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_profil;
    private String exigences ;
    private Float annees_experiences ;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "idMission", referencedColumnName = "idMission") // Assurez-vous que la clé étrangère correspond à la clé primaire de Mission
    private Mission mission;

    public String getExigences() {
        return exigences;
    }

    public void setExigences(String exigences) {
        this.exigences = exigences;
    }

    public Float getAnnees_experiences() {
        return annees_experiences;
    }

    public void setAnnees_experiences(Float annees_experiences) {
        this.annees_experiences = annees_experiences;
    }

    public Mission getMission() {
        return mission;
    }

    public void setMission(Mission mission) {
        this.mission = mission;
    }
}
