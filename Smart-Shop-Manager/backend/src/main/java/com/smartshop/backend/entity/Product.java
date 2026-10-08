package com.smartshop.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_barcode", columnList = "barcode"),
        @Index(name = "idx_products_product_code", columnList = "product_code"),
        @Index(name = "idx_products_category_id", columnList = "category_id")
})
public class Product {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
private String productCode;
private String barcode;
private String productName;
private String brand;
private String subcategory;

@ManyToOne
@JoinColumn(name = "category_id")

private Category category;
private String variant;
private String unit;
private Integer quantity;
private BigDecimal purchasePrice;
private BigDecimal sellingPrice;
private Integer minimumStock;
private LocalDate expiryDate;
private Boolean expiryApplicable;
private Boolean active;

@Version
private Long version;

@Column(updatable = false)
private LocalDateTime createdAt;
private LocalDateTime updatedAt;

@PrePersist
void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = createdAt;
}

@PreUpdate
void onUpdate() {
    updatedAt = LocalDateTime.now();
}

}
