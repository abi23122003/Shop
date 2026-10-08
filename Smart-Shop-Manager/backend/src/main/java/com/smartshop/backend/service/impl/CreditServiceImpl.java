package com.smartshop.backend.service.impl;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import com.smartshop.backend.mapper.CreditTransactionMapper;
import com.smartshop.backend.entity.Credit;
import com.smartshop.backend.entity.CreditTransaction;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.smartshop.backend.dto.CreditDTO;
import com.smartshop.backend.dto.CreditTransactionDTO;
import com.smartshop.backend.service.CreditService;
import com.smartshop.backend.entity.Customer;
import com.smartshop.backend.mapper.CreditMapper;
import com.smartshop.backend.repository.CreditRepository;
import com.smartshop.backend.repository.CreditTransactionRepository;
import com.smartshop.backend.repository.CustomerRepository;

@Service
public class CreditServiceImpl implements CreditService {
    private final CreditRepository creditRepository;
    private final CreditTransactionRepository creditTransactionRepository;
        private final CustomerRepository customerRepository;


    public CreditServiceImpl(CreditRepository creditRepository, CreditTransactionRepository creditTransactionRepository, CustomerRepository customerRepository) {
        this.creditRepository = creditRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.customerRepository = customerRepository;
    }

@Override
@Transactional
public CreditDTO addCreditPurchase(Long customerId, BigDecimal amount, String remarks) {

    validateAmount(amount);
    Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));

    if (!Boolean.TRUE.equals(customer.getCreditEnabled())) {
        throw new IllegalArgumentException("This customer is not enabled for credit purchases");
    }

    Optional<Credit> optionalCredit = creditRepository.findByCustomerForUpdate(customer);

    Credit credit;

   if (optionalCredit.isPresent()) {

    credit = optionalCredit.get();

    BigDecimal totalCredit = valueOrZero(credit.getTotalCredit());
    BigDecimal balance = valueOrZero(credit.getBalance());
    validateCreditLimit(customer, balance, amount);

    credit.setTotalCredit(totalCredit.add(amount));
    credit.setBalance(balance.add(amount));

} else {

    credit = new Credit();

    credit.setCustomer(customer);
    validateCreditLimit(customer, BigDecimal.ZERO, amount);
    credit.setTotalCredit(amount);
    credit.setTotalPaid(BigDecimal.ZERO);
    credit.setBalance(amount);
    credit.setStatus("PENDING");
}

    creditRepository.save(credit);
    CreditTransaction transaction = new CreditTransaction();

    transaction.setCredit(credit);
    transaction.setTransactionDate(java.time.LocalDate.now());
    transaction.setType("PURCHASE");
    transaction.setAmount(amount);
    transaction.setRemarks(remarks);

creditTransactionRepository.save(transaction);

return CreditMapper.toDTO(credit);


}
 @Override
@Transactional
public CreditDTO recordPayment(Long customerId, BigDecimal amount, String remarks) {

    validateAmount(amount);
    Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));

    Credit credit = creditRepository.findByCustomerForUpdate(customer)
            .orElseThrow(() -> new EntityNotFoundException("No credit account found for customer id: " + customerId));

    BigDecimal currentBalance = valueOrZero(credit.getBalance());
    if (amount.compareTo(currentBalance) > 0) {
        throw new IllegalArgumentException("Payment cannot exceed the outstanding balance");
    }
    credit.setTotalPaid(valueOrZero(credit.getTotalPaid()).add(amount));
    credit.setBalance(currentBalance.subtract(amount));

    if (credit.getBalance().signum() <= 0) {
        credit.setBalance(BigDecimal.ZERO);
        credit.setStatus("PAID");
    } else {
        credit.setStatus("PENDING");
    }

    creditRepository.save(credit);

    CreditTransaction transaction = new CreditTransaction();
    transaction.setCredit(credit);
    transaction.setTransactionDate(java.time.LocalDate.now());
    transaction.setType("PAYMENT");
    transaction.setAmount(amount);
    transaction.setRemarks(remarks);

    creditTransactionRepository.save(transaction);

    return CreditMapper.toDTO(credit);
}

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }

    private void validateCreditLimit(Customer customer, BigDecimal balance, BigDecimal amount) {
        BigDecimal creditLimit = customer.getCreditLimit();
        if (creditLimit != null && creditLimit.signum() > 0
                && balance.add(amount).compareTo(creditLimit) > 0) {
            throw new IllegalArgumentException("Credit limit exceeded for this customer");
        }
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

   @Override
public CreditDTO getCreditByCustomer(Long customerId) {

    Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));

    Credit credit = creditRepository.findByCustomer(customer)
            .orElseThrow(() -> new EntityNotFoundException("No credit account found for customer id: " + customerId));

    return CreditMapper.toDTO(credit);
}
    @Override
public List<CreditDTO> getAllCredits() {

    return creditRepository.findAll()
            .stream()
            .map(CreditMapper::toDTO)
            .collect(Collectors.toList());
}
@Override
public List<CreditTransactionDTO> getTransactionHistory(Long customerId) {

    Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + customerId));

    Credit credit = creditRepository.findByCustomer(customer)
            .orElseThrow(() -> new EntityNotFoundException("No credit account found for customer id: " + customerId));

    return creditTransactionRepository.findByCredit(credit)
            .stream()
            .map(CreditTransactionMapper::toDTO)
            .collect(Collectors.toList());
}
    
}
