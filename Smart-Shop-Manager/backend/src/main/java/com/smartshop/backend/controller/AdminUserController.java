package com.smartshop.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartshop.backend.dto.UserDTO;
import com.smartshop.backend.entity.User;
import com.smartshop.backend.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<UserDTO> getAllUsers() {
        return userRepository.findAllByOrderByApprovedAscIdDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/pending")
    public List<UserDTO> getPendingUsers() {
        return userRepository.findByApprovedFalse().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<UserDTO> approveUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        user.setApproved(true);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(toDTO(saved));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<UserDTO> approveUserPost(@PathVariable Long id) {
        return approveUser(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteOrRejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        if ("ROLE_ADMIN".equals(user.getRole()) && "admin".equalsIgnoreCase(user.getUsername())) {
            throw new IllegalArgumentException("The primary administrator account cannot be deleted.");
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User account removed successfully"));
    }

    private UserDTO toDTO(User user) {
        return new UserDTO(user.getId(), user.getUsername(), user.getRole(), user.isApproved());
    }
}
