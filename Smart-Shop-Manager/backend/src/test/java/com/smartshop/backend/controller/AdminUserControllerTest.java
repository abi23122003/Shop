package com.smartshop.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import com.smartshop.backend.dto.UserDTO;
import com.smartshop.backend.entity.User;
import com.smartshop.backend.repository.UserRepository;

class AdminUserControllerTest {

    private AdminUserController adminUserController;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        adminUserController = new AdminUserController();
        userRepository = mock(UserRepository.class);
        ReflectionTestUtils.setField(adminUserController, "userRepository", userRepository);
    }

    @Test
    void getPendingUsersReturnsOnlyUnapprovedAccounts() {
        User pending = new User(2L, "cashier1", "hash", "ROLE_USER", false);
        when(userRepository.findByApprovedFalse()).thenReturn(List.of(pending));

        List<UserDTO> result = adminUserController.getPendingUsers();

        assertEquals(1, result.size());
        assertEquals("cashier1", result.get(0).getUsername());
        assertFalse(result.get(0).isApproved());
    }

    @Test
    void approveUserSetsApprovedToTrueAndSaves() {
        User user = new User(3L, "staff1", "hash", "ROLE_USER", false);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<UserDTO> response = adminUserController.approveUser(3L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isApproved());
        assertTrue(user.isApproved());
        verify(userRepository).save(user);
    }

    @Test
    void cannotDeletePrimaryAdminAccount() {
        User admin = new User(1L, "admin", "hash", "ROLE_ADMIN", true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> adminUserController.deleteOrRejectUser(1L));

        assertTrue(ex.getMessage().contains("primary administrator"));
    }

    @Test
    void deleteOrRejectPendingUserRemovesAccount() {
        User pending = new User(4L, "spam_account", "hash", "ROLE_USER", false);
        when(userRepository.findById(4L)).thenReturn(Optional.of(pending));

        ResponseEntity<Map<String, String>> response = adminUserController.deleteOrRejectUser(4L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userRepository).delete(pending);
    }
}
