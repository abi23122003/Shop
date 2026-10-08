package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartshop.backend.entity.Sale;
import com.smartshop.backend.repository.CustomerRepository;
import com.smartshop.backend.repository.ProductRepository;
import com.smartshop.backend.repository.SaleRepository;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CustomerRepository customerRepository;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(saleRepository, productRepository, customerRepository);
    }

    @Test
    void salesReportUsesInclusiveDateRange() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 7);
        when(saleRepository.findBySaleDateBetween(from, to)).thenReturn(List.of());

        assertEquals(0, reportService.getSalesReport(from, to).size());

        verify(saleRepository).findBySaleDateBetween(eq(from), eq(to));
    }

    @Test
    void profitReportUsesInclusiveDateRange() {
        LocalDate from = LocalDate.of(2026, 10, 1);
        LocalDate to = LocalDate.of(2026, 10, 7);
        when(saleRepository.sumTotalAmountByDateRange(from, to)).thenReturn(null);
        when(saleRepository.sumCostOfGoodsSoldByDateRange(from, to)).thenReturn(null);

        var result = reportService.getProfitReport(from, to);

        assertEquals(0, result.getTotalSales().signum());
        assertEquals(0, result.getTotalProfit().signum());
        verify(saleRepository).sumTotalAmountByDateRange(eq(from), eq(to));
        verify(saleRepository).sumCostOfGoodsSoldByDateRange(eq(from), eq(to));
    }
}
