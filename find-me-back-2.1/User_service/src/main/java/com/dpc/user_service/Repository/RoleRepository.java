package com.dpc.user_service.Repository;



import com.dpc.user_service.Entities.ERole;

import com.dpc.user_service.Entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

        Optional<Role> findByRole(ERole role);


}
