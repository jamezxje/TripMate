package com.tripmate.config;

import com.tripmate.entity.User;
import com.tripmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (!userRepository.existsById(1L)) {
            userRepository.save(User.builder()
                    .email("anv@example.com")
                    .fullName("Nguyễn Văn A")
                    .passwordHash("hash123")
                    .build());
        }

        if (!userRepository.existsById(2L)) {
            userRepository.save(User.builder()
                    .email("btt@example.com")
                    .fullName("Trần Thị B")
                    .passwordHash("hash123")
                    .build());
        }

        if (!userRepository.existsById(3L)) {
            userRepository.save(User.builder()
                    .email("lvc@example.com")
                    .fullName("Lê Văn C")
                    .passwordHash("hash123")
                    .build());
        }
    }
}
