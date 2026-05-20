package com.dpc.mission_service.Controller;
import com.dpc.mission_service.Services.CandidatureService;
import com.dpc.mission_service.model.Candidature;
import com.dpc.mission_service.model.CandidatureRequest;
import com.dpc.mission_service.model.StatusCandidature;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/candidatures")
public class CandidatureController {

    @Autowired
    private CandidatureService candidatureService;

    @Operation(summary = "Créer une nouvelle candidature avec une lettre de motivation")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidature créée avec succès",
                    content = {@Content(mediaType = "application/json",
                            schema = @Schema(implementation = Candidature.class))}),
            @ApiResponse(responseCode = "404", description = "Mission non trouvée",
                    content = @Content)
    })
    @PostMapping("/creercandidature")
    public ResponseEntity<Candidature> creerCandidature(@RequestBody CandidatureRequest request) {
        Long missionId = request.getMission() != null ? request.getMission().getIdMission() : null;
        List<Long> docs = request.getDossiercompetence() != null ? request.getDossiercompetence() : List.of();
        Candidature candidature = candidatureService.creerCandidature(
                request.getCandidatId(),
                missionId,
                docs
        );
        return ResponseEntity.ok(candidature);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Candidature> updateCandidatureStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String raw = body != null ? body.get("status") : null;
        if (raw == null || raw.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        StatusCandidature statut = parseStatus(raw);
        if (statut == null) {
            return ResponseEntity.badRequest().build();
        }
        Candidature updated = candidatureService.updateStatut(id, statut);
        return ResponseEntity.ok(updated);
    }

    private StatusCandidature parseStatus(String raw) {
        String normalized = raw.trim().toUpperCase(Locale.ROOT)
                .replace("É", "E")
                .replace("È", "E")
                .replace("Ê", "E")
                .replace('-', '_')
                .replace(' ', '_');

        return switch (normalized) {
            case "ENCOURS", "EN_COURS", "ENATTENTE", "EN_ATTENTE" -> StatusCandidature.ENCOURS;
            case "ACCEPTER", "ACCEPTE", "ACCEPTEE" -> StatusCandidature.ACCEPTER;
            case "REFUSER", "REFUSE", "REFUSEE" -> StatusCandidature.REFUSER;
            default -> null;
        };
    }
    @Operation(summary = "Récupérer toutes les candidatures")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des candidatures récupérée avec succès",
                    content = {@Content(mediaType = "application/json",
                            schema = @Schema(implementation = Candidature.class))})
    })
    @GetMapping("/allCondidature")
    public ResponseEntity<List<Candidature>> getAllCandidatures() {
        List<Candidature> candidatures = candidatureService.getAllCandidatures();
        return ResponseEntity.ok(candidatures);
    }
    @Operation(summary = "Supprimer une candidature par ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidature supprimée avec succès"),
            @ApiResponse(responseCode = "404", description = "Candidature non trouvée", content = @Content)
    })
    @DeleteMapping("/{idCandidature}")
    public ResponseEntity<Void> deleteCandidature(@PathVariable Long idCandidature) {
        candidatureService.deleteCandidature(idCandidature);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/CandidatureByCandidat/{userId}")
    public ResponseEntity<List<Candidature>> getCandidaturesByUserId(@PathVariable Long userId) {
        List<Candidature> candidatures = candidatureService.getCandidaturesByUserId(userId);
        return ResponseEntity.ok(candidatures);
    }
    @GetMapping("/getcandidaturebymissionowner/{UserId}")
    public ResponseEntity<List<Candidature>> getCandidaturesByMissionId(@PathVariable Long UserId) {
        List<Candidature> candidatures = candidatureService.findCandidaturesWhereUserIdMatchesMission(UserId);
        return ResponseEntity.ok(candidatures);
    }
    @GetMapping("/by-mission/{missionId}")
    public ResponseEntity<List<Candidature>> getCandidaturesByMission(@PathVariable Long missionId) {
        List<Candidature> candidatures = candidatureService.getCandidaturesByMissionId(missionId);
        return ResponseEntity.ok(candidatures);
    }

    @GetMapping("/by-candidate-and-mission")
    public ResponseEntity<List<Candidature>> getCandidatureByCandidateAndMission(
            @RequestParam Long candidatId,
            @RequestParam Long missionId) {

        List<Candidature> candidature = candidatureService
                .getCandidatureByCandidateAndMission(candidatId, missionId);

        return ResponseEntity.ok(candidature);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleEntityNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}
