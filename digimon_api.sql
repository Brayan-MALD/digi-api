from pathlib import Path

# Contenido del script SQL
sql_content = """-- Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS digimon_api;
USE digimon_api;

-- Crear la tabla digimons
CREATE TABLE IF NOT EXISTS digimons (
  id VARCHAR(36) PRIMARY KEY,   -- UUID
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  nivel INT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  imagen TEXT                   -- URL de la imagen del digimon
);

-- Ejemplo de inserción manual (puedes probar con este)
INSERT INTO digimons (id, nombre, tipo, nivel, version, imagen)
VALUES (
  UUID(), 
  'Agumon', 
  'Reptil', 
  1, 
  1, 
  'https://digimon.shadowsmith.com/img/agumon.jpg'
);
"""

# Guardar el archivo en /mnt/data
sql_path = Path("/mnt/data/digimon_api.sql")
sql_path.write_text(sql_content, encoding="utf-8")

sql_path
