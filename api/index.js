const express = require('express');
const app = express();
const { Pool } = require('pg');
const path = require('path');


//conexión a la base de datos
const pool = new Pool({
    user: 'postgres',
    password: 'mere1',
    host: 'localhost', 
    database: 'parkingtest',
    port: 5432, 
});

// para parsear JSON
app.use(express.json());


//  archivos estáticos para que express los pueda usar
app.use('/css', express.static(__dirname + '/../css'));
app.use('/images', express.static(__dirname + '/../images'));
app.use('/scripts', express.static(__dirname + '/../scripts'));

// HTML principal para que se se abra en localhost
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/../main.html'));
});

// Ruta para manejar el login
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE telefono = $1 AND contrasena = $2', [phone, password]);
        if (result.rows.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Teléfono o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error al realizar el login:', error);
        res.status(500).json({ success: false, message: 'Error al realizar el login' });
    }
});

// Ruta para registrar usuario
app.post('/register', async (req, res) => {
    const { nombre, phone, password, tipo, correo} = req.body;
    try {
        await pool.query(
            'INSERT INTO usuario (nombre,telefono,tipo,contrasena,correo) VALUES ($1, $2, $3, $4, $5)',
            [nombre, phone, tipo, password, correo]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al registrar usuario' });
    }
});



// para ver la tabla usaurios
app.get('/usuario', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuario');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});



// Más rutas pronto

// Iniciar el servidor
const puerto = 3000; 
app.listen(puerto, () => {
    console.log(`Servidor Express escuchando en el puerto ${puerto}`);
});