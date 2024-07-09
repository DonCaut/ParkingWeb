function navigateTo(pageId) {
    // Ocultar los contenidos
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => content.classList.remove('active'));

    // Mostrar el contenido de la página
    document.getElementById(pageId).classList.add('active');

    // Llamar a cargarReservaActiva si se navega a pageMovilizas
    if (pageId === 'pageMovilizas') {
        cargarReservaActiva();
    }    

}

// event listeners de los botones de navegación
document.querySelectorAll('.page-button').forEach(button => {
    button.addEventListener('click', function() {
        const targetPageId = this.getAttribute('data-target');
        navigateTo(targetPageId);
    });
});
                //  Función de login---------------------------------------------------------------
async function handleLogin(event) { 
    event.preventDefault(); // Prevenir el envío del formulario

    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (data.success) {
            if (data.tipoUsuario === 'Guardia' || data.tipoUsuario === 'Administrador') {
                navigateTo('paginaGuardia1'); // Redirigir a la página de administrador o guardia
            } else {
                navigateTo('pageMovilizas'); // Redirigir a la página principal del usuario normal
            }
        } else {
            alert(data.message); // Mostrar mensaje de error si el login falla
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al intentar iniciar sesión. Por favor, intenta de nuevo.');
    }
}



let selectedAccountType = '';

// Manejar la selección del tipo de cuenta
document.querySelectorAll('.page-button').forEach(button => {
    button.addEventListener('click', function() {
        const tipoCuenta = this.textContent;
        sessionStorage.setItem('tipoCuenta', tipoCuenta);
        const targetPageId = this.getAttribute('data-target');
        navigateTo(targetPageId);
    });
});

// Función para manejar el envío del formulario
function handleRegister(event) {
    event.preventDefault();  
     
    const correo = document.getElementById('correo-registro').value;
    const tipo = sessionStorage.getItem('tipoCuenta');
    const nombre = document.getElementById('nombre-registro').value;
    const phone = document.getElementById('phone-registro').value;
    const password = document.getElementById('password-registro').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, phone, password, tipo, correo})
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            alert('Cuenta registrada con éxito');
            navigateTo('pageTestRegistro');
        } else {
            alert('Error al registrar la cuenta');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al registrar la cuenta');
    });
}

//FUNCION DE MODAL DEL BOTON CAMPUS CHUYACA
// Obtener el modal y el botón de cerrar
var modal = document.getElementById("myModal");
var closeButton = modal.querySelector(".close-chuyaca");

// Mostrar el modal al hacer clic en el botón correspondiente
document.getElementById("btnChuyaca").addEventListener("click", function() {
    modal.style.display = "block";
});

// Cerrar el modal al hacer clic en el botón de cerrar
closeButton.onclick = function() {
    modal.style.display = "none";
};

// Cerrar el modal al hacer clic fuera del contenido del modal
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Event listener para el formulario de ingreso de patente y modelo
//formularioIngresoPatente.addEventListener('submit', handleVehicleRegistration);

// Función para manejar el registro de vehículo
async function handleVehicleRegistration(event) {
    event.preventDefault(); // Prevenir el envío del formulario por defecto

    const formData = new FormData(event.target); // Obtener datos del formulario
    const patente = formData.get('patente');
    const modelo = formData.get('modelo');
    let tipoVehiculo = formData.get('tipoVehiculo');

    console.log(`Tipo de dato de patente: ${typeof patente}`);
    console.log(`Tipo de dato de modelo: ${typeof modelo}`);
    console.log(`Tipo de dato de tipoVehiculo: ${typeof tipoVehiculo}`);

    try {
        const response = await fetch('/ingresar-vehiculo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ patente, modelo, tipoVehiculo })
        });

        const data = await response.json();
        console.log(data); // Mostrar respuesta en consola
        if (data.success) {
            // Mostrar página de éxito de matrícula usando navigateTo
            navigateTo('paginaMatriculaExitosa');
        } else {
            alert('Error al ingresar el vehículo');
        }

        // Aquí podrías manejar la respuesta como lo necesites en tu aplicación
    } catch (error) {
        console.error('Error al enviar datos:', error);
        // Manejar errores si es necesario
    }
}


