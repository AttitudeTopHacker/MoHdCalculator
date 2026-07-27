package mohd.salman.ansari.security;

import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.entity.Provider;
import mohd.salman.ansari.entity.User;
import mohd.salman.ansari.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
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

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Fetch user attributes from Google
        OAuth2User oAuth2User = new DefaultOAuth2UserService().loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email    = (String) attributes.get("email");
        String fullName = (String) attributes.get("name");

        // Upsert user — create if not exists, update name if needed
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // New Google user
            user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .provider(Provider.GOOGLE)
                    .isVerified(true)   // Google accounts are already verified
                    .isProfileSetup(false) // Needs name/password setup
                    .build();
            userRepository.save(user);
        } else if (user.getProvider() == Provider.LOCAL) {
            // Existing local user — link Google to their account
            user.setVerified(true);
            user.setProfileSetup(true); // Local users already have a profile
            userRepository.save(user);
        }

        return oAuth2User;
    }
}
