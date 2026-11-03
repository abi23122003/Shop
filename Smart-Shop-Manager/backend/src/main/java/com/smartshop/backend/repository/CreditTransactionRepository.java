package com.smartshop.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.smartshop.backend.entity.Credit;
import com.smartshop.backend.entity.CreditTransaction;
import com.smartshop.backend.entity.Sale;

public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Long> {

    List<CreditTransaction> findByCredit(Credit credit);

    List<CreditTransaction> findBySale(Sale sale);

    @Query("select coalesce(sum(case when upper(t.type) = 'PAYMENT' then -t.amount else t.amount end), 0) from CreditTransaction t where t.credit = :credit")
    java.math.BigDecimal calculateBalance(@Param("credit") Credit credit);

    @Query("select coalesce(sum(case when upper(t.type) = 'PAYMENT' then t.amount else 0 end), 0) from CreditTransaction t where t.credit = :credit")
    java.math.BigDecimal calculateTotalPaid(@Param("credit") Credit credit);

    @Query("select coalesce(sum(case when upper(t.type) in ('PURCHASE', 'REVERSAL') then t.amount else 0 end), 0) from CreditTransaction t where t.credit = :credit")
    java.math.BigDecimal calculateTotalCredit(@Param("credit") Credit credit);

}
