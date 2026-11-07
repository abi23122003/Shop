package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartshop.backend.dto.CustomerDTO;
import com.smartshop.backend.entity.Credit;
import com.smartshop.backend.entity.Customer;
import com.smartshop.backend.repository.CreditRepository;
import com.smartshop.backend.repository.CustomerRepository;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CreditRepository creditRepository;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(customerRepository, creditRepository);
    }

    @Test
    void rejectsDeactivationViaUpdateCustomerWhenOutstandingDebtExists() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setActive(true);

        Credit credit = new Credit();
        credit.setBalance(BigDecimal.valueOf(150.00));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomer(customer)).thenReturn(Optional.of(credit));

        CustomerDTO updateDto = new CustomerDTO();
        updateDto.setActive(false);

        assertThrows(IllegalArgumentException.class, () -> customerService.updateCustomer(1L, updateDto));
    }

    @Test
    void allowsDeactivationViaUpdateCustomerWhenNoDebt() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setActive(true);

        Credit credit = new Credit();
        credit.setBalance(BigDecimal.ZERO);

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomer(customer)).thenReturn(Optional.of(credit));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomerDTO updateDto = new CustomerDTO();
        updateDto.setActive(false);

        CustomerDTO result = customerService.updateCustomer(1L, updateDto);
        assertFalse(result.getActive());
        verify(customerRepository).save(customer);
    }

    @Test
    void rejectsDeactivationViaDeleteCustomerWhenOutstandingDebtExists() {
        Customer customer = new Customer();
        customer.setId(2L);
        customer.setActive(true);

        Credit credit = new Credit();
        credit.setBalance(BigDecimal.valueOf(50.00));

        when(customerRepository.findById(2L)).thenReturn(Optional.of(customer));
        when(creditRepository.findByCustomer(customer)).thenReturn(Optional.of(credit));

        assertThrows(IllegalArgumentException.class, () -> customerService.deleteCustomer(2L));
    }
}
