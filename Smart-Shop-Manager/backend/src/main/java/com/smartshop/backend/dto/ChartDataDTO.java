package com.smartshop.backend.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataDTO {

    private String label;

    private BigDecimal value;

    public ChartDataDTO(String label, Integer value) {
        this(label, value == null ? null : BigDecimal.valueOf(value));
    }
}