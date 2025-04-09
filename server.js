const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// Compresión de respuestas
app.use(compression());

// Limitar solicitudes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente en 15 minutos'
});

app.use('/api/', limiter);

// Conexión a MongoDB con opciones optimizadas
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fukusukeDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
}).then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error de conexión:', err));

// Modelo Cliente con validaciones
const Cliente = mongoose.model('Cliente', new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'El correo es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un correo válido']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true,
    match: [/^[0-9+\-\s()]{8,15}$/, 'Por favor ingrese un teléfono válido']
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true }));

// Índices para mejorar el rendimiento de las consultas
Cliente.init().then(() => {
  console.log('✅ Índices asegurados en MongoDB');
});

// Middleware
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));

// Configuración de sesión con opciones de seguridad
app.use(session({
  secret: process.env.SESSION_SECRET || 'fukusuke_sushi_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 día
  }
}));

// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
  if (req.session.usuario) {
    next();
  } else {
    res.status(401).json({ error: 'No autorizado' });
  }
};

// Rutas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'registro.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/inicio', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'inicio.html'));
});

// API: obtener nombre de usuario logueado
app.get('/usuario', (req, res) => {
  if (req.session.usuario) {
    res.json({ nombre: req.session.usuario });
  } else {
    res.json({});
  }
});

// Registro
app.post('/registrar', async (req, res) => {
  try {
    const { nombre, email, telefono, direccion, password } = req.body;
    
    // Validación detallada de la contraseña
    const passwordErrors = [];
    
    if (password.length < 8) {
      passwordErrors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('La contraseña debe contener al menos una letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('La contraseña debe contener al menos un número');
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      passwordErrors.push('La contraseña debe contener al menos un carácter especial');
    }
    
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: passwordErrors.join(', ') });
    }
    
    // Verificar si el correo ya existe
    const clienteExistente = await Cliente.findOne({ email });

    if (clienteExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo cliente
    const nuevoCliente = new Cliente({
      nombre,
      email,
      telefono,
      direccion,
      password: hashedPassword
    });
    
    await nuevoCliente.save();

    res.status(200).json({ mensaje: 'Cliente registrado correctamente' });
  } catch (error) {
    console.error('❌ Error al guardar en MongoDB:', error);
    
    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: mensajes.join(', ') });
    }
    
    res.status(500).json({ error: 'Error al registrar cliente. Por favor, intente nuevamente.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const cliente = await Cliente.findOne({ email });

    if (!cliente) {
      return res.status(400).json({ error: 'Correo no registrado' });
    }

    // Verificar contraseña
    const esValida = await bcrypt.compare(password, cliente.password);

    if (!esValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    req.session.usuario = cliente.nombre;
    res.status(200).json({ mensaje: 'Inicio de sesión correcto', nombre: cliente.nombre });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Error al cerrar sesión:', err);
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.redirect('/login');
  });
});

// Ruta protegida de ejemplo
app.get('/api/perfil', isAuthenticated, (req, res) => {
  res.json({ mensaje: 'Perfil de usuario', usuario: req.session.usuario });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
