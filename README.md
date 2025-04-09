# Fukusuke Sushi - Sistema de Registro de Clientes

Sistema web para el registro y gestión de clientes del restaurante Fukusuke Sushi, desarrollado con Node.js, Express y MongoDB.

## Características

- Registro de clientes con validación de datos
- Inicio de sesión seguro con contraseñas encriptadas
- Interfaz responsiva para dispositivos móviles y de escritorio
- Validación de contraseñas en tiempo real
- Protección contra ataques comunes (XSS, CSRF, etc.)
- Compresión de respuestas para mejorar el rendimiento
- Limitación de solicitudes para prevenir abusos

## Tecnologías utilizadas

- **Backend**: Node.js, Express
- **Base de datos**: MongoDB con Mongoose
- **Frontend**: HTML, CSS, JavaScript
- **Seguridad**: Helmet, bcrypt, express-rate-limit
- **Optimización**: Compression

## Requisitos previos

- Node.js (versión 14 o superior)
- MongoDB (versión 4.4 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/tu-usuario/fukusuke-sushi.git
   cd fukusuke-sushi
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Crear archivo .env en la raíz del proyecto con las siguientes variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/fukusukeDB
   SESSION_SECRET=tu_secreto_de_sesion
   NODE_ENV=development
   ```

4. Iniciar el servidor:
   ```
   npm run dev
   ```

5. Acceder a la aplicación en `http://localhost:3000`

## Estructura del proyecto

```
fukusuke-sushi/
├── node_modules/
├── public/
│   ├── estilos.css
│   └── img/
├── views/
│   ├── inicio.html
│   ├── login.html
│   └── registro.html
├── .env
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Seguridad

- Las contraseñas se almacenan encriptadas con bcrypt
- Se implementa protección contra ataques XSS y CSRF
- Se limita el número de solicitudes por IP
- Se utilizan cookies seguras para las sesiones
- Se implementa CSP (Content Security Policy)

## Optimización

- Compresión de respuestas HTTP
- Caché de archivos estáticos
- Índices en MongoDB para consultas eficientes
- Validación de datos en el servidor y cliente
- Diseño responsivo para todos los dispositivos

## Contribución

1. Hacer fork del repositorio
2. Crear una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Hacer commit de tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Hacer push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC.

## Contacto

Para cualquier consulta o sugerencia, por favor contacta a [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com). 