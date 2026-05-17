Gestión de Reparaciones

App de escritorio para gestionar clientes y trabajos de tu taller de telefonía y memorias USB.

---

## Instalación (solo la primera vez)

##Instalar Node.js
Ve a https://nodejs.org y descarga la versión LTS (el botón verde grande).
Instálalo normalmente: siguiente → siguiente → finalizar.

##Instalar la app
Haz doble clic en el archivo instalar.bat
Espera a que termine (puede tardar 1-2 minutos).

##Iniciar
Abre una terminal en esta carpeta y escribe:
  npm start

---

## Estructura del proyecto

gestion-taller/
├── main.js          ← proceso principal + base de datos
├── preload.js       ← puente seguro entre interfaz y datos
├── package.json     ← configuración del proyecto
├── instalar.bat     ← instalador para Windows
└── src/
    ├── index.html   ← interfaz principal
    ├── styles.css   ← estilos
    └── app.js       ← lógica de la interfaz

---

## Dónde se guardan los datos

Los datos se guardan automáticamente en:
  C:\Users\TuUsuario\AppData\Roaming\gestion-taller\taller.db

Para hacer copias de seguridad, copia ese archivo .db a un lugar seguro.

---

## Notas importantes

- El campo de Conformidad se bloquea permanentemente al guardar. No hay forma de modificarlo después.
- Las contraseñas de cuentas de clientes se guardan en texto plano en la base de datos local.
- Solo funciona en Windows con Node.js instalado.
