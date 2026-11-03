package com.smartshop.backend.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.math.BigDecimal;
import java.util.UUID;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartshop.backend.dto.SaleDTO;
import com.smartshop.backend.dto.SaleItemDTO;
import com.smartshop.backend.entity.Credit;
import com.smartshop.backend.entity.CreditTransaction;
import com.smartshop.backend.entity.Customer;
import com.smartshop.backend.entity.Product;
import com.smartshop.backend.entity.Sale;
import com.smartshop.backend.entity.SaleItem;
import com.smartshop.backend.entity.StockMovement;
import com.smartshop.backend.mapper.SaleMapper;
import com.smartshop.backend.repository.CreditRepository;
import com.smartshop.backend.repository.CreditTransactionRepository;
import com.smartshop.backend.repository.CustomerRepository;
import com.smartshop.backend.repository.ProductRepository;
import com.smartshop.backend.repository.SaleRepository;
import com.smartshop.backend.repository.StockMovementRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;


@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CreditRepository creditRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final StockMovementRepository stockMovementRepository;

    public SaleService(
            SaleRepository saleRepository,
            CustomerRepository customerRepository,
            ProductRepository productRepository,
            CreditRepository creditRepository,
            CreditTransactionRepository creditTransactionRepository,
            StockMovementRepository stockMovementRepository) {

        this.saleRepository = saleRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.creditRepository = creditRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.stockMovementRepository = stockMovementRepository;
    }
    @Transactional
public SaleDTO saveSale(SaleDTO saleDTO) {

   Customer customer = saleDTO.getCustomerId() == null
        ? null
        : customerRepository.findById(saleDTO.getCustomerId())
            .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + saleDTO.getCustomerId()));

   String paymentMethod = saleDTO.getPaymentMethod() == null ? "" : saleDTO.getPaymentMethod().trim();
   if (!"Cash".equalsIgnoreCase(paymentMethod)
           && !"UPI".equalsIgnoreCase(paymentMethod)
           && !"Card".equalsIgnoreCase(paymentMethod)
           && !"Credit".equalsIgnoreCase(paymentMethod)) {
       throw new IllegalArgumentException("Unsupported payment method");
   }
   if ("Credit".equalsIgnoreCase(paymentMethod)
           && (customer == null || !Boolean.TRUE.equals(customer.getCreditEnabled()))) {
       throw new IllegalArgumentException("This customer is not enabled for credit purchases");
   }

Set<Long> productIds = new HashSet<>();

Sale sale = new Sale();

sale.setSaleCode(saleDTO.getSaleCode() == null || saleDTO.getSaleCode().isBlank()
        ? "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
        : saleDTO.getSaleCode());
sale.setSaleDate(saleDTO.getSaleDate());
sale.setCustomer(customer);
sale.setPaymentMethod(normalizePaymentMethod(paymentMethod));

BigDecimal totalAmount = BigDecimal.ZERO;

List<SaleItem> saleItems = new ArrayList<>();
for (SaleItemDTO itemDTO : saleDTO.getSaleItems()) {

    if (!productIds.add(itemDTO.getProductId())) {
        throw new IllegalArgumentException("A product may only appear once in a sale.");
    }

    Product product = productRepository.findByIdForUpdate(itemDTO.getProductId())
            .orElseThrow(() -> new EntityNotFoundException("Product not found with id: " + itemDTO.getProductId()));

    if (Boolean.FALSE.equals(product.getActive())) {
        throw new IllegalArgumentException("Inactive products cannot be sold: " + product.getProductName());
    }

    int availableQuantity = product.getQuantity() == null ? 0 : product.getQuantity();
    if (availableQuantity < itemDTO.getQuantity()) {
        throw new IllegalArgumentException(
                "Insufficient stock for product: " + product.getProductName());
    }

    BigDecimal sellingPrice = product.getSellingPrice() == null
            ? BigDecimal.ZERO
            : product.getSellingPrice();
    product.setQuantity(availableQuantity - itemDTO.getQuantity());
    productRepository.save(product);

    SaleItem saleItem = new SaleItem();

    saleItem.setSale(sale);
    saleItem.setProduct(product);
    saleItem.setQuantity(itemDTO.getQuantity());
    saleItem.setSellingPrice(sellingPrice);
    saleItem.setPurchasePrice(product.getPurchasePrice());

    BigDecimal itemTotal = sellingPrice.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));

    saleItem.setTotalPrice(itemTotal);

    totalAmount = totalAmount.add(itemTotal);

    saleItems.add(saleItem);
}
sale.setSaleItems(saleItems);
sale.setTotalAmount(totalAmount);

Sale savedSale = saleRepository.save(sale);

