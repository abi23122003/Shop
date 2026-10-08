package com.smartshop.backend.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreditDTO {

    private Long id;

    private Long customerId;

    private String customerName;

    private BigDecimal totalCredit;

    private BigDecimal totalPaid;

    private BigDecimal balance;

    private String status;
}