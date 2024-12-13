const urlApi = 'https://api.escuelajs.co/api/v1';
const aplicacion = document.getElementById('app');
let pagina = 0;
const limite = 10;
let estaCargando = false;
let sinMasProductos = false; 


// Función para obtener productos con paginación
const obtenerProductos = async () => {
    const respuesta = await fetch(`${urlApi}/products?offset=${pagina}&limit=${limite}`);
    const datos = await respuesta.json();
    return datos;
};

const mostrarCategorias = async () => {
    aplicacion.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 1rem;">Explora Nuestras Categorías</h2>
        <div class="search-container" style="text-align: center; margin-bottom: 2rem;">
            <!-- Campo de búsqueda -->
            <input 
                type="text" 
                id="category-search" 
                placeholder="Buscar categoría..." 
                style="padding: 0.5rem; font-size: 1rem; width: 50%; border-radius: 5px; border: 1px solid #ccc;"
            />
            <!-- Selector para filtrar -->
            <select 
                id="category-select" 
                style="padding: 0.5rem; font-size: 1rem; margin-left: 1rem; border-radius: 5px; border: 1px solid #ccc;"
            >
                <option value="">Selecciona una categoría</option>
            </select>
        </div>
        <section id="categories-grid" class="categories-grid"></section>
    `;

    const gridCategorias = document.getElementById('categories-grid');
    const inputBusqueda = document.getElementById('category-search');
    const selectCategoria = document.getElementById('category-select');

    // Obtener las primeras 5 categorías
    const obtenerCategorias = async () => {
        try {
            const respuesta = await fetch(`${urlApi}/categories`);
            const categorias = await respuesta.json();
            return categorias.slice(0, 5); 
        } catch (error) {
            console.error("Error al cargar las categorías:", error);
            return [];
        }
    };

    // Renderizar tarjetas de categorías
    const mostrarTarjetasCategorias = (categorias) => {
        gridCategorias.innerHTML = ''; 
        categorias.forEach(categoria => {
            const tarjeta = document.createElement('div');
            tarjeta.classList.add('category-card');
            tarjeta.innerHTML = `
                <img src="${categoria.image}" alt="${categoria.name}">
                <h3>${categoria.name}</h3>
            `;
            tarjeta.onclick = () => mostrarProductosPorCategoria(categoria.id);
            gridCategorias.appendChild(tarjeta);

            // Agregar opciones al selector si no existen
            if (!Array.from(selectCategoria.options).some(opt => opt.value == categoria.id)) {
                const opcionNueva = document.createElement('option');
                opcionNueva.value = categoria.id;
                opcionNueva.textContent = categoria.name;
                selectCategoria.appendChild(opcionNueva);
            }
        });
    };

    // Función para aplicar filtros
    const aplicarFiltros = (categorias) => {
        const consulta = inputBusqueda.value.toLowerCase();
        const idSeleccionado = selectCategoria.value;

        const filtrado = categorias.filter(categoria => {
            const coincideBusqueda = categoria.name.toLowerCase().includes(consulta);
            const coincideSeleccion = idSeleccionado ? categoria.id == idSeleccionado : true;
            return coincideBusqueda && coincideSeleccion;
        });

        mostrarTarjetasCategorias(filtrado);
    };

    // Eventos del input y el selector
    inputBusqueda.addEventListener('input', () => aplicarFiltros(todasLasCategorias));
    selectCategoria.addEventListener('change', () => aplicarFiltros(todasLasCategorias));

    // Cargar y mostrar las 5 categorías
    const todasLasCategorias = await obtenerCategorias();
    mostrarTarjetasCategorias(todasLasCategorias);
};

// Cerrar al hacer clic fuera del modal
window.onclick = (event) => {
    const modal = document.getElementById('modal-detalle');
    if (modal && event.target === modal) {
        modal.style.display = "none";
    }
};

// Carrito de compras
let carrito = JSON.parse(localStorage.getItem('cart')) || [];

// Función para obtener producto por ID
const obtenerProductoPorId = async (id) => {
    const respuesta = await fetch(`${urlApi}/products/${id}`);
    const producto = await respuesta.json();
    return producto;
};

const agregarAlCarrito = async (id) => {
    let productoEnCarrito = carrito.find(item => item.id === id);
    if (productoEnCarrito) {
        productoEnCarrito.quantity += 1;
    } else {
        const producto = await obtenerProductoPorId(id);
        productoEnCarrito = {
            id: producto.id,
            title: producto.title,
            price: producto.price,
            quantity: 1,
            image: producto.images[0] || ''
        };
        carrito.push(productoEnCarrito);
    }

    localStorage.setItem('cart', JSON.stringify(carrito));
    alert('Producto agregado al carrito');
    mostrarCarritoCompras();
};

const mostrarCarritoCompras = () => {
    window.onscroll = null;

    aplicacion.innerHTML = '<h2>Carrito de Compras</h2>';

    if (carrito.length === 0) {
        aplicacion.innerHTML += '<p>El carrito está vacío.</p>';
        return;
    }

    let totalCarrito = 0;
    carrito.forEach(item => {
        const lineaTotal = item.price * item.quantity;
        totalCarrito += lineaTotal;

        const itemCarrito = document.createElement('div');
        itemCarrito.classList.add('cart-item');
        itemCarrito.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-info">
                <h3>${item.title}</h3>
                <p>Precio: $${item.price}</p>
                <p>
                    Cantidad: 
                    <button class="btn-quantity" onclick="actualizarCantidadCarrito(${item.id}, -1)">Quitar</button>
                    ${item.quantity}
                    <button class="btn-quantity" onclick="actualizarCantidadCarrito(${item.id}, 1)">Añadir</button>
                </p>
                <p>Total: $${lineaTotal}</p>
                <button onclick="eliminarDelCarrito(${item.id})">Eliminar</button>
            </div>
        `;
        aplicacion.appendChild(itemCarrito);
    });

    const pieCarrito = document.createElement('div');
    pieCarrito.classList.add('cart-footer');
    pieCarrito.innerHTML = `
        <h3>Total Carrito: $${totalCarrito}</h3>
        <button onclick="finalizarCompra()">Finalizar Pedido</button>
    `;
    aplicacion.appendChild(pieCarrito);
};

