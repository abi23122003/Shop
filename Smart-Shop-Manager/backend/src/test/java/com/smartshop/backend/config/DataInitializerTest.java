package com.smartshop.backend.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class DataInitializerTest {

    @Test
    void rejectsEmptyOrNullCredentials() {
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials(null, "SecureP@ss123!"));
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials("", "SecureP@ss123!"));
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials("admin", null));
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials("admin", ""));
    }

    @Test
    void rejectsShortOrWeakDefaultPasswords() {
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials("admin", "short"));
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials("admin", "admin123"));
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials("admin", "password"));
        assertThrows(IllegalStateException.class, () -> DataInitializer.validateAdminCredentials("admin", "12345678"));
    }

    @Test
    void acceptsStrongCredentials() {
        assertDoesNotThrow(() -> DataInitializer.validateAdminCredentials("admin", "SuperSecureAdminPass2026!"));
    }
}
