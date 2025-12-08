# 📋 Planificación MVP - Gestor de Productos para Cotillón

## 🎯 Objetivo del MVP
Sistema backend completo para gestión de productos con escaneo de códigos de barras, control de inventario, precios, categorías y auditoría de cambios, con sistema de roles y autenticación.

---

## 🚨 FASE 0: CORRECCIONES CRÍTICAS (Urgente)
**Duración estimada:** 1-2 días

### 🔴 Bug Crítico de Auditoría
- [ ] **Corregir conversión de UUID a número**
  - Eliminar `parseInt()` en `ProductService` y `AuditInterceptor`
  - Los IDs ya son strings (UUID), no necesitan conversión
  - Verificar que `record_id` en `audit_log` se guarda correctamente
  - **Archivo afectado:** `src/products/products.service.ts`, `src/common/interceptors/audit.interceptor.ts`

### ✅ Criterios de Aceptación:
- Los registros de auditoría muestran UUIDs válidos en `record_id`
- Se puede consultar el historial de un producto correctamente
- No hay valores `NaN` en la tabla `audit_log`

---

## 📦 FASE 1: COMPLETAR MÓDULOS BÁSICOS
**Duración estimada:** 5-7 días

### 1.1 Módulo de Categories (Prioridad Alta)
**Duración:** 2 días

- [ ] **Implementar CategoriesModule completo**
  - [ ] Crear DTOs (CreateCategoryDto, UpdateCategoryDto)
  - [ ] Implementar CategoriesService con CRUD
  - [ ] Soporte para categorías jerárquicas (parent_id)
  - [ ] Implementar CategoriesController
  - [ ] Documentar con Swagger
  - [ ] Proteger rutas con JWT Guard

- [ ] **Activar relación Products-Categories**
  - [ ] Descomentar relación en entidad Product
  - [ ] Endpoint: Asignar categorías a productos
  - [ ] Endpoint: Filtrar productos por categoría
  - [ ] Incluir categorías en respuesta de productos

**Endpoints a crear:**
```
POST   /categories               (Admin/Employee)
GET    /categories               (Público)
GET    /categories/:id           (Público)
GET    /categories/:id/children  (Público)
PUT    /categories/:id           (Admin/Employee)
DELETE /categories/:id           (Admin)
```

### 1.2 Módulo de Inventory (Prioridad Alta)
**Duración:** 2 días

- [ ] **Implementar InventoryModule**
  - [ ] Crear DTOs (CreateInventoryDto, UpdateInventoryDto)
  - [ ] Implementar InventoryService
  - [ ] Control de stock mínimo/máximo
  - [ ] Alertas de stock bajo
  - [ ] Implementar InventoryController
  - [ ] Documentar con Swagger

- [ ] **Integrar con Products**
  - [ ] Endpoint: Consultar stock de producto
  - [ ] Endpoint: Ajustar inventario (entrada/salida)
  - [ ] Endpoint: Historial de movimientos
  - [ ] Validar stock al eliminar productos

**Endpoints a crear:**
```
POST   /inventory                (Admin/Employee)
GET    /inventory                (Admin/Employee/Viewer)
GET    /inventory/:id            (Admin/Employee/Viewer)
PATCH    /inventory/:id            (Admin/Employee)
GET    /inventory/low-stock      (Admin/Employee/Viewer)
POST   /inventory/:id/adjust     (Admin/Employee)
```

### 1.3 Módulo de Pricing (Prioridad Alta)
**Duración:** 2 días

- [ ] **Implementar PricingModule**
  - [ ] Crear DTOs (CreatePricingDto, UpdatePricingDto)
  - [ ] Implementar PricingService
  - [ ] Historial de precios (valid_from, valid_to)
  - [ ] Cálculo automático de markup_percentage
  - [ ] Implementar PricingController
  - [ ] Documentar con Swagger

