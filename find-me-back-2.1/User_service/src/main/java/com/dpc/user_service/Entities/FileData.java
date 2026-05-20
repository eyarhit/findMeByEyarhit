package com.dpc.user_service.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_data")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FileData {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)

//==> Last Version
//    private Long id;
//    private String name;
//    private String type;
//    @Lob
//    @Column(name = "file_data", columnDefinition = "LONGBLOB")
//    private byte[] fichierData;
//
//    @ManyToOne
//    @JoinColumn(name ="user_id")
//    private User user;

    //==> New Version
    private Long id;

    private String name;
    private String type;
    private String filePath; // Chemin du fichier sur le disque

    @Lob
    @Column(name = "data", columnDefinition = "LONGBLOB")
    private byte[] data; // Données binaires (optionnel)

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime uploadDate;
}
