package com.smartshop.backend.repository;

import com.smartshop.backend.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Sale s where s.id = :id")
    java.util.Optional<Sale> findByIdForUpdate(@Param("id") Long id);

    List<Sale> findBySaleDate(LocalDate saleDate);

    List<Sale> findBySaleDateBetween(LocalDate from, LocalDate to);

    @Query("select coalesce(sum(s.totalAmount), 0) from Sale s where s.saleDate = :saleDate and s.status <> 'REVERSED'")
    BigDecimal sumTotalAmountBySaleDate(@Param("saleDate") LocalDate saleDate);

    @Query("select coalesce(sum(si.quantity * si.purchasePrice), 0) from SaleItem si where si.sale.saleDate = :saleDate and si.sale.status <> 'REVERSED'")
    BigDecimal sumCostOfGoodsSoldBySaleDate(@Param("saleDate") LocalDate saleDate);

    @Query("select coalesce(sum(s.totalAmount), 0) from Sale s where s.saleDate between :from and :to and s.status <> 'REVERSED'")
    BigDecimal sumTotalAmountByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select coalesce(sum(si.quantity * si.purchasePrice), 0) from SaleItem si where si.sale.saleDate between :from and :to and si.sale.status <> 'REVERSED'")
    BigDecimal sumCostOfGoodsSoldByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select coalesce(sum(s.totalAmount), 0) from Sale s where s.status <> 'REVERSED'")
    BigDecimal sumTotalAmount();

    @Query("select coalesce(sum(si.quantity * si.purchasePrice), 0) from SaleItem si where si.sale.status <> 'REVERSED'")
    BigDecimal sumCostOfGoodsSold();

}
