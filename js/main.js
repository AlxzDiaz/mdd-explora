/* MDD Explora — interacciones de la interfaz.
   Cada función revisa si su bloque existe en la página actual. */
(function () {
  "use strict";

  var data = window.MDD;
  var TIPOS = { tour: "Tour", hospedaje: "Hospedaje", transporte: "Transporte" };

  function soles(n) {
    return "S/ " + n.toLocaleString("es-PE");
  }

  function buscarServicio(id) {
    return data.servicios.find(function (s) {
      return s.id === id;
    });
  }

  function escapar(texto) {
    var div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  /* ---------- Menú móvil (bloque nav) ---------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var toggle = nav.querySelector(".nav__toggle");

    toggle.addEventListener("click", function () {
      var abierto = nav.classList.toggle("nav--open");
      toggle.setAttribute("aria-expanded", String(abierto));
    });

    nav.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("nav--open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Plantilla de tarjeta (bloque card) ---------- */
  function tarjeta(s) {
    var empresa = data.empresas[s.empresa];
    return (
      '<article class="card' + (s.destacado ? " card--featured" : "") + '">' +
      '<div class="card__media">' +
      '<img class="card__image" src="' + s.imagen + '" alt="" loading="lazy" width="400" height="250">' +
      '<div class="card__badges">' +
      '<span class="badge badge--' + s.tipo + '">' + TIPOS[s.tipo] + "</span>" +
      (s.destacado ? '<span class="badge badge--featured">Destacado</span>' : "") +
      "</div></div>" +
      '<div class="card__body">' +
      '<span class="card__company">' + escapar(empresa.nombre) + "</span>" +
      '<h3 class="card__title">' + escapar(s.nombre) + "</h3>" +
      '<p class="card__description">' + escapar(s.descripcion) + "</p>" +
      '<div class="card__meta"><span>⏱ ' + s.duracion + "</span><span>★ " + s.rating.toFixed(1) + "</span></div>" +
      '<div class="card__footer">' +
      '<p class="card__price">' + soles(s.precio) + '<span class="card__price-unit">' + s.unidad + "</span></p>" +
      '<a class="button button--primary button--small" href="reservar.html?servicios=' + s.id + '">Reservar</a>' +
      "</div></div></article>"
    );
  }

  /* ---------- Catálogo con filtros (servicios.html) ---------- */
  function initCatalogo() {
    var lista = document.getElementById("catalogo");
    if (!lista) return;

    var buscador = document.getElementById("buscar");
    var orden = document.getElementById("orden");
    var contador = document.getElementById("contador");
    var chips = document.querySelectorAll(".filter__chip");
    var params = new URLSearchParams(location.search);
    var tipoActivo = params.get("tipo") || "todos";

    function pintar() {
      var texto = buscador.value.trim().toLowerCase();
      var resultado = data.servicios.filter(function (s) {
        var empresa = data.empresas[s.empresa].nombre;
        var coincideTipo = tipoActivo === "todos" || s.tipo === tipoActivo;
        var coincideTexto = (s.nombre + " " + s.descripcion + " " + empresa).toLowerCase().indexOf(texto) !== -1;
        return coincideTipo && coincideTexto;
      });

      if (orden.value === "precio-asc") resultado.sort(function (a, b) { return a.precio - b.precio; });
      if (orden.value === "precio-desc") resultado.sort(function (a, b) { return b.precio - a.precio; });
      if (orden.value === "rating") resultado.sort(function (a, b) { return b.rating - a.rating; });

      lista.innerHTML = resultado.length
        ? resultado.map(tarjeta).join("")
        : '<p class="planner__empty">No encontramos servicios con ese filtro.</p>';
      contador.textContent = resultado.length + (resultado.length === 1 ? " servicio encontrado" : " servicios encontrados");
    }

    chips.forEach(function (chip) {
      chip.classList.toggle("filter__chip--active", chip.dataset.tipo === tipoActivo);
      chip.setAttribute("aria-pressed", String(chip.dataset.tipo === tipoActivo));
      chip.addEventListener("click", function () {
        tipoActivo = chip.dataset.tipo;
        chips.forEach(function (c) {
          var activo = c === chip;
          c.classList.toggle("filter__chip--active", activo);
          c.setAttribute("aria-pressed", String(activo));
        });
        pintar();
      });
    });

    buscador.addEventListener("input", pintar);
    orden.addEventListener("change", pintar);
    pintar();
  }

  /* ---------- Planificador por presupuesto (index.html) ---------- */
  function armarPaquete(dias, presupuesto) {
    var elegidos = [];
    var total = 0;

    function agregar(s) {
      elegidos.push(s);
      total += s.precio;
    }

    var noches = Math.max(dias - 1, 0);
    var traslado = buscarServicio("traslado-fluvial");
    var bungalow = buscarServicio("noche-bungalow");

    if (noches > 0) {
      agregar(traslado);
      for (var i = 0; i < noches; i++) agregar(bungalow);
    }

    // Tours y paseos: uno por día como máximo, priorizando los mejor calificados
    var actividades = data.servicios
      .filter(function (s) {
        return !s.soloCatalogo && (s.tipo === "tour" || s.id === "lago-valencia");
      })
      .sort(function (a, b) { return b.rating - a.rating; });

    actividades.forEach(function (s) {
      var tours = elegidos.filter(function (e) { return e.tipo !== "hospedaje" && e.id !== "traslado-fluvial"; });
      if (tours.length < dias && total + s.precio <= presupuesto) agregar(s);
    });

    return { elegidos: elegidos, total: total, noches: noches };
  }

  function initPlanner() {
    var form = document.getElementById("planner-form");
    if (!form) return;
    var salida = document.getElementById("planner-result");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var dias = Number(form.dias.value);
      var presupuesto = Number(form.presupuesto.value);
      var personas = Math.max(Number(form.personas.value) || 1, 1);

      if (!presupuesto || presupuesto < 40) {
        salida.innerHTML = '<p class="planner__empty">Ingresa un presupuesto de al menos S/ 40 por persona.</p>';
        return;
      }

      var p = armarPaquete(dias, presupuesto);
      var hayActividad = p.elegidos.some(function (s) { return s.tipo === "tour" || s.id === "lago-valencia"; });

      if (p.total > presupuesto || !hayActividad) {
        salida.innerHTML =
          '<h3 class="planner__result-title">Necesitas un poco más</h3>' +
          '<p class="planner__empty">Con ' + soles(presupuesto) + " por persona no alcanza para " + dias +
          (dias === 1 ? " día" : " días") + " con hospedaje y una actividad. Prueba con menos días o un presupuesto mayor.</p>";
        return;
      }

      var ids = p.elegidos.map(function (s) { return s.id; });
      var items = p.elegidos.map(function (s) {
        return '<li class="planner__item"><span>' + escapar(s.nombre) +
          '<span class="planner__item-company">' + escapar(data.empresas[s.empresa].nombre) + "</span></span>" +
          "<strong>" + soles(s.precio) + "</strong></li>";
      }).join("");

      salida.innerHTML =
        '<h3 class="planner__result-title">Tu experiencia de ' + dias + (dias === 1 ? " día" : " días") + "</h3>" +
        '<ul class="planner__list">' + items + "</ul>" +
        '<p class="planner__total"><span>Total por persona</span><span>' + soles(p.total) + "</span></p>" +
        '<p class="planner__note">Para ' + personas + (personas === 1 ? " persona" : " personas") + ": <strong>" +
        soles(p.total * personas) + "</strong>." +
        (presupuesto > p.total ? " Te sobran " + soles(presupuesto - p.total) + " por persona para restaurantes." : "") + "</p>" +
        '<a class="button button--primary button--block" href="reservar.html?servicios=' + ids.join(",") +
        "&personas=" + personas + '">Reservar este paquete</a>';
    });
  }

  /* ---------- Mapa interactivo (Leaflet + OpenStreetMap) ---------- */
  function initMapa() {
    var el = document.getElementById("mapa");
    if (!el || typeof L === "undefined") return;

    var mapa = L.map(el, { scrollWheelZoom: false }).setView([-12.66, -69.1], 9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap",
    }).addTo(mapa);

    var marcadores = {};
    document.querySelectorAll(".map__place").forEach(function (btn) {
      var lat = Number(btn.dataset.lat);
      var lng = Number(btn.dataset.lng);
      var nombre = btn.querySelector(".map__place-name").textContent;
      marcadores[nombre] = L.marker([lat, lng]).addTo(mapa).bindPopup("<strong>" + nombre + "</strong>");
      btn.addEventListener("click", function () {
        mapa.flyTo([lat, lng], 12);
        marcadores[nombre].openPopup();
      });
    });
  }

  /* ---------- Formulario de reserva (reservar.html) ---------- */
  function initReserva() {
    var form = document.getElementById("reserva-form");
    if (!form) return;

    var opciones = document.getElementById("opciones-servicios");
    var resumen = document.getElementById("resumen-lista");
    var totalEl = document.getElementById("resumen-total");
    var personasEl = document.getElementById("resumen-personas");
    var mensaje = document.getElementById("reserva-mensaje");
    var params = new URLSearchParams(location.search);
    var preseleccion = (params.get("servicios") || "").split(",");

    if (params.get("personas")) form.personas.value = params.get("personas");

    // Fecha mínima: mañana
    var manana = new Date();
    manana.setDate(manana.getDate() + 1);
    form.fecha.min = manana.toISOString().slice(0, 10);

    opciones.innerHTML = data.servicios.map(function (s) {
      var marcado = preseleccion.indexOf(s.id) !== -1 ? " checked" : "";
      return '<label class="form__option">' +
        '<input class="form__checkbox" type="checkbox" name="servicio" value="' + s.id + '"' + marcado + ">" +
        '<span class="form__option-text">' + escapar(s.nombre) +
        '<span class="form__option-company">' + escapar(data.empresas[s.empresa].nombre) + " · " + s.unidad + "</span></span>" +
        '<span class="form__option-price">' + soles(s.precio) + "</span></label>";
    }).join("");

    // Si llegan varias noches del mismo servicio desde el planificador
    var noches = preseleccion.filter(function (id) { return id === "noche-bungalow"; }).length;

    function seleccionados() {
      return Array.prototype.map.call(form.querySelectorAll(".form__checkbox:checked"), function (c) {
        return buscarServicio(c.value);
      });
    }

    function actualizar() {
      var lista = seleccionados();
      var personas = Math.max(Number(form.personas.value) || 1, 1);
      var subtotal = 0;

      resumen.innerHTML = lista.length
        ? lista.map(function (s) {
            var veces = s.id === "noche-bungalow" && noches > 1 ? noches : 1;
            subtotal += s.precio * veces;
            return '<li class="summary__item"><span>' + escapar(s.nombre) + (veces > 1 ? " × " + veces : "") +
              "</span><span>" + soles(s.precio * veces) + "</span></li>";
          }).join("")
        : '<li class="summary__empty">Aún no eliges servicios.</li>';

      personasEl.textContent = personas + (personas === 1 ? " persona" : " personas") + " × " + soles(subtotal);
      totalEl.textContent = soles(subtotal * personas);
    }

    form.addEventListener("change", actualizar);
    form.addEventListener("input", actualizar);
    actualizar();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lista = seleccionados();
      var errores = [];

      form.querySelectorAll(".form__input").forEach(function (input) {
        var valido = input.checkValidity();
        input.classList.toggle("form__input--invalid", !valido);
        if (!valido) errores.push(input.dataset.nombre || input.name);
      });
      if (!lista.length) errores.unshift("al menos un servicio");

      if (errores.length) {
        mensaje.className = "alert alert--error";
        mensaje.innerHTML = '<p class="alert__title">Revisa el formulario</p>' +
          '<p class="alert__text">Falta completar: ' + errores.join(", ") + ".</p>";
        mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      var codigo = "MDD-" + Date.now().toString(36).toUpperCase().slice(-6);
      var empresas = lista
        .map(function (s) { return data.empresas[s.empresa].nombre; })
        .filter(function (n, i, arr) { return arr.indexOf(n) === i; });

      mensaje.className = "alert alert--success";
      mensaje.innerHTML = '<p class="alert__title">¡Solicitud registrada! Código ' + codigo + "</p>" +
        '<p class="alert__text">Gracias, ' + escapar(form.nombre.value.split(" ")[0]) +
        ". Enviamos tu solicitud a " + escapar(empresas.join(", ")) +
        ". Recibirás la confirmación en " + escapar(form.correo.value) + " en menos de 24 horas.</p>" +
        '<p class="alert__text"><em>Demostración: en esta fase no se envían datos a ningún servidor.</em></p>';
      mensaje.scrollIntoView({ behavior: "smooth", block: "center" });
      form.reset();
      actualizar();
    });
  }

  /* ---------- Año del pie de página ---------- */
  function initAnio() {
    document.querySelectorAll("[data-anio]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initCatalogo();
    initPlanner();
    initMapa();
    initReserva();
    initAnio();
  });
})();
