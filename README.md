# ⚙️ TallerPro - Sistema de Gestión para Talleres de Soporte Técnico

TallerPro es una aplicación de escritorio moderna, rápida y minimalista diseñada específicamente para técnicos de hardware, especialistas en micro-soldadura e informáticos que necesitan gestionar clientes, órdenes de trabajo, finanzas e historiales de reparación sin complicaciones.

Desarrollada sobre **Electron** utilizando un motor de base de datos relacional **SQLite (`sql.js`)** que trabaja completamente local y en segundo plano.

## 🚀 Características Clave

- **Dashboard Automatizado:** Control de estadísticas en tiempo real (Ingresos del mes, trabajos diarios, flujo de clientes).
- **Gestión Blindada de Clientes:** Registro detallado con números de contacto y bases de datos históricas por usuario.
- **Órdenes de Trabajo Avanzadas:** Control del dispositivo, descripción de la falla, soluciones aplicadas y almacenamiento seguro de credenciales/cuentas asociadas al equipo.
- **Módulo de Finanzas Integrado:** Soporte para pagos en efectivo o transferencias con cálculo automático de comisiones bancarias.
- **Arquitectura Local Silenciosa:** La base de datos guarda la información de manera asíncrona para liberar el hilo principal de la interfaz, asegurando transiciones fluidas a 60 FPS.

## 🛠️ Stack Tecnológico

- **Frontend:** HTML5, CSS3 (Variables nativas, diseño responsivo adaptado a taller), JavaScript (ES6+).
- **Backend / Runtime:** Node.js & Electron.
- **Base de Datos:** SQLite via `sql.js` (Estructura relacional empaquetada e indexada).
- **Compilador:** Electron-Builder (Configurado para empaquetado NSIS optimizado para Windows x64).

## 📦 Instalación en Desarrollo

Si deseas clonar el proyecto y ejecutarlo en tu entorno local, asegúrate de tener [Node.js](https://nodejs.org/) instalado y corre:

```bash
# 1. Clonar el repositorio
git clone [https://github.com/ShiroUzU0208/Gestion-De-talleres.git](https://github.com/ShiroUzU0208/Gestion-De-talleres.git)

# 2. Entrar a la carpeta del proyecto
cd Gestion-De-talleres

# 3. Instalar las dependencias de producción y desarrollo
npm install

# 4. Lanzar la aplicación en modo desarrollo
npm start
