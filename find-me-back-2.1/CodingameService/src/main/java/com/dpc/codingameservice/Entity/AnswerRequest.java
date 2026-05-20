package com.dpc.codingameservice.Entity;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class AnswerRequest implements Serializable {
    private Long questionId;
    private String userResponse;
}
