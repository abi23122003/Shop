package com.smartshop.backend.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class LoginAttemptServiceTest {

    @Test
    void blocksAfterFiveFailuresAndClearsOnSuccess() {
        LoginAttemptService service = new LoginAttemptService();

        for (int attempt = 0; attempt < 5; attempt++) {
            service.recordFailure("admin");
        }

        assertTrue(service.isBlocked("admin"));
        service.recordSuccess("admin");
        assertFalse(service.isBlocked("admin"));
    }
}
