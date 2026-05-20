package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Descrip_mission implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDescriptionMission;
    private String mission_name;
    private String avantages;
    private String description ;
    @ElementCollection
    private List<String> competencesRequises = new ArrayList<>();
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private Date date_debut;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private Date date_fin;
    private String poste ;
    @Enumerated(EnumType.STRING)
    private Langue langue ;

    private String futures_taches ;

    /** Nullable côté JSON ; normalisé à 0 avant persistance si absent. */
    private Integer nbre_recruteurs;

    private Float salaire ;
    private Boolean isRemote ;

    @Enumerated(EnumType.STRING)
    private Statut statut ;

    @Enumerated(EnumType.STRING)
    private TypeContrat typeContrat ;
    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "idMission", referencedColumnName = "idMission") // Assurez-vous que la clé étrangère correspond à la clé primaire de Mission
    private Mission mission;

    public String getMission_name() {
        return mission_name;
    }

    public void setMission_name(String mission_name) {
        this.mission_name = mission_name;
    }

    public String getAvantages() {
        return avantages;
    }

    public void setAvantages(String avantages) {
        this.avantages = avantages;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getCompetencesRequises() {
        return competencesRequises;
    }

    public void setCompetencesRequises(List<String> competencesRequises) {
        this.competencesRequises = competencesRequises;
    }

    public Date getDate_debut() {
        return date_debut;
    }

    public void setDate_debut(Date date_debut) {
        this.date_debut = date_debut;
    }

    public Date getDate_fin() {
        return date_fin;
    }

    public void setDate_fin(Date date_fin) {
        this.date_fin = date_fin;
    }

    public String getPoste() {
        return poste;
    }

    public void setPoste(String poste) {
        this.poste = poste;
    }

    public Langue getLangue() {
        return langue;
    }

    public void setLangue(Langue langue) {
        this.langue = langue;
    }

    public String getFutures_taches() {
        return futures_taches;
    }

    public void setFutures_taches(String futures_taches) {
        this.futures_taches = futures_taches;
    }

    public Integer getNbre_recruteurs() {
        return nbre_recruteurs;
    }

    public void setNbre_recruteurs(Integer nbre_recruteurs) {
        this.nbre_recruteurs = nbre_recruteurs;
    }

    public Float getSalaire() {
        return salaire;
    }

    public void setSalaire(Float salaire) {
        this.salaire = salaire;
    }

    public Boolean getIsRemote() {
        return isRemote;
    }

    public void setIsRemote(Boolean isRemote) {
        this.isRemote = isRemote;
    }

    public Statut getStatut() {
        return statut;
    }

    public void setStatut(Statut statut) {
        this.statut = statut;
    }

    public TypeContrat getTypeContrat() {
        return typeContrat;
    }

    public void setTypeContrat(TypeContrat typeContrat) {
        this.typeContrat = typeContrat;
    }

    public Mission getMission() {
        return mission;
    }

    public void setMission(Mission mission) {
        this.mission = mission;
    }
}
