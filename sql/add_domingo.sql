-- Agregar domingo (dia_semana=0) a la tabla de disponibilidad
-- Ejecutar en Neon SQL Editor

INSERT INTO disponibilidad (dia_semana, activo, hora_inicio, hora_fin, slots_max)
VALUES (0, false, '10:00', '19:00', 3)
ON CONFLICT (dia_semana) DO NOTHING;
