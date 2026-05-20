package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Mission implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMission;
    private String reference_code ;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    private String logo ;
    private Boolean archived;
    @JsonAlias({"id_societer", "idSociete", "userId"})
    private Long user_id;

    @Enumerated(EnumType.STRING)
    private StatusMission statusMission ;

    @OneToOne(mappedBy = "mission", cascade = CascadeType.ALL, orphanRemoval = true)
    private Descrip_mission descrip_mission;

    @OneToOne(mappedBy = "mission", cascade = CascadeType.ALL, orphanRemoval = true)
    private ProfilDemande profilDemande;


    @ManyToOne
    @JoinColumn(name = "ville_id")
    private Ville ville;

    @ManyToOne
    @JoinColumn(name = "pays_id")
    private Pays pays;


    @JsonIgnore
    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL)
    private Set<Candidature> candidatures;

    public Long getIdMission() {
        return idMission;
    }

    public void setIdMission(Long idMission) {
        this.idMission = idMission;
    }

    public String getReference_code() {
        return reference_code;
    }

    public void setReference_code(String reference_code) {
        this.reference_code = reference_code;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getLogo() {
        return logo;
    }

    public void setLogo(String logo) {
        this.logo = logo;
    }

    public Boolean getArchived() {
        return archived;
    }

    public void setArchived(Boolean archived) {
        this.archived = archived;
    }

    public Long getUser_id() {
        return user_id;
    }

    public void setUser_id(Long user_id) {
        this.user_id = user_id;
    }

    public StatusMission getStatusMission() {
        return statusMission;
    }

    public void setStatusMission(StatusMission statusMission) {
        this.statusMission = statusMission;
    }

    public Descrip_mission getDescrip_mission() {
        return descrip_mission;
    }

    public void setDescrip_mission(Descrip_mission descrip_mission) {
        this.descrip_mission = descrip_mission;
    }

    public ProfilDemande getProfilDemande() {
        return profilDemande;
    }

    public void setProfilDemande(ProfilDemande profilDemande) {
        this.profilDemande = profilDemande;
    }

    public Ville getVille() {
        return ville;
    }

    public void setVille(Ville ville) {
        this.ville = ville;
    }

    public Pays getPays() {
        return pays;
    }

    public void setPays(Pays pays) {
        this.pays = pays;
    }

    public Set<Candidature> getCandidatures() {
        return candidatures;
    }

    public void setCandidatures(Set<Candidature> candidatures) {
        this.candidatures = candidatures;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (reference_code == null || reference_code.isBlank()) {
            reference_code = "REF-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
    }
}
