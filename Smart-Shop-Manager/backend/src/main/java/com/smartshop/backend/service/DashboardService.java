package com.smartshop.backend.service;

import java.time.LocalDate;
import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.smartshop.backend.dto.DashboardDTO;
import com.smartshop.backend.entity.Sale;
import com.smartshop.backend.repository.CategoryRepository;
import com.smartshop.backend.repository.CustomerRepository;
import com.smartshop.backend.repository.ProductRepository;
import com.smartshop.backend.repository.SaleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;

    public DashboardDTO getDashboardData() {

        DashboardDTO dashboard = new DashboardDTO();

        dashboard.setTotalProducts(productRepository.countActiveProducts());
        dashboard.setTotalCategories(categoryRepository.count());
        dashboard.setTotalCustomers(customerRepository.count());

        BigDecimal todaySales = saleRepository.sumTotalAmountBySaleDate(LocalDate.now());
        dashboard.setTodaySales(todaySales == null ? BigDecimal.ZERO : todaySales);

        dashboard.setLowStockProducts(productRepository.countLowStockProducts());

        return dashboard;
    }
}
