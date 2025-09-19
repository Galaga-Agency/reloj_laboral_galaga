# Reloj Laboral

Sistema de control horario digital para cumplimiento de la normativa laboral española 2025.

## Descripción

Aplicación web de fichaje digital que permite a empresas cumplir con el Art. 34.9 del Estatuto de los Trabajadores y la nueva normativa de control horario digital. Incluye interfaces diferenciadas para empleados, administradores e inspectores oficiales.

## Funcionalidades Principales

### Para Empleados
- Fichaje entrada/salida con timestamp preciso
- Visualización de historial personal de fichajes
- Configuración de horarios personalizados
- Seguimiento de horas extraordinarias
- Descarga de informes mensuales en PDF
- Sistema de aceptación/contestación de informes mensuales

### Para Administradores
- Panel de gestión de todos los empleados
- Corrección de registros horarios con trazabilidad
- Generación de informes por empleado y periodo
- Exportación de datos en formato CSV
- Auditoría completa de cambios realizados

### Para Inspectores Oficiales
- Portal dedicado con acceso a todos los datos
- Herramientas de búsqueda y filtrado avanzadas
- Exportación de datos de cumplimiento
- Sistema de alertas por incumplimientos

## Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Components
- **Backend**: Supabase (PostgreSQL + Auth)
- **PDF Generation**: jsPDF + html2canvas
- **Animations**: GSAP
- **Forms**: React Hook Form
- **Routing**: React Router DOM v6
- **Icons**: React Icons (Feather)

## Estructura del Proyecto
```
src/
├── components/
│   ├── forms/
│   │   ├── LoginForm.tsx                  # Formulario de login
│   │   └── WorkSettingsForm.tsx           # Configuración horarios
│   ├── modals/
│   │   ├── MonthlyReportModal.tsx         # Modal informe mensual
│   │   ├── TimeEditModal.tsx              # Editar fichajes (admin)
│   │   └── UserEditModal.tsx              # Editar usuarios (admin)
│   ├── pages/
│   │   ├── DashboardPage.tsx              # Dashboard empleado
│   │   ├── GDPRConsentPage.tsx            # Consentimiento RGPD
│   │   ├── LoginPage.tsx                  # Página login
│   │   ├── PasswordUpdatePage.tsx         # Cambiar contraseña
│   │   ├── PortalOficialPage.tsx          # Portal inspectores
│   │   └── [otros...]
│   ├── ui/
│   │   ├── PrimaryButton.tsx              # Botón principal
│   │   ├── CustomInput.tsx                # Input personalizado
│   │   ├── Checkbox.tsx                   # Checkbox personalizado
│   │   └── [otros...]
│   ├── AdminPanel.tsx                     # Panel administración
│   ├── RelojPrincipal.tsx                 # Fichaje entrada/salida
│   ├── HistorialTrabajo.tsx               # Lista fichajes
│   └── WorkSettings.tsx                   # Config horarios empleado
├── hooks/
│   ├── useTimeRecords.ts                  # Hook fichajes
│   ├── useReports.ts                      # Hook reportes PDF
│   └── useMonthlyReports.ts               # Hook informes mensuales
├── services/
│   ├── auth-service.ts                    # Autenticación
│   ├── time-records-service.ts            # CRUD fichajes
│   └── pdf-service.ts                     # Generación PDFs
├── context/
│   └── AuthContext.tsx                    # Estado global auth
├── utils/
│   ├── date-utils.ts                      # Utilidades fechas
│   └── route-config.ts                    # Configuración rutas
└── types/
└── index.ts                           # Tipos TypeScript
```

## Base de Datos (Supabase)

### Tablas Principales