- [ ] **Integrar con Products**
  - [ ] Endpoint: Obtener precio actual de producto
  - [ ] Endpoint: Historial de precios
  - [ ] Endpoint: Actualizar precio (crear nuevo registro)
  - [ ] Validar que siempre haya un precio activo

**Endpoints a crear:**
```
POST   /pricing                  (Admin/Employee)
GET    /pricing/product/:id      (Público)
GET    /pricing/:id/history      (Admin/Employee)
PATCH    /pricing/:id              (Admin/Employee)
```

### 1.4 Módulo de Users (Prioridad Media)
**Duración:** 1 día

- [ ] **Implementar UsersModule (CRUD)**
  - [ ] Crear DTOs (CreateUserDto, UpdateUserDto)
  - [ ] Implementar UsersService (ya existe parcialmente)
  - [ ] Implementar UsersController
  - [ ] Hash de passwords con bcrypt
  - [ ] Documentar con Swagger

**Endpoints a crear:**
```
POST   /users                    (Admin)
GET    /users                    (Admin)
GET    /users/:id                (Admin/Self)
PATCH    /users/:id                (Admin/Self)
DELETE /users/:id                (Admin)
PATCH    /users/:id/change-password (Self)
```

### ✅ Criterios de Aceptación Fase 1:
- Todos los módulos tienen CRUD completo
- Relaciones entre entidades funcionando
- Documentación Swagger completa
- Validación de DTOs implementada
- Respuestas HTTP consistentes

---

## 🔐 FASE 2: SISTEMA DE ROLES Y PERMISOS
**Duración estimada:** 2-3 días

### 2.1 Implementar Guards de Roles
- [ ] **Crear RolesGuard**
  - [ ] Decorador `@Roles()` personalizado
  - [ ] Guard que valida roles del usuario
  - [ ] Aplicar en todos los endpoints según permisos

### 2.2 Definir Matriz de Permisos
```
| Endpoint                  | Admin | Employee | Viewer | Público |
|---------------------------|-------|----------|--------|---------|
| POST /products            |   ✓   |    ✓     |   ✗    |    ✗    |
| GET /products             |   ✓   |    ✓     |   ✓    |    ✗    |
| GET /products/barcode/:id |   ✓   |    ✓     |   ✓    |    ✓    |
| PATCH /products/:id         |   ✓   |    ✓     |   ✗    |    ✗    |
| DELETE /products/:id      |   ✓   |    ✗     |   ✗    |    ✗    |
| POST /categories          |   ✓   |    ✓     |   ✗    |    ✗    |
| GET /categories           |   ✓   |    ✓     |   ✓    |    ✓    |
| POST /users               |   ✓   |    ✗     |   ✗    |    ✗    |
| GET /audit-log            |   ✓   |    ✗     |   ✗    |    ✗    |
```

- [ ] **Aplicar Guards en Controllers**
  - [ ] Products
  - [ ] Categories
  - [ ] Inventory
  - [ ] Pricing
  - [ ] Users
  - [ ] Audit Log

### 2.3 Mejorar Sistema de Auditoría
- [ ] **Capturar automáticamente el userId del JWT**
  - [ ] No pasar `created_by`/`updated_by` en DTOs
  - [ ] Obtener del request (decorador `@CurrentUser()`)
  - [ ] Aplicar en todos los módulos

- [ ] **Extender auditoría a todos los módulos**
  - [ ] Categories
  - [ ] Inventory
  - [ ] Pricing
  - [ ] Users

### ✅ Criterios de Aceptación Fase 2:
- Cada rol tiene permisos específicos funcionando
- Intentos de acceso no autorizados retornan 403
- La auditoría captura el usuario del JWT automáticamente
- Todos los módulos registran cambios en audit_log

---

## 🛠️ FASE 3: MEJORAS Y SOFT DELETE
**Duración estimada:** 2-3 días

### 3.1 Implementar Soft Delete
- [ ] **Products**
  - [ ] Cambiar de `remove()` a actualizar `status: 'inactive'`
  - [ ] Endpoint de restauración
  - [ ] Filtrar productos inactivos por defecto

