package com.dpc.codingameservice.Entity;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;


@Data
@AllArgsConstructor
@NoArgsConstructor

public class StartSessionRequest implements Serializable {
    private Long userId;
    private Long levelId;
    private Long domainId;
}
