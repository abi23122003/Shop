package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartshop.backend.dto.CreditDTO;
import com.smartshop.backend.entity.Credit;
import com.smartshop.backend.entity.CreditTransaction;
import com.smartshop.backend.entity.Customer;
import com.smartshop.backend.repository.CreditRepository;
import com.smartshop.backend.repository.CreditTransactionRepository;
import com.smartshop.backend.repository.CustomerRepository;
import com.smartshop.backend.service.impl.CreditServiceImpl;

@ExtendWith(MockitoExtension.class)
class CreditServiceImplTest {

    @Mock private CreditRepository creditRepository;
    @Mock private CreditTransactionRepository creditTransactionRepository;
    @Mock private CustomerRepository customerRepository;

    private CreditServiceImpl creditService;

    @BeforeEach
    void setUp() {
        creditService = new CreditServiceImpl(
                creditRepository,
                creditTransactionRepository,
                customerRepository);
    }

    @Test
    void rejectsCreditLimitBypass() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setCreditEnabled(true);
        customer.setCreditLimit(BigDecimal.valueOf(100));

        Credit credit = new Credit();
        credit.setCustomer(customer);
        credit.setBalance(BigDecimal.valueOf(90));
        credit.setTotalCredit(BigDecimal.valueOf(90));
        credit.setTotalPaid(BigDecimal.ZERO);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomerForUpdate(customer)).thenReturn(Optional.of(credit));

        assertThrows(IllegalArgumentException.class,
                () -> creditService.addCreditPurchase(1L, BigDecimal.valueOf(11), "test"));
    }

    @Test
    void rejectsPaymentAboveOutstandingBalance() {
        Customer customer = new Customer();
        customer.setId(1L);

        Credit credit = new Credit();
        credit.setCustomer(customer);
        credit.setBalance(BigDecimal.valueOf(20));
        credit.setTotalPaid(BigDecimal.ZERO);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomerForUpdate(customer)).thenReturn(Optional.of(credit));

        assertThrows(IllegalArgumentException.class,
                () -> creditService.recordPayment(1L, BigDecimal.valueOf(21), "test"));
    }

    @Test
    void setsCreditStatusToPendingWhenNewCreditPurchaseIsAddedToPaidAccount() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setCreditEnabled(true);
        customer.setCreditLimit(BigDecimal.valueOf(500));

        Credit credit = new Credit();
        credit.setCustomer(customer);
        credit.setBalance(BigDecimal.ZERO);
        credit.setTotalCredit(BigDecimal.valueOf(100));
        credit.setTotalPaid(BigDecimal.valueOf(100));
        credit.setStatus("PAID");

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomerForUpdate(customer)).thenReturn(Optional.of(credit));

        CreditDTO result = creditService.addCreditPurchase(1L, BigDecimal.valueOf(50), "new item");

        assertEquals("PENDING", result.getStatus());
        assertEquals(BigDecimal.valueOf(50), credit.getBalance());
        assertEquals("PENDING", credit.getStatus());
        verify(creditRepository).save(credit);
        verify(creditTransactionRepository).save(any(CreditTransaction.class));
    }

    @Test
    void recordsCustomerRefundForCreditBalanceSuccessfully() {
        Customer customer = new Customer();
        customer.setId(1L);

        Credit credit = new Credit();
        credit.setCustomer(customer);
        // Customer has negative balance (overpayment / reversed paid credit sale)
        credit.setBalance(BigDecimal.valueOf(-100));
        credit.setTotalCredit(BigDecimal.valueOf(100));
        credit.setTotalPaid(BigDecimal.valueOf(200));
        credit.setStatus("CREDIT_BALANCE");

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomerForUpdate(customer)).thenReturn(Optional.of(credit));

        CreditDTO result = creditService.recordRefund(1L, BigDecimal.valueOf(100), "Refund overpayment");

        assertEquals(BigDecimal.ZERO, credit.getBalance());
        assertEquals(BigDecimal.valueOf(100), credit.getTotalPaid());
        assertEquals("PAID", result.getStatus());
        verify(creditRepository).save(credit);
        verify(creditTransactionRepository).save(any(CreditTransaction.class));
    }

    @Test
    void rejectsRefundWhenNoCreditBalanceAvailable() {
        Customer customer = new Customer();
        customer.setId(1L);

        Credit credit = new Credit();
        credit.setCustomer(customer);
        credit.setBalance(BigDecimal.valueOf(50));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomerForUpdate(customer)).thenReturn(Optional.of(credit));

        assertThrows(IllegalArgumentException.class,
                () -> creditService.recordRefund(1L, BigDecimal.valueOf(20), "refund"));
    }

    @Test
    void rejectsRefundExceedingAvailableCreditBalance() {
        Customer customer = new Customer();
        customer.setId(1L);

        Credit credit = new Credit();
        credit.setCustomer(customer);
        credit.setBalance(BigDecimal.valueOf(-50)); // $50 refundable

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomerForUpdate(customer)).thenReturn(Optional.of(credit));

        assertThrows(IllegalArgumentException.class,
                () -> creditService.recordRefund(1L, BigDecimal.valueOf(60), "refund"));
    }

    @Test
    void returnsEmptyHistoryWhenCustomerHasNoCreditAccountYet() {
        Customer customer = new Customer();
        customer.setId(1L);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomer(customer)).thenReturn(Optional.empty());

        assertTrue(creditService.getTransactionHistory(1L).isEmpty());
    }
}