//     Función para cargar la página dinámica de selección de matrícula---------------------
// Función para cargar la página dinámica de listaMatricula
function cargarListaMatricula() {
    // Ocultar todas las páginas activas
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => content.classList.remove('active'));

    // Mostrar la página de listaMatricula
    const listaMatriculaPage = document.getElementById('listaMatricula');
    listaMatriculaPage.classList.add('active');

    // Llamar a la API para obtener las matrículas registradas por el usuario actual
    fetch('/getVehicles')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const vehicles = data.vehicles;

                // Generar radios dinámicamente
                const vehicleSelection = document.getElementById('vehicle-selection');
                vehicleSelection.innerHTML = ''; // Limpiar contenido anterior (si lo hubiera)

                vehicles.forEach(vehiculo => {
                    const radio = document.createElement('input');
                    radio.type = 'radio'; // Tipo radio para selección única
                    radio.name = 'selectedVehicle'; // Nombre del grupo de radios
                    radio.value = vehiculo.patente; // Valor de la patente del vehículo

                    const label = document.createElement('label');
                    label.textContent = vehiculo.patente;

                    const br = document.createElement('br');

                    vehicleSelection.appendChild(radio);
                    vehicleSelection.appendChild(label);
                    vehicleSelection.appendChild(br);
                });
            } else {
                console.error('Error al obtener vehículos:', data.message);
                alert('Hubo un problema al cargar las matrículas. Inténtalo nuevamente.');
            }
        })
        .catch(error => {
            console.error('Error al obtener vehículos:', error);
            alert('Hubo un problema al cargar las matrículas. Inténtalo nuevamente.');
        });
}

// Función para manejar el clic en el botón de registrar matrícula
function handleRegistrarMatricula() {
    // Aquí puedes manejar la lógica para registrar una nueva matrícula
    // Redirigir a otra página, mostrar un formulario de registro, etc.
    console.log('Registrar matrícula');
}

// Función para manejar el clic en el botón de continuar desde la lista de matrículas
function handleContinueFromList() {
    const selectedVehicle = document.querySelector('input[name="selectedVehicle"]:checked');

    if (selectedVehicle) {
        const patenteSeleccionada = selectedVehicle.value;
        console.log('Patente seleccionada:', patenteSeleccionada);

                // Aquí puedes continuar con la lógica según la patente seleccionada
        // Guardar el dato seleccionado, por ejemplo, en el local storage
        localStorage.setItem('selectedVehicle', patenteSeleccionada);
        navigateTo('paginaSeleccionaLocalizacion');
    } else {
        alert('Debe seleccionar una patente para continuar.');
    }
}

// Event listener para el botón de registrar matrícula
const registrarMatriculaBtn = document.getElementById('registrarMatricula-btn');
if (registrarMatriculaBtn) {
    registrarMatriculaBtn.addEventListener('click', handleRegistrarMatricula);
}

// Event listener para el botón de continuar desde la lista de matrículas
const continueListBtn = document.getElementById('continue-list-btn');
if (continueListBtn) {
    continueListBtn.addEventListener('click', handleContinueFromList);
}

// Event listener para el botón de continuar desde páginaMatriculaExitosa
const continueBtn = document.getElementById('continue-btn');
if (continueBtn) {
    continueBtn.addEventListener('click', cargarListaMatricula);
}


//   PARA ALMACENAR LAS VARIABLES UTILIZADAS PARA GENERAR LSO BOTONES
let selectedCampus = null;
let selectedLugarCampus = null;

// Función para manejar el clic en los botones del modal-------------------------------------------------------------------

function handleModalButtonClick(event) {
    selectedCampus = 1; // Suponiendo que el campus es siempre 1 según tu descripción
    selectedLugarCampus = event.target.getAttribute('data-lugar'); // Obtener el valor data-lugar del botón

    console.log(`Valores almacenados - campus: ${selectedCampus}, lugarCampus: ${selectedLugarCampus}`);
    iniciarSeleccionFechaHora();
}

function handleMeyerButtonClick(event) {
    selectedCampus = 2; // Valor predeterminado diferente para el nuevo botón
    selectedLugarCampus = 1; // Otro valor predeterminado para el nuevo botón

    console.log(`Valores almacenados - campus: ${selectedCampus}, lugarCampus: ${selectedLugarCampus}`);
    iniciarSeleccionFechaHora();
}

