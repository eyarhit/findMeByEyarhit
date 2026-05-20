package com.dpc.cv_service.Service;

import com.dpc.cv_service.Entites.*;

import java.util.List;

public interface ICVService {
    Cv creer(Cv cv);
    Cv getCVsByUserId(Long userId);
    Cv modifier(Long id, Cv cv);
    List<Cv> lire();
    Cv creerOuMettreAJour(Cv cv);




}
