package com.smartshop.backend.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class SalesReportDTO {

    private String saleCode;

    private String customerName;

    private BigDecimal totalAmount;

    private String saleDate;
}