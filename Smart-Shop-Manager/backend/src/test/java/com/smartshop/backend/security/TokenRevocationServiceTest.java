package com.smartshop.backend.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import io.jsonwebtoken.JwtException;

class TokenRevocationServiceTest {

    private StubJwtService jwtService;
    private TokenRevocationService service;

    private static class StubJwtService extends JwtService {
        private final Map<String, Date> tokenExpirations = new HashMap<>();

        void registerToken(String token, Date expiration) {
            tokenExpirations.put(token, expiration);
        }

        @Override
        public Date extractExpiration(String token) {
            if (tokenExpirations.containsKey(token)) {
                return tokenExpirations.get(token);
            }
            throw new JwtException("Signature verification failed for invalid token");
        }
    }

    @BeforeEach
    void setUp() {
        jwtService = new StubJwtService();
        service = new TokenRevocationService(jwtService);
    }

    @Test
    void revokesTokenSuccessfully() {
        String token = "valid.jwt.token";
        jwtService.registerToken(token, new Date(System.currentTimeMillis() + 60000));

        assertFalse(service.isRevoked(token));
        service.revokeToken("Bearer " + token);
        assertTrue(service.isRevoked(token));
        assertTrue(service.isRevoked("Bearer " + token));
    }

    @Test
    void rejectsInvalidOrUnverifiableToken() {
        String invalidToken = "invalid.unverifiable.token";

        assertFalse(service.isRevoked(invalidToken));
        service.revokeToken(invalidToken);
        assertFalse(service.isRevoked(invalidToken));
    }

    @Test
    void doesNotRevokeTokenWhenExpirationIsNull() {
        String tokenWithoutExpiration = "token.without.expiration";
        jwtService.registerToken(tokenWithoutExpiration, null);

        assertFalse(service.isRevoked(tokenWithoutExpiration));
        service.revokeToken(tokenWithoutExpiration);
        assertFalse(service.isRevoked(tokenWithoutExpiration));
    }

    @Test
    void handlesNullOrEmptyTokenSafely() {
        assertFalse(service.isRevoked(null));
        assertFalse(service.isRevoked(""));
        service.revokeToken(null);
        service.revokeToken("");
    }
}
