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

    @Test
    void distinctKeysDoNotLockOutOtherUsersOrIps() {
        LoginAttemptService service = new LoginAttemptService();

        for (int attempt = 0; attempt < 5; attempt++) {
            service.recordFailure("198.51.100.1:admin");
        }

        assertTrue(service.isBlocked("198.51.100.1:admin"));
        assertFalse(service.isBlocked("127.0.0.1:admin"));
        assertFalse(service.isBlocked("203.0.113.5:admin"));
    }

    @Test
    void boundedCapacityPreventsUnboundedMapGrowth() {
        LoginAttemptService service = new LoginAttemptService();

        for (int i = 0; i < 5500; i++) {
            service.recordFailure("ip-" + i + ":user");
        }

        assertTrue(service.getTrackedEntriesCount() <= LoginAttemptService.MAX_ENTRIES);
    }

    @Test
    void activeBlockSurvivesEvictionWhenUnblockedEntriesAreAvailable() {
        LoginAttemptService service = new LoginAttemptService();

        for (int i = 0; i < LoginAttemptService.MAX_ATTEMPTS; i++) {
            service.recordFailure("blocked-key");
        }
        assertTrue(service.isBlocked("blocked-key"));

        for (int i = 0; i < LoginAttemptService.MAX_ENTRIES + 100; i++) {
            service.recordFailure("unblocked-" + i);
        }

        assertTrue(service.isBlocked("blocked-key"));
    }
}
