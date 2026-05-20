package com.dpc.cv_service.Controller;

import com.dpc.cv_service.Entites.Experience;
import com.dpc.cv_service.Service.IEducationService;
import com.dpc.cv_service.Service.IExperienceService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/experiences")
@AllArgsConstructor

public class ExperienceController {
    @Autowired
    private final IExperienceService experienceService ;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getExperiencesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(experienceService.getExperiencesByUserId(userId));
    }

    @PutMapping("/{idExperience}")
    public ResponseEntity<Experience> updateExperience(
            @PathVariable Long idExperience,
            @RequestBody Experience experience) {
        try {
            Experience updated = experienceService.updateExperience(idExperience, experience);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/merge/{userId}")
    public ResponseEntity<List<Experience>> mergeExperiences(
            @PathVariable Long userId,
            @RequestBody List<Experience> experiences) {
        List<Experience> updated = experienceService.mergeExperiencesForUser(userId, experiences);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/total-annees/{userId}")
    public ResponseEntity<Double> getTotalAnneesExperience(@PathVariable Long userId) {
        double total = experienceService.calculerTotalAnneesExperience(userId);
        return ResponseEntity.ok(total);
    }





}
