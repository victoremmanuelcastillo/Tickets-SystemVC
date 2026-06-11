const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const initDb = async () => {
  // --- Schema ---
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name        VARCHAR(255) NOT NULL,
      role        VARCHAR(20)  NOT NULL CHECK (role IN ('usuario', 'agente', 'admin')),
      area        VARCHAR(255),
      created_at  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id   SERIAL PRIMARY KEY,
      code VARCHAR(10)  NOT NULL,
      name VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS problems (
      id               SERIAL PRIMARY KEY,
      category_id      INT REFERENCES categories(id),
      code             VARCHAR(20)  NOT NULL,
      name             VARCHAR(255) NOT NULL,
      priority         VARCHAR(20)  NOT NULL,
      resolution_hours INT          NOT NULL,
      description      TEXT
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id         SERIAL PRIMARY KEY,
      problem_id INT  REFERENCES problems(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE problems ADD COLUMN IF NOT EXISTS description TEXT;

    CREATE TABLE IF NOT EXISTS tickets (
      id              SERIAL PRIMARY KEY,
      user_id         INT REFERENCES users(id),
      user_name       VARCHAR(255) NOT NULL,
      area            VARCHAR(255),
      category_id     INT REFERENCES categories(id),
      problem_id      INT REFERENCES problems(id),
      additional_info TEXT,
      status          VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'in_progress', 'resolved')),
      assigned_to     INT REFERENCES users(id),
      assigned_name   VARCHAR(255),
      created_at      TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ticket_notes (
      id         SERIAL PRIMARY KEY,
      ticket_id  INT REFERENCES tickets(id) ON DELETE CASCADE,
      admin_id   INT REFERENCES users(id),
      admin_name VARCHAR(255) NOT NULL,
      note       TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_to INT REFERENCES users(id);
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assigned_name VARCHAR(255);
    ALTER TABLE users   ADD COLUMN IF NOT EXISTS specialty VARCHAR(100);
    ALTER TABLE users   ADD COLUMN IF NOT EXISTS is_primary_admin BOOLEAN DEFAULT FALSE;
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS other_description TEXT;
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

    CREATE INDEX IF NOT EXISTS idx_tickets_status      ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_user_id     ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at  ON tickets(created_at DESC);

    -- Auto-actualiza updated_at en cada UPDATE sobre tickets
    CREATE OR REPLACE FUNCTION fn_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_tickets_updated_at ON tickets;
    CREATE TRIGGER trg_tickets_updated_at
      BEFORE UPDATE ON tickets
      FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

    DO $$
    BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('usuario', 'agente', 'admin'));
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `);

  // --- Seed categories + problems (only if empty) ---
  const { rows: catCount } = await pool.query('SELECT COUNT(*) FROM categories');
  if (parseInt(catCount[0].count) === 0) {
    await pool.query(`
      INSERT INTO categories (code, name) VALUES
      ('1.1', 'Infraestructura'),
      ('1.2', 'Soporte Técnico'),
      ('1.3', 'Accesos'),
      ('1.4', 'Correo Electrónico'),
      ('1.5', 'Consulta General');
    `);

    // --- Infraestructura ---
    const { rows: cats } = await pool.query('SELECT id, code FROM categories ORDER BY id');
    const catMap = Object.fromEntries(cats.map(c => [c.code, c.id]));

    await pool.query(`
      INSERT INTO problems (category_id, code, name, priority, resolution_hours, description) VALUES
      ($1,'1.1.1','Servidor caído',             'Crítica',  2,  'El servidor principal o de respaldo no responde. Puede afectar múltiples servicios y usuarios simultáneamente.'),
      ($1,'1.1.2','Lentitud del sistema',        'Alta',     4,  'Rendimiento degradado en servidores o aplicaciones. Los usuarios reportan tiempos de respuesta anormalmente lentos.'),
      ($1,'1.1.3','Fallo de base de datos',      'Crítica',  2,  'La base de datos no responde, presenta errores de conexión o corrupción de datos.'),
      ($1,'1.1.4','Red institucional sin conexión','Crítica', 1,  'La red interna de la organización ha perdido conectividad total o parcial entre segmentos.'),
      ($1,'1.1.5','Problemas DNS',               'Alta',     4,  'El servicio de resolución de nombres no funciona correctamente, impidiendo acceder a recursos por nombre.'),
      ($1,'1.1.6','VPN no funciona',             'Alta',     4,  'Los usuarios remotos no pueden establecer la conexión VPN o se desconectan constantemente.'),
      ($1,'1.1.7','Pérdida de conexión entre sedes','Crítica',2, 'El enlace de comunicación entre dos o más sedes de la organización está interrumpido.'),
      ($1,'1.1.8','Sistema fuera de servicio',   'Crítica',  2,  'Una aplicación o sistema crítico para la operación se encuentra completamente inaccesible.'),
      ($1,'1.1.9','Ataque o amenaza de seguridad','Crítica', 1,  'Se ha detectado actividad maliciosa, intrusión, ransomware, o comportamiento anómalo en la infraestructura.'),
      ($1,'1.1.10','Error de almacenamiento',    'Alta',     4,  'Fallos en discos, arreglos RAID, NAS/SAN o sistema de archivos con riesgo de pérdida de datos.'),
      ($1,'1.1.11','Saturación de recursos',     'Alta',     4,  'CPU, memoria RAM o disco en los servidores al límite, provocando degradación o caídas de servicio.'),
      ($1,'1.1.12','Respaldo fallido',            'Media Alta',8, 'El proceso de backup no se completó correctamente. Los datos podrían no estar protegidos.'),
      ($1,'1.1.13','Problemas eléctricos',        'Crítica',  1,  'Cortes de luz, fallas en UPS, picos de voltaje u otros problemas eléctricos que afectan los equipos.'),
      ($1,'1.1.14','Error de virtualización',    'Alta',     4,  'La plataforma de virtualización presenta fallos, máquinas virtuales no inician o se comportan de forma inestable.'),
      ($1,'1.1.15','Caída de servicios web',      'Alta',     4,  'Los servidores web o aplicaciones publicadas en internet/intranet no están disponibles.')
    `, [catMap['1.1']]);

    // --- Soporte Técnico ---
    await pool.query(`
      INSERT INTO problems (category_id, code, name, priority, resolution_hours, description) VALUES
      ($1,'1.2.1','Equipo lento',                'Media',    8,  'El equipo de cómputo tarda demasiado en iniciar, abrir aplicaciones o realizar tareas cotidianas.'),
      ($1,'1.2.2','Computadora no enciende',     'Alta',     4,  'El equipo no da señales de vida al presionar el botón de encendido o se apaga inmediatamente.'),
      ($1,'1.2.3','Pantalla azul (BSOD)',         'Alta',     4,  'El sistema operativo presenta pantalla azul de la muerte con código de error.'),
      ($1,'1.2.4','Teclado o mouse no funcionan','Media',    8,  'Los periféricos de entrada no responden, funcionan parcialmente o con retraso.'),
      ($1,'1.2.5','Problema con impresora',       'Media',    8,  'La impresora no imprime, imprime con mala calidad, o no es detectada por el equipo.'),
      ($1,'1.2.6','Cámara o micrófono fallan',   'Media',    8,  'Los dispositivos de video/audio no funcionan en videollamadas o conferencias.'),
      ($1,'1.2.7','Sin internet',                 'Alta',     4,  'El equipo no tiene acceso a internet aunque otros dispositivos en la misma red sí funcionan.'),
      ($1,'1.2.8','Wi-Fi inestable',             'Media',    8,  'La conexión inalámbrica se corta frecuentemente o tiene velocidad muy baja.'),
      ($1,'1.2.9','Actualización fallida',        'Media Alta',6, 'Una actualización del sistema operativo o aplicación no se completó y dejó el equipo inestable.'),
      ($1,'1.2.10','Software no abre',            'Media',    8,  'Una aplicación instalada no inicia, se cierra sola o presenta errores al ejecutarse.'),
      ($1,'1.2.11','Error de drivers',            'Media Alta',6, 'Los controladores de dispositivos están corruptos, desactualizados o causan conflictos.'),
      ($1,'1.2.12','Virus o malware',             'Alta',     4,  'Se detecta comportamiento sospechoso, alertas del antivirus o evidencia de software malicioso.'),
      ($1,'1.2.13','Equipo sobrecalentado',       'Media Alta',6, 'El equipo se apaga solo, hace ruido excesivo o el ventilador trabaja al máximo todo el tiempo.'),
      ($1,'1.2.14','Audio no funciona',           'Baja',    16,  'No hay sonido en el equipo o los altavoces/audífonos no son detectados correctamente.'),
      ($1,'1.2.15','USB no detectado',            'Media',    8,  'Los puertos USB no reconocen memorias, discos externos u otros dispositivos.')
    `, [catMap['1.2']]);

    // --- Accesos ---
    await pool.query(`
      INSERT INTO problems (category_id, code, name, priority, resolution_hours, description) VALUES
      ($1,'1.3.1','Contraseña olvidada',          'Media Alta',4, 'El usuario no recuerda su contraseña y no puede acceder a su cuenta o sistema.'),
      ($1,'1.3.2','Usuario bloqueado',             'Alta',     2,  'La cuenta del usuario fue bloqueada por intentos fallidos o por política de seguridad.'),
      ($1,'1.3.3','Sin permisos suficientes',      'Media',    8,  'El usuario no tiene acceso a un recurso, carpeta, sistema o función que necesita para su trabajo.'),
      ($1,'1.3.4','Acceso denegado',               'Alta',     4,  'El sistema rechaza el acceso aunque las credenciales parecen correctas.'),
      ($1,'1.3.5','Error de autenticación',        'Alta',     4,  'El proceso de login falla con mensajes de error aunque los datos ingresados son correctos.'),
      ($1,'1.3.6','MFA no funciona',               'Alta',     4,  'El segundo factor de autenticación (app, SMS, token) no genera o no acepta el código.'),
      ($1,'1.3.7','Cuenta deshabilitada',          'Media Alta',4, 'La cuenta del usuario fue deshabilitada por administración o por inactividad.'),
      ($1,'1.3.8','Problema con token/certificado','Alta',     4,  'El token físico, certificado digital o tarjeta inteligente no funciona correctamente.'),
      ($1,'1.3.9','No puede entrar al sistema',    'Alta',     2,  'El usuario no logra acceder a un sistema crítico por causas no identificadas.'),
      ($1,'1.3.10','Error de roles o permisos',    'Media',    8,  'Los roles asignados no corresponden a las funciones del usuario o generan conflictos.')
    `, [catMap['1.3']]);

    // --- Correo Electrónico ---
    await pool.query(`
      INSERT INTO problems (category_id, code, name, priority, resolution_hours, description) VALUES
      ($1,'1.4.1','No recibe correos',             'Media Alta',6, 'Los correos enviados al usuario no llegan a su bandeja de entrada.'),
      ($1,'1.4.2','No puede enviar correos',       'Media Alta',6, 'El usuario no logra enviar mensajes, estos quedan en la bandeja de salida o se recibe error.'),
      ($1,'1.4.3','Cuenta saturada',               'Media',    8,  'El buzón de correo ha alcanzado su límite de capacidad y no acepta nuevos mensajes.'),
      ($1,'1.4.4','Adjuntos fallan',               'Media',    8,  'No es posible adjuntar o recibir archivos. Los adjuntos no se abren o se reciben dañados.'),
      ($1,'1.4.5','Spam excesivo',                 'Baja',    16,  'La bandeja recibe una cantidad anormal de correo no deseado que afecta la productividad.'),
      ($1,'1.4.6','Error de sincronización',       'Media',    8,  'El cliente de correo no sincroniza correctamente con el servidor, mostrando correos duplicados o desactualizados.'),
      ($1,'1.4.7','Outlook no abre',               'Media',    8,  'La aplicación de correo no inicia o se cierra inesperadamente al abrirla.'),
      ($1,'1.4.8','Correo bloqueado',              'Media Alta',6, 'Mensajes enviados son rechazados por el servidor destino o el dominio está en lista negra.'),
      ($1,'1.4.9','Problema IMAP/SMTP',            'Media Alta',6, 'Los protocolos de correo presentan errores de configuración o conexión.'),
      ($1,'1.4.10','Correos eliminados accidentalmente','Media',8, 'El usuario eliminó correos importantes y necesita recuperarlos.')
    `, [catMap['1.4']]);

    // --- Consulta General ---
    await pool.query(`
      INSERT INTO problems (category_id, code, name, priority, resolution_hours, description) VALUES
      ($1,'1.5.1','Dudas sobre sistemas',          'Baja',    24,  'El usuario tiene preguntas sobre el funcionamiento o uso de sistemas y aplicaciones institucionales.'),
      ($1,'1.5.2','Solicitud de capacitación',     'Baja',    48,  'Se requiere entrenamiento o capacitación en el uso de herramientas tecnológicas.'),
      ($1,'1.5.3','Información de servicios',      'Baja',    24,  'Consulta sobre los servicios de TI disponibles, horarios, contactos o procedimientos.'),
      ($1,'1.5.4','Consulta de procedimientos',    'Baja',    24,  'El usuario necesita conocer el proceso correcto para realizar una gestión de TI.'),
      ($1,'1.5.5','Reporte de mejora',             'Baja',    48,  'Sugerencia para mejorar un sistema, proceso o servicio tecnológico existente.'),
      ($1,'1.5.6','Solicitud de manuales',         'Baja',    48,  'Se requieren guías, tutoriales o documentación de uso de sistemas o equipos.'),
      ($1,'1.5.7','Asesoría técnica',              'Media',   16,  'El usuario necesita orientación especializada para resolver una situación técnica particular.'),
      ($1,'1.5.8','Estado de un ticket',           'Baja',    24,  'Consulta sobre el avance o estado actual de una solicitud de soporte previamente registrada.'),
      ($1,'1.5.9','Solicitud de instalación',      'Media',   16,  'Se requiere instalar software, configurar un equipo nuevo o instalar un periférico.'),
      ($1,'1.5.10','Consulta administrativa',      'Baja',    48,  'Preguntas relacionadas con procesos administrativos vinculados al área de TI.')
    `, [catMap['1.5']]);

    // --- Seed suggestions (auto-suggestions per problem) ---
    const { rows: allProbs } = await pool.query('SELECT id, code FROM problems ORDER BY id');
    const probMap = Object.fromEntries(allProbs.map(p => [p.code, p.id]));

    const suggestionsSeed = [
      // Infraestructura
      ['1.1.1',  'Verificar el estado del servidor en el panel de administración. Intentar reinicio controlado del servicio afectado. Revisar logs del sistema para identificar la causa raíz. Si el reinicio no resuelve, escalar al administrador de infraestructura de inmediato.'],
      ['1.1.2',  'Monitorear consumo de CPU, RAM y disco en el servidor. Identificar procesos que consuman recursos excesivos y evaluar si pueden terminarse. Revisar si hay actualizaciones pendientes o tareas programadas en ejecución. Considerar escalado de recursos si el problema es recurrente.'],
      ['1.1.3',  'Verificar el estado del servicio de base de datos (MySQL/PostgreSQL/MSSQL). Revisar logs de errores del motor de BD. Intentar reiniciar el servicio de forma controlada. Si hay corrupción de datos, activar el protocolo de restauración desde el último respaldo válido.'],
      ['1.1.4',  'Verificar estado de los switches y routers principales. Revisar si el problema es generalizado o afecta solo un segmento. Comprobar cables y conexiones físicas en el rack principal. Reiniciar equipos de red en orden: router → switch core → switches de acceso.'],
      ['1.1.5',  'Verificar que el servicio DNS esté activo en el servidor correspondiente. Intentar hacer flush del caché DNS en los equipos afectados (ipconfig /flushdns). Comprobar la configuración de los registros DNS. Si el problema persiste, configurar temporalmente DNS alternativo (8.8.8.8).'],
      ['1.1.6',  'Verificar que el servicio VPN esté activo en el servidor. Comprobar que las credenciales del usuario sean correctas y estén vigentes. Revisar las reglas del firewall que puedan estar bloqueando la conexión. Solicitar al usuario que descargue los logs de la aplicación VPN para diagnóstico.'],
      ['1.1.7',  'Verificar el estado del enlace WAN entre sedes (fibra, MPLS, SD-WAN). Contactar al proveedor de telecomunicaciones para reportar la incidencia. Activar el enlace de respaldo si existe. Notificar a los usuarios afectados con tiempo estimado de restablecimiento.'],
      ['1.1.8',  'Identificar el sistema afectado y verificar si el servidor está activo. Revisar si hay mantenimiento programado no comunicado. Comprobar conectividad y disponibilidad del servicio. Escalar inmediatamente al responsable del sistema y al administrador de infraestructura.'],
      ['1.1.9',  'AISLAR INMEDIATAMENTE los sistemas afectados de la red. Notificar al equipo de seguridad informática. No apagar los equipos para preservar evidencia. Activar el protocolo de respuesta a incidentes de seguridad. Documentar todo lo observado.'],
      ['1.1.10', 'Verificar el estado de los discos en el sistema RAID o gestor de almacenamiento. Revisar alertas de S.M.A.R.T. en los discos. Comprobar espacio disponible. Si hay riesgo de pérdida de datos, detener operaciones de escritura y escalar urgentemente al administrador.'],
      ['1.1.11', 'Revisar el monitoreo de recursos del servidor (Zabbix, Nagios, Grafana u otro). Identificar qué proceso o servicio está consumiendo más recursos. Evaluar si se puede reiniciar ese proceso. Planificar ampliación de capacidad si el problema es estructural.'],
      ['1.1.12', 'Revisar los logs del sistema de respaldo para identificar el error específico. Verificar espacio disponible en el destino del backup. Comprobar conectividad entre servidor origen y destino. Ejecutar el respaldo manualmente y verificar su éxito antes de la siguiente ventana programada.'],
      ['1.1.13', 'Verificar el estado de los UPS y tableros eléctricos. Contactar al área de mantenimiento o facilities. Si hay riesgo de corte, iniciar apagado controlado de servidores críticos. Documentar el incidente para el proveedor eléctrico.'],
      ['1.1.14', 'Acceder a la consola de administración del hipervisor (VMware, Hyper-V, Proxmox). Verificar el estado de las VMs afectadas. Revisar logs del hipervisor. Intentar reinicio de la VM desde la consola. Si el hipervisor no responde, escalar al administrador de virtualización.'],
      ['1.1.15', 'Verificar el estado del servidor web (Apache, Nginx, IIS). Revisar si el proceso del servidor web está activo. Comprobar certificados SSL si aplica. Revisar logs de acceso y error del servidor web para identificar la causa de la caída.'],
      // Soporte Técnico
      ['1.2.1',  'Reiniciar el equipo completamente. Verificar programas que inician con Windows y deshabilitar los innecesarios. Revisar el uso de disco y liberar espacio si está al límite. Ejecutar limpieza de archivos temporales. Si persiste, revisar posible presencia de malware.'],
      ['1.2.2',  'Verificar que el cable de alimentación esté bien conectado. Intentar encender con el cargador si es laptop. Revisar si hay luces LED o sonidos al presionar el botón. Si no hay respuesta alguna, probablemente requiere revisión de hardware por el técnico presencial.'],
      ['1.2.3',  'Anotar el código de error BSOD (STOP code). Reiniciar el equipo y ver si es recurrente. Si ocurrió tras una actualización, intentar desinstalarla desde Modo Seguro. Ejecutar sfc /scannow y chkdsk desde la línea de comandos como administrador.'],
      ['1.2.4',  'Desconectar y reconectar los periféricos. Probar con un puerto USB diferente. Reiniciar el equipo. Actualizar o reinstalar los controladores del teclado/mouse desde el Administrador de dispositivos. Probar con otro teclado/mouse para descartar falla de hardware.'],
      ['1.2.5',  'Verificar que la impresora esté encendida y conectada correctamente. Revisar la cola de impresión y cancelar trabajos atascados. Reiniciar el servicio de cola de impresión (spooler). Reinstalar los controladores de la impresora. Verificar nivel de tinta/tóner.'],
      ['1.2.6',  'Verificar que el dispositivo esté conectado y reconocido por el sistema. Revisar si la aplicación tiene permisos de acceso a la cámara/micrófono. Actualizar los controladores del dispositivo. Probar en otra aplicación para aislar si el problema es de hardware o de software.'],
      ['1.2.7',  'Verificar que el cable de red o Wi-Fi esté correctamente conectado. Reiniciar el adaptador de red. Ejecutar el solucionador de problemas de red de Windows. Probar con ping a la puerta de enlace. Si otros equipos tampoco tienen internet, escalar como problema de infraestructura.'],
      ['1.2.8',  'Olvidar la red Wi-Fi y volver a conectarse. Acercar el equipo al punto de acceso. Verificar si hay interferencias. Reiniciar el adaptador Wi-Fi. Actualizar los controladores de la tarjeta de red inalámbrica. Si el problema es generalizado, escalar a infraestructura.'],
      ['1.2.9',  'Verificar cuánto espacio libre hay en el disco (se necesita al menos 20% libre). Si la actualización quedó a medias, usar el Solucionador de problemas de Windows Update. Ejecutar sfc /scannow. Como último recurso, desinstalar la actualización problemática desde Configuración.'],
      ['1.2.10', 'Intentar cerrar y reabrir la aplicación. Reiniciar el equipo. Reparar la instalación desde Panel de Control → Programas. Si no funciona, desinstalar completamente y reinstalar. Verificar que la versión sea compatible con el sistema operativo.'],
      ['1.2.11', 'Abrir el Administrador de dispositivos y buscar dispositivos con advertencia (ícono amarillo). Hacer clic derecho → Actualizar controlador. Si falla la actualización automática, buscar el driver en el sitio oficial del fabricante. Reiniciar tras la actualización.'],
      ['1.2.12', 'Ejecutar inmediatamente un análisis completo con el antivirus institucional. Desconectar el equipo de la red si el antivirus detecta amenazas activas. No compartir archivos del equipo con otros. Notificar al área de TI para seguimiento y posible formateo del equipo.'],
      ['1.2.13', 'Verificar que los ventiladores del equipo estén funcionando y no tengan polvo acumulado. Asegurar que el equipo tenga ventilación adecuada. Revisar la pasta térmica si corresponde. Usar monitoreo de temperatura (HWMonitor). Si el problema persiste, requiere mantenimiento físico.'],
      ['1.2.14', 'Verificar que el volumen no esté silenciado. Comprobar las conexiones de los altavoces/audífonos. Revisar el Administrador de dispositivos para el dispositivo de audio. Actualizar los controladores de audio. Probar con otros altavoces/audífonos para descartar falla de hardware.'],
      ['1.2.15', 'Conectar el dispositivo USB en otro puerto. Verificar en el Administrador de dispositivos si aparece con error. Reinstalar el controlador USB si es necesario. Probar el dispositivo en otro equipo para verificar si el problema es del USB o del equipo. Revisar si los puertos USB están habilitados en la BIOS.'],
      // Accesos
      ['1.3.1',  'Usar la opción "¿Olvidaste tu contraseña?" del sistema si está disponible. Contactar al administrador de TI con tu nombre completo y área para restablecimiento de contraseña. Tener a mano tu correo institucional para recibir el enlace de restablecimiento.'],
      ['1.3.2',  'Esperar el tiempo de desbloqueo automático establecido por política (generalmente 30 minutos). Si es urgente, contactar al administrador de TI indicando tu usuario, nombre completo y área. El administrador puede desbloquear la cuenta manualmente desde la consola de administración.'],
      ['1.3.3',  'Verificar con tu supervisor si realmente necesitas ese acceso para tus funciones. Solicitar formalmente al administrador de TI el acceso indicando: recurso requerido, motivo y nombre de tu jefe inmediato como aval. El proceso puede requerir aprobación del área correspondiente.'],
      ['1.3.4',  'Verificar que estás usando las credenciales correctas (usuario y contraseña exactos). Asegurar que el CAPS LOCK esté desactivado. Intentar desde otro navegador o dispositivo. Si el problema persiste con credenciales correctas, escalar a soporte de TI para revisión del sistema.'],
      ['1.3.5',  'Cerrar completamente el navegador o aplicación y volver a intentar. Limpiar caché y cookies del navegador. Verificar que la fecha y hora del equipo sean correctas (afecta certificados). Si usas VPN, verificar que esté activa. Intentar desde otra red si es posible.'],
      ['1.3.6',  'Verificar que la aplicación de autenticación (Google Authenticator, Microsoft Authenticator) esté sincronizada. Comprobar que la hora del teléfono sea correcta (zona horaria). Si el código SMS no llega, verificar cobertura. Contactar al administrador para restablecer el MFA si ninguna opción funciona.'],
      ['1.3.7',  'Las cuentas se deshabilitan automáticamente por inactividad prolongada o por solicitud de Recursos Humanos. Contactar al administrador de TI con tu nombre completo, área y correo institucional para solicitar la reactivación. Puede requerirse autorización de tu jefe directo.'],
      ['1.3.8',  'Verificar que el token/tarjeta esté correctamente insertado o conectado. Probar en otro equipo para descartar falla del lector. Revisar que los drivers del lector estén actualizados. Si el token está dañado o vencido, solicitar renovación al área de seguridad informática.'],
      ['1.3.9',  'Verificar que el sistema esté operativo (no en mantenimiento). Comprobar conectividad de red desde el equipo. Intentar desde otro equipo o navegador. Si el problema es solo con tu usuario, puede ser un problema de cuenta; contacta al administrador con tu información completa.'],
      ['1.3.10', 'Documentar qué acceso tienes y qué acceso necesitas. Contactar al administrador de TI para revisión de roles. El ajuste de roles puede requerir aprobación del responsable del área. Evitar compartir credenciales de otros usuarios como solución temporal.'],
      // Correo Electrónico
      ['1.4.1',  'Revisar la carpeta de Spam/Correo no deseado. Verificar que el remitente no esté bloqueado. Comprobar las reglas de correo que podrían estar moviendo mensajes automáticamente. Verificar que el buzón no esté lleno. Si el problema persiste, contactar al administrador de correo con ejemplos de mensajes no recibidos.'],
      ['1.4.2',  'Verificar la conexión a internet del equipo. Revisar la configuración del servidor de salida (SMTP). Comprobar si hay mensajes de error específicos al enviar. Verificar que la cuenta no esté bloqueada para envíos. Intentar enviar un correo de prueba a una dirección interna primero.'],
      ['1.4.3',  'Revisar el uso actual del buzón en la configuración de la cuenta. Eliminar correos antiguos, especialmente los que tienen adjuntos grandes. Vaciar la papelera y elementos eliminados. Solicitar al administrador el incremento de cuota si es necesario para las funciones del cargo.'],
      ['1.4.4',  'Verificar el tamaño del adjunto (la mayoría de servidores tienen límite de 25 MB). Comprimir el archivo antes de adjuntarlo. Si el archivo es muy grande, usar una unidad compartida o sistema de transferencia de archivos institucional. Verificar que el formato del archivo no esté bloqueado por el servidor.'],
      ['1.4.5',  'Marcar los correos spam como "No deseado" para entrenar el filtro. Verificar y ajustar las reglas de filtrado de spam. No hacer clic en enlaces de correos sospechosos. Reportar al administrador si el spam es excesivo para que refuerce las reglas del servidor de correo.'],
      ['1.4.6',  'Cerrar y reabrir el cliente de correo. Verificar la conectividad con el servidor de correo. Revisar la configuración de la cuenta (IMAP/Exchange). Intentar sincronización manual. Si hay correos duplicados, puede ser necesario recrear el perfil de Outlook.'],
      ['1.4.7',  'Cerrar completamente Outlook desde el Administrador de tareas. Abrir Outlook en modo seguro (outlook.exe /safe). Si funciona en modo seguro, deshabilitar complementos. Reparar la instalación de Office desde Panel de Control. Como último recurso, recrear el perfil de Outlook.'],
      ['1.4.8',  'Verificar si el problema es con destinatarios externos específicos o general. El administrador debe revisar si el dominio está en alguna lista negra (RBL). Verificar la configuración SPF, DKIM y DMARC del dominio. Contactar al proveedor de correo para gestionar la salida de listas negras.'],
      ['1.4.9',  'Verificar la configuración del servidor entrante (IMAP: puerto 993/SSL o 143/STARTTLS) y saliente (SMTP: puerto 587/STARTTLS o 465/SSL). Asegurar que el servidor de correo esté en la lista de aplicaciones permitidas del firewall. Confirmar credenciales con el administrador.'],
      ['1.4.10', 'Revisar la carpeta "Elementos eliminados" o "Papelera". En Outlook/Exchange, usar "Recuperar elementos eliminados" que puede tener correos hasta 30 días. Contactar al administrador de correo para recuperación desde respaldo del servidor si los correos son críticos.'],
      // Consulta General
      ['1.5.1',  'Te recomendamos revisar el portal de documentación institucional donde encontrarás manuales y guías actualizadas. Si tienes dudas específicas, puedes solicitarlas en este ticket detallando el sistema o función sobre la que necesitas información.'],
      ['1.5.2',  'Hemos registrado tu solicitud de capacitación. El equipo de TI coordinará una sesión según disponibilidad. Por favor incluye en la descripción el sistema o herramienta sobre la que requieres formación y el número aproximado de personas que necesitan la capacitación.'],
      ['1.5.3',  'Puedes consultar el catálogo de servicios de TI en el portal institucional. Si no encuentras la información que buscas, nuestro equipo te responderá con los detalles del servicio que consultas.'],
      ['1.5.4',  'Describe el procedimiento que necesitas realizar y te orientaremos. Puedes también consultar la sección de procedimientos en el portal de TI donde documentamos los procesos más frecuentes.'],
      ['1.5.5',  'Gracias por tu sugerencia de mejora. El equipo de TI la revisará y evaluará su viabilidad e impacto. Te informaremos sobre la decisión tomada. Este tipo de retroalimentación es muy valiosa para mejorar nuestros servicios.'],
      ['1.5.6',  'Hemos registrado tu solicitud de manuales. Los documentaremos y enviaremos al correo registrado en tu cuenta. Si necesitas documentación urgente, indícalo en la descripción del ticket.'],
      ['1.5.7',  'Un especialista de TI revisará tu caso y se pondrá en contacto contigo. Para agilizar la atención, describe con el mayor detalle posible la situación técnica que enfrentas: qué intentas hacer, qué resultado obtienes y qué pasos ya intentaste.'],
      ['1.5.8',  'Puedes consultar el estado de tus tickets anteriores en el sistema de gestión. Si necesitas información específica sobre un ticket, proporciona el número o descripción del mismo en este ticket.'],
      ['1.5.9',  'Hemos registrado tu solicitud de instalación. Un técnico se pondrá en contacto para coordinar la instalación. Describe el software o equipo que necesitas instalar, el equipo donde se instalará y el uso que le darás.'],
      ['1.5.10', 'Tu consulta ha sido registrada. El área administrativa de TI revisará tu caso y te responderá con la información o los pasos a seguir. Describe con detalle tu consulta para que podamos darte una respuesta precisa.'],
    ];

    for (const [code, content] of suggestionsSeed) {
      const probId = probMap[code];
      if (probId) {
        await pool.query(
          'INSERT INTO suggestions (problem_id, content) VALUES ($1, $2)',
          [probId, content]
        );
      }
    }

    console.log('✅ Categorías, problemas y sugerencias insertados');
  }

  // --- Default admin user ---
  const { rows: admins } = await pool.query(
    "SELECT id FROM users WHERE email = 'admin@empresa.com'"
  );
  if (admins.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, name, role, area, is_primary_admin)
       VALUES ('admin@empresa.com', $1, 'Administrador TI', 'admin', 'TI', TRUE)`,
      [hash]
    );
    console.log('✅ Admin creado → admin@empresa.com / admin123');
  } else {
    // Ensure the first admin is marked as primary
    await pool.query(
      `UPDATE users SET is_primary_admin = TRUE WHERE email = 'admin@empresa.com' AND (is_primary_admin IS NULL OR is_primary_admin = FALSE)`
    );
  }

  console.log('✅ Base de datos lista');
};

module.exports = { pool, initDb };
