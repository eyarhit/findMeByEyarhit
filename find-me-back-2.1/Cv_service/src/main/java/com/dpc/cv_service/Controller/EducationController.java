package com.dpc.cv_service.Controller;

import com.dpc.cv_service.Entites.Education;
import com.dpc.cv_service.Service.ICompetenceService;
import com.dpc.cv_service.Service.IEducationService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/educations")
@AllArgsConstructor

public class EducationController {

    @Autowired
    private final IEducationService educationService ;
    @GetMapping("/{userId}")
    public ResponseEntity<?> getEducationsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(educationService.getEducationsByUserId(userId));
    }

    @PutMapping("/bulk-update/{userId}")
    public ResponseEntity<List<Education>> updateEducations(
            @PathVariable Long userId,
            @RequestBody List<Education> educations) {
        List<Education> updated = educationService.updateEducationsForUser(userId, educations);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{idEducation}")
    public ResponseEntity<Education> updateEducation(
            @PathVariable Long idEducation,
            @RequestBody Education education) {
        try {
            Education updated = educationService.updateEducation(idEducation, education);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


}