function iniciarSeleccionFechaHora() {
    // Actualizar el mínimo de fecha permitida en el input de fecha
    const hoy = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato ISO (YYYY-MM-DD)
    const selectFecha = document.getElementById('SelectFecha');
    selectFecha.setAttribute('min', hoy);

    // Redirigir a la página para seleccionar fecha y hora
    navigateTo('paginaSeleccionaFechaHora');

    // Lógica para cargar opciones de fecha y hora inicial
    const cargarFechaYHora = () => {
        const selectFecha = document.getElementById('SelectFecha');
        const selectHora = document.getElementById('SelectHora');
        const rangeHoras = document.getElementById('rangeHoras');
        const outputRange = document.getElementById('outputRange');

        // Establecer fecha mínima como hoy y máxima como 2050-12-31
        const today = new Date();
        const maxDate = new Date('2050-12-31').toISOString().split('T')[0];
        selectFecha.setAttribute('min', today.toISOString().split('T')[0]);
        selectFecha.setAttribute('max', maxDate);
        selectFecha.value = today.toISOString().split('T')[0];

        // Llenar select de horas con opciones
        selectHora.innerHTML = '';
        for (let hour = 1; hour <= 12; hour++) {
            const option = document.createElement('option');
            option.text = `${hour.toString().padStart(2, '0')}:00`; // Formato 01:00, 02:00, etc.
            option.value = hour;
            selectHora.appendChild(option);
        }

        // Configurar rango de horas adicionales
        rangeHoras.setAttribute('min', 0);
        rangeHoras.setAttribute('max', 5);
        rangeHoras.setAttribute('step', 1);
        rangeHoras.value = 0;
        outputRange.textContent = '0 horas adicionales';

        // Event listener para actualizar la salida en base a las horas adicionales
        rangeHoras.addEventListener('input', () => {
            const horaInicial = parseInt(selectHora.value, 10);
            const horasAdicionales = parseInt(rangeHoras.value, 10);
            const horaSalida = horaInicial + horasAdicionales;

            const horaInicialFormateada = `${horaInicial.toString().padStart(2, '0')}:00`;
            const horaSalidaFormateada = `${horaSalida.toString().padStart(2, '0')}:59`;

            outputRange.textContent = `${horasAdicionales} horas adicionales (Hora de salida: ${horaSalida.toString().padStart(2, '0')}:59)`;

            // Almacenar valores en localStorage
            localStorage.setItem('selectedHoraEntrada', horaInicialFormateada);
            localStorage.setItem('selectedHoraSalida', horaSalidaFormateada);            
        });
    };

    // Llamar a la función para cargar opciones de fecha y hora
    cargarFechaYHora();    
}

// Event listeners para los botones del modal
document.addEventListener('DOMContentLoaded', () => {
    // Obtener los botones del modal
    const modalButtons = document.querySelectorAll('.modal-buttons-chuyaca button');
    
    // Asignar evento a cada botón
    modalButtons.forEach(button => {
        button.addEventListener('click', handleModalButtonClick);
    });
});

// Función ejemplo para manejar la nueva funcionalidad
function navigateToAnotherPage() {
    // Lógica para manejar la redirección o la funcionalidad adicional
    // navigateTo('otraPagina');
    console.log('Navegar a otra página con los valores almacenados');
}

