package com.dpc.mission_service.Controller;

import com.dpc.mission_service.Services.IMissionService;
import com.dpc.mission_service.model.Mission;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * API missions sous le préfixe {@code /api/v1/missions}.
 * <p>
 * Employés ESN : liste des offres créées par l’utilisateur (filtrage par onglet) via
 * {@code GET .../mission/for-ESN-Employee/{userId}?espace=...} (voir méthode dédiée).
 */
@RestController
@RequestMapping("/api/v1/missions")
public class MissionController {
    private final IMissionService iMissionService;

    public MissionController(IMissionService iMissionService) {
        this.iMissionService = iMissionService;
    }

    @PostMapping("/create/{userId}")
    public ResponseEntity<Mission> create(@RequestBody Mission mission, @PathVariable Long userId) {
        mission.setUser_id(userId);

        if (mission.getDescrip_mission() != null) {
            if (mission.getDescrip_mission().getNbre_recruteurs() == null) {
                mission.getDescrip_mission().setNbre_recruteurs(0);
            }
            mission.getDescrip_mission().setMission(mission);
        }
        if (mission.getProfilDemande() != null) {
            mission.getProfilDemande().setMission(mission);
        }

        Mission savedMission = iMissionService.creer(mission);
        return ResponseEntity.ok(savedMission);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<Mission> update(@PathVariable Long id, @RequestBody Mission mission) {
        Mission updated = iMissionService.modifier(id, mission);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/mission/all")
    public List<Mission> getAllMissions() {
        return iMissionService.getAllMissions();
    }

    @GetMapping("/mission/getMissionId/{missionId}")
    public ResponseEntity<Mission> getMissionId(@PathVariable Long missionId) {
        Optional<Mission> mission = iMissionService.getMissionByIdMission(missionId);
        if (mission.isPresent()) {
            return ResponseEntity.ok(mission.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
//getoffresbyfiltrespourlescandidats
    @GetMapping("/mission/for-user/{userId}")
    public ResponseEntity<List<Mission>> getMissionsForUser(@PathVariable Long userId) {
        List<Mission> missions = iMissionService.getMissionsForUser(userId);
        return ResponseEntity.ok(missions);
    }

    @GetMapping("/mission/for-freelancer/{userId}")
    public ResponseEntity<List<Mission>> getMissionsForFreelancer(@PathVariable Long userId) {
        List<Mission> missions = iMissionService.getMissionsForFreelancer(userId);
        return ResponseEntity.ok(missions);
    }

    /**
     * Offres pour un employé ESN : missions dont le créateur est {@code user_id = userId}.
     * <ul>
     *   <li>{@code espace} absent / vide / « tous » : toutes ces missions</li>
     *   <li>libellé contenant « publier » ou « offre » (ex. « Offres publier ») : ouvertes, non archivées</li>
     *   <li>« archiv » : {@code archived = true}</li>
     *   <li>« ferm », « clotur », « clos » : statut {@code CLOSED}, non archivées</li>
     * </ul>
     * Jamais de 404 si la liste est vide : toujours {@code 200} avec {@code []}.
     */
    @GetMapping("/mission/for-ESN-Employee/{userId}")
    public ResponseEntity<List<Mission>> getMissionsForEsnEmployee(
            @PathVariable Long userId,
            @RequestParam(value = "espace", required = false) String espace) {
        return ResponseEntity.ok(iMissionService.getMissionsForEsnEmployee(userId, espace));
    }

    /**
     * Vitrine marché : toutes les offres encore ouvertes (toutes sociétés), pour consultation par
     * d’autres ESN — en complément de {@code for-ESN-Employee} (uniquement « mes » offres).
     */
    @GetMapping("/mission/market")
    public ResponseEntity<List<Mission>> getOpenMissionsForMarket() {
        return ResponseEntity.ok(iMissionService.getOpenMissionsForMarket());
    }

//    @GetMapping("/active")
//    public List<Mission> getAllActiveMissions() {
//        return missionService.getAllActiveMissions();
//    }
//
//    @GetMapping("/match/{userId}")
//    public Map<String, Object> matchMissionsForProfile(@PathVariable Long userId) {
//        return missionService.matchMissionsForProfile(userId);
//    }

}
