para crear la tabla que uso como test en postgresql:

CREATE TABLE usuarios (
    nombre character varying(255),
    telefono character varying(20) PRIMARY KEY,
    tipo character varying(50),
    password character varying(50)
);


Para iniciar primero cambiar los datos en index.js:

//conexión a la base de datos
const pool = new Pool({
    user: 'su nombre de usuario',
    password: 'su pasword',
    host: 'localhost', 
    database: 'nombre database',
    port: 5432,                               //estoy usando el port por defecto, si tiene otro cámbielo.
});

Ahora en consola asegurese que está en la carpeta api dentro del proyecto, para ejecutar lo siguiente:

cd ruta/al/proyecto/api
o cd api

una vez en la direccion de api ejecute el siguiente comando:

npm install

una vez instaladas las bibliotecas use el siguiente comando:

npm start

debería decir: Servidor Express escuchando en el puerto 3000 en el console

si dice esto ahora vaya a en su navegador: http://localhost:3000/ 
para iniciar la app.

si quiere ver los datos de la tabla para ver los cambios puede ir a la direccion de testeo en otra pestaña:
http://localhost:3000/usuarios


