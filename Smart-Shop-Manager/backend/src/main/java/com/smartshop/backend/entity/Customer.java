package com.smartshop.backend.entity;

import java.math.BigDecimal;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "customers", indexes = {
        @jakarta.persistence.Index(name = "idx_customers_phone", columnList = "phone")
})
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerCode;

    private String customerName;

    private String phone;

    private String email;

    private String address;

    private BigDecimal creditLimit;

    private Boolean creditEnabled;

    private Boolean active;
}