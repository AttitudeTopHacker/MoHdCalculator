package mohd.salman.ansari.security;

import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.entity.Provider;
import mohd.salman.ansari.entity.User;
import mohd.salman.ansari.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Loads Google user info and creates/updates the local User record in Supabase.
 */
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Value("${app.admin-emails}")
    private String adminEmails;

    private boolean checkIsAdmin(String email) {
        if (adminEmails == null || email == null) return false;
        String[] emails = adminEmails.split(",");
        for (String e : emails) {
            if (e.trim().equalsIgnoreCase(email.trim())) {
                return true;
            }
        }
        return false;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Fetch user attributes from Google
        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String rawEmail   = (String) attributes.get("email");
        String email      = rawEmail != null ? rawEmail.toLowerCase().trim() : null;
        String fullName   = (String) attributes.get("name");
        String pictureUrl = (String) attributes.get("picture"); // Google profile pic

        // Upsert user — create if not exists, update name if needed
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.isSuspended()) {
            throw new OAuth2AuthenticationException(
                new OAuth2Error("suspended_user"), "Your account is suspended. Please contact support."
            );
        }

        boolean isAdmin = checkIsAdmin(email);

        if (user == null) {
            // New Google user
            user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .provider(Provider.GOOGLE)
                    .pictureUrl(pictureUrl)
                    .isVerified(true)   // Google accounts are already verified
                    .isProfileSetup(false) // Needs name/password setup
                    .isAdmin(isAdmin)
                    .build();
            userRepository.save(user);
        } else if (user.getProvider() == Provider.LOCAL) {
            // Existing local user — link Google to their account
            user.setVerified(true);
            user.setProfileSetup(true); // Local users already have a profile
            user.setAdmin(isAdmin);
            if (pictureUrl != null) user.setPictureUrl(pictureUrl);
            userRepository.save(user);
        } else {
            // Returning Google user — update picture or admin flag if changed
            boolean updated = false;
            if (pictureUrl != null && !pictureUrl.equals(user.getPictureUrl())) {
                user.setPictureUrl(pictureUrl);
                updated = true;
            }
            if (user.isAdmin() != isAdmin) {
                user.setAdmin(isAdmin);
                updated = true;
            }
            if (updated) {
                userRepository.save(user);
            }
        }

        return oAuth2User;
    }
}
