package mohd.salman.ansari.repository;

import mohd.salman.ansari.entity.Otp;
import mohd.salman.ansari.entity.OtpType;
import mohd.salman.ansari.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<Otp, UUID> {

    Optional<Otp> findByCodeAndUserEmailAndTypeAndUsed(String code, String email, OtpType type, boolean used);

    void deleteAllByUser(User user);

    void deleteAllByUserAndType(User user, OtpType type);
}
