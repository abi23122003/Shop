package com.smartshop.backend.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final Duration BLOCK_DURATION = Duration.ofMinutes(15);

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        AttemptState state = attempts.get(key);
        if (state == null) {
            return false;
        }
        Instant now = Instant.now();
        if (state.blockedUntil != null && now.isBefore(state.blockedUntil)) {
            return true;
        }
        if (now.isAfter(state.windowStarted.plus(WINDOW))) {
            attempts.remove(key, state);
        }
        return false;
    }

    public void recordFailure(String key) {
        Instant now = Instant.now();
        attempts.compute(key, (ignored, current) -> {
            AttemptState state = current;
            if (state == null || now.isAfter(state.windowStarted.plus(WINDOW))) {
                state = new AttemptState(now);
            }
            state.failures++;
            if (state.failures >= MAX_ATTEMPTS) {
                state.blockedUntil = now.plus(BLOCK_DURATION);
            }
            return state;
        });
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    private static final class AttemptState {
        private final Instant windowStarted;
        private int failures;
        private Instant blockedUntil;

        private AttemptState(Instant windowStarted) {
            this.windowStarted = windowStarted;
        }
    }
}
