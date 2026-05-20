package com.dpc.mission_service.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class MissionJsonDeserializationTest {

    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void deserializesStatutNone_idSocieterAlias_lowercaseEnums_nullRecruteurs() throws Exception {
        String json = """
                {
                  "reference_code": "",
                  "id_societer": 8,
                  "archived": false,
                  "statusMission": "OPEN",
                  "descrip_mission": {
                    "mission_name": "Dev",
                    "statut": "None",
                    "nbre_recruteurs": null,
                    "langue": "FRANCAIS",
                    "typeContrat": "cdi"
                  }
                }
                """;
        Mission m = mapper.readValue(json, Mission.class);
        assertEquals(8L, m.getUser_id());
        assertEquals(StatusMission.OPEN, m.getStatusMission());
        assertEquals(Statut.NONE, m.getDescrip_mission().getStatut());
        assertEquals(Langue.FRANCAIS, m.getDescrip_mission().getLangue());
        assertEquals(TypeContrat.CDI, m.getDescrip_mission().getTypeContrat());
        assertNull(m.getDescrip_mission().getNbre_recruteurs());
    }

    @Test
    void deserializesIsoLocalDates() throws Exception {
        String json = """
                {
                  "statusMission": "OPEN",
                  "descrip_mission": {
                    "mission_name": "X",
                    "statut": "none",
                    "date_debut": "2026-04-19T00:00:00",
                    "date_fin": "2026-04-20T00:00:00",
                    "nbre_recruteurs": 2
                  }
                }
                """;
        Mission m = mapper.readValue(json, Mission.class);
        assertEquals(Statut.NONE, m.getDescrip_mission().getStatut());
        assertEquals(2, m.getDescrip_mission().getNbre_recruteurs());
    }
}
