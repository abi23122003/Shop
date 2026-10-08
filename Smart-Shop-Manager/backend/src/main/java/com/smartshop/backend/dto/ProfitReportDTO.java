package com.smartshop.backend.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class ProfitReportDTO {

    private BigDecimal totalSales;
    private BigDecimal totalProfit;
}