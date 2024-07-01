function navigateTo(pageId) {
    // Ocultar los contenidos
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => content.classList.remove('active'));

    // Mostrar el contenido de la página
    document.getElementById(pageId).classList.add('active');
}

// event listeners de los botones de navegación
document.querySelectorAll('.page-button').forEach(button => {
    button.addEventListener('click', function() {
        const targetPageId = this.getAttribute('data-target');
        navigateTo(targetPageId);
    });
});
                                             //  Función de login
async function handleLogin(event) { 
    event.preventDefault(); // Prevenir el envío del formulario

    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone, password })
        });

        const data = await response.json();

        if (data.success) {
            navigateTo('pageTestLogin'); // Redirigir a la página principal del usuario (por hacer)
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


