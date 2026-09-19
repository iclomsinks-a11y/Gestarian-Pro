# GESTARIAN - ESPECIFICACIÓN TÉCNICA Y ARQUITECTURA DEL SISTEMA

**Aplicación Minimalista de Presupuestos y Facturas para Autónomos y Pequeñas Empresas**
*Documento de Referencia y Plan de Desarrollo Continuo*

---

## 1. IDENTIDAD Y PALETA VISUAL
- **Estilo:** Minimalista sobrio, sin textos de relleno ni ornamentos que distraigan.
- **Fondo:** Tono hueso (Off-white / Alabaster: `#F8F7F3`).
- **Tipografía:** Gris oscuro (`#1E293B`) y negro carbón (`#0F172A`).
- **Gamas principales:**
  - Base: Hueso (`#F8F7F3`, `#F3F2EB`).
  - Grises: Neutros fríos y cálidos (`#F1F5F9`, `#E2E8F0`, `#94A3B8`, `#64748B`, `#334155`).
  - Azules: Azul marino ejecutivo y slate blue (`#0F2942`, `#1E3A8A`, `#2563EB`).
- **Estructura Header:**
  - Arriba izquierda: `[NUEVO USUARIO]`
  - Arriba centro: `GESTARIAN` (todo en mayúsculas, espaciado minimalista)
  - Arriba derecha: `[ÁREA DE CLIENTES]`

---

## 2. OFERTAS Y MODELOS DE SERVICIO (DASHBOARD)
1. **LITE:**
   - Creación directa de Presupuestos y Facturas.
   - Opción con/sin IVA y casilla específica para marcar IVA 21%.
   - Conversión automática de presupuesto a factura.
   - Generación directa de factura.
   - Guardado en base de datos.
   - Botón de compartir nativo del dispositivo (`navigator.share`) con alternativa de copiado.
2. **PRO:**
   - Todo lo de Lite más:
   - Almacenamiento unificado de clientes, presupuestos y facturas en base de datos.
   - Informes fiscales trimestrales para gestoría (1T, 2T, 3T, 4T).
   - Generación de libros de facturas compatibles con A3, SAGE y hojas de cálculo XML / XLS Excel.
   - Agenda de citas para clientes.
   - Flujo automático: cuando un presupuesto es aceptado, se activa la agenda para concertar cita con el cliente.
3. **ENTERPRISE:**
   - Para pequeñas empresas y despachos profesionales.
   - Múltiples series de facturación (Serie Ordinaria A, Rectificativas R, Proyectos P).
   - Retención de IRPF configurable (15%, 7%, exento).
   - Auditoría y exportaciones contables avanzadas.

---

## 3. REGLA CRÍTICA DE INMUTABILIDAD FISCAL
- **Fase Borrador:** La factura y presupuesto pueden ser modificados, corregidos o eliminados.
- **Fase Confirmada:** La factura es revisada y validada antes de enviarla.
- **Fase Enviada:** En el momento en que se envía la factura al cliente:
  - **Queda terminantemente bloqueada.**
  - **No se puede modificar ni el presupuesto vinculado ni la factura emitida**, cumpliendo estrictamente con la normativa española de facturación y trazabilidad.

---

## 4. REGISTRO DE USUARIO Y VALIDACIÓN POR EMAIL
- **Campos obligatorios:**
  1. Nombre completo / Razón social
  2. Dirección fiscal completa (Calle, CP, Población, Provincia)
  3. CIF / NIF
  4. Número de teléfono
  5. Correo electrónico
- **Flujo de verificación:**
  - Envío de código numérico de 6 dígitos al correo proporcionado.
  - Verificación en pantalla antes de dar de alta activa al emisor fiscal.

---

## 5. INTEGRACIÓN RESEND (ENVÍO DE EMAILS)
- Arquitectura preparada para API de Resend (`api.resend.com/emails`).
- Envío de código de confirmación de registro (`verification_code`).
- Envío formal de facturas y presupuestos a clientes con archivo o enlace seguro.

```typescript
// Configuración Resend
export async function sendVerificationEmail(email: string, code: string) {
  // POST https://api.resend.com/emails
  // Authorization: Bearer RESEND_API_KEY
  // From: Gestarian <facturas@gestarian.com>
  // To: [email]
  // Subject: "Código de confirmación de alta - GESTARIAN"
}
```

---

## 6. ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)

```sql
-- TABLA DE USUARIOS / EMISORES FISCALES
CREATE TABLE IF NOT EXISTS gestarian_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  fiscal_address TEXT NOT NULL,
  cif TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT FALSE,
  tier TEXT DEFAULT 'pro' CHECK (tier IN ('lite', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS gestarian_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES gestarian_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cif TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLA DE DOCUMENTOS (PRESUPUESTOS Y FACTURAS)
CREATE TABLE IF NOT EXISTS gestarian_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES gestarian_users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES gestarian_clients(id),
  type TEXT NOT NULL CHECK (type IN ('presupuesto', 'factura')),
  number TEXT NOT NULL,
  series TEXT DEFAULT 'A',
  date DATE NOT NULL,
  due_date DATE,
  client_name TEXT NOT NULL,
  client_cif TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL,
  apply_iva BOOLEAN DEFAULT TRUE,
  iva_rate NUMERIC(5,2) DEFAULT 21.00,
  iva_amount NUMERIC(12,2) NOT NULL,
  apply_irpf BOOLEAN DEFAULT FALSE,
  irpf_rate NUMERIC(5,2) DEFAULT 0.00,
  irpf_amount NUMERIC(12,2) DEFAULT 0.00,
  total NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  related_budget_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLA DE CITAS / AGENDA
CREATE TABLE IF NOT EXISTS gestarian_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES gestarian_users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES gestarian_clients(id),
  budget_id UUID REFERENCES gestarian_documents(id),
  title TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT DEFAULT 'confirmada' CHECK (status IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. FORMATOS DE EXPORTACIÓN GESTORÍA
1. **XLS / XML (Excel compatible):** Libro de Facturas Emitidas con columnas oficiales: Número, Fecha, NIF Receptor, Razón Social, Base Imponible, % IVA, Cuota IVA, Total Factura.
2. **SAGE:** CSV delimitado por punto y coma con cabeceras de subcuentas contables (Cuenta 430 Clientes, Cuenta 705 Prestación de Servicios, Cuenta 477 IVA Repercutido).
3. **A3:** Formato estandarizado de enlace contable de facturas para suites A3ASESOR / A3eco.
