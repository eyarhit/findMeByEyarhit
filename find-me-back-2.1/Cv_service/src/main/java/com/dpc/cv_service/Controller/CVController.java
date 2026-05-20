package com.dpc.cv_service.Controller;

import com.dpc.cv_service.Entites.*;
import com.dpc.cv_service.Service.ICVService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@AllArgsConstructor

public class CVController {

    @Autowired
    private final ICVService icvService ;

    @PostMapping("/create/Cv/{userId}")
    public ResponseEntity<Cv> create(@RequestBody Cv cv, @PathVariable Long userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().body(null);
        }
        cv.setUserId(userId);
        Cv savedCV = icvService.creer(cv);
        return ResponseEntity.ok(savedCV);
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveCv(@RequestBody Cv cv,
                                    @RequestParam(required = false) Long userId) {
        Long effectiveUserId = cv.getUserId() != null ? cv.getUserId() : userId;
        if (effectiveUserId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "userId is required",
                    "hint", "Send userId in JSON body (userId/idUser/user_id) or as query param ?userId=..."
            ));
        }
        cv.setUserId(effectiveUserId);

        Cv savedCv = icvService.creerOuMettreAJour(cv);
        return ResponseEntity.ok(savedCv);
    }



    @GetMapping("/CVs/{userId}")
    public ResponseEntity<Cv> getCVsByUserId(@PathVariable Long userId) {
        Cv cv = icvService.getCVsByUserId(userId);
        return ResponseEntity.ok(cv);
    }
    @GetMapping("/read")
    public List<Cv> read(){
        return icvService.lire();
    }



//    @GetMapping("/profiles/{userId}")
//    public Map<String, Object> getProfileByUserId(@PathVariable Long userId) {
//        return cvService.getProfileByUserId(userId);
//    }

}
