const express = require('express');
const app = express();
const session = require('express-session');
const { Pool } = require('pg');
const path = require('path');



// Middleware para registrar todas las solicitudes entrantes
app.use((req, res, next) => {
    console.log(`Request URL: ${req.url}`);
    next();
  });





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
app.use(express.urlencoded({ extended: true }));




//  archivos estáticos para que express los pueda usar
app.use(express.static(path.join(__dirname, '../')));
app.use('/css', express.static(__dirname + '/../css'));
app.use('/images', express.static(__dirname + '/../images'));
app.use('/scripts', express.static(__dirname + '/../scripts'));
app.use('/vectors', express.static(path.join(__dirname, '../vectors')));

// HTML principal para que se se abra en localhost
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/../main.html'));
});

// Configurar la sesión
app.use(session({
    secret: 'mi_secreto_de_prueba', // Cambia esto por una cadena secreta segura en producción
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Asegúrate de usar secure: true en producción con HTTPS
}));



// Ruta para manejar el login
app.post('/login', async (req, res) => {
    const { correo, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuario WHERE correo = $1 AND contrasena = $2', [correo, password]);
        if (result.rows.length > 0) {
            req.session.user = result.rows[0]; // Establece la sesión de usuario
            console.log('Usuario logueado:', req.session.user); // Agrega un console.log para verificar
            res.json({ success: true, tipoUsuario: req.session.user.tipo });
        } else {
            res.json({ success: false, message: 'Correo o contraseña incorrectos' });
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

// Ruta para manejar el formulario de ingreso de patente y modelo
app.post('/ingresar-vehiculo', async (req, res) => {
    const { patente, modelo, tipoVehiculo } = req.body;

    console.log('Datos recibidos del formulario:', req.body);

    try {
        const idTipoVehiculo = parseInt(tipoVehiculo, 10);
        
        if (isNaN(idTipoVehiculo)) {
            throw new Error('El valor de tipoVehiculo no es un número válido.');
        }

        // Insertar en la tabla Vehículo
        const vehiculoResult = await pool.query(
            'INSERT INTO Vehiculo (Patente, Descripcion, ID_Tipo_V) VALUES ($1, $2, $3) RETURNING Patente',
            [patente, modelo, idTipoVehiculo]
        );

        const vehiculoPatente = vehiculoResult.rows[0].patente;

        // Verifica si req.session.user está definido
        if (!req.session.user) {
            throw new Error('Usuario no autenticado');
        }

        // Insertar en la tabla Registra
        await pool.query(
            'INSERT INTO Registra (ID_Usuario, ID_Vehiculo) VALUES ($1, $2)',
            [req.session.user.correo, vehiculoPatente]
        );

       // Devuelve éxito y la patente del vehículo registrado
       res.json({ success: true, patente: vehiculoPatente });

    } catch (error) {
        console.error('Error al ingresar vehículo:', error.message);
        res.status(500).json({ success: false, message: 'Error interno al procesar la solicitud' }); // Devuelve un error interno del servidor
    }
});

// Ruta para obtener vehículos registrados por un usuario para la página de seleccionar matrícula
app.get('/getVehicles', async (req, res) => {
    const correoUsuario = req.session.user.correo; // Suponiendo que el correo del usuario está almacenado en req.session.user
    console.log('Correo del usuario:', correoUsuario); // Verificar el valor de req.session.user
    if (!correoUsuario) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    try {
        const result = await pool.query(
            `SELECT v.patente 
             FROM Vehiculo v
             JOIN Registra r ON v.Patente = r.ID_Vehiculo
             WHERE r.ID_Usuario = $1`,
            [correoUsuario]
        );
        console.log('Vehículos obtenidos:', result.rows); // Verificar los resultados de la consulta
        res.json({ success: true, vehicles: result.rows });
    } catch (error) {
        console.error('Error al obtener vehículos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener vehículos' });
    }
});


// Ruta para obtener estacionamientos según campus y lugarCampus-------------------------------------
app.get('/getEstacionamientos', async (req, res) => {
    const { campus, lugarCampus } = req.query;
    console.log(`[${new Date().toLocaleString()}] Valores recibidos - campus: ${campus}, lugarCampus: ${lugarCampus}`);

    try {
        // Consulta SQL para obtener los estacionamientos según campus y lugarCampus
        const result = await pool.query(
            `SELECT ID_Estacionamiento
             FROM Estacionamiento
             WHERE ID_Campus = $1 AND ID_Lugar = $2`,
            [campus, lugarCampus]
        );
        console.log(`[${new Date().toLocaleString()}] Estacionamientos obtenidos:`, result.rows); // Logging de resultados
        res.json({ success: true, estacionamientos: result.rows });
    } catch (error) {
        console.error('Error al obtener estacionamientos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estacionamientos' });
    }
});


// Ruta para reservar el estacionamiento ------------------------------------------
app.post('/reservarEstacionamientoFinal', async (req, res) => {
    const { estacionamiento, selectedFecha, selectedHoraEntrada, selectedHoraSalida, selectedVehicle } = req.body;
    const userCorreo = req.session.user ? req.session.user.correo : null;

    if (!userCorreo) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!selectedFecha || !selectedHoraEntrada || !selectedHoraSalida || !estacionamiento || !selectedVehicle) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    const reservaData = {
        fecha_reserva: selectedFecha,
        ID_Usuario: userCorreo,
        ID_Estacionamiento: estacionamiento
    };

    const ocupaData = {
        Fecha_Entrada: selectedHoraEntrada,
        Fecha_Salida: selectedHoraSalida,
        Estado: true,
        ID_Estacionamiento: estacionamiento,
        ID_Vehiculo: selectedVehicle
    };

    try {
        // Realizar transacción en la base de datos
        await pool.query('BEGIN');
        await pool.query('INSERT INTO Reserva (fecha_reserva, ID_Usuario, ID_Estacionamiento) VALUES ($1, $2, $3)',
            [reservaData.fecha_reserva, reservaData.ID_Usuario, reservaData.ID_Estacionamiento]);
        await pool.query('INSERT INTO Ocupa (Fecha_Entrada, Fecha_Salida, Estado, ID_Estacionamiento, ID_Vehiculo) VALUES ($1, $2, $3, $4, $5)',
            [ocupaData.Fecha_Entrada, ocupaData.Fecha_Salida, ocupaData.Estado, ocupaData.ID_Estacionamiento, ocupaData.ID_Vehiculo]);
        await pool.query('COMMIT');
        res.status(200).json({ message: 'Reserva y ocupación registradas con éxito' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error al registrar reserva y ocupación:', error);
        res.status(500).json({ error: 'Error al registrar la reserva y ocupación' });
    }
});


//---------------------------------------------------------------------------------------------

//------------Para verificar sesion---------
app.get('/verificarSesion', (req, res) => {
    if (req.session.user) {
        const tipoUsuario = req.session.user.tipo;
        if (tipoUsuario === 'Guardia' || tipoUsuario === 'Administrador') {
            res.json({ autenticado: true, tipo: tipoUsuario });
        } else {
            res.json({ autenticado: false, mensaje: 'Acceso denegado para este tipo de usuario' });
        }
    } else {
        res.json({ autenticado: false, mensaje: 'Usuario no autenticado' });
    }
});
//--------------------------------


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

// Ruta de prueba para verificar la sesión
app.get('/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Ruta para ver todos los registros de la tabla Registra
app.get('/registros', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM registra');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ error: 'Error al obtener registros' });
    }
});

// Más rutas pronto

// Iniciar el servidor
const puerto = 3000; 
app.listen(puerto, () => {
    console.log(`Servidor Express escuchando en el puerto ${puerto}`);
});