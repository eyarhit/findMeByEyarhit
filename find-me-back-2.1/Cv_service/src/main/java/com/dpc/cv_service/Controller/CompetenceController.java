package com.dpc.cv_service.Controller;

import com.dpc.cv_service.Entites.Competence;
import com.dpc.cv_service.Service.ICVService;
import com.dpc.cv_service.Service.ICompetenceService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/competences")
@AllArgsConstructor

public class CompetenceController {
    @Autowired
private final ICompetenceService competenceService ;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getCompetencesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(competenceService.getCompetencesByUserId(userId));
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<Competence> updateCompetenceByUserId(
            @PathVariable Long userId,
            @RequestBody Competence competence) {
        try {
            Competence updated = competenceService.updateCompetenceByUserId(userId, competence);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }


}
