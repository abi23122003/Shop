package com.smartshop.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SaleDTO {

    private Long id;

    private String saleCode;

    @NotNull(message = "Sale date is required")
    private LocalDate saleDate;

    private Long customerId;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    private BigDecimal totalAmount;

    @NotEmpty(message = "At least one sale item is required")
    @Valid
    private List<SaleItemDTO> saleItems;
}
