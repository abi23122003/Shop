CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(255),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username)
);

CREATE TABLE categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    description VARCHAR(255),
    active BIT(1),
    PRIMARY KEY (id)
);

CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_code VARCHAR(255),
    customer_name VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    address VARCHAR(255),
    credit_limit DECIMAL(19, 2),
    credit_enabled BIT(1),
    active BIT(1),
    PRIMARY KEY (id),
    KEY idx_customers_phone (phone)
);

CREATE TABLE products (
    id BIGINT NOT NULL AUTO_INCREMENT,
    product_code VARCHAR(255),
    barcode VARCHAR(255),
    product_name VARCHAR(255),
    brand VARCHAR(255),
    subcategory VARCHAR(255),
    category_id BIGINT,
    variant VARCHAR(255),
    unit VARCHAR(255),
    quantity INT,
    purchase_price DECIMAL(19, 2),
    selling_price DECIMAL(19, 2),
    minimum_stock INT,
    expiry_date DATE,
    expiry_applicable BIT(1),
    active BIT(1),
    version BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    KEY idx_products_barcode (barcode),
    KEY idx_products_product_code (product_code),
    KEY idx_products_category_id (category_id),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE sales (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sale_code VARCHAR(255),
    sale_date DATE,
    customer_id BIGINT,
    payment_method VARCHAR(255),
    total_amount DECIMAL(19, 2),
    PRIMARY KEY (id),
    KEY idx_sales_sale_date (sale_date),
    KEY idx_sales_customer_id (customer_id),
    CONSTRAINT fk_sales_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE TABLE sale_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sale_id BIGINT,
    product_id BIGINT,
    quantity INT,
    selling_price DECIMAL(19, 2),
    purchase_price DECIMAL(19, 2),
    total_price DECIMAL(19, 2),
    PRIMARY KEY (id),
    KEY idx_sale_items_product_id (product_id),
    CONSTRAINT fk_sale_items_sale
        FOREIGN KEY (sale_id) REFERENCES sales (id),
    CONSTRAINT fk_sale_items_product
        FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE credits (
    id BIGINT NOT NULL AUTO_INCREMENT,
    customer_id BIGINT,
    total_credit DECIMAL(19, 2),
    total_paid DECIMAL(19, 2),
    balance DECIMAL(19, 2),
    status VARCHAR(255),
    version BIGINT,
    PRIMARY KEY (id),
    UNIQUE KEY uk_credits_customer_id (customer_id),
    CONSTRAINT fk_credits_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE TABLE credit_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    credit_id BIGINT NOT NULL,
    sale_id BIGINT,
    transaction_date DATE,
    type VARCHAR(255),
    amount DECIMAL(19, 2),
    remarks VARCHAR(255),
    PRIMARY KEY (id),
    KEY idx_credit_transactions_credit_id (credit_id),
    KEY idx_credit_transactions_sale_id (sale_id),
    CONSTRAINT fk_credit_transactions_credit
        FOREIGN KEY (credit_id) REFERENCES credits (id),
    CONSTRAINT fk_credit_transactions_sale
        FOREIGN KEY (sale_id) REFERENCES sales (id)
);
