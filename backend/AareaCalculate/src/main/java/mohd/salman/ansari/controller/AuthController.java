package mohd.salman.ansari.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.dto.*;
import mohd.salman.ansari.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/signup
     * Creates a unverified user account and sends verification OTP.
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(
            @Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.signup(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully! Verification OTP sent to email.", response));
    }

    /**
     * POST /api/v1/auth/verify-signup
     * Verifies the signup OTP code and activates account.
     */
    @PostMapping("/verify-signup")
    public ResponseEntity<ApiResponse<AuthResponse>> verifySignup(
            @Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifySignupOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Account verified successfully!", response));
    }

    /**
     * POST /api/v1/auth/resend-signup-otp
     * Resends the verification OTP code.
     */
    @PostMapping("/resend-signup-otp")
    public ResponseEntity<ApiResponse<Void>> resendSignupOtp(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendSignupOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Verification OTP resent successfully."));
    }

    /**
     * POST /api/v1/auth/login
     * Authenticates email/password and returns JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful.", response));
    }

    /**
     * POST /api/v1/auth/google-native
     * Authenticates native Google ID tokens and returns JWT.
     */
    @PostMapping("/google-native")
    public ResponseEntity<ApiResponse<AuthResponse>> googleNative(
            @Valid @RequestBody NativeGoogleLoginRequest request) {
        AuthResponse response = authService.loginWithGoogleNative(request);
        return ResponseEntity.ok(ApiResponse.success("Google Sign-In successful.", response));
    }

    /**
     * POST /api/v1/auth/forgot-password
     * Sends a 6-digit password reset OTP to the provided email.
     * Always returns 200 (prevents email enumeration).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
                "If an account with that email exists, a password reset OTP has been sent."));
    }

    /**
     * POST /api/v1/auth/reset-password
     * Validates reset OTP and sets a new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordOtpRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now log in."));
    }

    /**
     * POST /api/v1/auth/profile-setup
     * Configures profile name and password for Google users.
     */
    @PostMapping("/profile-setup")
    public ResponseEntity<ApiResponse<UserResponse>> profileSetup(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProfileSetupRequest request) {
        UserResponse response = authService.profileSetup(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile configured successfully!", response));
    }

    /**
     * PUT /api/v1/auth/profile
     * Updates user's full name and/or password.
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = authService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully!", response));
    }

    /**
     * GET /api/v1/auth/me
     * Returns the currently authenticated user's profile.
     * Requires: Authorization: Bearer <token>
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("User retrieved.", user));
    }
}
