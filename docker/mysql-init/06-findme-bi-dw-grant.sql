-- findme_dw est créé après 02-findme-bi-readonly sur volumes anciens : réappliquer le GRANT Metabase.
GRANT SELECT ON findme_dw.* TO 'findme_bi'@'%';
FLUSH PRIVILEGES;
