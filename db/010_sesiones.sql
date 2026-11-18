-- ============================================================================
-- 010 — Trabajos de varias sesiones
-- ----------------------------------------------------------------------------
-- Un tatuaje grande (o un borrado láser) se hace en varias sesiones. Cada
-- sesión sigue siendo una cita: la primera abre el trabajo y las siguientes
-- apuntan a ella con trabajo_id. Lo acordado con el cliente (cuántas sesiones
-- y el valor final) va en todas las citas del trabajo, y cada cita guarda en
-- `precio` lo que se cobra en esa sesión: así el saldo sigue saliendo por cita.
--
-- El número de cada sesión no se guarda: sale de contar las sesiones vivas del
-- trabajo por fecha. Así, si una se cancela o se cambia de día, las demás se
-- renumeran solas.
-- ============================================================================

ALTER TABLE citas
  ADD COLUMN trabajo_id  INT REFERENCES citas(id) ON DELETE SET NULL,
  ADD COLUMN sesiones    SMALLINT CHECK (sesiones BETWEEN 1 AND 40),
  ADD COLUMN valor_final INT CHECK (valor_final >= 0);

CREATE INDEX citas_trabajo ON citas (trabajo_id) WHERE trabajo_id IS NOT NULL;

-- La vista fija las columnas de c.* al crearse: se vuelve a crear para que vea las nuevas.
DROP VIEW citas_con_saldo;
CREATE VIEW citas_con_saldo AS
SELECT c.*,
       COALESCE(p.pagado, 0)::INT AS pagado,
       CASE WHEN c.precio IS NULL THEN NULL
            ELSE GREATEST(c.precio - COALESCE(p.pagado, 0), 0)::INT END AS saldo
FROM citas c
LEFT JOIN (SELECT cita_id, SUM(monto) AS pagado FROM pagos GROUP BY cita_id) p
  ON p.cita_id = c.id;

-- Entre una sesión y la siguiente de un mismo trabajo: el mensaje para agendarla.
ALTER TABLE seguimientos DROP CONSTRAINT seguimientos_etapa_check;
ALTER TABLE seguimientos ADD CONSTRAINT seguimientos_etapa_check
  CHECK (etapa IN ('dia1', 'dia7', 'dia30', 'resena', 'laser1', 'laserProxima', 'siguienteSesion'));
