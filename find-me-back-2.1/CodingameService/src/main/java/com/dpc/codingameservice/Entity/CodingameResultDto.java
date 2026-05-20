package com.dpc.codingameservice.Entity;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CodingameResultDto {
    private LocalDateTime date;
    private Duration duration;
    private String framework;
    private double score;
    private String level;
    private String domain;
}