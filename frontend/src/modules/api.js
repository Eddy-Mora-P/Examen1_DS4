import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { ErrorApi } from "./errores.js";
import { obtenerToken, olvidarSesion } from "./auth.js";

export const request = async (ruta, opciones = {}) => {
  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  try {
    const headers = new Headers(opciones.headers || {});
    headers.set("Accept", "application/json");

    const token = obtenerToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let body = opciones.body;
    if (body && typeof body === "object" && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(body);
    }

    const respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...opciones,
      headers,
      body,
      signal: controlador.signal,
    });

    if (respuesta.status === 204) {
      return null;
    }

    const texto = await respuesta.text();
    let cuerpoJson = {};
    if (texto) {
      try {
        cuerpoJson = JSON.parse(texto);
      } catch {
        cuerpoJson = {};
      }
    }

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        olvidarSesion();
        window.location.reload();
      }
      throw new ErrorApi(respuesta.status, cuerpoJson);
    }

    return cuerpoJson;
  } finally {
    clearTimeout(timeout);
  }
};
