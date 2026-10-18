package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing unified GitHub stats including public and private repositories.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitHubStatsDto {
    private String username;
    private String name;
    private String avatarUrl;
    private String htmlUrl;
    private String bio;
    private String location;
    private int publicRepos;
    private int privateRepos;
    private int totalRepos;
}