- [ ] **Extender a otros módulos**
  - [ ] Categories (con validación de productos asociados)
  - [ ] Users (`is_active: false`)

### 3.2 Mejoras en Endpoints
- [ ] **Búsqueda y Filtrado Avanzado**
  - [ ] Filtrar por múltiples criterios
  - [ ] Búsqueda por texto (name, description)
  - [ ] Ordenamiento flexible
  - [ ] Mejorar paginación (incluir total de registros)

- [ ] **Endpoints Adicionales**
  - [ ] `GET /products/low-stock` (productos con stock bajo)
  - [ ] `GET /categories/tree` (árbol jerárquico completo)
  - [ ] `GET /dashboard/stats` (estadísticas generales)

### 3.3 Validaciones de Negocio
- [ ] **Products**
  - [ ] No permitir duplicar barcode/sku
  - [ ] Validar que tenga al menos una categoría
  - [ ] Validar precio antes de activar

- [ ] **Inventory**
  - [ ] No permitir stock negativo
  - [ ] Alertas automáticas de stock bajo

- [ ] **Categories**
  - [ ] No permitir eliminar si tiene productos
  - [ ] Validar jerarquía (no ciclos)

### ✅ Criterios de Aceptación Fase 3:
- Soft delete funcionando en todos los módulos
- Búsqueda y filtrado robusto
- Validaciones de negocio implementadas
- Endpoints adicionales operativos

---

## 🧪 FASE 4: TESTING
**Duración estimada:** 4-5 días

### 4.1 Tests Unitarios (Prioridad)
- [ ] **ProductsService**
  - [ ] create()
  - [ ] findAll() con filtros
  - [ ] findByBarcode()
  - [ ] update()
  - [ ] remove() (soft delete)

- [ ] **AuditLogService**
  - [ ] createLog()
  - [ ] findByRecord()

- [ ] **CategoriesService, InventoryService, PricingService**

### 4.2 Tests de Integración
- [ ] **Products API**
  - [ ] CRUD completo
  - [ ] Endpoint de escaneo
  - [ ] Filtros y paginación

- [ ] **Auth & Authorization**
  - [ ] Login/Register
  - [ ] Acceso con diferentes roles
  - [ ] Tokens expirados

### 4.3 Tests E2E (Opcional para MVP)
- [ ] Flujo completo: Crear producto → Asignar categoría → Ajustar inventario → Escanear

### ✅ Criterios de Aceptación Fase 4:
- Cobertura de tests > 70% en servicios principales
- Tests de integración pasando para endpoints críticos
- CI/CD configurado (opcional)

---

## 🚀 FASE 5: PREPARACIÓN PARA DEPLOYMENT
**Duración estimada:** 2-3 días

### 5.1 Configuración para Producción
- [ ] **Variables de Entorno**
  - [ ] Validar todas las variables necesarias
  - [ ] Configurar para Render (.env.example)
  - [ ] Configurar para Supabase

- [ ] **Base de Datos**
  - [ ] Crear migraciones TypeORM
  - [ ] Script de seed para datos iniciales
  - [ ] Configurar conexión a Supabase

### 5.2 Seguridad
- [ ] **Validaciones**
  - [ ] Helmet.js configurado
  - [ ] Rate limiting
  - [ ] CORS configurado correctamente

- [ ] **Logs y Monitoreo**
  - [ ] Logger configurado (Winston o similar)
  - [ ] Manejo de errores global
  - [ ] Health check endpoint

### 5.3 Documentación
- [ ] **README.md actualizado**
  - [ ] Instrucciones de instalación
  - [ ] Variables de entorno
  - [ ] Endpoints disponibles
  - [ ] Guía de deployment

- [ ] **Swagger completo**
  - [ ] Todos los endpoints documentados
  - [ ] Ejemplos de requests/responses
  - [ ] Descripción de errores

