package com.smartshop.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartshop.backend.entity.Credit;
import com.smartshop.backend.entity.Customer;
import jakarta.persistence.LockModeType;

public interface CreditRepository extends JpaRepository<Credit, Long> {

    Optional<Credit> findByCustomer(Customer customer);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Credit c WHERE c.customer = :customer")
    Optional<Credit> findByCustomerForUpdate(@Param("customer") Customer customer);

}