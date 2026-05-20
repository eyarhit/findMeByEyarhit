package com.dpc.cv_service.Configuration;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;

import java.io.IOException;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Accepts date strings in yyyy-MM-dd, yyyy-MM, or yyyy formats.
 * yyyy-MM -> first day of month, yyyy -> first day of year.
 */
public class FlexibleLocalDateDeserializer extends JsonDeserializer<LocalDate> {

    @Override
    public LocalDate deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String raw = parser.getValueAsString();
        if (raw == null) {
            return null;
        }

        String value = raw.trim();
        if (value.isEmpty()) {
            return null;
        }

        try {
            return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (DateTimeParseException ignored) {
            // try next format
        }

        try {
            return Year.parse(value, DateTimeFormatter.ofPattern("yyyy")).atDay(1);
        } catch (DateTimeParseException ignored) {
            // try next format
        }

        try {
            return LocalDate.parse(value + "-01", DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        } catch (DateTimeParseException ignored) {
            // try next format
        }

        if (value.matches("(?i).*(present|présent|en\\s*cours|aujourd.?hui|now|actuel).*")) {
            return null;
        }

        // Avoid 500 on noisy PDF dates — store as null instead of failing the whole save
        return null;
    }
}
