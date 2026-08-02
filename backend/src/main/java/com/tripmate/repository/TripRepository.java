package com.tripmate.repository;

import com.tripmate.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {

    Optional<Trip> findByJoinCode(String joinCode);

    boolean existsByJoinCode(String joinCode);
}
