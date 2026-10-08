package com.smartshop.backend.controller;

import java.util.List;
import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartshop.backend.dto.CustomerReportDTO;
import com.smartshop.backend.dto.ProductReportDTO;
import com.smartshop.backend.dto.ProfitReportDTO;
import com.smartshop.backend.dto.SalesReportDTO;
import com.smartshop.backend.dto.StockReportDTO;
import com.smartshop.backend.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales")
    public List<SalesReportDTO> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        return reportService.getSalesReport(from, to);
    }

    @GetMapping("/products")
    public List<ProductReportDTO> getProductReport() {
        return reportService.getProductReport();
    }

    @GetMapping("/stock")
    public List<StockReportDTO> getStockReport() {
        return reportService.getStockReport();
    }

    @GetMapping("/customers")
    public List<CustomerReportDTO> getCustomerReport() {
        return reportService.getCustomerReport();
    }

    @GetMapping("/profit")
    public ProfitReportDTO getProfitReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        validateRange(from, to);
        return reportService.getProfitReport(from, to);
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if ((from == null) != (to == null) || from != null && from.isAfter(to)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Report date range must include valid from and to dates.");
        }
    }
}
