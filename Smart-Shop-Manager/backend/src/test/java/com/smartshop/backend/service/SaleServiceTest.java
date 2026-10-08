package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartshop.backend.dto.SaleDTO;
import com.smartshop.backend.dto.SaleItemDTO;
import com.smartshop.backend.entity.Customer;
import com.smartshop.backend.entity.Product;
import com.smartshop.backend.entity.Sale;
import com.smartshop.backend.repository.CreditRepository;
import com.smartshop.backend.repository.CreditTransactionRepository;
import com.smartshop.backend.repository.CustomerRepository;
import com.smartshop.backend.repository.ProductRepository;
import com.smartshop.backend.repository.SaleRepository;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock private SaleRepository saleRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CreditRepository creditRepository;
    @Mock private CreditTransactionRepository creditTransactionRepository;

    private SaleService saleService;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(
                saleRepository,
                customerRepository,
                productRepository,
                creditRepository,
                creditTransactionRepository);
    }

    @Test
    void usesDatabaseSellingPriceInsteadOfClientPrice() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setCreditEnabled(false);

        Product product = new Product();
        product.setId(2L);
        product.setProductName("Milk");
        product.setQuantity(3);
        product.setSellingPrice(BigDecimal.valueOf(50));
        product.setPurchasePrice(BigDecimal.valueOf(30));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(product));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleDTO request = new SaleDTO(
                null,
                null,
                LocalDate.now(),
                1L,
                "Cash",
                BigDecimal.ZERO,
                java.util.List.of(new SaleItemDTO(null, 2L, 1,
                        BigDecimal.ONE, BigDecimal.ONE)));

        SaleDTO result = saleService.saveSale(request);

        assertEquals(BigDecimal.valueOf(50), result.getTotalAmount());
        assertEquals(2, product.getQuantity());
    }

    @Test
    void allowsWalkInCashSaleWithoutCustomer() {
        Product product = new Product();
        product.setId(2L);
        product.setProductName("Milk");
        product.setQuantity(3);
        product.setSellingPrice(BigDecimal.valueOf(50));
        product.setPurchasePrice(BigDecimal.valueOf(30));

        when(productRepository.findByIdForUpdate(2L)).thenReturn(Optional.of(product));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SaleDTO request = new SaleDTO(
                null,
                null,
                LocalDate.now(),
                null,
                "Cash",
                BigDecimal.ZERO,
                java.util.List.of(new SaleItemDTO(null, 2L, 1,
                        BigDecimal.ONE, BigDecimal.ONE)));

        SaleDTO result = saleService.saveSale(request);

        assertEquals(BigDecimal.valueOf(50), result.getTotalAmount());
        assertEquals(2, product.getQuantity());
    }

    @Test
    void rejectsWalkInCreditSale() {
        SaleDTO request = new SaleDTO(
                null,
                null,
                LocalDate.now(),
                null,
                "Credit",
                BigDecimal.ZERO,
                java.util.List.of(new SaleItemDTO(null, 2L, 1,
                        BigDecimal.ONE, BigDecimal.ONE)));

        assertThrows(IllegalArgumentException.class, () -> saleService.saveSale(request));
    }
}
