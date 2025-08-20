// Objeto con usuarios y sus contraseñas válidas (para login simple)
const usuariosValidos = {
  'marck': 'marck069',
  'maria': 'abcd',
  'pedro': 'pass123'
};

document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos del DOM (contenedor productos, búsqueda, botones)
  const productosContainer = document.querySelector('.row.g-4');
  const inputBuscar = document.querySelector('input[type="search"]');
  const formBuscar = document.querySelector('form');
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');

  const RADIO_KM = 0.5;  // Radio máximo (en km) para mostrar productos cercanos
  let productos = [];    // Lista que se llenará con productos desde JSON
  let userLat = null;    // Latitud del usuario (geolocalización)
  let userLng = null;    // Longitud del usuario

  // Leer usuario y contraseña guardados en localStorage (persistencia entre sesiones)
  let usuarioGuardado = localStorage.getItem('usuario');
  let contraseñaGuardada = localStorage.getItem('contraseña');

  let carrito = [];  // Arreglo para guardar productos agregados al carrito

  // Si hay usuario guardado, actualizar UI y cargar carrito específico del usuario
  if (usuarioGuardado) {
    btnLogin.textContent = usuarioGuardado;        // Mostrar usuario en botón login
    btnLogout.classList.remove('d-none');           // Mostrar botón logout

    // Cargar carrito guardado en localStorage con clave personalizada por usuario
    const carritoGuardado = localStorage.getItem(`carrito_${usuarioGuardado}`);
    carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
  }

  // Función que guarda el carrito actual en localStorage bajo la clave del usuario
  function guardarCarrito() {
    if (usuarioGuardado) {
      localStorage.setItem(`carrito_${usuarioGuardado}`, JSON.stringify(carrito));
    }
  }

  // Evento click para iniciar sesión (login)
  btnLogin.addEventListener('click', () => {
    // Si ya hay sesión iniciada, no permitir cambiar usuario
    if (usuarioGuardado) {
      alert(`Ya has iniciado sesión como ${usuarioGuardado}. No puedes cambiar de usuario.`);
      return;
    }

    // Solicitar nombre de usuario con prompt
    const usuario = prompt('Ingresa tu nombre de usuario:');
    if (!usuario) {
      alert('Debes ingresar un nombre de usuario.');
      return;
    }

    // Solicitar contraseña con prompt
    const contraseña = prompt('Ingresa tu contraseña:');
    if (!contraseña) {
      alert('Debes ingresar una contraseña.');
      return;
    }

    // Verificar si usuario existe y contraseña coincide
    if (usuariosValidos[usuario] && usuariosValidos[usuario] === contraseña) {
      // Guardar usuario en variable y localStorage (persistencia)
      usuarioGuardado = usuario;
      localStorage.setItem('usuario', usuario);
      localStorage.setItem('contraseña', contraseña); // ⚠️ Solo para pruebas, no guardar así en producción

      // Actualizar UI botones
      btnLogin.textContent = usuario;
      btnLogout.classList.remove('d-none');
      alert(`Bienvenido, ${usuario}`);

      // Cargar carrito guardado para el usuario (o vacío si no hay)
      const carritoGuardado = localStorage.getItem(`carrito_${usuarioGuardado}`);
      carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  });


  btnLogin.addEventListener('click', () => {
    if (usuarioGuardado) {
      // Aquí mostramos un confirm que solo puede aceptar o cancelar
      const cambiar = confirm(`Ya has iniciado sesión como ${usuarioGuardado}. No puedes cambiar de usuario.\n\nPresiona Cancelar para cerrar este mensaje.`);
      if (!cambiar) {
        // El usuario presionó Cancelar, así que solo terminamos la función sin hacer nada
        return;
      }
      // Si se quisiera implementar lógica para cambiar de usuario, va aquí (pero no queremos eso)
      return;  // Por seguridad, no hacer nada más
    }

    // Aquí el código para pedir usuario y contraseña con prompt porque no hay sesión iniciada
    const usuario = prompt('Ingresa tu nombre de usuario:');
    if (!usuario) {
      alert('Debes ingresar un nombre de usuario.');
      return;
    }

    const contraseña = prompt('Ingresa tu contraseña:');
    if (!contraseña) {
      alert('Debes ingresar una contraseña.');
      return;
    }

    if (usuariosValidos[usuario] && usuariosValidos[usuario] === contraseña) {
      usuarioGuardado = usuario;
      localStorage.setItem('usuario', usuario);
      localStorage.setItem('contraseña', contraseña); // Solo para pruebas
      btnLogin.textContent = usuario;
      btnLogout.classList.remove('d-none');
      alert(`Bienvenido, ${usuario}`);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  });



  // Evento click para cerrar sesión (logout)
  btnLogout.addEventListener('click', () => {
    // Eliminar datos de sesión en localStorage
    localStorage.removeItem('usuario');
    localStorage.removeItem('contraseña');
    usuarioGuardado = null;
    carrito = [];

    // Resetear botones UI
    btnLogin.textContent = 'Login';
    btnLogout.classList.add('d-none');
    alert('Has cerrado sesión.');
  });

  // Función que calcula distancia entre dos puntos geográficos usando fórmula Haversine
  function calcularDistancia(lat1, lng1, lat2, lng2) {
    const toRad = angle => angle * Math.PI / 180;  // Convierte grados a radianes
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    // Fórmula Haversine para distancia
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Función para mostrar productos en la página, con botón para agregar al carrito
  function renderProductos(lista) {
    productosContainer.innerHTML = '';  // Limpiar contenedor
    if (lista.length === 0) {
      productosContainer.innerHTML = '<p class="text-center">No hay productos cercanos disponibles.</p>';
      return;
    }

    // Para cada producto crear una tarjeta (card)
    lista.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-3';

      // Mostrar distancia con dos decimales o mensaje si desconocida
      const distanciaTexto = (p.distancia !== undefined && p.distancia !== Infinity)
        ? p.distancia.toFixed(2) + ' km'
        : 'Distancia desconocida';

      col.innerHTML = `
        <div class="card">
          <img src="${p.imagen}" alt="${p.nombre}" class="card-img-top" style="height: 200px; object-fit: cover;">
          <div class="card-body text-center">
            <h5 class="card-title">${p.nombre}</h5>
            <p class="card-text">${p.tienda} - <small>${distanciaTexto}</small></p>
            <h6 class="text-success">$${p.precio.toLocaleString('es-CL')}</h6>
            <a href="${p.url}" target="_blank" class="btn btn-success w-100 mb-2">Cómo llegar</a>
            <button class="btn btn-primary w-100 btn-agregar">Agregar al carrito</button>
          </div>
        </div>
      `;

      // Evento para agregar producto al carrito solo si usuario está logueado
      col.querySelector('.btn-agregar').addEventListener('click', () => {
        if (!usuarioGuardado) {
          alert('Debes iniciar sesión para agregar productos al carrito.');
          return;
        }
        carrito.push(p);
        guardarCarrito();  // Guardar carrito actualizado
        alert(`${p.nombre} agregado al carrito.`);
      });

      productosContainer.appendChild(col);
    });
  }

  // Filtrar productos según ubicación y término de búsqueda, luego mostrar
  function filtrarYMostrar() {
    const termino = inputBuscar.value.toLowerCase().trim();  // Término en minúsculas

    // Añadir distancia a cada producto si hay ubicación, sino distancia infinita
    let filtrados = productos.map(p => {
      if (userLat !== null && userLng !== null && p.lat && p.lng) {
        p.distancia = calcularDistancia(userLat, userLng, p.lat, p.lng);
      } else {
        p.distancia = Infinity;
      }
      return p;
    }).filter(p => p.distancia <= RADIO_KM);  // Filtrar productos dentro del radio

    // Filtrar por término de búsqueda en nombre del producto
    if (termino) {
      filtrados = filtrados.filter(p => p.nombre.toLowerCase().includes(termino));
    }

    // Ordenar productos por distancia ascendente
    filtrados.sort((a, b) => a.distancia - b.distancia);

    renderProductos(filtrados);  // Mostrar productos filtrados
  }

  // Cargar productos desde archivo JSON
  async function cargarProductos() {
    try {
      const response = await fetch('static/data/productos.json');
      productos = await response.json();
      filtrarYMostrar();  // Mostrar productos al cargarlos
    } catch (error) {
      console.error('Error al cargar productos:', error);
      productosContainer.innerHTML = '<p class="text-center text-danger">No se pudieron cargar los productos.</p>';
    }
  }

  // Obtener ubicación actual del usuario (geolocalización)
  function obtenerUbicacion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        filtrarYMostrar();
      }, err => {
        console.warn('No se pudo obtener ubicación:', err.message);
        filtrarYMostrar();
      });
    } else {
      console.warn('Geolocalización no soportada');
      filtrarYMostrar();
    }
  }

  // Eventos para filtrar productos con formulario y campo de búsqueda
  if (formBuscar && inputBuscar && productosContainer) {
    formBuscar.addEventListener('submit', e => {
      e.preventDefault();
      filtrarYMostrar();
    });
    inputBuscar.addEventListener('input', filtrarYMostrar);
  }

  // Iniciar carga de productos y ubicación al cargar la página
  cargarProductos();
  obtenerUbicacion();
});