const actualizarCantidadCarrito = (id, cambio) => {
    const productoEnCarrito = carrito.find(item => item.id === id);

    if (productoEnCarrito) {
        productoEnCarrito.quantity += cambio;

        if (productoEnCarrito.quantity <= 0) {
            eliminarDelCarrito(id);
        } else {
            localStorage.setItem('cart', JSON.stringify(carrito));
            mostrarCarritoCompras();
        }
    }
};

const eliminarDelCarrito = (id) => {
    carrito = carrito.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(carrito));
    mostrarCarritoCompras();
};

const finalizarCompra = () => {
    alert('Pedido finalizado. Gracias por su compra.');
    carrito = [];
    localStorage.removeItem('cart');
    mostrarCarritoCompras();
};


// Función para mostrar la página inicial
const mostrarPaginaInicial = async () => {
    aplicacion.innerHTML = `
        <h2>Explora Nuestras Categorías</h2>
        <section id="categories-grid" class="categories-grid"></section>

        <!-- Contenedor de Navidad -->
        <div id="navidad-container"></div>

    `;
    mostrarCategoriasInicio();
};

// Mostrar categorías (solo las primeras 5) en la página inicial
const mostrarCategoriasInicio = async () => {
    const gridCategorias = document.getElementById('categories-grid');
    gridCategorias.innerHTML = 'Cargando categorías...';

    try {
        const respuesta = await fetch(`${urlApi}/categories`);
        const categorias = await respuesta.json();

        gridCategorias.innerHTML = ''; 

        categorias.slice(0, 5).forEach(categoria => {
            const tarjeta = document.createElement('div');
            tarjeta.classList.add('category-card');
            tarjeta.innerHTML = `
                <img src="${categoria.image}" alt="${categoria.name}">
                <h3>${categoria.name}</h3>
            `;
            tarjeta.onclick = () => mostrarProductosPorCategoria(categoria.id); 
            gridCategorias.appendChild(tarjeta);
        });
    } catch (error) {
        gridCategorias.innerHTML = '<p>Error al cargar categorías.</p>';
        console.error(error);
    }
};

