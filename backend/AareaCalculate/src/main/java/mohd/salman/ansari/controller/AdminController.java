package mohd.salman.ansari.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mohd.salman.ansari.dto.ApiResponse;
import mohd.salman.ansari.dto.UserResponse;
import mohd.salman.ansari.entity.TeamMember;
import mohd.salman.ansari.entity.User;
import mohd.salman.ansari.exception.ResourceNotFoundException;
import mohd.salman.ansari.repository.TeamMemberRepository;
import mohd.salman.ansari.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    // Helper to get currently logged in user's email
    private String getCurrentUserEmail() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return principal.toString();
    }

    // ── User Management ──────────────────────────────────────────────────────

    @GetMapping("/users")
    public ApiResponse<List<UserResponse>> getAllUsers(@RequestParam(required = false) String search) {
        log.info("Admin fetch users requested with search query: '{}'", search);
        List<UserResponse> list = userRepository.findAll().stream()
                .filter(u -> search == null || search.trim().isEmpty() ||
                        (u.getFullName() != null && u.getFullName().toLowerCase().contains(search.toLowerCase().trim())) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(search.toLowerCase().trim())))
                .map(UserResponse::from)
                .toList();
        return ApiResponse.success("Users fetched successfully.", list);
    }

    @PutMapping("/users/{id}/suspend")
    public ApiResponse<UserResponse> toggleUserSuspension(@PathVariable UUID id) {
        log.info("Admin request to toggle suspension for user ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String currentEmail = getCurrentUserEmail();
        if (user.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new IllegalArgumentException("You cannot suspend your own administrator account.");
        }

        user.setSuspended(!user.isSuspended());
        userRepository.save(user);

        log.info("User {} suspension status toggled to: {}", user.getEmail(), user.isSuspended());
        return ApiResponse.success(
                user.isSuspended() ? "Account suspended successfully." : "Account activated successfully.",
                UserResponse.from(user)
        );
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable UUID id) {
        log.info("Admin request to delete user ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String currentEmail = getCurrentUserEmail();
        if (user.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new IllegalArgumentException("You cannot delete your own administrator account.");
        }

        userRepository.delete(user);
        log.info("User {} deleted successfully.", user.getEmail());
        return ApiResponse.success("User account deleted successfully.");
    }

    // ── Team Member Management ───────────────────────────────────────────────

    @PostMapping("/team")
    public ApiResponse<TeamMember> addTeamMember(@RequestBody TeamMember request) {
        log.info("Admin request to add team member: {}", request.getName());
        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Name and email are required for team members.");
        }

        TeamMember teamMember = TeamMember.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .about(request.getAbout() != null ? request.getAbout().trim() : "")
                .pictureUrl(request.getPictureUrl()) // Store base64 pic
                .build();

        teamMemberRepository.save(teamMember);
        return ApiResponse.success("Team member added successfully.", teamMember);
    }

    @DeleteMapping("/team/{id}")
    public ApiResponse<Void> deleteTeamMember(@PathVariable UUID id) {
        log.info("Admin request to delete team member ID: {}", id);
        TeamMember member = teamMemberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team member not found."));

        teamMemberRepository.delete(member);
        return ApiResponse.success("Team member removed successfully.");
    }
}
