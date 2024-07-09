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
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
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
//--------------------------OBTENER LA RESERVA DEL USUARIO ACTIVO O LOGUEADO
app.get('/obtenerMiReservaActiva', (req, res) => {
    const correoUsuario = req.session.user.correo;

    const query = `
        SELECT 
            o.ID_Estacionamiento,
            o.ID_Vehiculo,
            o.Fecha_Entrada,
            o.Fecha_Salida,
            o.Estado,
            r.fecha_reserva,
            u.Nombre AS Usuario_Nombre,
            u.Correo AS Usuario_Correo,
            u.Tipo AS Usuario_Tipo,
            cs.Nombre AS Campus_Nombre,
            v.Descripcion AS Vehiculo_Descripcion,
            v.Año AS Vehiculo_Año,
            tv.Nombre AS Tipo_Vehiculo,
            le.Descripcion AS Lugar_Estacionamiento_Descripcion
        FROM 
            Ocupa o
        JOIN 
            Reserva r ON o.ID_Estacionamiento = r.ID_Estacionamiento
        JOIN 
            Usuario u ON r.ID_Usuario = u.Correo
        JOIN 
            Estacionamiento e ON r.ID_Estacionamiento = e.ID_Estacionamiento
        JOIN 
            Campus_Sede cs ON e.ID_Campus = cs.ID_Campus
        JOIN 
            Vehiculo v ON o.ID_Vehiculo = v.Patente
        JOIN 
            Tipo_Vehiculo tv ON v.ID_Tipo_V = tv.ID_Tipo_V
        JOIN 
            Lugar_Estacionamiento le ON e.ID_Lugar = le.ID_Lugar
        WHERE 
            o.Estado = true
            AND u.Correo = $1;
    `;
    
    pool.query(query, [correoUsuario], (error, result) => {
        if (error) {
            console.error('Error al obtener la reserva activa del usuario:', error);
            res.status(500).json({ error: 'Error al obtener la reserva activa del usuario' });
        } else {
            res.status(200).json(result.rows);
        }
    });
});


