-- Widen experience text columns (fix "Data too long for column 'description'")
USE cv_bd;

ALTER TABLE experience
  MODIFY COLUMN description TEXT,
  MODIFY COLUMN travail_realise TEXT;
