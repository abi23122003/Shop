package com.smartshop.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {

    private Long id;
    private String productCode;
    private String barcode;
    @NotBlank(message = "Product Name is required")
    private String productName;
    private String brand;
    private String subcategory;
    private Long categoryId;
    private String variant;
    private String unit;
    @PositiveOrZero(message = "Quantity cannot be negative")
    private Integer quantity;
    @PositiveOrZero(message = "Purchase price cannot be negative")
    private BigDecimal purchasePrice;
    @PositiveOrZero(message = "Selling price cannot be negative")
    private BigDecimal sellingPrice;
    @PositiveOrZero(message = "Minimum stock cannot be negative")
    private Integer minimumStock;
    private LocalDate expiryDate;
    private Boolean expiryApplicable;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