//-------TODO LO QUE CORRESPONDE A CONSULTAS DE ADMIN Y GUARDIAS-------------------------------------------
// Ruta para obtener reservas activas-------------------------------
app.get('/obtenerReservasActivas', async (req, res) => {
    try {
        const consulta = `
            SELECT 
                o.ID_Estacionamiento,
                o.ID_Vehiculo,
                o.Fecha_Entrada,
                o.Fecha_Salida,
                o.Estado,
                r.fecha_reserva,
                u.Nombre AS Usuario_Nombre,
                u.Correo AS Usuario_Correo,
                u.Tipo AS Usuario_Tipo,
                cs.Nombre AS Campus_Nombre,
                v.Descripcion AS Vehiculo_Descripcion,
                v.Año AS Vehiculo_Año,
                tv.Nombre AS Tipo_Vehiculo,
                le.Descripcion AS Lugar_Estacionamiento_Descripcion
            FROM 
                Ocupa o
            JOIN 
                Reserva r ON o.ID_Estacionamiento = r.ID_Estacionamiento
            JOIN 
                Usuario u ON r.ID_Usuario = u.Correo
            JOIN 
                Estacionamiento e ON r.ID_Estacionamiento = e.ID_Estacionamiento
            JOIN 
                Campus_Sede cs ON e.ID_Campus = cs.ID_Campus
            JOIN 
                Vehiculo v ON o.ID_Vehiculo = v.Patente
            JOIN 
                Tipo_Vehiculo tv ON v.ID_Tipo_V = tv.ID_Tipo_V
            JOIN 
                Lugar_Estacionamiento le ON e.ID_Lugar = le.ID_Lugar
            WHERE 
                o.Estado = true;
        `;

        const resultado = await pool.query(consulta);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener reservas activas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener reservas activas' });
    }
});
//----------------------------------------------------------------------------------------------
//--------------------------ACTUALIZAR A FALSE-------------------------------
app.put('/actualizarEstadoReserva', (req, res) => {
    const { id_vehiculo, fecha_entrada, id_estacionamiento} = req.body;


    console.log(id_estacionamiento);
    console.log( id_vehiculo);
    console.log(fecha_entrada);

    
    // Consulta SQL para actualizar el estado en la tabla Ocupa
    const query = `
        UPDATE Ocupa
        SET Estado = false
        WHERE ID_Vehiculo = $1
        AND Fecha_Entrada = $2
        AND ID_Estacionamiento = $3
        AND Estado = true
    `;
    const values = [id_vehiculo, fecha_entrada, id_estacionamiento];

    // Ejecutar la consulta SQL
    pool.query(query, values, (error, result) => {
        if (error) {
            console.error('Error al actualizar estado de reserva:', error);
            res.status(500).json({ message: 'Error al actualizar estado de reserva' });
        } else {
            console.log('Estado de reserva actualizado correctamente');
            res.json({ message: 'Estado de reserva actualizado correctamente' });
        }
    });
});
//------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------
app.get('/obtenerTodasLasReservas', (req, res) => {
    const query = `
        SELECT 
            o.ID_Estacionamiento,
            o.ID_Vehiculo,
            o.Fecha_Entrada,
            o.Fecha_Salida,
            o.Estado,
            r.fecha_reserva,
            u.Nombre AS Usuario_Nombre,
            u.Correo AS Usuario_Correo,
            u.Tipo AS Usuario_Tipo,
            cs.Nombre AS Campus_Nombre,
            v.Descripcion AS Vehiculo_Descripcion,
            v.Año AS Vehiculo_Año,
            tv.Nombre AS Tipo_Vehiculo,
            le.Descripcion AS Lugar_Estacionamiento_Descripcion
        FROM 
            Ocupa o
        JOIN 
            Reserva r ON o.ID_Estacionamiento = r.ID_Estacionamiento
        JOIN 
            Usuario u ON r.ID_Usuario = u.Correo
        JOIN 
            Estacionamiento e ON r.ID_Estacionamiento = e.ID_Estacionamiento
        JOIN 
            Campus_Sede cs ON e.ID_Campus = cs.ID_Campus
        JOIN 
            Vehiculo v ON o.ID_Vehiculo = v.Patente
        JOIN 
            Tipo_Vehiculo tv ON v.ID_Tipo_V = tv.ID_Tipo_V
        JOIN 
            Lugar_Estacionamiento le ON e.ID_Lugar = le.ID_Lugar
    `;

    pool.query(query, (error, result) => {
        if (error) {
            console.error('Error al obtener todas las reservas:', error);
            res.status(500).json({ error: 'Error al obtener las reservas' });
        } else {
            res.status(200).json(result.rows);
        }
    });
});
//----------------------------------------------------------------
//PATH PARA OBTENER LAS RESERVAS ACTIVAS EN CHUYACA
app.get('/reservasChuyaca', (req, res) => {
    const query = `
        SELECT 
            o.ID_Estacionamiento,
            o.ID_Vehiculo,
            o.Fecha_Entrada,
            o.Fecha_Salida,
            o.Estado,
            r.fecha_reserva,
            u.Nombre AS Usuario_Nombre,
            u.Correo AS Usuario_Correo,
            u.Tipo AS Usuario_Tipo,
            cs.Nombre AS Campus_Nombre,
            v.Descripcion AS Vehiculo_Descripcion,
            v.Año AS Vehiculo_Año,
            tv.Nombre AS Tipo_Vehiculo,
            le.Descripcion AS Lugar_Estacionamiento_Descripcion
        FROM 
            Ocupa o
        JOIN 
            Reserva r ON o.ID_Estacionamiento = r.ID_Estacionamiento
        JOIN 
            Usuario u ON r.ID_Usuario = u.Correo
        JOIN 
            Estacionamiento e ON r.ID_Estacionamiento = e.ID_Estacionamiento
        JOIN 
            Campus_Sede cs ON e.ID_Campus = cs.ID_Campus
        JOIN 
            Vehiculo v ON o.ID_Vehiculo = v.Patente
        JOIN 
            Tipo_Vehiculo tv ON v.ID_Tipo_V = tv.ID_Tipo_V
        JOIN 
            Lugar_Estacionamiento le ON e.ID_Lugar = le.ID_Lugar
        WHERE 
            cs.Nombre = 'Chuyaca' AND
            o.Estado = true;  -- Filtrar por Chuyaca y reservas activas
    `;

    pool.query(query, (error, result) => {
        if (error) {
            console.error('Error al obtener reservas de Chuyaca:', error);
            res.status(500).json({ error: 'Error al obtener las reservas de Chuyaca' });
        } else {
            res.status(200).json(result.rows);
        }
    });
});
//----------------------------------------------------------------
//PATH PARA OBTENER LAS RESERVAS ACTIVAS EN Meyer
app.get('/reservasMeyer', (req, res) => {
    const query = `
        SELECT 
            o.ID_Estacionamiento,
            o.ID_Vehiculo,
            o.Fecha_Entrada,
            o.Fecha_Salida,
            o.Estado,
            r.fecha_reserva,
            u.Nombre AS Usuario_Nombre,
            u.Correo AS Usuario_Correo,
            u.Tipo AS Usuario_Tipo,
            cs.Nombre AS Campus_Nombre,
            v.Descripcion AS Vehiculo_Descripcion,
            v.Año AS Vehiculo_Año,
            tv.Nombre AS Tipo_Vehiculo,
            le.Descripcion AS Lugar_Estacionamiento_Descripcion
        FROM 
            Ocupa o
        JOIN 
            Reserva r ON o.ID_Estacionamiento = r.ID_Estacionamiento
        JOIN 
            Usuario u ON r.ID_Usuario = u.Correo
        JOIN 
            Estacionamiento e ON r.ID_Estacionamiento = e.ID_Estacionamiento
        JOIN 
            Campus_Sede cs ON e.ID_Campus = cs.ID_Campus
        JOIN 
            Vehiculo v ON o.ID_Vehiculo = v.Patente
        JOIN 
            Tipo_Vehiculo tv ON v.ID_Tipo_V = tv.ID_Tipo_V
        JOIN 
            Lugar_Estacionamiento le ON e.ID_Lugar = le.ID_Lugar
        WHERE 
            cs.Nombre = 'Meyer' AND
            o.Estado = true;  -- Filtrar por Meyer y reservas activas
    `;

    pool.query(query, (error, result) => {
        if (error) {
            console.error('Error al obtener reservas de Meyer:', error);
            res.status(500).json({ error: 'Error al obtener las reservas de Meyer' });
        } else {
            res.status(200).json(result.rows);
        }
    });
});
//----------------------------------------------------------------

