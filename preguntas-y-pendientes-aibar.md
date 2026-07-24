# AIBAR SRL — Preguntas para el dueño + Qué falta

## Preguntas de negocio pendientes

Estas dependen de cómo funciona AIBAR en la realidad, no de decisiones técnicas. Las que ya tienen respuesta quedan marcadas ✅ con lo que se resolvió.

### Pendientes de confirmar

1. **¿Los choferes tienen un camión fijo asignado, o rotan de camión según el viaje?**
   Hoy `choferes.camion_id` es opcional. Si en la práctica los choferes rotan de camión, ese campo puede quedar como un dato meramente informativo ("camión de cabecera"), y lo que importa de verdad es el `camion_id` de cada viaje individual (que ya está bien registrado).

2. **¿Hay algún tope de kms o de tiempo de viaje que debería disparar una alerta?**
   Por ejemplo, si un viaje lleva demasiadas horas "en curso" sin finalizar, o un chofer supera cierto kilometraje mensual. Hoy no hay ningún tipo de alerta — el sistema muestra los datos pero no avisa proactivamente de nada.

3. **Combustible: ¿conviene diferenciar surtidor propio vs. estaciones de servicio externas?**
   Confirmaste que AIBAR usa ambos. Si en algún momento se quiere saber cuánto se gasta en cada uno por separado, habría que sumar un campo (`lugar_carga` o `proveedor`) a `cargas_combustible`. Por ahora no está, todas las cargas se registran igual sin distinguir el origen.

4. **¿Hace falta registrar costos de mantenimiento/service de los camiones**, además del combustible? Hoy el sistema no contempla nada de mantenimiento (cambios de aceite, service, reparaciones).

5. **¿Los reportes/resúmenes que va a necesitar el dueño son de qué tipo?** Por ejemplo: gasto mensual por camión, kms totales de la flota, ranking de choferes por kms, multas acumuladas por chofer. Hoy hay algunos cálculos puntuales (kms del mes, gasto total de combustible por camión), pero no hay una pantalla de reportes consolidada.

### Ya confirmadas y resueltas

- ✅ **Un empleado puede editar/cancelar viajes asignados por otro empleado**, no solo los propios. Ya implementado así — cualquier empleado puede operar sobre cualquier viaje, y queda registrado en auditoría quién hizo cada acción.
- ✅ **Las multas pueden cargarse con fecha retroactiva** (llegan por notificación del municipio, no siempre en el momento). El campo `fecha` de la multa es independiente de cuándo se carga en el sistema.
- ✅ **Se registra el gasto en combustible por camión.** Implementado con litros, monto, fecha, y kilometraje opcional al momento de la carga.
- ✅ **Los viajes tienen un campo `cliente`** (quién contrata el transporte), además de origen/destino/carga.

---

## Qué queda por hacer

### 1) Pulido de UX (antes de mostrarlo como terminado)

- [ ] **Confirmaciones antes de acciones destructivas**: dar de baja un chofer, dar de baja un camión. Hoy esas acciones no existen todavía en el frontend (solo se armaron los servicios en el backend) — si se agregan botones para esto, deberían pedir confirmación antes de ejecutar, mismo criterio que ya se usa en "cancelar viaje" con el modal de motivo.
- [ ] **Estados de carga y error más consistentes** entre pantallas — revisar que todas usen el mismo estilo de mensaje de error y de spinner.
- [ ] **Revisar responsive en mobile** — quedó funcional pero sin pulir estéticamente, se dejó para el final a propósito.
- [ ] **Confirmar que el guard de admin** (`adminGuard`) esté aplicado correctamente en las rutas de `/auditoria` y `/usuarios`, y que redirija bien si un empleado intenta entrar por URL directa.

### 2) Funcionalidades que quedaron afuera del alcance actual (opcional, a futuro)

- [ ] Editar/dar de baja choferes y camiones desde el frontend (el backend ya lo soporta, falta la pantalla).
- [ ] Pantalla de detalle de chofer con kms del mes/histórico e historial de viajes (los endpoints ya existen en el backend: `/choferes/{id}/kms-mes-actual` y `/choferes/{id}/kms-historico`, falta consumirlos en una pantalla).
- [ ] Pantalla de reportes/resúmenes (depende de la pregunta de negocio #5 de arriba).
- [ ] Alertas o notificaciones (depende de la pregunta de negocio #2).

### 3) Deploy

- [ ] **Backend a Render**: crear el servicio, configurar variables de entorno (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, etc.), confirmar el comando de arranque.
- [ ] **Frontend a Vercel**: conectar el repo, configurar la URL del backend de producción en `environment.prod.ts`.
- [ ] **Actualizar CORS** en `app/main.py` para incluir la URL real de Vercel una vez que exista.
- [ ] **Prueba end-to-end en producción**: login, alta de chofer, asignación de viaje, todo el flujo en las URLs reales.

### 4) Documentación y repos

- [ ] README de `aibar-backend`: qué es, stack, cómo levantarlo local, variables de entorno necesarias.
- [ ] README de `aibar-frontend`: qué es, stack, cómo levantarlo local, cómo apunta al backend.
- [ ] Confirmar que `.env` nunca se subió a git en ninguno de los dos repos.

### 5) Seguridad — repaso final antes de que la empresa lo use de verdad

- [ ] Todos los endpoints de escritura (POST/PATCH/DELETE) protegidos con `require_rol(...)` — repasar uno por uno.
- [ ] `JWT_SECRET` de producción distinto y tan random como el de desarrollo (no reusar necesariamente el mismo).
- [ ] Confirmar que los usuarios de prueba (`prueba.tester`, etc.) se eliminen o desactiven antes de que el sistema entre en uso real, para no dejar cuentas de test con acceso admin dando vueltas.

---

## Cómo seguir

1. Mandale las preguntas pendientes al dueño (sección de arriba) — podés seguir trabajando en paralelo mientras esperás las respuestas, ninguna bloquea el resto.
2. Mientras tanto, priorizaría el **punto 3 (deploy)** — tener el sistema accesible desde una URL real (aunque sea con datos de prueba) es lo que le da entidad de "proyecto terminado" tanto para mostrarlo a AIBAR como para portfolio.
3. El pulido de UX y las funcionalidades opcionales se pueden ir sumando de a poco después del deploy, sin bloquear que la empresa ya empiece a probarlo.
