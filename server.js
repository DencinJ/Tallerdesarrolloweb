const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/fukusukeDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error de conexión:', err));

  const Cliente = mongoose.model('Cliente', new mongoose.Schema({
    nombre: String,
    email: {
      type: String,
      unique: true, // 👈 Esto asegura que sea único
      required: true
    },
    telefono: String,
    direccion: String,
    password: String,
  }));

Cliente.init().then(() => {
  console.log('✅ Índices asegurados en MongoDB');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'registro.html'));
});
// Mostrar formulario de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Validar login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const cliente = await Cliente.findOne({ email });

  if (!cliente) {
    return res.status(400).json({ error: 'Correo no registrado' });
  }

  if (cliente.password !== password) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  res.status(200).json({ mensaje: 'Inicio de sesión correcto', nombre: cliente.nombre });
});

app.post('/registrar', async (req, res) => {
  console.log('📩 Datos recibidos:', req.body);

  try {
    // Verificar si el correo ya está registrado
    const clienteExistente = await Cliente.findOne({ email: req.body.email });

    if (clienteExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const nuevoCliente = new Cliente(req.body);
    const resultado = await nuevoCliente.save();

    console.log('✅ Cliente guardado:', resultado);
    res.status(200).json({ mensaje: 'Cliente registrado correctamente' });

  } catch (error) {
    console.error('❌ Error al guardar en MongoDB:', error);
    res.status(500).json({ error: 'Error al registrar cliente' });
  }
});
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});