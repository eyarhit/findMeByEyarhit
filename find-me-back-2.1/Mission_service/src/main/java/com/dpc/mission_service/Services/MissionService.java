package com.dpc.mission_service.Services;

import com.dpc.mission_service.Repository.MissionRepository;
import com.dpc.mission_service.Repository.PaysRepository;
import com.dpc.mission_service.Repository.VilleRepository;
import com.dpc.mission_service.feign.UserClient;
import com.dpc.mission_service.model.Mission;
import com.dpc.mission_service.model.Pays;
import com.dpc.mission_service.model.Statut;
import com.dpc.mission_service.model.StatusMission;
import com.dpc.mission_service.model.TypeContrat;
import com.dpc.mission_service.model.Ville;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class MissionService implements IMissionService {
    private final MissionRepository missionRepository;
    private final UserClient userClient;
    private final VilleRepository villeRepository;
    private final PaysRepository paysRepository;

    public MissionService(
            MissionRepository missionRepository,
            UserClient userClient,
            VilleRepository villeRepository,
            PaysRepository paysRepository) {
        this.missionRepository = missionRepository;
        this.userClient = userClient;
        this.villeRepository = villeRepository;
        this.paysRepository = paysRepository;
    }

    @Override
    public Mission creer(Mission mission) {
        resolveGeographyForPersistence(mission);
        sanitizeDescripMissionForMysql(mission);
        return missionRepository.save(mission);
    }

    /**
     * Bases MySQL existantes : la colonne {@code statut} est souvent un ENUM
     * ({@code CELEBATAIRE}, {@code ENGAGE}) sans valeur {@code NONE} → erreur
     * « Data truncated for column 'statut' » et HTTP 500. Le front envoie
     * {@code "None"} mappé sur {@link Statut#NONE} : on ne persiste pas NONE en base.
     */
    private void sanitizeDescripMissionForMysql(Mission mission) {
        if (mission.getDescrip_mission() == null) {
            return;
        }
        if (mission.getDescrip_mission().getStatut() == Statut.NONE) {
            mission.getDescrip_mission().setStatut(null);
        }
    }

    /**
     * Le JSON peut contenir des objets {@code ville}/{@code pays} sans id (entités transitoires).
     * Hibernate refuse de persister une {@link Mission} qui référence une entité non managée → 500.
     * Les pays/villes inconnus sont créés en base pour conserver le lieu saisi par le RH.
     */
    private void resolveGeographyForPersistence(Mission mission) {
        if (mission.getPays() == null
                && mission.getVille() != null
                && mission.getVille().getPays() != null) {
            mission.setPays(mission.getVille().getPays());
        }
        resolveMissionPays(mission);
        resolveMissionVille(mission);
        if (mission.getPays() == null
                && mission.getVille() != null
                && mission.getVille().getPays() != null) {
            mission.setPays(mission.getVille().getPays());
        }
    }

    private void resolveMissionPays(Mission mission) {
        Pays p = mission.getPays();
        if (p == null) {
            return;
        }
        Pays resolved = resolveOrCreatePays(p);
        mission.setPays(resolved);
    }

    private Pays resolveOrCreatePays(Pays p) {
        if (p.getId() != null && p.getId() > 0) {
            Optional<Pays> byId = paysRepository.findById(p.getId());
            if (byId.isPresent()) {
                return byId.get();
            }
        }
        if (p.getNom() != null && !p.getNom().isBlank()) {
            String nom = p.getNom().trim();
            return paysRepository.findFirstByNomIgnoreCase(nom)
                    .orElseGet(() -> {
                        Pays created = new Pays();
                        created.setNom(nom);
                        return paysRepository.save(created);
                    });
        }
        return null;
    }

    private void resolveMissionVille(Mission mission) {
        Ville v = mission.getVille();
        if (v == null) {
            return;
        }
        if (v.getIdVille() != null && v.getIdVille() > 0) {
            mission.setVille(villeRepository.findById(v.getIdVille()).orElse(null));
            return;
        }
        String nom = v.getNomdeville();
        if (nom == null || nom.isBlank()) {
            mission.setVille(null);
            return;
        }

        Pays pays = resolvePaysForVille(v, mission.getPays());
        if (pays == null) {
            mission.setVille(null);
            return;
        }
        mission.setPays(pays);

        String cityName = nom.trim();
        Ville resolved = villeRepository
                .findFirstByNomdevilleIgnoreCaseAndPays_Id(cityName, pays.getId())
                .orElseGet(() -> {
                    Ville created = new Ville();
                    created.setNomdeville(cityName);
                    created.setPays(pays);
                    return villeRepository.save(created);
                });
        mission.setVille(resolved);
    }

    private Pays resolvePaysForVille(Ville ville, Pays missionPays) {
        if (missionPays != null) {
            Pays resolved = resolveOrCreatePays(missionPays);
            if (resolved != null) {
                return resolved;
            }
        }
        Pays nested = ville.getPays();
        if (nested != null) {
            return resolveOrCreatePays(nested);
        }
        return null;
    }
    @Override
    public Mission modifier(Long id, Mission mission) {
        Mission existing = missionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mission non trouvée !"));

        existing.setReference_code(mission.getReference_code());
        existing.setLogo(mission.getLogo());
        existing.setArchived(mission.getArchived());
        existing.setStatusMission(mission.getStatusMission());
        existing.setCreatedAt(mission.getCreatedAt());

        // Mise à jour de descrip_mission
        if (existing.getDescrip_mission() != null && mission.getDescrip_mission() != null) {
            var desc = existing.getDescrip_mission();
            var newDesc = mission.getDescrip_mission();

            desc.setAvantages(newDesc.getAvantages());
            desc.setDate_debut(newDesc.getDate_debut());
            desc.setDate_fin(newDesc.getDate_fin());
            desc.setDescription(newDesc.getDescription());
            desc.setFutures_taches(newDesc.getFutures_taches());
            desc.setIsRemote(newDesc.getIsRemote());
            desc.setLangue(newDesc.getLangue());
            desc.setMission_name(newDesc.getMission_name());
            desc.setNbre_recruteurs(newDesc.getNbre_recruteurs());
            desc.setPoste(newDesc.getPoste());
            desc.setSalaire(newDesc.getSalaire());
            desc.setStatut(newDesc.getStatut() == Statut.NONE ? null : newDesc.getStatut());
            desc.setTypeContrat(newDesc.getTypeContrat());
        }

        //  Mise à jour de profilDemande
        if (existing.getProfilDemande() != null && mission.getProfilDemande() != null) {
            var profil = existing.getProfilDemande();
            var newProfil = mission.getProfilDemande();

            profil.setExigences(newProfil.getExigences());
            profil.setAnnees_experiences(newProfil.getAnnees_experiences());
        }

        if (mission.getVille() != null) {
            existing.setVille(mission.getVille());
        }
        if (mission.getPays() != null) {
            existing.setPays(mission.getPays());
        }
        resolveGeographyForPersistence(existing);

        return missionRepository.save(existing);
    }

    @Override
    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }

    @Override
    public Optional<Mission> getMissionByIdMission(Long idMission) {
        return missionRepository.findById(idMission);
    }

    @Override
    public List<Mission> getMissionsForUser(Long userId) {
        var user = userClient.getUserById(userId);
        String normalizedTarget = normalizeUserTargetMarket(user.getTargetmarket());
        List<TypeContrat> contratsAutorises = List.of(
                TypeContrat.CDI,
                TypeContrat.CDD,
                TypeContrat.ALTERNANCE
        );

        List<Mission> base = missionRepository.findOpenNonArchivedByContractTypes(
                StatusMission.OPEN, contratsAutorises);
        return filterMissionsByTargetMarket(base, normalizedTarget);
    }

    @Override
    public List<Mission> getMissionsForFreelancer(Long userId) {
        var user = userClient.getUserById(userId);
        String normalizedTarget = normalizeUserTargetMarket(user.getTargetmarket());
        List<TypeContrat> contratsAutorises = List.of(
                TypeContrat.FREELANCE,
                TypeContrat.MISSION_CDI
        );

        List<Mission> base = missionRepository.findOpenNonArchivedByContractTypes(
                StatusMission.OPEN, contratsAutorises);
        return filterMissionsByTargetMarket(base, normalizedTarget);
    }

    @Override
    public List<Mission> getOpenMissionsForMarket() {
        return missionRepository.findAllOpenNonArchived(StatusMission.OPEN);
    }

    private static String normalizeUserTargetMarket(String rawTarget) {
        if (rawTarget == null || rawTarget.isBlank()) {
            return "";
        }
        return switch (rawTarget.trim().toLowerCase(Locale.FRENCH)) {
            case "francais" -> "france";
            case "tunisien" -> "tunisie";
            default -> rawTarget.trim().toLowerCase(Locale.FRENCH);
        };
    }

    /**
     * Ancienne requête JPQL exigeait un pays sur la mission : beaucoup d’offres n’ont ni {@code pays}
     * ni {@code ville} renseignés → liste vide pour les candidats. Les offres sans zone géographique
     * restent visibles pour tout marché cible ; sinon on filtre sur le pays (mission ou ville).
     */
    private static List<Mission> filterMissionsByTargetMarket(List<Mission> base, String normalizedTarget) {
        if (normalizedTarget.isEmpty()) {
            return base;
        }
        return base.stream()
                .filter(m -> missionMatchesTargetMarket(m, normalizedTarget))
                .toList();
    }

    private static boolean missionMatchesTargetMarket(Mission m, String target) {
        if (m.getPays() == null && m.getVille() == null) {
            return true;
        }
        if (m.getPays() != null && m.getPays().getNom() != null
                && m.getPays().getNom().equalsIgnoreCase(target)) {
            return true;
        }
        if (m.getVille() != null
                && m.getVille().getPays() != null
                && m.getVille().getPays().getNom() != null
                && m.getVille().getPays().getNom().equalsIgnoreCase(target)) {
            return true;
        }
        if (m.getPays() == null
                && m.getVille() != null
                && m.getVille().getPays() == null) {
            return true;
        }
        return false;
    }

    @Override
    public List<Mission> getMissionsForEsnEmployee(Long userId, String espace) {
        List<Mission> rows = missionRepository.findMissionsByPublisherUserId(userId);
        if (rows.isEmpty() || espace == null || espace.isBlank()) {
            return rows;
        }
        String e = normalizeEspaceLabel(espace);
        if (matchesAllEspace(e)) {
            return rows;
        }
        if (e.contains("archiv")) {
            return rows.stream().filter(m -> Boolean.TRUE.equals(m.getArchived())).toList();
        }
        if (e.contains("ferm") || e.contains("clotur") || e.contains("clos")) {
            return rows.stream()
                    .filter(m -> m.getStatusMission() == StatusMission.CLOSED && !Boolean.TRUE.equals(m.getArchived()))
                    .toList();
        }
        if (e.contains("publier") || e.contains("offre")) {
            return rows.stream()
                    .filter(m -> m.getStatusMission() == StatusMission.OPEN && !Boolean.TRUE.equals(m.getArchived()))
                    .toList();
        }
        return rows;
    }

    private static String normalizeEspaceLabel(String espace) {
        String t = Normalizer.normalize(espace.trim(), Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return t.toLowerCase(Locale.FRENCH);
    }

    private static boolean matchesAllEspace(String e) {
        return e.isEmpty() || e.equals("tous") || e.equals("toutes") || e.equals("all");
    }

//    public List<Mission> getAllActiveMissions() {
//        return missionRepository.findByStatusMissionNotAndArchivedFalse("CLOSED");
//    }
//
//    public Map<String, Object> matchMissionsForProfile(Long userId) {
//        // Fetch CV from User Service via Feign Client
//        Map<String, Object> cvData = userClient.getUserById(userId);
//
//        // Fetch active missions
//        List<Mission> missions = getAllActiveMissions();
//
//        // Convert missions to JSON-compatible format
//        List<Map<String, Object>> missionsData = missions.stream().map(mission -> {
//            Map<String, Object> missionMap = new HashMap<>();
//            missionMap.put("idMission", mission.getIdMission());
//            missionMap.put("statusMission", mission.getStatusMission().toString());
//            missionMap.put("archived", mission.getArchived());
//            if (mission.getDescrip_mission() != null) {
//                Map<String, Object> descMap = new HashMap<>();
//                descMap.put("mission_name", mission.getDescrip_mission().getMission_name());
//                descMap.put("poste", mission.getDescrip_mission().getPoste());
//                descMap.put("competencesRequises", mission.getDescrip_mission().getCompetencesRequises());
//                descMap.put("langue", mission.getDescrip_mission().getLangue() != null ? mission.getDescrip_mission().getLangue().toString() : null);
//                descMap.put("isRemote", mission.getDescrip_mission().getIsRemote());
//                missionMap.put("descrip_mission", descMap);
//            }
//            if (mission.getProfilDemande() != null) {
//                Map<String, Object> profilMap = new HashMap<>();
//                profilMap.put("annees_experiences", mission.getProfilDemande().getAnnees_experiences());
//                profilMap.put("exigences", mission.getProfilDemande().getExigences());
//                missionMap.put("profilDemande", profilMap);
//            }
//            if (mission.getVille() != null) {
//                Map<String, Object> villeMap = new HashMap<>();
//                villeMap.put("nomdeville", mission.getVille().getNomdeville());
//                missionMap.put("ville", villeMap);
//            }
//            if (mission.getPays() != null) {
//                Map<String, Object> paysMap = new HashMap<>();
//                paysMap.put("nom", mission.getPays().getNom());
//                missionMap.put("pays", paysMap);
//            }
//            return missionMap;
//        }).collect(Collectors.toList());
//
//        try {
//            return PythonScriptExecutor.executeMatchingScript(cvData, missionsData);
//        } catch (Exception e) {
//            throw new RuntimeException("Failed to match missions: " + e.getMessage());
//        }
//    }




}
