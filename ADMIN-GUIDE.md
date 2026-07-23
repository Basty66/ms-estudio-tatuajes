# Guía de Administración — MS Estudio Tatuajes

## Acceso al Panel

1. Abre https://tatuajes-azure.vercel.app
2. Haz **triple tap rápido** sobre el logo **"MS"** en el navbar
3. Ingresa la contraseña de administrador y presiona **INGRESAR**

> La sesión se mantiene aunque recargues la página. Para salir, usa el botón **SALIR** en la esquina superior derecha.

---

## Panel de Control (Dashboard)

Al entrar ves las métricas principales:
- **Citas Pendientes** — agendamientos sin confirmar
- **Citas Activas** — total de citas no canceladas
- **Cotizaciones** — solicitudes de cotización recibidas
- **Visitas** — visitas a la página

También se muestran las **últimas cotizaciones** y **últimas citas** agendadas.

---

## Gestión de Citas

Sección para administrar todas las citas agendadas desde la web.

### Filtros por estado
Usa los botones superiores para filtrar:
- **Todas** — todas las citas
- **Pendientes (N)** — citas esperando confirmación
- **Confirmadas (N)** — citas confirmadas
- **Completadas (N)** — tatuajes realizados
- **Canceladas (N)** — citas canceladas

### Acciones por cita
Cada cita tiene botones de acción:
- ✅ **Confirmar** — aparece en citas pendientes, la confirma
- ✅ **Completada** — aparece en confirmadas, la marca como realizada
- ✕ **Cancelar** — cancela la cita
- ✏️ **Editar** — permite modificar nombre, fecha, hora, descripción, notas
- 🗑️ **Eliminar** — borra la cita permanentemente

### Agregar cita manual
Puedes crear citas directamente desde el panel sin pasar por la web.

---

## Cotizaciones

Las solicitudes de cotización que llegan desde la web aparecen aquí.

### Estados
- 🟡 **PENDIENTE** — recién recibida, sin revisar
- 🟢 **ACEPTADA** — cotización aceptada
- 🔴 **RECHAZADA** — cotización rechazada

### Acciones
- ✅ **Aceptar** — cambia estado a aceptada
- ✕ **Rechazar** — cambia estado a rechazada
- 🗑️ **Eliminar** — borra la cotización

---

## Disponibilidad

### Template Semanal
Define para cada día de la semana:
- **Activo/Inactivo** — si se aceptan citas ese día
- **Horario** — hora de inicio y fin
- **Slots** — cantidad máxima de citas por día

Ejemplo: Sábado activo de 10:00 a 19:00 con 3 slots = máximo 3 personas por sábado.

### Calendario Visual
Muestra la disponibilidad de cada día con colores:
- 🟦 **Libre** — sin citas agendadas
- 🟨 **Parcial** — algunas citas, aún hay cupo
- 🟥 **Lleno** — todos los cupos ocupados

Pasa el mouse sobre un día para ver el detalle de cuántas citas hay (pendientes vs confirmadas).

### Excepciones por Fecha
Para días especiales (feriados, vacaciones, etc.):
- **Bloquear un día** — desactivar la atención
- **Cambiar slots** — aumentar o reducir cupos para un día específico
- **Motivo** — opcional, para recordar por qué

---

## Galería

Sube y administra las imágenes del portafolio.

1. Toca el área de upload o arrastra una imagen
2. Selecciona el **estilo** del tatuaje
3. Añade **título** y **descripción** (opcional)
4. Presiona **SUBIR IMAGEN**

Las imágenes aparecen ordenadas en la galería pública.

---

## Publicaciones

Crea contenido para el blog/noticias de la página.

- **Título** — requerido
- **Contenido** — texto de la publicación
- **Imagen URL** — enlace a imagen destacada (opcional)
- **Tipo** — post, evento, etc.
- **Publicado** — visible en la web

---

## Reseñas

Las reseñas de clientes aparecen aquí. Se muestran en la sección de testimonios de la web.

---

## Finanzas

Lleva el control de ingresos y gastos del estudio.

### Resumen
- **Ingresos totales** — en verde
- **Gastos totales** — en rojo
- **Neto** — ganancia/pérdida total
- **Detalle** — insumos, porcentaje pagado, arriendo

### Agregar registro
1. Selecciona **INGRESO** o **GASTO**
2. Elige la **categoría**:
   - Ingresos: Tatuaje, Otro
   - Gastos: Insumos, Porcentaje, Arriendo, Transporte, Marketing, Otro
3. Escribe el **concepto** (ej: "Tatuaje brazo completo")
4. Ingresa el **monto** en pesos chilenos
5. Selecciona la **fecha**
6. Presiona **GUARDAR**

### Tabla de registros
Muestra todos los movimientos ordenados del más reciente al más antiguo. Puedes eliminar registros con el botón 🗑️.

---

## Calendario Público (Agenda)

Los clientes ven el mismo calendario en la sección **AGENDA TU CITA** de la web.

### Colores para el cliente
- 🟦 **Libre** — sin citas ese día
- 🟨 **Parcial** — algunas citas, aún disponible
- 🟥 **Lleno** — sin cupos disponibles
- ⬜ **Pasado** — día ya transcurrido

Los clientes pueden seleccionar un día, llenar sus datos y agendar. La cita queda como **pendiente** hasta que el admin la confirme.

---

## Flujo de Trabajo Recomendado

### Cuando llega una cotización:
1. Ve a **Cotizaciones** → revisa los detalles
2. Contacta al cliente por WhatsApp (el número está en la cotización)
3. Si acepta → presiona ✅ **Aceptar**
4. Si no le interesa → presiona ✕ **Rechazar**

### Cuando alguien agenda desde la web:
1. Ve a **Citas** → filtro **Pendientes**
2. Revisa los detalles de la cita
3. Confirma con el cliente por WhatsApp si es necesario
4. Presiona ✅ **Confirmar**
5. Después del tatuaje → marca como **Completada**

### Para llevar las finanzas:
1. Ve a **Finanzas**
2. Cada vez que cobres un tatuaje → agrega un **INGRESO** categoría "Tatuaje"
3. Cada vez que compres insumos → agrega un **GASTO** categoría "Insumos"
4. Si pagas porcentaje o arriendo → agrégalo como **GASTO**
5. Revisa el resumen para ver ganancias totales
