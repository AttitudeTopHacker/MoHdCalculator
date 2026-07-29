package mohd.salman.ansari.service;

import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.dto.CalculationHistoryDto;
import mohd.salman.ansari.dto.SaveHistoryRequest;
import mohd.salman.ansari.entity.CalculationHistory;
import mohd.salman.ansari.entity.User;
import mohd.salman.ansari.repository.CalculationHistoryRepository;
import mohd.salman.ansari.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CalculationHistoryService {

    private final CalculationHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public CalculationHistoryDto saveHistory(String userEmail, SaveHistoryRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        CalculationHistory history = CalculationHistory.builder()
                .user(user)
                .calculationType(request.getCalculationType())
                .inputData(request.getInputData())
                .resultData(request.getResultData())
                .build();

        CalculationHistory saved = historyRepository.save(history);
        return new CalculationHistoryDto(
                saved.getId(),
                saved.getCalculationType(),
                saved.getInputData(),
                saved.getResultData(),
                saved.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public Page<CalculationHistoryDto> getHistory(String userEmail, int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail));

        return historyRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size))
                .map(h -> new CalculationHistoryDto(
                        h.getId(),
                        h.getCalculationType(),
                        h.getInputData(),
                        h.getResultData(),
                        h.getCreatedAt()
                ));
    }

    @Transactional
    public void deleteHistoryItem(String userEmail, UUID historyId) {
        CalculationHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new IllegalArgumentException("History item not found"));

        if (!history.getUser().getEmail().equals(userEmail)) {
            throw new SecurityException("Unauthorized action");
        }

        historyRepository.delete(history);
    }
}
