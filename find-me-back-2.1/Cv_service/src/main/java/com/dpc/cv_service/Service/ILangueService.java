package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.Langue;

import java.util.List;

public interface ILangueService {
    List<Langue> getLanguesByUserId(Long userId);
    Langue updateLangue(Long idLangue, Langue updatedLangue);
    List<Langue> mergeLanguesForUser(Long userId, List<Langue> langues);

}