#### `usuarios`
```sql
- id (uuid, primary key)
- nombre (text)
- email (text, unique)
- first_login (boolean)
- is_admin (boolean)
- is_active (boolean)
- role (text) -- 'employee' | 'official'
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `registros_tiempo`
```sql
- id (uuid, primary key)
- usuario_id (uuid, foreign key)
- fecha (timestamptz) -- single timestamp field
- tipo_registro (text) -- 'entrada' | 'salida'
- es_simulado (boolean)
- fue_modificado (boolean)
- fecha_ultima_modificacion (timestamptz, nullable)
- modificado_por_admin (uuid, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `user_work_settings`
```sql
- id (uuid, primary key)
- usuario_id (uuid, foreign key)
- horas_diarias (numeric)
- horas_viernes (numeric)
- hora_entrada_min (text)
- hora_entrada_max (text)
- hora_salida_min (text)
- hora_salida_max (text)
- hora_salida_viernes_min (text)
- hora_salida_viernes_max (text)
- hora_inicio_descanso (text)
- hora_fin_descanso (text)
- duracion_descanso_min (integer)
- duracion_descanso_max (integer)
- dias_libres (text[])
- auto_entry_enabled (boolean)
- include_lunch_break (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `monthly_reports`
```sql
- id (uuid, primary key)
- usuario_id (uuid, foreign key)
- year (integer)
- month (integer)
- report_data (jsonb)
- pdf_url (text, nullable)
- generated_at (timestamptz)
- viewed_at (timestamptz, nullable)
- accepted_at (timestamptz, nullable)
- contested_at (timestamptz, nullable)
- contest_reason (text, nullable)
- is_accepted (boolean)
- is_contested (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### `time_corrections`
```sql
- id (uuid, primary key)
- registro_tiempo_id (uuid, foreign key)
- usuario_id (uuid, foreign key)
- admin_user_id (uuid, foreign key)
- admin_user_name (text)
- campo_modificado (text)
- valor_anterior (text)
- valor_nuevo (text)
- razon (text)
- fecha_correccion (timestamptz)
- ip_address (text, nullable)
- user_agent (text, nullable)
- created_at (timestamptz)
```

#### `official_access_logs`
```sql
- id (serial, primary key)
- official_id (uuid, foreign key)
- accessed_user_id (text) -- can be 'all' or specific user id
- access_type (text)
- accessed_data (text) -- JSON string
- ip_address (text, nullable)
- user_agent (text, nullable)
- created_at (timestamptz)
```


## Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn

### Configuración

1. Clonar el repositorio
```bash
git clone <repository-url>
cd reloj-laboral
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno

- crear un archivo .env.local
- Completar con:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Iniciar desarrollo
```bash
npm run dev
```

## Configuración de Supabase

### Políticas RLS (Row Level Security)

Esas reglas sirven para proteger los datos de las tablas. Dejamos acceso a esos datos segun reglas, por ejemplo:

#### Tabla `usuarios`
```sql
-- Usuarios pueden ver solo sus datos
CREATE POLICY "usuarios_select_own" ON usuarios 
  FOR SELECT USING (auth.uid() = id OR is_admin = true);

-- Admins pueden ver todos los usuarios
CREATE POLICY "usuarios_select_admin" ON usuarios 
  FOR SELECT USING (is_admin = true);
```

#### Tabla `registros_tiempo`
```sql
-- Empleados ven solo sus registros
CREATE POLICY "registros_select_own" ON registros_tiempo 
  FOR SELECT USING (auth.uid() = usuario_id);

-- Admins ven todos los registros
CREATE POLICY "registros_select_admin" ON registros_tiempo 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND is_admin = true)
  );
```

## Cumplimiento Legal

### Normativa Española
- **Art. 34.9 Estatuto de los Trabajadores**: Registro diario obligatorio
- **Real Decreto-ley 8/2019**: Control horario digital
- **Normativa 2025**: Sistema 100% digital con acceso telemático
- **RGPD**: Consentimiento explícito y derechos del interesado

### Características de Cumplimiento
- Registros inmutables con trazabilidad
- Acceso remoto para Inspección de Trabajo
- Retención automática de 4 años
- Exportación de datos en formatos estándar
- Sistema de alertas por incumplimientos

## Despliegue

### Producción (Netlify)

Al hacer push al repositorio de Github se ejecuta un Webhook, despliegando automaticamente el proyecto en Neltify

### Variables de Entorno Producción
```
VITE_SUPABASE_URL=production_url
VITE_SUPABASE_ANON_KEY=production_key
```

## Licencia

Propietario - GALAGA AGENCY

## Soporte

Para soporte técnico: soporte@galagaagency.com

## Changelog

### v1.0.0 (2025-09-19)
- Sistema de fichaje digital básico
- Panel de administración
- Portal oficial para inspectores
- Informes mensuales con PDF
- Cumplimiento RGPD completo
- Sistema de correcciones con auditoría