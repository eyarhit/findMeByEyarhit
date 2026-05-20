package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/**
 * Valeurs persistées en base (STRING).
 * Le front envoie souvent {@code "None"} pour « non renseigné » : accepté et mappé sur {@link #NONE}.
 */
public enum Statut {
    NONE,
    CELEBATAIRE,
    ENGAGE;

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static Statut fromJson(String value) {
        if (value == null || value.isBlank()) {
            return NONE;
        }
        String v = value.trim();
        if (v.equalsIgnoreCase("none")) {
            return NONE;
        }
        try {
            return Statut.valueOf(v.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Statut inconnu: '" + value + "'. Valeurs acceptées: NONE, None, CELEBATAIRE, ENGAGE.");
        }
    }

    @JsonValue
    public String toJson() {
        return name();
    }
}