### 5.4 Deployment
- [ ] **Render**
  - [ ] Configurar servicio
  - [ ] Variables de entorno
  - [ ] Build y deploy

- [ ] **Supabase**
  - [ ] Configurar proyecto
  - [ ] Ejecutar migraciones
  - [ ] Seed de datos iniciales

### ✅ Criterios de Aceptación Fase 5:
- API desplegada y accesible públicamente
- Base de datos en Supabase funcionando
- Swagger accesible en /api/docs
- README completo con instrucciones

---

## 📊 RESUMEN DE TIEMPOS

| Fase | Duración | Prioridad |
|------|----------|-----------|
| Fase 0: Correcciones Críticas | 1-2 días | 🔴 Crítica |
| Fase 1: Módulos Básicos | 5-7 días | 🟠 Alta |
| Fase 2: Roles y Permisos | 2-3 días | 🟠 Alta |
| Fase 3: Mejoras y Soft Delete | 2-3 días | 🟡 Media |
| Fase 4: Testing | 4-5 días | 🟡 Media |
| Fase 5: Deployment | 2-3 días | 🟢 Baja |
| **TOTAL** | **16-23 días** | |

**Nota:** Los tiempos son estimaciones para trabajo dedicado. Pueden variar según experiencia y tiempo disponible.

---

## 🎯 HITOS CLAVE

### Hito 1: MVP Básico (Fase 0 + 1)
- ✅ Bug de auditoría corregido
- ✅ Todos los módulos implementados
- ✅ CRUD completo de productos, categorías, inventario, precios
- **Tiempo estimado:** 6-9 días

### Hito 2: MVP Seguro (+ Fase 2)
- ✅ Sistema de roles funcionando
- ✅ Auditoría completa en todos los módulos
- **Tiempo estimado:** 8-12 días

### Hito 3: MVP Robusto (+ Fase 3)
- ✅ Soft delete implementado
- ✅ Validaciones de negocio
- ✅ Búsqueda avanzada
- **Tiempo estimado:** 10-15 días

### Hito 4: MVP Testeado (+ Fase 4)
- ✅ Tests unitarios y de integración
- ✅ Cobertura aceptable
- **Tiempo estimado:** 14-20 días

### Hito 5: MVP en Producción (+ Fase 5)
- ✅ Desplegado en Render + Supabase
- ✅ Documentación completa
- **Tiempo estimado:** 16-23 días

---

## 🔄 METODOLOGÍA SUGERIDA

### Desarrollo Iterativo
1. **Completar una funcionalidad a la vez**
2. **Probar manualmente en Swagger**
3. **Hacer commit con mensaje descriptivo**
4. **Pasar a la siguiente tarea**

### Priorización
- ✅ Primero: Corregir bugs críticos
- ✅ Segundo: Completar módulos básicos (Categories, Inventory, Pricing)
- ✅ Tercero: Implementar sistema de roles
- ✅ Cuarto: Mejoras y validaciones
- ✅ Quinto: Testing
- ✅ Sexto: Deployment

---

## 📌 PRÓXIMOS PASOS INMEDIATOS

### Esta Semana:
1. ⚠️ **URGENTE:** Corregir bug de UUID en auditoría
2. 🎯 Implementar CategoriesModule completo
3. 🎯 Implementar InventoryModule completo

### Próxima Semana:
1. 🎯 Implementar PricingModule completo
2. 🎯 Completar UsersModule (CRUD)
3. 🔐 Implementar sistema de roles y permisos

---

## 💡 RECOMENDACIONES

1. **No saltar la Fase 0** - El bug de auditoría puede causar problemas mayores
2. **Probar cada módulo antes de continuar** - Usar Swagger para validar
3. **Hacer commits frecuentes** - Facilita revertir cambios si algo falla
4. **Documentar mientras desarrollas** - Es más difícil hacerlo después
5. **Priorizar funcionalidad sobre perfección** - Es un MVP, iterar después
6. **Configurar las migraciones desde el inicio** - Evita problemas en deployment
