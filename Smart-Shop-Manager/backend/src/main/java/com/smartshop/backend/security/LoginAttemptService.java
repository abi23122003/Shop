package com.smartshop.backend.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final Duration WINDOW = Duration.ofMinutes(15);
    public static final Duration BLOCK_DURATION = Duration.ofMinutes(15);
    public static final int MAX_ENTRIES = 5000;

    private final Map<String, AttemptState> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        if (key == null || key.isBlank()) {
            return false;
        }
        AttemptState state = attempts.get(key);
        if (state == null) {
            return false;
        }
        Instant now = Instant.now();
        if (state.isBlocked(now)) {
            return true;
        }
        if (now.isAfter(state.windowStarted.plus(WINDOW))) {
            attempts.remove(key, state);
        }
        return false;
    }

    public void recordFailure(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        Instant now = Instant.now();
        enforceCapacityLimit(now);

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
        if (key != null) {
            attempts.remove(key);
        }
    }

    public void clear() {
        attempts.clear();
    }

    public int getTrackedEntriesCount() {
        return attempts.size();
    }

    private void enforceCapacityLimit(Instant now) {
        if (attempts.size() >= MAX_ENTRIES) {
            // First pass: remove expired entries
            attempts.entrySet().removeIf(entry -> {
                AttemptState state = entry.getValue();
                return now.isAfter(state.windowStarted.plus(WINDOW))
                        && (state.blockedUntil == null || now.isAfter(state.blockedUntil));
            });

            // Second pass: if still over capacity, evict entries (unblocked entries evicted before active blocks)
            if (attempts.size() >= MAX_ENTRIES) {
                attempts.entrySet().stream()
                        .sorted(Comparator
                                .<Map.Entry<String, AttemptState>, Boolean>comparing(
                                        e -> e.getValue().isBlocked(now))
                                .thenComparing(e -> e.getValue().windowStarted))
                        .limit(Math.max(1, MAX_ENTRIES / 10))
                        .forEach(e -> attempts.remove(e.getKey(), e.getValue()));
            }
        }
    }

    private static final class AttemptState {
        private final Instant windowStarted;
        private int failures;
        private Instant blockedUntil;

        private AttemptState(Instant windowStarted) {
            this.windowStarted = windowStarted;
        }

        private boolean isBlocked(Instant now) {
            return blockedUntil != null && now.isBefore(blockedUntil);
        }
    }
}
