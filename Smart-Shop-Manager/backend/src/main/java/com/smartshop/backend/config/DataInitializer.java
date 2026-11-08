package com.smartshop.backend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.smartshop.backend.entity.Category;
import com.smartshop.backend.entity.User;
import com.smartshop.backend.repository.CategoryRepository;
import com.smartshop.backend.repository.UserRepository;

@Configuration
public class DataInitializer {

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;

    @Bean
    CommandLineRunner init(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           CategoryRepository categoryRepository) {

        return args -> {
            validateAdminCredentials(adminUsername, adminPassword);

            List<User> adminUsers = userRepository.findByRole("ROLE_ADMIN");

            if (!adminUsers.isEmpty()) {
                // If an admin already matches the target username, use that one; otherwise take the first existing admin
                User targetAdmin = adminUsers.stream()
                        .filter(u -> adminUsername.equals(u.getUsername()))
                        .findFirst()
                        .orElse(adminUsers.get(0));

                boolean needsUpdate = false;
                if (!adminUsername.equals(targetAdmin.getUsername())) {
                    targetAdmin.setUsername(adminUsername);
                    needsUpdate = true;
                }
                if (!passwordEncoder.matches(adminPassword, targetAdmin.getPassword())) {
                    targetAdmin.setPassword(passwordEncoder.encode(adminPassword));
                    needsUpdate = true;
                }
                if (!targetAdmin.isApproved()) {
                    targetAdmin.setApproved(true);
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    targetAdmin.setRole("ROLE_ADMIN");
                    targetAdmin.setApproved(true);
                    userRepository.save(targetAdmin);
                }
            } else {
                // Fresh install: create the initial single admin user
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole("ROLE_ADMIN");
                admin.setApproved(true);
                userRepository.save(admin);
            }

            String[] defaultCategories = { "Grocery", "Personal Care", "Home Care", "Beverages", "Snacks", "Dairy & Bakery", "Fruits & Vegetables", "Household", "Baby Care", "Stationery", "Other" };
            for (String name : defaultCategories) {
                if (categoryRepository.findByNameIgnoreCase(name).isEmpty()) {
                    Category category = new Category();
                    category.setName(name);
                    category.setDescription("Default " + name + " category");
                    category.setActive(true);
                    categoryRepository.save(category);
                }
            }
        };
    }

    public static void validateAdminCredentials(String username, String password) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalStateException("Admin username must be configured and cannot be blank.");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalStateException("Admin password must be configured and cannot be blank.");
        }
        if (password.length() < 8) {
            throw new IllegalStateException("Admin password must be at least 8 characters long.");
        }
        String normalized = password.trim().toLowerCase();
        if (normalized.equals("admin123") || normalized.equals("password") || normalized.equals("admin")
                || normalized.equals("12345678") || normalized.equals("password123")
                || normalized.equals("changeme") || normalized.equals("root1234")) {
            throw new IllegalStateException("Admin password cannot use known default or weak passwords.");
        }
    }
}
