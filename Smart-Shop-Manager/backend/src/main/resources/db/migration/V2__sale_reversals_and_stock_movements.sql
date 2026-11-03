ALTER TABLE sales
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    ADD COLUMN reversal_reason VARCHAR(512),
    ADD COLUMN reversed_at DATETIME(6),
    ADD COLUMN reversed_by VARCHAR(255);

CREATE TABLE stock_movements (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    sale_id BIGINT,
    type VARCHAR(32) NOT NULL,
    quantity INT NOT NULL,
    moved_at DATETIME(6) NOT NULL,
    remarks VARCHAR(512),
    PRIMARY KEY (id),
    KEY idx_stock_movements_product_id (product_id),
    KEY idx_stock_movements_sale_id (sale_id),
    CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_stock_movements_sale FOREIGN KEY (sale_id) REFERENCES sales (id)
);

INSERT INTO stock_movements (product_id, sale_id, type, quantity, moved_at, remarks)
SELECT si.product_id, si.sale_id, 'SALE', si.quantity, CURRENT_TIMESTAMP(6), CONCAT('Sale ', s.sale_code)
FROM sale_items si
JOIN sales s ON s.id = si.sale_id;
