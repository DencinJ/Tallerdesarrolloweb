const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/fukusukeDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error de conexión:', err));

// Modelo Cliente
const Cliente = mongoose.model('Cliente', new mongoose.Schema({
  nombre: String,
  email: {
    type: String,
    unique: true,
    required: true
  },
  telefono: String,
  direccion: String,
  password: String,
}));

Cliente.init().then(() => {
  console.log('✅ Índices asegurados en MongoDB');
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'fukusuke_sushi_session_secret',
  resave: false,
  saveUninitialized: true
}));

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
    const clienteExistente = await Cliente.findOne({ email: req.body.email });

    if (clienteExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();

    res.status(200).json({ mensaje: 'Cliente registrado correctamente' });
  } catch (error) {
    console.error('❌ Error al guardar en MongoDB:', error);
    res.status(500).json({ error: 'Error al registrar cliente' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const cliente = await Cliente.findOne({ email });

  if (!cliente) {
    return res.status(400).json({ error: 'Correo no registrado' });
  }

  if (cliente.password !== password) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  req.session.usuario = cliente.nombre;
  res.status(200).json({ mensaje: 'Inicio de sesión correcto', nombre: cliente.nombre });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
