package com.smartshop.backend.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class DashboardDTO {

    private long totalProducts;

    private long totalCategories;

    private long totalCustomers;

    private BigDecimal todaySales;

    private long lowStockProducts;
}