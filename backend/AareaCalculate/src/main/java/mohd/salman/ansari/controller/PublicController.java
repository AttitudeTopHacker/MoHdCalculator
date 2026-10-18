package mohd.salman.ansari.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mohd.salman.ansari.dto.ApiResponse;
import mohd.salman.ansari.entity.TeamMember;
import mohd.salman.ansari.repository.TeamMemberRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Slf4j
public class PublicController {

    private final TeamMemberRepository teamMemberRepository;
    private final mohd.salman.ansari.service.GitHubStatsService gitHubStatsService;

    @GetMapping("/team")
    public ApiResponse<List<TeamMember>> getTeamMembers() {
        log.info("Public request to fetch team members list.");
        List<TeamMember> team = teamMemberRepository.findAll();
        return ApiResponse.success("Team list fetched successfully.", team);
    }

    @GetMapping("/github-stats")
    public ApiResponse<mohd.salman.ansari.dto.GitHubStatsDto> getGitHubStats() {
        log.info("Public request to fetch unified GitHub stats.");
        mohd.salman.ansari.dto.GitHubStatsDto stats = gitHubStatsService.getStats();
        return ApiResponse.success("GitHub stats fetched successfully.", stats);
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
