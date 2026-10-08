package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartshop.backend.entity.Credit;
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
}