// Renderizar la sección de categorías
const mostrarSeccionCategorias = async () => {
    aplicacion.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 1rem;">Explora Nuestras Categorías</h2>
        <div class="search-container" style="text-align: center; margin-bottom: 2rem;">
            <!-- Campo de búsqueda -->
            <input 
                type="text" 
                id="category-search" 
                placeholder="Buscar categoría..." 
                style="padding: 0.5rem; font-size: 1rem; width: 50%; border-radius: 5px; border: 1px solid #ccc;"
            />
            <!-- Selector para filtrar -->
            <select 
                id="category-select" 
                style="padding: 0.5rem; font-size: 1rem; margin-left: 1rem; border-radius: 5px; border: 1px solid #ccc;"
            >
                <option value="">Selecciona una categoría</option>
            </select>
        </div>
        <section id="categories-grid" class="categories-grid"></section>
    `;

    const gridCategorias = document.getElementById('categories-grid');
    const inputBusqueda = document.getElementById('category-search');
    const selectCategoria = document.getElementById('category-select');

    // Obtener solo las primeras 5 categorías
    const obtenerCategorias = async () => {
        try {
            const respuesta = await fetch(`${urlApi}/categories`);
            const categorias = await respuesta.json();
            return categorias.slice(0, 5); 
        } catch (error) {
            console.error("Error al cargar las categorías:", error);
            return [];
        }
    };

    const mostrarTarjetasCategorias = (categorias) => {
        gridCategorias.innerHTML = ''; 

        categorias.forEach(categoria => {
            const tarjeta = document.createElement('div');
            tarjeta.classList.add('category-card');
            tarjeta.innerHTML = `
                <img src="${categoria.image}" alt="${categoria.name}">
                <h3>${categoria.name}</h3>
            `;
            tarjeta.onclick = () => mostrarProductosPorCategoria(categoria.id);
            gridCategorias.appendChild(tarjeta);

            // Agregar opciones al selector si aún no existen
            if (!Array.from(selectCategoria.options).some(opcion => opcion.value == categoria.id)) {
                const opcionNueva = document.createElement('option');
                opcionNueva.value = categoria.id;
                opcionNueva.textContent = categoria.name;
                selectCategoria.appendChild(opcionNueva);
            }
        });
    };

    const aplicarFiltros = (categorias) => {
        const consulta = inputBusqueda.value.toLowerCase();
        const idSeleccionado = selectCategoria.value;

        const filtrado = categorias.filter(categoria => {
            const coincideBusqueda = categoria.name.toLowerCase().includes(consulta);
            const coincideSeleccion = idSeleccionado ? categoria.id == idSeleccionado : true;
            return coincideBusqueda && coincideSeleccion;
        });

        mostrarTarjetasCategorias(filtrado);
    };

    inputBusqueda.addEventListener('input', () => aplicarFiltros(todasLasCategorias));
    selectCategoria.addEventListener('change', () => aplicarFiltros(todasLasCategorias));

    const todasLasCategorias = await obtenerCategorias();
    mostrarTarjetasCategorias(todasLasCategorias);
};

// Mostra Detalles
const mostrarDetalleProducto = async (id) => {
    window.onscroll = null;

    const modal = document.getElementById('modal-detalle');
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = '<p>Cargando detalle del producto...</p>';

    try {
        const respuesta = await fetch(`${urlApi}/products/${id}`);
        const producto = await respuesta.json();

        // Si no hay imágenes válidas, usar la imagen por defecto
        let imagenes = (producto.images && producto.images.length > 0 && producto.images.some(img => img)) 
            ? producto.images.filter(img => img) // Filtrar imágenes vacías
            : ['img/notFound.jpg'];

        let indiceActual = 0;

        // Función para actualizar la imagen mostrada
        const actualizarImagen = () => {
            const imgPrincipal = document.querySelector('.main-image');
            imgPrincipal.src = imagenes[indiceActual];
        };

        modalBody.innerHTML = `
        <div class="product-detail" style="position: relative; text-align: center;">
            <!-- Contenedor de imagen con flechas -->
            <div class="image-container" style="display: flex; justify-content: center; align-items: center; position: relative;">
                <button class="arrow prev" onclick="cambiarImagen(-1)" 
                        style="position: absolute; top: 50%; left: 0; transform: translateY(-50%);
                        background: rgba(0, 0, 0, 0.5); color: white; border: none; border-radius: 50%; 
                        padding: 0.5rem 0.75rem; cursor: pointer; font-size: 1.2rem;">❮</button>
                <img src="${imagenes[indiceActual]}" class="main-image" alt="Imagen del producto"
                     style="width: 300px; height: 300px; object-fit: cover; border-radius: 8px;"
                     onerror="this.onerror=null; this.src='img/notFound.jpg';">
                <button class="arrow next" onclick="cambiarImagen(1)" 
                        style="position: absolute; top: 50%; right: 0; transform: translateY(-50%);
                        background: rgba(0, 0, 0, 0.5); color: white; border: none; border-radius: 50%; 
                        padding: 0.5rem 0.75rem; cursor: pointer; font-size: 1.2rem;">❯</button>
            </div>
            <h2>${producto.title}</h2>
            <p>${producto.description}</p>
            <p class="precio" style="font-size: 1.5rem; color: #ff6f61;">Precio: $${producto.price}</p>
            <button onclick="agregarAlCarrito(${producto.id})" 
                    style="padding: 0.5rem 1rem; background-color: #ff6f61; color: white; border: none; border-radius: 8px; cursor: pointer;">
                Agregar al carrito
            </button>
        </div>
    `;
    

        // Función global para cambiar imágenes
        window.cambiarImagen = (direccion) => {
            indiceActual += direccion;
            if (indiceActual < 0) indiceActual = imagenes.length - 1; // Volver al final
            if (indiceActual >= imagenes.length) indiceActual = 0;   // Volver al inicio
            actualizarImagen();
        };

        modal.style.display = "block";

    } catch (error) {
        console.error('Error al cargar detalles del producto:', error);
        modalBody.innerHTML = '<p>Error al cargar detalles del producto.</p>';
    }
};

const mostrarProductosPorCategoria = async (idCategoria) => {
    let pagina = 0;
    let sinMasProductos = false;
    let estaCargando = false;

    aplicacion.innerHTML = '<h2>Productos por Categoría</h2>';

    // Crear botón "Cargar más"
    const botonCargarMas = document.createElement('button');
    botonCargarMas.textContent = 'Cargar más';
    botonCargarMas.style.display = 'block';
    botonCargarMas.style.margin = '20px auto';
    botonCargarMas.style.padding = '10px 20px';
    botonCargarMas.disabled = false;

    // Crear preloader
    const preloader = document.createElement('div');
    preloader.innerHTML = 'Cargando...';
    preloader.style.display = 'none';
    preloader.style.textAlign = 'center';
    preloader.style.margin = '10px';

    aplicacion.appendChild(preloader);
    aplicacion.appendChild(botonCargarMas);

    const cargarMasProductos = async () => {
        if (estaCargando || sinMasProductos) return;

        estaCargando = true;
        preloader.style.display = 'block';
        botonCargarMas.disabled = true; 

        try {
            const respuesta = await fetch(`${urlApi}/products/?categoryId=${idCategoria}&offset=${pagina * limite}&limit=${limite}`);
            const productos = await respuesta.json();

            if (productos.length === 0) {
                sinMasProductos = true;
                botonCargarMas.textContent = 'No hay más productos disponibles';
                botonCargarMas.disabled = true;
            } else {
                productos.forEach(producto => {
                    const tarjeta = document.createElement('div');
                    tarjeta.classList.add('product-card');
                
                    // Imagen por defecto si no hay imagen disponible
                    const imagenProducto = producto.images && producto.images.length > 0 && producto.images[0] 
                        ? producto.images[0] 
                        : 'img/notFound.jpg'; // Ruta correcta de la imagen por defecto
                
                    tarjeta.innerHTML = `
                        <img src="${imagenProducto}" alt="${producto.title}" onerror="this.onerror=null; this.src='img/notFound.jpg';">
                        <h3>${producto.title}</h3>
                        <p>$${producto.price}</p>
                        <button onclick="agregarAlCarrito(${producto.id})">Agregar al carrito</button>
                        <button onclick="mostrarDetalleProducto(${producto.id})">Ver Detalle</button>
                    `;
                    aplicacion.insertBefore(tarjeta, preloader);
                });
                
                
                pagina++;
                botonCargarMas.disabled = false; 
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            aplicacion.innerHTML += '<p>Error al cargar productos.</p>';
        } finally {
            preloader.style.display = 'none'; 
            estaCargando = false;
        }
    };

    // Botón "Cargar más"
    botonCargarMas.onclick = cargarMasProductos;

    // Scroll infinito
    window.onscroll = () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            cargarMasProductos();
        }
    };

    // Cargar productos iniciales
    cargarMasProductos();
};


window.onclick = (event) => {
    const modal = document.getElementById('modal-detalle');
    if (modal && event.target === modal) {
        modal.style.display = "none";
    }
};

// Función para cerrar el modal
const cerrarModal = () => {
    const modal = document.getElementById('modal-detalle');
    modal.style.display = "none";
};

// Funciones para coincidir con las llamadas del HTML
const mostrarInicio = () => {
    mostrarPaginaInicial();
};

const mostrarCarrito = () => {
    mostrarCarritoCompras();
};

// Cargar la página inicial al abrir
document.addEventListener('DOMContentLoaded', () => {
    mostrarPaginaInicial();
});