//---------PARA ACTUALIZAR LAS RESERVAS ACTIVAS EN CHUYACA-------------------------------------------------
app.put('/eliminarReservasChuyaca', (req, res) => {
    const { id_vehiculo, fecha_entrada, id_estacionamiento } = req.body;

    // Consulta SQL para actualizar el estado en la tabla Ocupa para Chuyaca
    const query = `
        UPDATE Ocupa
        SET Estado = false
        FROM Estacionamiento AS e
        JOIN Campus_Sede AS cs ON e.ID_Campus = cs.ID_Campus
        WHERE Ocupa.ID_Vehiculo = $1
        AND Ocupa.Fecha_Entrada = $2
        AND Ocupa.ID_Estacionamiento = $3
        AND Ocupa.Estado = true
        AND cs.Nombre = 'Chuyaca'
        AND Ocupa.ID_Estacionamiento = e.ID_Estacionamiento
    `;
    const values = [id_vehiculo, fecha_entrada, id_estacionamiento];

    pool.query(query, values, (error, result) => {
        if (error) {
            console.error('Error al eliminar las reservas en Chuyaca:', error);
            res.status(500).json({ error: 'Error al eliminar las reservas en Chuyaca' });
        } else {
            res.status(200).json({ message: 'Reservas en Chuyaca eliminadas exitosamente' });
        }
    });
});
//------------------------------------------------------
app.put('/eliminarReservasMeyer', (req, res) => {
    const { id_vehiculo, fecha_entrada, id_estacionamiento } = req.body;

    // Consulta SQL para actualizar el estado en la tabla Ocupa para Chuyaca
    const query = `
        UPDATE Ocupa
        SET Estado = false
        FROM Estacionamiento AS e
        JOIN Campus_Sede AS cs ON e.ID_Campus = cs.ID_Campus
        WHERE Ocupa.ID_Vehiculo = $1
        AND Ocupa.Fecha_Entrada = $2
        AND Ocupa.ID_Estacionamiento = $3
        AND Ocupa.Estado = true
        AND cs.Nombre = 'Meyer'
        AND Ocupa.ID_Estacionamiento = e.ID_Estacionamiento
    `;
    const values = [id_vehiculo, fecha_entrada, id_estacionamiento];

    pool.query(query, values, (error, result) => {
        if (error) {
            console.error('Error al eliminar las reservas en Meyer:', error);
            res.status(500).json({ error: 'Error al eliminar las reservas en Meyer' });
        } else {
            res.status(200).json({ message: 'Reservas en Meyer eliminadas exitosamente' });
        }
    });
});
//------------------------------------------------------
//---------------CANCELAR LA RESERVA PERSONAL MIA DE USUARIO
app.put('/cancelarMiReservaPersonal', (req, res) => {
    const correoUsuario = req.session.user.correo;

    // Consulta para cancelar la reserva activa del usuario
    const cancelarReservaQuery = `
        UPDATE Ocupa AS o
        SET Estado = false
        WHERE o.ID_Vehiculo IN (
            SELECT v.Patente
            FROM Vehiculo AS v
            JOIN Registra AS r ON v.Patente = r.ID_Vehiculo
            WHERE r.ID_Usuario = $1
        )
        AND o.Estado = true
    `;

    // Ejecutar la consulta para cancelar la reserva
    pool.query(cancelarReservaQuery, [correoUsuario], (error, result) => {
        if (error) {
            console.error('Error al cancelar la reserva del usuario:', error);
            res.status(500).json({ error: 'Error al cancelar la reserva' });
        } else {
            // Determinar a dónde redirigir después de cancelar la reserva
            const tipoUsuarioQuery = `
                SELECT Tipo
                FROM Usuario
                WHERE Correo = $1
            `;

            // Consultar el tipo de usuario para decidir la página de redirección
            pool.query(tipoUsuarioQuery, [correoUsuario], (error, result) => {
                if (error) {
                    console.error('Error al obtener el tipo de usuario:', error);
                    res.status(500).json({ error: 'Error al obtener el tipo de usuario' });
                } else {
                    const tipoUsuario = result.rows[0].tipo;
                    let redirectPage = tipoUsuario === 'Administrador' || tipoUsuario === 'Guardia' ?
                        'paginaGuardia1' : 'pageMovilizas';
                    
                    res.status(200).json({ tipoUsuario, redirectPage });
                }
            });
        }
    });
});





//-----------------------------------------------------------------------------



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