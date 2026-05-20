package com.dpc.mission_service.web;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

/**
 * Standard error body for client-visible 4xx/5xx (especially validation / JSON parse issues).
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class ApiErrorResponse {

    private int status;
    private String error;
    private String message;
    private final List<FieldViolation> violations = new ArrayList<>();

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<FieldViolation> getViolations() {
        return violations;
    }

    public void addViolation(String path, String code, String detail, Object rejectedValue) {
        violations.add(new FieldViolation(path, code, detail, rejectedValue));
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record FieldViolation(String path, String code, String detail, Object rejectedValue) {
    }
}
