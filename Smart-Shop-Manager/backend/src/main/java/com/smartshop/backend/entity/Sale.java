package com.smartshop.backend.entity;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sales", indexes = {
        @jakarta.persistence.Index(name = "idx_sales_sale_date", columnList = "sale_date"),
        @jakarta.persistence.Index(name = "idx_sales_customer_id", columnList = "customer_id")
})
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String saleCode;

    private LocalDate saleDate;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    private String paymentMethod;

    private BigDecimal totalAmount;

    @Column(length = 32, nullable = false)
    private String status = "COMPLETED";

    @Column(length = 512)
    private String reversalReason;

    private LocalDateTime reversedAt;

    private String reversedBy;

    @OneToMany(
            mappedBy = "sale",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<SaleItem> saleItems;
}
