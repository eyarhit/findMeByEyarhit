package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Candidature implements Serializable {
    private static final ObjectMapper OM = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_candidature")
    private Long idCandidature;
    private Long candidatId;
    private String IdDocumentCv;

    /** JSON array of document IDs, e.g. [1,2,3] */
    @JsonIgnore
    @Column(name = "dossier_competence_json", columnDefinition = "TEXT")
    private String dossierCompetenceJson;

    @Enumerated(EnumType.STRING)
    private StatusCandidature statutCandidature = StatusCandidature.ENCOURS;

    private LocalDateTime datePostulation;

    @ManyToOne
    @JoinColumn(name = "mission_id", referencedColumnName = "idMission", nullable = true)
    private Mission mission;

    @PrePersist
    protected void onCreate() {
        if (datePostulation == null) {
            datePostulation = LocalDateTime.now();
        }
    }

    /**
     * Exposed to the Angular app as {@code dossiercompetence} (ids of CV, certificats, etc.).
     */
    public List<Long> getDossiercompetence() {
        try {
            if (dossierCompetenceJson != null && !dossierCompetenceJson.isBlank()) {
                return OM.readValue(dossierCompetenceJson, new TypeReference<List<Long>>() {});
            }
        } catch (Exception ignored) {
            // fall through
        }
        if (IdDocumentCv != null && !IdDocumentCv.isBlank()) {
            try {
                return Collections.singletonList(Long.parseLong(IdDocumentCv.trim()));
            } catch (NumberFormatException e) {
                String[] parts = IdDocumentCv.split(",");
                List<Long> out = new ArrayList<>();
                for (String p : parts) {
                    if (p != null && !p.isBlank()) {
                        try {
                            out.add(Long.parseLong(p.trim()));
                        } catch (NumberFormatException ignored) {
                            // skip invalid token
                        }
                    }
                }
                return out;
            }
        }
        return Collections.emptyList();
    }
}
