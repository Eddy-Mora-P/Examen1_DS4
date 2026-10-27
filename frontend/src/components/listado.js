import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

// YA IMPLEMENTADO — "2026-09-15" -> "15 set 2026"
export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

export const cargarPagina = async (pagina = 1) => {
  if (!$lista) {
    return;
  }

  $lista.setAttribute("aria-busy", "true");

  try {
    const respuesta = await listarEquipos(pagina, POR_PAGINA);
    const equipos = respuesta?.data ?? [];
    const meta = respuesta?.meta ?? {};
    const links = respuesta?.links ?? {};

    paginaActual = meta.current_page ?? pagina;
    ultimaPagina = meta.last_page ?? paginaActual;

    $lista.innerHTML = "";

    if (!equipos.length) {
      const $vacio = document.createElement("li");
      $vacio.className = "vacio";
      $vacio.textContent = "No hay equipos registrados.";
      $lista.appendChild($vacio);
    } else {
      equipos.forEach((equipo) => {
        const $nodo = $plantilla.content.cloneNode(true);
        const $li = $nodo.querySelector("li");
        const $codigo = $nodo.querySelector(".codigo");
        const $nombre = $nodo.querySelector(".nombre");
        const $categoria = $nodo.querySelector(".categoria");
        const $fecha = $nodo.querySelector(".fecha");
        const $estado = $nodo.querySelector(".estado");

        if ($li) {
          $li.dataset.id = equipo.id;
        }
        if ($codigo) {
          $codigo.textContent = equipo.codigo ?? "";
        }
        if ($nombre) {
          $nombre.textContent = equipo.nombre ?? "";
        }
        if ($categoria) {
          $categoria.textContent = equipo.categoria?.nombre ?? "";
        }
        if ($fecha) {
          $fecha.textContent = formatearFecha(equipo.fecha_adquisicion);
        }
        if ($estado) {
          $estado.textContent = equipo.estado ?? "";
          $estado.dataset.estado = equipo.estado ?? "";
        }

        $lista.appendChild($nodo);
      });
    }

    if ($resumen) {
      const from = meta.from ?? 0;
      const to = meta.to ?? 0;
      const total = meta.total ?? 0;
      $resumen.textContent = `Mostrando ${from}–${to} de ${total}`;
    }

    if ($paginaActual) {
      $paginaActual.textContent = `Página ${meta.current_page ?? paginaActual} de ${meta.last_page ?? ultimaPagina}`;
    }

    if ($btnAnterior) {
      $btnAnterior.disabled = paginaActual <= 1;
    }
    if ($btnSiguiente) {
      $btnSiguiente.disabled = paginaActual >= ultimaPagina;
    }
  } catch (error) {
    mostrarMensaje("error", error?.message ?? "No se pudo cargar el listado de equipos.");
  } finally {
    $lista.removeAttribute("aria-busy");
  }
};

const alHacerClicEnLista = async (evento) => {
  const $boton = evento.target.closest(".btn-eliminar");
  if (!$boton) {
    return;
  }

  const $li = $boton.closest("li[data-id]");
  const id = $li?.dataset.id;

  if (!id) {
    return;
  }

  if (!confirm("¿Eliminar este equipo?")) {
    return;
  }

  try {
    await eliminarEquipo(id);
    mostrarMensaje("exito", "Equipo eliminado.");

    const items = $lista.querySelectorAll("li[data-id]");
    if (items.length === 1 && paginaActual > 1) {
      await cargarPagina(paginaActual - 1);
    } else {
      await cargarPagina(paginaActual);
    }
  } catch (error) {
    if (error?.status === 409) {
      mostrarMensaje("error", error?.datos?.mensaje ?? error?.message ?? "No se puede eliminar el equipo.");
    } else {
      mostrarMensaje("error", error?.message ?? "Ocurrió un error al eliminar el equipo.");
    }
  }
};

export const iniciarListado = () => {
  if ($lista) {
    $lista.addEventListener("click", alHacerClicEnLista);
  }

  if ($btnAnterior) {
    $btnAnterior.addEventListener("click", () => {
      if (paginaActual > 1) {
        cargarPagina(paginaActual - 1);
      }
    });
  }

  if ($btnSiguiente) {
    $btnSiguiente.addEventListener("click", () => {
      if (paginaActual < ultimaPagina) {
        cargarPagina(paginaActual + 1);
      }
    });
  }

  cargarPagina(1);
};
