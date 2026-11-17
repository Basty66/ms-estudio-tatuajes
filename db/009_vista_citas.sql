-- ============================================================================
-- 009 — La vista de saldos ve las columnas nuevas de citas
-- ----------------------------------------------------------------------------
-- Postgres fija las columnas de "c.*" al crear la vista: las de 008 (origen)
-- no aparecían. Se vuelve a crear igual que en 001.
-- ============================================================================

DROP VIEW citas_con_saldo;
CREATE VIEW citas_con_saldo AS
SELECT c.*,
       COALESCE(p.pagado, 0)::INT AS pagado,
       CASE WHEN c.precio IS NULL THEN NULL
            ELSE GREATEST(c.precio - COALESCE(p.pagado, 0), 0)::INT END AS saldo
FROM citas c
LEFT JOIN (SELECT cita_id, SUM(monto) AS pagado FROM pagos GROUP BY cita_id) p
  ON p.cita_id = c.id;
