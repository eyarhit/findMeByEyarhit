package com.dpc.cv_service.Controller;

import com.dpc.cv_service.Entites.Langue;
import com.dpc.cv_service.Service.IExperienceService;
import com.dpc.cv_service.Service.ILangueService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/langues")
@AllArgsConstructor

public class LangueController {

    @Autowired
    private final ILangueService langueService ;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getLanguesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(langueService.getLanguesByUserId(userId));
    }
    @PutMapping("/{idLangue}")
    public ResponseEntity<Langue> updateLangue(
            @PathVariable Long idLangue,
            @RequestBody Langue langue) {
        try {
            Langue updated = langueService.updateLangue(idLangue, langue);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/merge/{userId}")
    public ResponseEntity<List<Langue>> mergeLangues(
            @PathVariable Long userId,
            @RequestBody List<Langue> langues) {
        return ResponseEntity.ok(langueService.mergeLanguesForUser(userId, langues));
    }

}
