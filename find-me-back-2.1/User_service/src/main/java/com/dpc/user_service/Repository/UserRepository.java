package com.dpc.user_service.Repository;

import com.dpc.user_service.Entities.ERole;
import com.dpc.user_service.Entities.Role;
import com.dpc.user_service.Entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    User getUserByEmail(String email);
    List<User> findByRole(Role role);

    List<User> findByRole_RoleAndNomSociete(ERole eRole, String nomSociete);

    List<User> findByNomSociete(String nomSociete);
}
