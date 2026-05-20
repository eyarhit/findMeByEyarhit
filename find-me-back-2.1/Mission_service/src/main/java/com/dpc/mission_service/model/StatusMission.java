package com.dpc.mission_service.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum StatusMission {
    OPEN,
    CLOSED;

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static StatusMission fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return StatusMission.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    @JsonValue
    public String toJson() {
        return name();
    }
}