for (SaleItem saleItem : saleItems) {
    StockMovement movement = new StockMovement();
    movement.setProduct(saleItem.getProduct());
    movement.setSale(savedSale);
    movement.setType("SALE");
    movement.setQuantity(saleItem.getQuantity());
    movement.setMovedAt(LocalDateTime.now());
    movement.setRemarks("Sale " + savedSale.getSaleCode());
    stockMovementRepository.save(movement);
}

 if ("Credit".equalsIgnoreCase(paymentMethod)) {
    Credit credit = creditRepository.findByCustomerForUpdate(customer).orElseGet(() -> {
        Credit created = new Credit();
        created.setCustomer(customer);
        created.setTotalCredit(BigDecimal.ZERO);
        created.setTotalPaid(BigDecimal.ZERO);
        created.setBalance(BigDecimal.ZERO);
        created.setStatus("PENDING");
        return creditRepository.save(created);
        });
    BigDecimal balance = valueOrZero(credit.getBalance());
    BigDecimal totalCredit = valueOrZero(credit.getTotalCredit());
    BigDecimal creditLimit = customer.getCreditLimit();
    if (creditLimit != null && creditLimit.signum() > 0
            && balance.add(totalAmount).compareTo(creditLimit) > 0) {
        throw new IllegalArgumentException("Credit limit exceeded for this customer");
    }
    credit.setBalance(balance.add(totalAmount));
    credit.setTotalCredit(totalCredit.add(totalAmount));
    credit.setStatus("PENDING");
    creditRepository.save(credit);

    CreditTransaction transaction = new CreditTransaction();
    transaction.setCredit(credit);
    transaction.setSale(savedSale);
    transaction.setTransactionDate(saleDTO.getSaleDate());
    transaction.setType("PURCHASE");
    transaction.setAmount(totalAmount);
    transaction.setRemarks("Credit sale: " + savedSale.getSaleCode());
    creditTransactionRepository.save(transaction);
}

return SaleMapper.toDTO(savedSale);
}

private BigDecimal valueOrZero(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value;
}

private String normalizePaymentMethod(String paymentMethod) {
    if ("UPI".equalsIgnoreCase(paymentMethod)) return "UPI";
    if ("CARD".equalsIgnoreCase(paymentMethod)) return "Card";
    if ("CREDIT".equalsIgnoreCase(paymentMethod)) return "Credit";
    return "Cash";
}

public List<SaleDTO> getAllSales() {

    return saleRepository.findAll()
            .stream()
            .map(SaleMapper::toDTO)
            .toList();
}
public SaleDTO getSaleById(Long id) {

    Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Sale not found with id: " + id));

    return SaleMapper.toDTO(sale);
}
@Transactional
public void deleteSale(Long id) {
    reverseSale(id, "Sale reversed");
}

@Transactional
public void reverseSale(Long id, String reason) {

    Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Sale not found with id: " + id));

    if ("REVERSED".equalsIgnoreCase(sale.getStatus())) {
        throw new IllegalStateException("Sale has already been reversed");
    }

    LocalDateTime reversedAt = LocalDateTime.now();
    String reversalReason = reason == null || reason.isBlank() ? "Sale reversed" : reason.trim();
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String reversedBy = authentication == null || !authentication.isAuthenticated()
            ? "system"
            : authentication.getName();

    for (SaleItem saleItem : sale.getSaleItems()) {
        Product product = saleItem.getProduct();
        int currentQuantity = product.getQuantity() == null ? 0 : product.getQuantity();
        product.setQuantity(currentQuantity + saleItem.getQuantity());
        productRepository.save(product);

        StockMovement movement = new StockMovement();
        movement.setProduct(product);
        movement.setSale(sale);
        movement.setType("REVERSAL");
        movement.setQuantity(saleItem.getQuantity());
        movement.setMovedAt(reversedAt);
        movement.setRemarks("Sale reversal " + sale.getSaleCode() + ": " + reversalReason);
        stockMovementRepository.save(movement);
    }

    if ("Credit".equalsIgnoreCase(sale.getPaymentMethod()) && sale.getCustomer() != null) {
        creditRepository.findByCustomer(sale.getCustomer()).ifPresent(credit -> {
            CreditTransaction reversal = new CreditTransaction();
            reversal.setCredit(credit);
            reversal.setSale(sale);
            reversal.setTransactionDate(reversedAt.toLocalDate());
            reversal.setType("REVERSAL");
            reversal.setAmount(valueOrZero(sale.getTotalAmount()).negate());
            reversal.setRemarks("Reversal of credit sale " + sale.getSaleCode() + ": " + reversalReason);
            creditTransactionRepository.save(reversal);

            BigDecimal updatedBalance = valueOrZero(creditTransactionRepository.calculateBalance(credit));
            BigDecimal updatedTotalPaid = valueOrZero(creditTransactionRepository.calculateTotalPaid(credit));
            BigDecimal updatedTotalCredit = valueOrZero(creditTransactionRepository.calculateTotalCredit(credit));
            credit.setBalance(updatedBalance);
            credit.setTotalPaid(updatedTotalPaid);
            credit.setTotalCredit(updatedTotalCredit);
            credit.setStatus(updatedBalance.signum() <= 0 ? "PAID" : "PENDING");
            creditRepository.save(credit);
        });
    }

    sale.setStatus("REVERSED");
    sale.setReversalReason(reversalReason);
    sale.setReversedAt(reversedAt);
    sale.setReversedBy(reversedBy);
    saleRepository.save(sale);
}
public SaleDTO updateSale(Long id, SaleDTO saleDTO) {

    throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.METHOD_NOT_ALLOWED,
            "Updating completed sales is not supported. Delete the sale and create a new one.");
}
}
