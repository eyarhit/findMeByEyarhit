-- Hibernate persiste l’enum Java sous le nom exact : ESN_COMMARCIAL (double M).
-- D’anciennes données peuvent contenir ESN_COMMERCIAL → findByRole échouait côté app.
UPDATE roles SET role = 'ESN_COMMARCIAL' WHERE role = 'ESN_COMMERCIAL';
