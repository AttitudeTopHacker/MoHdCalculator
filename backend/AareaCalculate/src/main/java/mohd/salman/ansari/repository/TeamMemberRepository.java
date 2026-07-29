package mohd.salman.ansari.repository;

import mohd.salman.ansari.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
}
