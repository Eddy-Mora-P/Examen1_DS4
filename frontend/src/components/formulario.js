import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

const textoOriginalBoton = $btnGuardar ? $btnGuardar.textContent : "Guardar";

export const iniciarFormulario = ({ alGuardar }) => {
  if (!$form || !$selectCategoria || !$btnGuardar) {
    return;
  }

  listarCategorias()
    .then((respuesta) => {
      const categorias = respuesta?.data ?? respuesta ?? [];
      categorias.forEach((categoria) => {
        const opcion = document.createElement("option");
        opcion.value = categoria.id;
        opcion.textContent = categoria.nombre;
        $selectCategoria.appendChild(opcion);
      });
    })
    .catch((error) => {
      mostrarMensaje("error", error?.message ?? "No se pudieron cargar las categorías.");
    });

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    $form.querySelectorAll("[data-error]").forEach((el) => {
      el.textContent = "";
    });
    $form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
    });

    const formData = new FormData($form);
    const datos = {};
    for (const [clave, valor] of formData.entries()) {
      datos[clave] = valor;
    }

    if (datos.categoria_id !== undefined && datos.categoria_id !== "") {
      datos.categoria_id = Number(datos.categoria_id);
    }
    if (datos.costo_interno !== undefined && datos.costo_interno !== "") {
      datos.costo_interno = Number(datos.costo_interno);
    }

    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const respuesta = await crearEquipo(datos);
      const equipo = respuesta?.data ?? respuesta;
      $form.reset();
      mostrarMensaje("exito", `Equipo ${equipo?.codigo ?? ""} registrado.`);
      if (typeof alGuardar === "function") {
        alGuardar();
      }
    } catch (error) {
      if (error?.status === 422 && error?.datos?.errors) {
        const errores = error.datos.errors;
        Object.keys(errores).forEach((campo) => {
          const mensajes = errores[campo];
          const mensaje = Array.isArray(mensajes) ? mensajes[0] : mensajes;
          const $errorEl = $form.querySelector(`[data-error="${campo}"]`);
          if ($errorEl) {
            $errorEl.textContent = mensaje;
          }
          const $campoEl = $form.querySelector(`[name="${campo}"]`);
          if ($campoEl) {
            $campoEl.setAttribute("aria-invalid", "true");
          }
        });
      } else {
        mostrarMensaje("error", error?.message ?? "Ocurrió un error al guardar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginalBoton;
    }
  });
};
