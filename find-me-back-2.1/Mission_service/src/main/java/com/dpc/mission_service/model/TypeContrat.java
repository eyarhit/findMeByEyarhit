package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum TypeContrat {

    CDI,
    CDD,
    ALTERNANCE,
    PORTAGESALARIALE,
    MISSION_CDI,
    FREELANCE;

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static TypeContrat fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim().toUpperCase(Locale.ROOT);
        try {
            return TypeContrat.valueOf(v);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "TypeContrat inconnu: '" + value + "'. Valeurs: CDI, CDD, ALTERNANCE, PORTAGESALARIALE, MISSION_CDI, FREELANCE.");
        }
    }

    @JsonValue
    public String toJson() {
        return name();
    }
}
