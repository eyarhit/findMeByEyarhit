package com.dpc.mission_service.model;

import lombok.Data;

@Data
public class User {
    private Long userId;
    private String targetmarket;

    public String getTargetmarket() {
        return targetmarket;
    }

    public void setTargetmarket(String targetmarket) {
        this.targetmarket = targetmarket;
    }
}
