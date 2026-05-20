package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum Langue {
    FRANCAIS,
    ANGLAIS,
    Arabe;

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static Langue fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String v = value.trim();
        for (Langue l : values()) {
            if (l.name().equalsIgnoreCase(v)) {
                return l;
            }
        }
        throw new IllegalArgumentException(
                "Langue inconnue: '" + value + "'. Valeurs acceptées: FRANCAIS, ANGLAIS, Arabe (casse libre).");
    }

    @JsonValue
    public String toJson() {
        return name();
    }
}
