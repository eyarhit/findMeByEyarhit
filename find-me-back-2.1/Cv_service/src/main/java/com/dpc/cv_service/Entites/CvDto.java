package com.dpc.cv_service.Entites;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CvDto {
    private Long id_cv;
    private List<Experience> experiences;
    private int totalAnneesExperience;
}
