package com.smartshop.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreditTransactionDTO {

    private Long id;

    private Long creditId;

    private LocalDate transactionDate;

    private String type;

    private BigDecimal amount;

    private String remarks;
}                       
