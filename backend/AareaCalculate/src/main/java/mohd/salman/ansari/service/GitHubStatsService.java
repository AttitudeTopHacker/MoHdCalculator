package mohd.salman.ansari.service;

import lombok.extern.slf4j.Slf4j;
import mohd.salman.ansari.dto.GitHubStatsDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@Service
@Slf4j
public class GitHubStatsService {

    @Value("${app.github.username:AttitudeTopHacker}")
    private String githubUsername;

    @Value("${app.github.token:}")
    private String githubToken;

    private final RestTemplate restTemplate = new RestTemplate();

    // Cache stats for 15 minutes (900,000 ms) to conserve rate limits
    private static final long CACHE_DURATION_MS = 15 * 60 * 1000;
    private final AtomicReference<CachedStats> cacheRef = new AtomicReference<>(null);

    private record CachedStats(GitHubStatsDto dto, long timestamp) {}

    public GitHubStatsDto getStats() {
        CachedStats cached = cacheRef.get();
        long now = System.currentTimeMillis();
        if (cached != null && (now - cached.timestamp()) < CACHE_DURATION_MS) {
            return cached.dto();
        }

        try {
            GitHubStatsDto fresh = fetchFromGitHub();
            cacheRef.set(new CachedStats(fresh, now));
            return fresh;
        } catch (Exception e) {
            log.error("Failed to fetch fresh GitHub stats: {}", e.getMessage());
            // Fallback to stale cache if present
            if (cached != null) {
                return cached.dto();
            }
            // Absolute fallback
            return GitHubStatsDto.builder()
                    .username(githubUsername)
                    .name("Mohd Salman")
                    .avatarUrl("https://avatars.githubusercontent.com/u/97902566?v=4")
                    .htmlUrl("https://github.com/" + githubUsername)
                    .bio("Founder & Lead Architect at msm.movin 2022 ORG | Web, Android & Desktop Engineer")
                    .location("India")
                    .publicRepos(7)
                    .privateRepos(0)
                    .totalRepos(7)
                    .build();
        }
    }

    @SuppressWarnings("rawtypes")
    private GitHubStatsDto fetchFromGitHub() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("User-Agent", "AreaCalculator-Server");

        boolean hasToken = githubToken != null && !githubToken.trim().isEmpty();
        String url;

        if (hasToken) {
            headers.set("Authorization", "Bearer " + githubToken.trim());
            // Authenticated endpoint returns authenticated user profile
            url = "https://api.github.com/user";
            log.info("Fetching authenticated GitHub stats from {}", url);
        } else {
            // Unauthenticated endpoint returns public data only
            url = "https://api.github.com/users/" + githubUsername;
            log.info("Fetching public GitHub stats from {}", url);
        }

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("GitHub API responded with " + response.getStatusCode());
        }

        Map root = response.getBody();

        String login = root.get("login") != null ? root.get("login").toString() : githubUsername;
        String name = root.get("name") != null ? root.get("name").toString() : "Mohd Salman";
        String avatarUrl = root.get("avatar_url") != null ? root.get("avatar_url").toString() : "https://avatars.githubusercontent.com/u/97902566?v=4";
        String htmlUrl = root.get("html_url") != null ? root.get("html_url").toString() : ("https://github.com/" + githubUsername);
        String bio = root.get("bio") != null ? root.get("bio").toString() : "Founder & Lead Architect at msm.movin 2022 ORG | Web, Android & Desktop Engineer";
        String location = root.get("location") != null ? root.get("location").toString() : "India";

        int publicRepos = 7;
        if (root.get("public_repos") instanceof Number n) {
            publicRepos = n.intValue();
        }

        int totalPrivateRepos = 0;
        if (hasToken) {
            if (root.get("total_private_repos") instanceof Number n) {
                totalPrivateRepos = n.intValue();
            } else if (root.get("owned_private_repos") instanceof Number n) {
                totalPrivateRepos = n.intValue();
            } else {
                // Query owner repositories directly to count private and public repos
                try {
                    String reposUrl = "https://api.github.com/user/repos?affiliation=owner&per_page=100";
                    ResponseEntity<List> reposResp = restTemplate.exchange(reposUrl, HttpMethod.GET, entity, List.class);
                    if (reposResp.getStatusCode().is2xxSuccessful() && reposResp.getBody() != null) {
                        int privCount = 0;
                        int pubCount = 0;
                        for (Object item : reposResp.getBody()) {
                            if (item instanceof Map repoMap) {
                                Object isPriv = repoMap.get("private");
                                if (Boolean.TRUE.equals(isPriv)) {
                                    privCount++;
                                } else {
                                    pubCount++;
                                }
                            }
                        }
                        totalPrivateRepos = privCount;
                        if (pubCount > 0) {
                            publicRepos = pubCount;
                        }
                    }
                } catch (Exception repoEx) {
                    log.warn("Could not fetch /user/repos list: {}", repoEx.getMessage());
                }
            }
        }

        int totalRepos = publicRepos + totalPrivateRepos;

        return GitHubStatsDto.builder()
                .username(login)
                .name(name)
                .avatarUrl(avatarUrl)
                .htmlUrl(htmlUrl)
                .bio(bio)
                .location(location)
                .publicRepos(publicRepos)
                .privateRepos(totalPrivateRepos)
                .totalRepos(totalRepos)
                .build();
    }
}
