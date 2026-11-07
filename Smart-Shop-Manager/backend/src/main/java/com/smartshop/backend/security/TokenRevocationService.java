package com.smartshop.backend.security;

import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class TokenRevocationService {

    private final Map<String, Instant> revokedTokens = new ConcurrentHashMap<>();
    private final JwtService jwtService;

    public TokenRevocationService(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public void revokeToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        try {
            Date expiration = jwtService.extractExpiration(cleanToken);
            if (expiration != null) {
                revokedTokens.put(cleanToken, expiration.toInstant());
            }
        } catch (Exception ex) {
            // Unverifiable or invalid tokens are not stored in revokedTokens
        }
        cleanupExpired();
    }

    public boolean isRevoked(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        Instant expiry = revokedTokens.get(cleanToken);
        if (expiry == null) {
            return false;
        }
        if (Instant.now().isAfter(expiry)) {
            revokedTokens.remove(cleanToken);
            return false;
        }
        return true;
    }

    public void clear() {
        revokedTokens.clear();
    }

    private void cleanupExpired() {
        if (revokedTokens.size() > 500) {
            Instant now = Instant.now();
            revokedTokens.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        }
    }
}
