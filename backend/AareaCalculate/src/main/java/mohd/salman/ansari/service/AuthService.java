package mohd.salman.ansari.service;

import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.dto.*;
import mohd.salman.ansari.entity.Otp;
import mohd.salman.ansari.entity.OtpType;
import mohd.salman.ansari.entity.Provider;
import mohd.salman.ansari.entity.User;
import mohd.salman.ansari.exception.*;
import mohd.salman.ansari.repository.OtpRepository;
import mohd.salman.ansari.repository.UserRepository;
import mohd.salman.ansari.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    // ── Signup ───────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // Passwords must match
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        // Email must be unique
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(
                    "An account with email '" + request.getEmail() + "' already exists.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .provider(Provider.LOCAL)
                .isVerified(false)
                .isProfileSetup(true) // local users set name/password on signup
                .build();

        userRepository.save(user);

        // Generate 6-digit OTP
        String otpCode = String.format("%06d", new Random().nextInt(1000000));

        // Save OTP
        otpRepository.deleteAllByUserAndType(user, OtpType.SIGNUP_VERIFICATION);
        Otp otp = Otp.builder()
                .code(otpCode)
                .type(OtpType.SIGNUP_VERIFICATION)
                .user(user)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(false)
                .build();
        otpRepository.save(otp);

        // Send OTP email
        emailService.sendSignupVerificationOtpEmail(user.getEmail(), user.getFullName(), otpCode);

        // Do not return JWT token yet since they are not verified
        return new AuthResponse(null, UserResponse.from(user));
    }

    // ── Verify Signup OTP ────────────────────────────────────────────────────

    @Transactional
    public AuthResponse verifySignupOtp(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.isVerified()) {
            throw new IllegalArgumentException("Account is already verified.");
        }

        Otp otp = otpRepository.findByCodeAndUserEmailAndTypeAndUsed(
                request.getOtp(), email, OtpType.SIGNUP_VERIFICATION, false)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired OTP."));

        if (Instant.now().isAfter(otp.getExpiresAt())) {
            throw new TokenExpiredException("OTP has expired. Please register again.");
        }

        user.setVerified(true);
        userRepository.save(user);

        otp.setUsed(true);
        otpRepository.save(otp);

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, UserResponse.from(user));
    }

    // ── Resend Signup OTP ────────────────────────────────────────────────────

    @Transactional
    public void resendSignupOtp(String email) {
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (user.isVerified()) {
            throw new IllegalArgumentException("Account is already verified.");
        }

        otpRepository.deleteAllByUserAndType(user, OtpType.SIGNUP_VERIFICATION);

        String otpCode = String.format("%06d", new Random().nextInt(1000000));
        Otp otp = Otp.builder()
                .code(otpCode)
                .type(OtpType.SIGNUP_VERIFICATION)
                .user(user)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .used(false)
                .build();
        otpRepository.save(otp);

        emailService.sendSignupVerificationOtpEmail(user.getEmail(), user.getFullName(), otpCode);
    }

    // ── Login ────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));

        // Block login if no password is set (Google-only accounts that never set a password)
        if (user.getPasswordHash() == null) {
            throw new InvalidCredentialsException("This account has no password set. Please use 'Continue with Google' or set a password via Edit Profile.");
        }

        if (!user.isVerified()) {
            throw new InvalidCredentialsException("Please verify your email address first.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password.");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, UserResponse.from(user));
    }

    // ── Forgot Password ──────────────────────────────────────────────────────

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Always respond with success to prevent email enumeration attacks
        userRepository.findByEmail(email).ifPresent(user -> {
            // Delete any existing reset OTPs for this user
            otpRepository.deleteAllByUserAndType(user, OtpType.PASSWORD_RESET);

            // Create new reset OTP (expires in 10 minutes)
            String otpCode = String.format("%06d", new Random().nextInt(1000000));
            Otp otp = Otp.builder()
                    .code(otpCode)
                    .type(OtpType.PASSWORD_RESET)
                    .user(user)
                    .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                    .used(false)
                    .build();
            otpRepository.save(otp);

            // Send reset OTP email
            emailService.sendPasswordResetOtpEmail(email, user.getFullName(), otpCode);
        });
    }

    // ── Reset Password ───────────────────────────────────────────────────────

    @Transactional
    public void resetPassword(ResetPasswordOtpRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        String email = request.getEmail().toLowerCase().trim();

        Otp otp = otpRepository.findByCodeAndUserEmailAndTypeAndUsed(
                request.getOtp(), email, OtpType.PASSWORD_RESET, false)
                .orElseThrow(() -> new InvalidCredentialsException("OTP is invalid or has already been used."));

        if (Instant.now().isAfter(otp.getExpiresAt())) {
            throw new TokenExpiredException("OTP has expired. Please request a new one.");
        }

        // Update password
        User user = otp.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setVerified(true);
        userRepository.save(user);

        // Invalidate OTP
        otp.setUsed(true);
        otpRepository.save(otp);
    }

    // ── Profile Setup ────────────────────────────────────────────────────────

    @Transactional
    public UserResponse profileSetup(String email, ProfileSetupRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setProfileSetup(true);
        user.setVerified(true);
        userRepository.save(user);

        return UserResponse.from(user);
    }

    // ── Update Profile ───────────────────────────────────────────────────────

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }

        // Update profile picture if provided
        if (request.getPictureUrl() != null && !request.getPictureUrl().trim().isEmpty()) {
            user.setPictureUrl(request.getPictureUrl().trim());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().trim().isEmpty()) {
            // Check current password if user has a password set (local login)
            if (user.getPasswordHash() != null) {
                if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                    throw new IllegalArgumentException("Current password is required to update password.");
                }
                if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                    throw new InvalidCredentialsException("Current password is incorrect.");
                }
            }

            if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
                throw new IllegalArgumentException("New passwords do not match.");
            }

            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            user.setProfileSetup(true); // If they didn't complete setup, this completes it
        }

        userRepository.save(user);
        return UserResponse.from(user);
    }

    // ── Get Current User ─────────────────────────────────────────────────────

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return UserResponse.from(user);
    }
}
