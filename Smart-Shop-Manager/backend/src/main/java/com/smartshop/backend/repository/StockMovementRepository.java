package com.smartshop.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartshop.backend.entity.StockMovement;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
}
