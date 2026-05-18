⚙️ TallerPro - Sistema de Gestión para Talleres de Soporte Técnico

TallerPro es una aplicación de escritorio moderna, rápida y minimalista diseñada específicamente para técnicos de hardware, especialistas en micro-soldadura e informáticos que necesitan gestionar clientes, órdenes de trabajo, finanzas e historiales de reparación sin complicaciones.

Desarrollada sobre Electron utilizando un motor de base de datos relacional SQLite (sql.js) que trabaja completamente local y en segundo plano.

🚀 Características Clave

Dashboard Automatizado: Control de estadísticas en tiempo real (Ingresos del mes, trabajos diarios, flujo de clientes).

Gestión Blindada de Clientes: Registro detallado con números de contacto y bases de datos históricas por usuario.

Órdenes de Trabajo Avanzadas: Control del dispositivo, descripción de la falla, soluciones aplicadas y almacenamiento seguro de credenciales/cuentas asociadas al equipo.

Módulo de Finanzas Integrado: Soporte para pagos en efectivo o transferencias con cálculo automático de comisiones bancarias.

Arquitectura Local Silenciosa: La base de datos guarda la información de manera asíncrona para liberar el hilo principal de la interfaz, asegurando transiciones fluidas a 60 FPS.

🎨 Personalización del Icono de la Aplicación

El sistema utiliza un icono personalizado para el ejecutable y las ventanas de instalación, el cual se gestiona directamente desde los recursos del proyecto:

Ubicación del recurso: El archivo de imagen se encuentra estrictamente en la ruta assets/icon.ico.

¿Cómo cambiar el icono? Si deseas modificar el logotipo de la aplicación para adaptarlo con la marca de tu propio taller, simplemente reemplaza el archivo existente por tu nuevo diseño.

⚠️ Requisitos Críticos del Archivo:

Debe tener obligatoriamente el formato .ico (no sirve renombrar un archivo .png o .jpg, es indispensable convertirlo con una herramienta de diseño real).

La resolución idónea e indispensable para que Windows no rompa la compilación o distorsione el acceso directo es de 256x256 píxeles.

🏗️ Compilación y Creación del Instalador (.exe)

El código fuente de este repositorio no es solo para ejecutar en modo desarrollo; ya incluye toda la infraestructura y configuración de empaquetado necesaria para compilar la aplicación en un instalador nativo de Windows (.exe) ejecutable en entornos de producción independientes (sin necesidad de tener Node.js instalado en la máquina cliente).

Gracias a la integración de electron-builder en la raíz del código, el sistema está estructurado para generar un instalador tipo NSIS (asistente de instalación guiado) que permite al usuario final:

Elegir la ruta de instalación en su disco duro.

Crear accesos directos automáticos en el Escritorio.

Registrar el software en el Menú de Inicio de Windows.

Para compilar el código y generar este instalador ejecutable autónomo, solo debes ejecutar el comando de producción en tu terminal:

npm run build


Una vez finalizado el empaquetado, el instalador final (TallerPro Setup X.X.X.exe) aparecerá automáticamente dentro de la carpeta local /dist con el icono de los assets incrustado de forma nativa.

🛠️ Stack Tecnológico

Frontend: HTML5, CSS3 (Variables nativas, diseño estilo terminal adaptado a taller), JavaScript (ES6+).

Backend / Runtime: Node.js & Electron.

Base de Datos: SQLite via sql.js (Estructura relacional empaquetada e indexada).

Compilador: Electron-Builder (Configurado para empaquetado NSIS optimizado para Windows x64).

📦 Instalación en Desarrollo

Si deseas clonar el proyecto y ejecutarlo en tu entorno local para modificar código, asegúrate de tener Node.js instalado y corre los siguientes comandos:

# 1. Clonar el repositorio
git clone [https://github.com/ShiroUzU0208/Gestion-De-talleres.git](https://github.com/ShiroUzU0208/Gestion-De-talleres.git)

# 2. Entrar a la carpeta del proyecto
cd Gestion-De-talleres

# 3. Instalar las dependencias de producción y desarrollo
npm install

# 4. Lanzar la aplicación en modo desarrollo
npm start


Desarrollado con 💻 por Carlos (ShiroUzU)
