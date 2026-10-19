package mohd.salman.ansari.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.entity.User;
import mohd.salman.ansari.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * After Google login succeeds: generates a JWT and redirects the user
 * to the frontend callback page with the token as a query param.
 *
 * Frontend URL: {FRONTEND_URL}/oauth2/callback?token=<jwt>
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String rawEmail = oAuth2User.getAttribute("email");
        String email = rawEmail != null ? rawEmail.toLowerCase().trim() : null;

        // Ensure user exists (CustomOAuth2UserService already saved them)
        userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("OAuth2 user not found after save: " + email));

        String jwt = jwtUtil.generateToken(email);

        // Check if authentication request originated from mobile app or local dev
        String state = request.getParameter("state");
        boolean isMobile = state != null && state.contains("_mobile");
        boolean isLocal = state != null && state.contains("_local");

        // Redirect frontend — token is read from URL and stored in localStorage
        String redirectUrl;
        if (isMobile) {
            redirectUrl = "com.msmmovin.areacalculator://oauth2/callback?token=" + jwt;
        } else if (isLocal) {
            // Extract local port from state (e.g., _local_5173)
            String localPort = "5173";
            int idx = state.indexOf("_local_");
            if (idx != -1) {
                String sub = state.substring(idx + 7);
                // Extract digits only if appended with further state
                String digits = sub.replaceAll("[^0-9].*$", "");
                if (!digits.isEmpty()) {
                    localPort = digits;
                }
            }
            redirectUrl = "http://localhost:" + localPort + "/oauth2/callback?token=" + jwt;
        } else {
            redirectUrl = frontendUrl + "/oauth2/callback?token=" + jwt;
        }
        response.sendRedirect(redirectUrl);
    }
}
