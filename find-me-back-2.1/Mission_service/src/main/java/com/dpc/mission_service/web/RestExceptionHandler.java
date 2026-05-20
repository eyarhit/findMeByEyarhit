package com.dpc.mission_service.web;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        ApiErrorResponse body = new ApiErrorResponse();
        body.setStatus(HttpStatus.BAD_REQUEST.value());
        body.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.setMessage("Le corps JSON est invalide ou incompatible avec le modèle attendu.");

        Throwable cause = ex.getMostSpecificCause();
        Throwable walk = cause;
        while (walk != null) {
            if (walk instanceof IllegalArgumentException iae) {
                body.addViolation(null, "INVALID_VALUE", iae.getMessage(), null);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
            }
            walk = walk.getCause();
        }
        if (cause instanceof InvalidFormatException ife) {
            String path = pathFromReferences(ife.getPath());
            body.addViolation(
                    path,
                    "INVALID_FORMAT",
                    ife.getOriginalMessage(),
                    ife.getValue());
        } else if (cause instanceof JsonMappingException jme) {
            String path = pathFromReferences(jme.getPath());
            body.addViolation(
                    path.isEmpty() ? null : path,
                    "JSON_MAPPING",
                    jme.getOriginalMessage(),
                    null);
        } else if (ex.getMessage() != null) {
            body.setMessage(ex.getMessage());
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        ApiErrorResponse body = new ApiErrorResponse();
        body.setStatus(HttpStatus.BAD_REQUEST.value());
        body.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.setMessage("Erreurs de validation sur les champs de la requête.");

        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            body.addViolation(
                    fe.getField(),
                    fe.getCode() != null ? fe.getCode() : "INVALID",
                    fe.getDefaultMessage(),
                    fe.getRejectedValue());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        ApiErrorResponse body = new ApiErrorResponse();
        body.setStatus(HttpStatus.BAD_REQUEST.value());
        body.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.setMessage("Contraintes de validation violées.");

        for (ConstraintViolation<?> v : ex.getConstraintViolations()) {
            body.addViolation(
                    v.getPropertyPath().toString(),
                    v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName(),
                    v.getMessage(),
                    v.getInvalidValue());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        ApiErrorResponse body = new ApiErrorResponse();
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        body.setStatus(status.value());
        body.setError(status.getReasonPhrase());
        body.setMessage(ex.getReason() != null ? ex.getReason() : ex.getMessage());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        ApiErrorResponse body = new ApiErrorResponse();
        body.setStatus(HttpStatus.CONFLICT.value());
        body.setError(HttpStatus.CONFLICT.getReasonPhrase());
        body.setMessage("Contrainte en base non respectée (doublon, clé étrangère, etc.).");
        String detail = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        body.addViolation(null, "DATA_INTEGRITY", detail, null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(InvalidDataAccessApiUsageException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidDataAccess(InvalidDataAccessApiUsageException ex) {
        ApiErrorResponse body = new ApiErrorResponse();
        body.setStatus(HttpStatus.BAD_REQUEST.value());
        body.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.setMessage("Données incohérentes pour la persistance (souvent une référence d'entité invalide).");
        String detail = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        body.addViolation(null, "PERSISTENCE", detail, null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    private static String pathFromReferences(List<JsonMappingException.Reference> refs) {
        if (refs == null || refs.isEmpty()) {
            return "";
        }
        return refs.stream()
                .map(r -> {
                    if (r.getFieldName() != null) {
                        return r.getFieldName();
                    }
                    if (r.getIndex() >= 0) {
                        return "[" + r.getIndex() + "]";
                    }
                    return null;
                })
                .filter(s -> s != null && !s.isEmpty())
                .collect(Collectors.joining("."));
    }
}
