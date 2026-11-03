package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

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
import com.smartshop.backend.entity.Credit;
import com.smartshop.backend.entity.CreditTransaction;
import com.smartshop.backend.entity.Product;
import com.smartshop.backend.entity.Sale;
import com.smartshop.backend.entity.SaleItem;
import com.smartshop.backend.entity.StockMovement;
import com.smartshop.backend.repository.CreditRepository;
import com.smartshop.backend.repository.CreditTransactionRepository;
import com.smartshop.backend.repository.CustomerRepository;
import com.smartshop.backend.repository.ProductRepository;
import com.smartshop.backend.repository.SaleRepository;
import com.smartshop.backend.repository.StockMovementRepository;

@ExtendWith(MockitoExtension.class)
class SaleServiceTest {

    @Mock private SaleRepository saleRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CreditRepository creditRepository;
    @Mock private CreditTransactionRepository creditTransactionRepository;
    @Mock private StockMovementRepository stockMovementRepository;

    private SaleService saleService;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(
                saleRepository,
                customerRepository,
                productRepository,
                creditRepository,
                creditTransactionRepository,
                stockMovementRepository);
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

    @Test
    void reversesCreditSaleWithNegativeTransactionAndPreservesOriginalRows() {
        Customer customer = new Customer();
        customer.setId(1L);
        Sale sale = new Sale();
        sale.setId(3L);
        sale.setSaleCode("TXN-3");
        sale.setSaleDate(LocalDate.now());
        sale.setCustomer(customer);
        sale.setPaymentMethod("Credit");
        sale.setTotalAmount(BigDecimal.valueOf(50));
        Product product = new Product();
        product.setId(4L);
        product.setQuantity(7);
        SaleItem item = new SaleItem();
        item.setSale(sale);
        item.setProduct(product);
        item.setQuantity(2);
        sale.setSaleItems(java.util.List.of(item));
        Credit credit = new Credit();
        credit.setCustomer(customer);
        credit.setBalance(BigDecimal.valueOf(50));
        credit.setTotalCredit(BigDecimal.valueOf(50));
        CreditTransaction original = new CreditTransaction();
        original.setCredit(credit);
        original.setSale(sale);
        original.setAmount(BigDecimal.valueOf(50));

        when(saleRepository.findById(3L)).thenReturn(Optional.of(sale));
        when(creditRepository.findByCustomer(customer)).thenReturn(Optional.of(credit));
        when(creditTransactionRepository.calculateBalance(credit)).thenReturn(BigDecimal.valueOf(25));
        when(creditTransactionRepository.calculateTotalPaid(credit)).thenReturn(BigDecimal.ZERO);
        when(creditTransactionRepository.calculateTotalCredit(credit)).thenReturn(BigDecimal.valueOf(25));

        saleService.reverseSale(3L, "Duplicate sale");

        assertEquals(sale, original.getSale());
        assertEquals(BigDecimal.valueOf(50), original.getAmount());
        assertEquals(BigDecimal.valueOf(25), credit.getBalance());
        assertEquals(9, product.getQuantity());
        assertEquals("REVERSED", sale.getStatus());
        assertEquals("Duplicate sale", sale.getReversalReason());
        verify(stockMovementRepository).save(org.mockito.ArgumentMatchers.argThat(movement ->
                "REVERSAL".equals(movement.getType()) && movement.getSale() == sale
                        && movement.getProduct() == product && movement.getQuantity() == 2));
        verify(creditTransactionRepository).save(org.mockito.ArgumentMatchers.argThat(transaction ->
                "REVERSAL".equals(transaction.getType())
                        && transaction.getCredit() == credit
                        && transaction.getSale() == sale
                        && BigDecimal.valueOf(-50).equals(transaction.getAmount())));
        verify(saleRepository).save(sale);
        verify(saleRepository, never()).delete(sale);

        assertThrows(IllegalStateException.class, () -> saleService.reverseSale(3L, "Again"));
    }
}
