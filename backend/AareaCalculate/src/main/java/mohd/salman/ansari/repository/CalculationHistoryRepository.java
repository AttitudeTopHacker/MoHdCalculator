package mohd.salman.ansari.repository;

import mohd.salman.ansari.entity.CalculationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CalculationHistoryRepository extends JpaRepository<CalculationHistory, UUID> {
    Page<CalculationHistory> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
