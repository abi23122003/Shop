package com.smartshop.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.smartshop.backend.entity.User;
import com.smartshop.backend.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void resetPassword_Success() {
        User user = new User();
        user.setId(1L);
        user.setUsername("clerk1");
        user.setPassword("oldHashedPassword");

        when(userRepository.findByUsername("clerk1")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newSecretPass123")).thenReturn("encodedSecretPass123");

        userService.resetPassword("clerk1", "newSecretPass123");

        assertEquals("encodedSecretPass123", user.getPassword());
        verify(userRepository).save(user);
    }

    @Test
    void resetPassword_UserNotFound_ThrowsException() {
        when(userRepository.findByUsername("missingUser")).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () ->
                userService.resetPassword("missingUser", "newSecretPass123")
        );
    }

    @Test
    void resetPassword_ShortPassword_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPassword("clerk1", "short")
        );
    }

    @Test
    void resetPassword_BlankUsername_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                userService.resetPassword("   ", "newSecretPass123")
        );
    }
}
