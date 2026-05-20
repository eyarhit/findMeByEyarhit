package com.dpc.mission_service.Controller;

import com.dpc.mission_service.Services.MissionFavoriService;
import com.dpc.mission_service.model.Mission;
import com.dpc.mission_service.model.UserType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/missions/favoris")
@RequiredArgsConstructor
public class MissionFavoriController {
    private final MissionFavoriService favoriService;

    @PostMapping("/add")
    public ResponseEntity<?> ajouter(@RequestParam Long userId,
                                     @RequestParam Long missionId,
                                     @RequestParam UserType userType) {
        return ResponseEntity.ok(favoriService.ajouterFavori(userId, missionId, userType));
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> supprimer(@RequestParam Long userId,
                                       @RequestParam Long missionId) {
        favoriService.supprimerFavori(userId, missionId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Mission>> getFavoris(@PathVariable Long userId,
                                                    @RequestParam UserType userType) {
        return ResponseEntity.ok(favoriService.getFavorisParUtilisateur(userId, userType));
    }
}