// PARA GENERAR LSO BOTONES DYNAMICOS NUEVOS
function handleReservar() {
    const selectedFecha = document.getElementById('SelectFecha').value; // Obtener el valor del input de fecha

    if (selectedFecha) {
        localStorage.setItem('selectedFecha', selectedFecha);
        console.log('Fecha seleccionada guardada en localStorage:', selectedFecha);

        // Aquí puedes continuar con otras acciones o redirigir si es necesario
        // navigateTo('paginaSeleccionaHora'); // Ejemplo de redirección si es necesaria
    } else {
        console.error('Error: No se pudo obtener la fecha seleccionada del input.');
    }
    
    // Llamar a la API para obtener los estacionamientos según campus y lugarCampus
    fetch(`/getEstacionamientos?campus=${selectedCampus}&lugarCampus=${selectedLugarCampus}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const estacionamientos = data.estacionamientos;

                // Limpiar contenido anterior
                const botonesLugares = document.getElementById('botones-lugares');
                botonesLugares.innerHTML = '';

                // Generar botones dinámicamente
                estacionamientos.forEach(estacionamiento => {
                    console.log('estacionamiento:', estacionamiento);
                    const button = document.createElement('button');
                    button.textContent = `Estacionamiento ${estacionamiento.id_estacionamiento}`;
                    button.addEventListener('click', () => {
                        // Lógica para manejar la selección de estacionamiento
                        console.log(`Seleccionaste el estacionamiento ${estacionamiento.id_estacionamiento}`);
                        
                        // Obtener valores almacenados
                        const selectedFecha = localStorage.getItem('selectedFecha');
                        const selectedHoraEntrada = localStorage.getItem('selectedHoraEntrada');
                        const selectedHoraSalida = localStorage.getItem('selectedHoraSalida');

                        // Llamar a la función para reservar el estacionamiento final
                        ReservarEstacionamientoFinal(estacionamiento.id_estacionamiento, selectedFecha, selectedHoraEntrada, selectedHoraSalida);
                    });
                    botonesLugares.appendChild(button);
                });

                // Mostrar la página de selecciona botones
                navigateTo('paginaSeleccionaBotones'); // Función para mostrar la página
            } else {
                console.error('Error al obtener estacionamientos:', data.message);
                alert('Hubo un problema al cargar los estacionamientos. Inténtalo nuevamente.');
            }
        })
        .catch(error => {
            console.error('Error al obtener estacionamientos:', error);
            alert('Hubo un problema al cargar los estacionamientos. Inténtalo nuevamente.');
        });
}

// FUNCION PARA HACER LA RESERVA FINAL DEL ESTACIONAMIENTOOO--------------------------------------------------------
async function ReservarEstacionamientoFinal(estacionamiento) {
    const selectedFecha = localStorage.getItem('selectedFecha');
    const selectedHoraEntrada = localStorage.getItem('selectedHoraEntrada');
    const selectedHoraSalida = localStorage.getItem('selectedHoraSalida');
    const selectedVehicle = localStorage.getItem('selectedVehicle');

    console.log('Datos recibidos:');
    console.log('Estacionamiento:', estacionamiento);
    console.log('Fecha seleccionada:', selectedFecha);
    console.log('Hora de entrada:', selectedHoraEntrada);
    console.log('Hora de salida:', selectedHoraSalida);
    console.log('Vehículo seleccionado:', selectedVehicle);

    if (!selectedFecha || !selectedHoraEntrada || !selectedHoraSalida || !selectedVehicle) {
        alert('Por favor, asegúrese de seleccionar la fecha, la hora de entrada, la hora de salida y la matrícula del vehículo.');
        return;
    }

    // Validar formato de fecha (YYYY-MM-DD)
    if (!isValidDate(selectedFecha)) {
        alert('Formato de fecha inválido. Seleccione una fecha válida.');
        return;
    }

    // Validar formato de hora de entrada (HH:00)
    if (!isValidTime(selectedHoraEntrada)) {
        alert('Formato de hora de entrada inválido. Seleccione una hora válida.');
        return;
    }

    // Validar formato de hora de salida (HH:59)
    if (!isValidTime(selectedHoraSalida)) {
        alert('Formato de hora de salida inválido. Seleccione una hora válida.');
        return;
    }

    try {
        const response = await fetch('/reservarEstacionamientoFinal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estacionamiento,
                selectedFecha,
                selectedHoraEntrada,
                selectedHoraSalida,
                selectedVehicle
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('Reserva y ocupación registradas con éxito:', result);
            alert('Reserva y ocupación registradas con éxito.');
            // Redirigir a la página de reserva exitosa usando la función navigateTo
            navigateTo('paginaReservaExitosa');
        } else {
            console.error('Error al registrar la reserva y ocupación:', result);
            alert('Error al registrar la reserva y ocupación.');
        }
    } catch (error) {
        console.error('Error de conexión al intentar registrar la reserva y ocupación:', error);
        alert('Error de conexión. Por favor, inténtelo de nuevo más tarde.');
    }
}

// Función para validar formato de fecha (YYYY-MM-DD)
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
}

// Función para validar formato de hora (HH:00 o HH:59)
function isValidTime(timeString) {
    const regex = /^(0[0-9]|1[0-2]):(00|59)$/;
    return regex.test(timeString);
}

//---------------------------------------------------------------------------------------------------
//FUNCIONES PARA EL GUARDIA -------------------------------------------------------------------------
function initMutationObserver() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('active')) {
                    if (target.id === 'paginaGuardia1') {
                        cargarPagina1();
                    } else if (target.id === 'paginaGuardiaSesiones') {
                        cargarSesiones();
                    }
                    // Agregar más verificaciones según sea necesario
                }
            }
        });
    });

    document.querySelectorAll('.content').forEach(page => {
        observer.observe(page, { attributes: true });
    });
}
//-------------------------------------------------------------------------------------------------------

//-------FUCNION PARA LA PAGINA DE GUARDIA 1-----------------
function cargarPagina1() {
    fetch('/verificarSesion')
        .then(response => response.json())
        .then(data => {
            if (data.autenticado && (data.tipo === 'Guardia' || data.tipo === 'Administrador')) {
                console.log('Acceso permitido');
                // Ejecutar la lógica específica de la página aquí
            } else {
                console.log('Acceso denegado, redirigiendo a la página de inicio');
                navigateTo('page2');
            }
        })
        .catch(error => {
            console.error('Error al verificar la sesión:', error);
            navigateTo('page2');
        });
}


function cargarSesiones() {
    fetch('/verificarSesion')
        .then(response => response.json())
        .then(data => {
            if (data.autenticado && (data.tipo === 'Guardia' || data.tipo === 'Administrador')) {
                console.log('Acceso permitido');
                // Ejecutar la lógica específica de la página aquí
            } else {
                console.log('Acceso denegado, redirigiendo a la página de inicio');
                navigateTo('page2');
            }
        })
        .catch(error => {
            console.error('Error al verificar la sesión:', error);
            navigateTo('page2');
        });
}
//--------------------------------------------------------------

// Función para obtener y mostrar reservas activas----------------------------------------------------
async function mostrarActivos() {
    try {
        const response = await fetch('/obtenerReservasActivas');
        const reservas = await response.json();

        if (response.ok) {
            renderizarReservas(reservas);
        } else {
            console.error('Error al obtener reservas activas:', reservas.message);
        }
    } catch (error) {
        console.error('Error en la solicitud para obtener reservas activas:', error);
    }
}

// Función para renderizar reservas en el HTML
// Función para renderizar reservas en el HTML
function renderizarReservas(reservas) {
    const resultadosDiv = document.querySelector('.resultados-sesion');
    resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores

    const table = document.createElement('table');
    table.classList.add('reservas-table');

    const headerRow = document.createElement('tr');
    const headers = ['Código', 'Patente', 'Hora', 'Fecha', 'Nombre', 'Campus', 'Acciones'];
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });
    table.appendChild(headerRow);

    reservas.forEach(reserva => {
        const row = document.createElement('tr');

        const codigoCell = document.createElement('td');
        codigoCell.textContent = reserva.id_estacionamiento;
        row.appendChild(codigoCell);

        const patenteCell = document.createElement('td');
        patenteCell.textContent = reserva.id_vehiculo;
        row.appendChild(patenteCell);

        const horaCell = document.createElement('td');
        horaCell.textContent = `${reserva.fecha_entrada} / ${reserva.fecha_salida}`;
        row.appendChild(horaCell);

        const fechaCell = document.createElement('td');
        fechaCell.textContent = formatFecha(reserva.fecha_reserva);
        row.appendChild(fechaCell);

        const nombreCell = document.createElement('td');
        nombreCell.textContent = reserva.usuario_nombre;
        row.appendChild(nombreCell);

        const campusCell = document.createElement('td');
        campusCell.textContent = reserva.campus_nombre;
        row.appendChild(campusCell);

        const accionesCell = document.createElement('td');
        const editarButton = document.createElement('button');
        editarButton.textContent = 'Editar';
        editarButton.classList.add('boton-sesion');
        editarButton.addEventListener('click', () => mostrarDetallesReserva(reserva));
        accionesCell.appendChild(editarButton);

        const eliminarButton = document.createElement('button');
        eliminarButton.textContent = 'Eliminar';
        eliminarButton.classList.add('boton-sesion');
        eliminarButton.addEventListener('click', () => eliminarReserva(reserva));
        accionesCell.appendChild(eliminarButton);

        row.appendChild(accionesCell);
        table.appendChild(row);
    });

    resultadosDiv.appendChild(table);
}

//boton 2 para mmostrar toads las FUNCIONEs
function mostrarTodasLasReservas() {
    fetch('/obtenerTodasLasReservas')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener las reservas');
            }
            return response.json();
        })
        .then(reservas => {
            const resultadosDiv = document.querySelector('.resultados-sesion');
            resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores

            const table = document.createElement('table');
            table.classList.add('reservas-table');

            const headerRow = document.createElement('tr');
            const headers = ['Código', 'Patente', 'Hora', 'Fecha', 'Nombre', 'Campus', 'Acciones'];
            headers.forEach(headerText => {
                const header = document.createElement('th');
                header.textContent = headerText;
                headerRow.appendChild(header);
            });
            table.appendChild(headerRow);

            reservas.forEach(reserva => {
                const row = document.createElement('tr');

                const codigoCell = document.createElement('td');
                codigoCell.textContent = reserva.id_estacionamiento;
                row.appendChild(codigoCell);

                const patenteCell = document.createElement('td');
                patenteCell.textContent = reserva.id_vehiculo;
                row.appendChild(patenteCell);

                const horaCell = document.createElement('td');
                horaCell.textContent = `${reserva.fecha_entrada} / ${reserva.fecha_salida}`;
                row.appendChild(horaCell);

                const fechaCell = document.createElement('td');
                fechaCell.textContent = formatFecha(reserva.fecha_reserva);
                row.appendChild(fechaCell);

                const nombreCell = document.createElement('td');
                nombreCell.textContent = reserva.usuario_nombre;
                row.appendChild(nombreCell);

                const campusCell = document.createElement('td');
                campusCell.textContent = reserva.campus_nombre;
                row.appendChild(campusCell);

                const accionesCell = document.createElement('td');
                const editarButton = document.createElement('button');
                editarButton.textContent = 'Editar';
                editarButton.classList.add('boton-sesion');
                editarButton.addEventListener('click', () => mostrarDetallesReserva(reserva));
                accionesCell.appendChild(editarButton);

                row.appendChild(accionesCell);
                table.appendChild(row);
            });

            resultadosDiv.appendChild(table);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al cargar las reservas.');
        });
}
//-------------------------------------------------------
//  PARA EL BOTON DE CHUYACA EN LO DE GUARDIA----------------------------------------------------------------
function renderizarReservasChuyaca() {
    fetch('/reservasChuyaca')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener las reservas de Chuyaca');
            }
            return response.json();
        })
        .then(reservas => {
            const resultadosDiv = document.querySelector('.resultados-sesion');
            resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores

            const table = document.createElement('table');
            table.classList.add('reservas-table');

            const headerRow = document.createElement('tr');
            const headers = ['Código', 'Patente', 'Hora', 'Fecha', 'Nombre', 'Campus', 'Acciones'];
            headers.forEach(headerText => {
                const header = document.createElement('th');
                header.textContent = headerText;
                headerRow.appendChild(header);
            });
            table.appendChild(headerRow);

            reservas.forEach(reserva => {
                const row = document.createElement('tr');

                const codigoCell = document.createElement('td');
                codigoCell.textContent = reserva.id_estacionamiento;
                row.appendChild(codigoCell);

                const patenteCell = document.createElement('td');
                patenteCell.textContent = reserva.id_vehiculo;
                row.appendChild(patenteCell);

                const horaCell = document.createElement('td');
                horaCell.textContent = `${reserva.fecha_entrada} / ${reserva.fecha_salida}`;
                row.appendChild(horaCell);

                const fechaCell = document.createElement('td');
                fechaCell.textContent = formatFecha(reserva.fecha_reserva);
                row.appendChild(fechaCell);

                const nombreCell = document.createElement('td');
                nombreCell.textContent = reserva.usuario_nombre;
                row.appendChild(nombreCell);

                const campusCell = document.createElement('td');
                campusCell.textContent = reserva.campus_nombre;
                row.appendChild(campusCell);

                const accionesCell = document.createElement('td');
                const editarButton = document.createElement('button');
                editarButton.textContent = 'Editar';
                editarButton.classList.add('boton-sesion');
                editarButton.addEventListener('click', () => mostrarDetallesReserva(reserva));
                accionesCell.appendChild(editarButton);

                const eliminarButton = document.createElement('button');
                eliminarButton.textContent = 'Eliminar';
                eliminarButton.classList.add('boton-sesion');
                eliminarButton.addEventListener('click', () => eliminarReservaChuyaca(reserva));
                accionesCell.appendChild(eliminarButton);



                row.appendChild(accionesCell);
                table.appendChild(row);
            });

            resultadosDiv.appendChild(table);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al obtener las reservas de Chuyaca.');
        });
}
//-------------------------------------------------------------------------------------------------

//--------RESERVAS MEYER MOSTRAR-------------------------------
function renderizarReservasMeyer() {
    fetch('/reservasMeyer')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener las reservas de Meyer');
            }
            return response.json();
        })
        .then(reservas => {
            const resultadosDiv = document.querySelector('.resultados-sesion');
            resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores

            const table = document.createElement('table');
            table.classList.add('reservas-table');

            const headerRow = document.createElement('tr');
            const headers = ['Código', 'Patente', 'Hora', 'Fecha', 'Nombre', 'Campus', 'Acciones'];
            headers.forEach(headerText => {
                const header = document.createElement('th');
                header.textContent = headerText;
                headerRow.appendChild(header);
            });
            table.appendChild(headerRow);

            reservas.forEach(reserva => {
                const row = document.createElement('tr');

                const codigoCell = document.createElement('td');
                codigoCell.textContent = reserva.id_estacionamiento;
                row.appendChild(codigoCell);

                const patenteCell = document.createElement('td');
                patenteCell.textContent = reserva.id_vehiculo;
                row.appendChild(patenteCell);

                const horaCell = document.createElement('td');
                horaCell.textContent = `${reserva.fecha_entrada} / ${reserva.fecha_salida}`;
                row.appendChild(horaCell);

                const fechaCell = document.createElement('td');
                fechaCell.textContent = formatFecha(reserva.fecha_reserva);
                row.appendChild(fechaCell);

                const nombreCell = document.createElement('td');
                nombreCell.textContent = reserva.usuario_nombre;
                row.appendChild(nombreCell);

                const campusCell = document.createElement('td');
                campusCell.textContent = reserva.campus_nombre;
                row.appendChild(campusCell);

                const accionesCell = document.createElement('td');
                const editarButton = document.createElement('button');
                editarButton.textContent = 'Editar';
                editarButton.classList.add('boton-sesion');
                editarButton.addEventListener('click', () => mostrarDetallesReserva(reserva));
                accionesCell.appendChild(editarButton);

                const eliminarButton = document.createElement('button');
                eliminarButton.textContent = 'Eliminar';
                eliminarButton.classList.add('boton-sesion');
                eliminarButton.addEventListener('click', () => eliminarReservaMeyer(reserva));
                accionesCell.appendChild(eliminarButton);



                row.appendChild(accionesCell);
                table.appendChild(row);
            });

            resultadosDiv.appendChild(table);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al obtener las reservas de Chuyaca.');
        });
}
//--------------------------------------------------------------------------------------------------------------

// Función para formatear fechas ISO 8601 y mostrar solo la fecha
function formatFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

//--------------------------------------------------------------------------------------
// Función para mostrar detalles específicos de una reserva
function mostrarDetallesReserva(reserva) {
    const detallesDiv = document.querySelector('.resultados-sesion-datos');
    detallesDiv.innerHTML = ''; // Limpiar detalles anteriores

    const detallesLista = document.createElement('ul');
    detallesLista.classList.add('detalles-reserva-lista');

    const detalles = [
        { titulo: 'Modelo', dato: reserva.vehiculo_descripcion },
        { titulo: 'Patente', dato: reserva.id_vehiculo },
        { titulo: 'Campus', dato: reserva.campus_nombre },
        { titulo: 'Lugar Estacionamiento', dato: reserva.lugar_estacionamiento_descripcion },
        { titulo: 'Nombre', dato: reserva.usuario_nombre },
        { titulo: 'Categoría', dato: reserva.usuario_tipo },
        { titulo: 'Correo', dato: reserva.usuario_correo }
    ];

    detalles.forEach(detalle => {
        const detalleItem = document.createElement('li');
        const tituloSpan = document.createElement('span');
        tituloSpan.textContent = `${detalle.titulo}: `;
        detalleItem.appendChild(tituloSpan);
        detalleItem.textContent += detalle.dato;
        detallesLista.appendChild(detalleItem);
    });

    detallesDiv.appendChild(detallesLista);

    // Navegar a la página de detalles de reserva
    navigateTo('paginaGuardiaSesionesDatos');
}
//--------------------------------------------------------------------------
//------------------------------Cargar reserva activa si se navega a la pagina de movilizas
function cargarReservaActiva() {
    fetch('/obtenerMiReservaActiva', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            const reserva = data[0];
            mostrarDetallesReservaActiva(reserva);
            navigateTo('pageMiReservaActiva');
        }
    })
    .catch(error => {
        console.error('Error al obtener la reserva activa del usuario:', error);
    });
}

function mostrarDetallesReservaActiva(reserva) {
    const resultadosDiv = document.querySelector('.resultados-mi-reserva-activa');
    resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores

    const detalleDiv = document.createElement('div');
    detalleDiv.classList.add('detalle-reserva-activa');

    const info = `
        <p><strong>Código:</strong> ${reserva.id_estacionamiento}</p>
        <p><strong>Patente:</strong> ${reserva.id_vehiculo}</p>
        <p><strong>Hora:</strong> ${reserva.fecha_entrada} / ${reserva.fecha_salida}</p>
        <p><strong>Fecha:</strong> ${formatFecha(reserva.fecha_reserva)}</p>
        <p><strong>Nombre:</strong> ${reserva.usuario_nombre}</p>
        <p><strong>Campus:</strong> ${reserva.campus_nombre}</p>
    `;

    detalleDiv.innerHTML = info;
    resultadosDiv.appendChild(detalleDiv);

}
//---------------------------------------




//CAMBIAR EL ESTADO DE RESERVA A FALSE-------------------------------------------------------------
function eliminarReserva(reserva) {
    // Mostrar confirmación
    if (confirm('¿Estás seguro que deseas eliminar esta reserva?')) {
        // Llamar al endpoint para actualizar el estado
        fetch(`/actualizarEstadoReserva`, {
            method: 'PUT', // O el método correcto que corresponda
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_vehiculo: reserva.id_vehiculo,
                fecha_entrada: reserva.fecha_entrada,
                id_estacionamiento: reserva.id_estacionamiento
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al actualizar el estado de la reserva');
            }
            return response.json();
        })
        .then(data => {
            // Puedes manejar la respuesta si es necesario
            console.log('Estado de reserva actualizado correctamente:', data);
            mostrarActivos()
            // Aquí podrías realizar alguna acción adicional si es necesario
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al actualizar el estado de la reserva.');
        });
    } else {
        // No hacer nada si se selecciona cancelar en la confirmación
        return;
    }
}
//-------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------
function eliminarReservaChuyaca(reserva) {
    // Mostrar confirmación
    if (confirm('¿Estás seguro que deseas eliminar esta reserva en Chuyaca?')) {
        // Llamar al endpoint para actualizar el estado
        fetch('/eliminarReservasChuyaca', {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_vehiculo: reserva.id_vehiculo,
                fecha_entrada: reserva.fecha_entrada,
                id_estacionamiento: reserva.id_estacionamiento
                
                
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al actualizar el estado de la reserva en Chuyaca');
            }
            return response.json();
        })
        .then(data => {
            console.log('Estado de reserva actualizado correctamente en Chuyaca:', data);
            // Aquí podrías realizar alguna acción adicional si es necesario
            renderizarReservasChuyaca(); // Actualizar la lista de reservas
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al actualizar el estado de la reserva en Chuyaca.');
        });
    } else {
        // No hacer nada si se selecciona cancelar en la confirmación
        return;
    }
}
//--------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------
function eliminarReservaMeyer(reserva) {
    // Mostrar confirmación
    if (confirm('¿Estás seguro que deseas eliminar esta reserva en Meyer?')) {
        // Llamar al endpoint para actualizar el estado
        fetch('/eliminarReservasMeyer', {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_vehiculo: reserva.id_vehiculo,
                fecha_entrada: reserva.fecha_entrada,
                id_estacionamiento: reserva.id_estacionamiento
                
                
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al actualizar el estado de la reserva en Meyer');
            }
            return response.json();
        })
        .then(data => {
            console.log('Estado de reserva actualizado correctamente en Meyer:', data);
            // Aquí podrías realizar alguna acción adicional si es necesario
            renderizarReservasMeyer(); // Actualizar la lista de reservas
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un problema al actualizar el estado de la reserva en Meyer.');
        });
    } else {
        // No hacer nada si se selecciona cancelar en la confirmación
        return;
    }
}
//--------------------------------------------------------------
//-------------------------------------------------------------- CANCELAR MI PROPIA RESERVA
function cancelarMiReservaPersonal() {
    // Obtener el correo del usuario logueado
    fetch('/cancelarMiReservaPersonal', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Reserva cancelada:', data);

        // Redirigir según el tipo de usuario
        if (data.tipoUsuario === 'Administrador' || data.tipoUsuario === 'Guardia') {
            navigateTo('paginaGuardia1');
        } else {
            navigateTo('pageMovilizas');
        }
    })
    .catch(error => {
        console.error('Error al cancelar la reserva:', error);
    });
}


// Función para obtener la patente registrada desde la URL temporal -------------------------------------------
function obtenerPatenteRegistrada() {
    const vehiculoPatente = window.location.pathname.split('/').pop();
    return vehiculoPatente;
}

// Función para mostrar la patente registrada en la página
function mostrarPatenteRegistrada() {
    const patenteSpan = document.getElementById('patente-registrada');
    if (patenteSpan) {
        const patente = obtenerPatenteRegistrada();
        patenteSpan.textContent = patente;
    }
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    initMutationObserver();
    mostrarPatenteRegistrada();
});