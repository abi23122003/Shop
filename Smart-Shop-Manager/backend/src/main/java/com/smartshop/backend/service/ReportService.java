package com.smartshop.backend.service;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.smartshop.backend.dto.CustomerReportDTO;
import com.smartshop.backend.dto.ProductReportDTO;
import com.smartshop.backend.dto.ProfitReportDTO;
import com.smartshop.backend.dto.SalesReportDTO;
import com.smartshop.backend.dto.StockReportDTO;
import com.smartshop.backend.entity.Customer;
import com.smartshop.backend.entity.Product;
import com.smartshop.backend.entity.Sale;
import com.smartshop.backend.entity.SaleItem;
import com.smartshop.backend.repository.CustomerRepository;
import com.smartshop.backend.repository.ProductRepository;
import com.smartshop.backend.repository.SaleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public List<SalesReportDTO> getSalesReport() {
        return getSalesReport(null, null);
    }

    public List<SalesReportDTO> getSalesReport(LocalDate from, LocalDate to) {
        List<Sale> sales = from == null && to == null
                ? saleRepository.findAll()
                : saleRepository.findBySaleDateBetween(from, to);
        return sales.stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ProductReportDTO> getProductReport() {
        return productRepository.findAll()
                .stream()
                .map(this::convertProductToDTO)
                .toList();
    }

    public List<StockReportDTO> getStockReport() {
        return productRepository.findAll()
                .stream()
                .map(this::convertStockToDTO)
                .toList();
    }

    public List<CustomerReportDTO> getCustomerReport() {
        return customerRepository.findAll()
                .stream()
                .map(this::convertCustomerToDTO)
                .toList();
    }

    public ProfitReportDTO getProfitReport() {
        return getProfitReport(null, null);
    }

    public ProfitReportDTO getProfitReport(LocalDate from, LocalDate to) {
        BigDecimal totalSales = from == null && to == null
                ? saleRepository.sumTotalAmount()
                : saleRepository.sumTotalAmountByDateRange(from, to);
        BigDecimal costOfGoodsSold = from == null && to == null
                ? saleRepository.sumCostOfGoodsSold()
                : saleRepository.sumCostOfGoodsSoldByDateRange(from, to);

        ProfitReportDTO dto = new ProfitReportDTO();
        dto.setTotalSales(totalSales == null ? BigDecimal.ZERO : totalSales);
        dto.setTotalProfit(dto.getTotalSales().subtract(
                costOfGoodsSold == null ? BigDecimal.ZERO : costOfGoodsSold));
        return dto;
    }

    private StockReportDTO convertStockToDTO(Product product) {
        StockReportDTO dto = new StockReportDTO();

        dto.setProductCode(product.getProductCode());
        dto.setProductName(product.getProductName());
        dto.setQuantity(product.getQuantity());
        dto.setMinimumStock(product.getMinimumStock());

        int quantity = product.getQuantity() == null ? 0 : product.getQuantity();
        int minimumStock = product.getMinimumStock() == null ? 0 : product.getMinimumStock();
        if (quantity <= minimumStock) {
            dto.setStockStatus("Low Stock");
        } else {
            dto.setStockStatus("In Stock");
        }

        return dto;
    }

    private CustomerReportDTO convertCustomerToDTO(Customer customer) {
        CustomerReportDTO dto = new CustomerReportDTO();

        dto.setCustomerName(customer.getCustomerName());
        dto.setPhone(customer.getPhone());
        dto.setEmail(customer.getEmail());

        return dto;
    }

    private ProductReportDTO convertProductToDTO(Product product) {
        ProductReportDTO dto = new ProductReportDTO();

        dto.setProductCode(product.getProductCode());
        dto.setProductName(product.getProductName());

        if (product.getCategory() != null) {
            dto.setCategoryName(product.getCategory().getName());
        } else {
            dto.setCategoryName("No Category");
        }

        dto.setBrand(product.getBrand());
        dto.setQuantity(product.getQuantity());
        dto.setPurchasePrice(product.getPurchasePrice());
        dto.setSellingPrice(product.getSellingPrice());

        return dto;
    }

    private SalesReportDTO convertToDTO(Sale sale) {
        SalesReportDTO dto = new SalesReportDTO();

        dto.setSaleCode(sale.getSaleCode());
        dto.setCustomerName(sale.getCustomer() == null ? "Walk-in Customer" : sale.getCustomer().getCustomerName());
        dto.setSaleDate(sale.getSaleDate().toString());
        dto.setTotalAmount(sale.getTotalAmount());

        return dto;
    }
}