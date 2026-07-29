package mohd.salman.ansari.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseCleanUp {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void cleanUpOidColumn() {
        try {
            // Query PostgreSQL schema to check the data type of picture_url in users table
            String query = "SELECT data_type FROM information_schema.columns " +
                           "WHERE table_name = 'users' AND column_name = 'picture_url'";
            
            String dataType = jdbcTemplate.queryForObject(query, String.class);
            
            if (dataType != null && (dataType.equalsIgnoreCase("oid") || 
                                     dataType.equalsIgnoreCase("bigint") || 
                                     dataType.equalsIgnoreCase("integer"))) {
                log.info("DATABASE CLEANUP: Detected OID/numeric column type ({}) for 'picture_url' in 'users' table.", dataType);
                log.info("DATABASE CLEANUP: Dropping 'picture_url' column so Hibernate can recreate it as TEXT.");
                jdbcTemplate.execute("ALTER TABLE users DROP COLUMN picture_url");
            } else {
                log.info("DATABASE CLEANUP: 'picture_url' column type is: {}. No action needed.", dataType);
            }
        } catch (Exception e) {
            log.warn("DATABASE CLEANUP: Bypassed database check or table/column does not exist yet: {}", e.getMessage());
        }
    }
}
