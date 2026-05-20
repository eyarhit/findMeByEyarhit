package com.dpc.mission_service.model;

import java.util.List;

public class CandidatureRequest {

    private Long candidatId;
    private MissionRef mission;
    private List<Long> dossiercompetence;

    public Long getCandidatId() { return candidatId; }
    public void setCandidatId(Long candidatId) { this.candidatId = candidatId; }

    public MissionRef getMission() { return mission; }
    public void setMission(MissionRef mission) { this.mission = mission; }

    public List<Long> getDossiercompetence() { return dossiercompetence; }
    public void setDossiercompetence(List<Long> dossiercompetence) { this.dossiercompetence = dossiercompetence; }

    public static class MissionRef {
        private Long idMission;

        public Long getIdMission() { return idMission; }
        public void setIdMission(Long idMission) { this.idMission = idMission; }
    }
}
