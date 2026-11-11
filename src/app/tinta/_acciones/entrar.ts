"use server";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/db/conexion";
import { MENSAJE_PIN_FACIL } from "@/lib/admin/pin";
import { PANEL } from "@/lib/admin/ruta";
import {
  COOKIE_BIO,
  NOMBRE_SITIO,
  credencialDeEsteAparato,
  dominioYOrigen,
  guardarDesafio,
  tomarDesafio,
} from "@/lib/admin/biometria";
import {
  abrirSesion,
  anotarFallo,
  bloquear,
  cerrarSesion,
  desbloquear,
  hashPin,
  igualesSinFiltrar,
  leerSesion,
  mensajeCastigo,
  minutosDeCastigo,
  nombreDelAparato,
  pinCorrecto,
  pinDemasiadoFacil,
  pinValido,
  usuarioActual,
} from "@/lib/admin/sesion";

/**
 * Entrar al panel, desbloquearlo y activar la biometría.
 *
 * Tres momentos distintos:
 *
 *   1. Aparato nuevo: nombre + clave del panel + PIN propio (se crea la
 *      primera vez). La clave sola no basta porque la conoce todo el equipo, y
 *      el PIN solo tampoco, porque son cuatro dígitos expuestos a internet.
 *   2. Aparato conocido y bloqueado por inactividad: PIN o Face ID / huella.
 *      Ya no se pide nombre ni clave: la sesión dice de quién es el teléfono.
 *   3. Adentro: activar o quitar la biometría en este aparato. Es opcional.
 *
 * Todo error se dice en castellano y nunca revela de más: una clave
 * equivocada no dice si el PIN existe, ni al revés.
 */
type Respuesta = { ok: true } | { ok: false; error: string };

/**
 * Sin clave configurada no se entra: una clave por defecto escrita en un
 * repositorio público es una puerta abierta.
 */
const CLAVE_PANEL = process.env.ADMIN_CLAVE ?? "";
const SIN_CLAVE = "Falta configurar ADMIN_CLAVE en el servidor.";

async function aparato(): Promise<string> {
  return nombreDelAparato((await headers()).get("user-agent"));
}

async function personaActiva(usuarioId: number) {
  const id = Math.floor(Number(usuarioId));
  if (!id) return null;
  const [fila] = (await sql`
    SELECT id, nombre, pin_hash FROM usuarios WHERE id = ${id} AND activo
  `) as Array<{ id: number; nombre: string; pin_hash: string | null }>;
  return fila ?? null;
}

/* ------------------------------------------------------ aparato nuevo -- */

/**
 * Primer paso en un aparato nuevo: la clave del panel.
 * Si es correcta, dice si la persona ya tiene PIN o tiene que crearlo.
 */
export async function revisarClave(
  usuarioId: number,
  clave: string,
): Promise<{ ok: true; tienePin: boolean } | { ok: false; error: string }> {
  if (!CLAVE_PANEL) return { ok: false, error: SIN_CLAVE };
  const persona = await personaActiva(usuarioId);
  if (!persona) return { ok: false, error: "Esa persona no está activa en el panel." };

  const castigo = await minutosDeCastigo(persona.id);
  if (castigo) return { ok: false, error: mensajeCastigo(castigo) };

  if (!igualesSinFiltrar(String(clave ?? ""), CLAVE_PANEL)) {
    const quedan = await anotarFallo(persona.id);
    return {
      ok: false,
      error: quedan > 0 ? "La clave del panel no es esa." : mensajeCastigo(15),
    };
  }

  return { ok: true, tienePin: Boolean(persona.pin_hash) };
}

/**
 * Segundo paso: el PIN. Si la persona todavía no tenía, este queda como el
 * suyo. La clave se vuelve a comprobar: el primer paso no deja nada guardado,
 * así que sin esto bastaría con saltárselo.
 */
export async function entrar(usuarioId: number, clave: string, pin: string): Promise<Respuesta> {
  if (!CLAVE_PANEL) return { ok: false, error: SIN_CLAVE };
  const persona = await personaActiva(usuarioId);
  if (!persona) return { ok: false, error: "Esa persona no está activa en el panel." };

  const castigo = await minutosDeCastigo(persona.id);
  if (castigo) return { ok: false, error: mensajeCastigo(castigo) };

  if (!igualesSinFiltrar(String(clave ?? ""), CLAVE_PANEL)) {
    await anotarFallo(persona.id);
    return { ok: false, error: "La clave del panel no es esa." };
  }
  if (!pinValido(pin)) return { ok: false, error: "El PIN son 4 números." };

  if (persona.pin_hash) {
    if (!(await pinCorrecto(pin, persona.pin_hash))) {
      const quedan = await anotarFallo(persona.id);
      return {
        ok: false,
        error:
          quedan > 0
            ? `PIN incorrecto. Te ${quedan === 1 ? "queda 1 intento" : `quedan ${quedan} intentos`}.`
            : mensajeCastigo(15),
      };
    }
  } else {
    if (pinDemasiadoFacil(pin)) {
      return { ok: false, error: MENSAJE_PIN_FACIL };
    }
    // El UPDATE vuelve a exigir que no tenga PIN: si dos aparatos lo crean a
    // la vez, gana el primero y el segundo tiene que usar ese.
    const filas = (await sql`
      UPDATE usuarios SET pin_hash = ${await hashPin(pin)}
      WHERE id = ${persona.id} AND pin_hash IS NULL
      RETURNING id
    `) as Array<{ id: number }>;
    if (filas.length === 0) {
      return { ok: false, error: "Tu PIN se acaba de crear desde otro aparato. Usa ese." };
    }
  }

  await abrirSesion(persona.id, await aparato());
  return { ok: true };
}

/* ------------------------------------------------- aparato bloqueado -- */

export async function desbloquearConPin(pin: string): Promise<Respuesta> {
  const sesion = await leerSesion();
  if (!sesion) return { ok: false, error: "La sesión se cerró. Vuelve a entrar." };

  const castigo = await minutosDeCastigo(sesion.id);
  if (castigo) return { ok: false, error: mensajeCastigo(castigo) };

  const persona = await personaActiva(sesion.id);
  if (!persona?.pin_hash) return { ok: false, error: "No tienes PIN. Sal y vuelve a entrar." };

  if (!pinValido(pin) || !(await pinCorrecto(pin, persona.pin_hash))) {
    const quedan = await anotarFallo(sesion.id);
    return {
      ok: false,
      error:
        quedan > 0
          ? `PIN incorrecto. Te ${quedan === 1 ? "queda 1 intento" : `quedan ${quedan} intentos`}.`
          : mensajeCastigo(15),
    };
  }

  await sql`UPDATE usuarios SET intentos_fallidos = 0 WHERE id = ${sesion.id}`;
  await desbloquear();
  return { ok: true };
}

/** Opciones para pedirle a Face ID / huella que firme el desafío. */
export async function opcionesDesbloqueo(): Promise<
  { ok: true; opciones: PublicKeyCredentialRequestOptionsJSON } | { ok: false; error: string }
> {
  const sesion = await leerSesion();
  if (!sesion) return { ok: false, error: "La sesión se cerró. Vuelve a entrar." };

  const credencial = await credencialDeEsteAparato(sesion.id);
  if (!credencial) return { ok: false, error: "La biometría no está activada en este aparato." };

  const { rpID } = await dominioYOrigen();
  const opciones = await generateAuthenticationOptions({
    rpID,
    allowCredentials: [
      { id: credencial.id, transports: credencial.transportes as AuthenticatorTransport[] },
    ],
    userVerification: "required",
  });
  await guardarDesafio(opciones.challenge, sesion.id);
  return { ok: true, opciones };
}

export async function desbloquearConBiometria(
  respuesta: AuthenticationResponseJSON,
): Promise<Respuesta> {
  const sesion = await leerSesion();
  if (!sesion) return { ok: false, error: "La sesión se cerró. Vuelve a entrar." };

  const desafio = await tomarDesafio();
  if (!desafio || desafio.usuarioId !== sesion.id) {
    return { ok: false, error: "Se demoró demasiado. Vuelve a intentarlo." };
  }

  const credencial = await credencialDeEsteAparato(sesion.id);
  if (!credencial || credencial.id !== respuesta.id) {
    return { ok: false, error: "Esa huella no corresponde a este aparato." };
  }

  const { rpID, origen } = await dominioYOrigen();
  try {
    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response: respuesta,
      expectedChallenge: desafio.desafio,
      expectedOrigin: origen,
      expectedRPID: rpID,
      credential: {
        id: credencial.id,
        publicKey: isoBase64URL.toBuffer(credencial.llavePublica),
        counter: credencial.contador,
        transports: credencial.transportes as AuthenticatorTransport[],
      },
      requireUserVerification: true,
    });
    if (!verified) return { ok: false, error: "No se pudo comprobar. Usa tu PIN." };

    await sql`
      UPDATE credenciales_biometricas
      SET contador = ${authenticationInfo.newCounter}, ultimo_uso = NOW()
      WHERE id = ${credencial.id}
    `;
  } catch {
    return { ok: false, error: "No se pudo comprobar. Usa tu PIN." };
  }

  await desbloquear();
  return { ok: true };
}

/**
 * Candado inmediato, al volver a abrir la app. No necesita comprobar nada:
 * bloquear nunca da más acceso, solo quita.
 */
export async function bloquearAhora(): Promise<void> {
  await bloquear();
}

/** "No soy yo": cierra la sesión de este aparato. */
export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect(`${PANEL}/entrar`);
}

/* --------------------------------------------- adentro: biometría y PIN -- */

export async function estadoBiometria(): Promise<{ activa: boolean }> {
  const usuario = await usuarioActual();
  if (!usuario) return { activa: false };
  return { activa: Boolean(await credencialDeEsteAparato(usuario.id)) };
}

export async function opcionesRegistro(): Promise<
  { ok: true; opciones: PublicKeyCredentialCreationOptionsJSON } | { ok: false; error: string }
> {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false, error: "La sesión expiró. Vuelve a entrar." };

  const existentes = (await sql`
    SELECT id, transportes FROM credenciales_biometricas WHERE usuario_id = ${usuario.id}
  `) as Array<{ id: string; transportes: string[] | null }>;

  const { rpID } = await dominioYOrigen();
  const opciones = await generateRegistrationOptions({
    rpName: NOMBRE_SITIO,
    rpID,
    userName: usuario.nombre,
    userDisplayName: usuario.nombre,
    attestationType: "none",
    // Si ya la activó en este mismo teléfono, el sistema lo dice en vez de
    // crear una segunda llave igual.
    excludeCredentials: existentes.map((c) => ({
      id: c.id,
      transports: (c.transportes ?? []) as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      // La del propio teléfono (Face ID, huella), no una llave USB.
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
  });
  await guardarDesafio(opciones.challenge, usuario.id);
  return { ok: true, opciones };
}

export async function guardarBiometria(respuesta: RegistrationResponseJSON): Promise<Respuesta> {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false, error: "La sesión expiró. Vuelve a entrar." };

  const desafio = await tomarDesafio();
  if (!desafio || desafio.usuarioId !== usuario.id) {
    return { ok: false, error: "Se demoró demasiado. Vuelve a intentarlo." };
  }

  const { rpID, origen } = await dominioYOrigen();
  try {
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: respuesta,
      expectedChallenge: desafio.desafio,
      expectedOrigin: origen,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
    if (!verified || !registrationInfo) {
      return { ok: false, error: "El teléfono no confirmó la huella." };
    }

    const { credential } = registrationInfo;
    await sql`
      INSERT INTO credenciales_biometricas (id, usuario_id, llave_publica, contador, transportes, dispositivo)
      VALUES (${credential.id}, ${usuario.id}, ${isoBase64URL.fromBuffer(credential.publicKey)},
              ${credential.counter}, ${credential.transports ?? []}, ${await aparato()})
      ON CONFLICT (id) DO NOTHING
    `;

    const tarro = await cookies();
    tarro.set(COOKIE_BIO, credential.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 400, // lo máximo que aceptan los navegadores
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `No se pudo activar: ${(e as Error).message}` };
  }
}

export async function quitarBiometria(): Promise<Respuesta> {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false, error: "La sesión expiró. Vuelve a entrar." };

  const credencial = await credencialDeEsteAparato(usuario.id);
  if (credencial) {
    await sql`DELETE FROM credenciales_biometricas WHERE id = ${credencial.id}`;
  }
  (await cookies()).delete(COOKIE_BIO);
  return { ok: true };
}

export async function cambiarPin(actual: string, nuevo: string): Promise<Respuesta> {
  const usuario = await usuarioActual();
  if (!usuario) return { ok: false, error: "La sesión expiró. Vuelve a entrar." };
  if (!pinValido(nuevo)) return { ok: false, error: "El PIN nuevo tienen que ser 4 números." };
  if (pinDemasiadoFacil(nuevo)) {
    return { ok: false, error: MENSAJE_PIN_FACIL };
  }

  const castigo = await minutosDeCastigo(usuario.id);
  if (castigo) return { ok: false, error: mensajeCastigo(castigo) };

  const persona = await personaActiva(usuario.id);
  if (!persona?.pin_hash || !(await pinCorrecto(actual, persona.pin_hash))) {
    await anotarFallo(usuario.id);
    return { ok: false, error: "El PIN actual no es ese." };
  }

  await sql`UPDATE usuarios SET pin_hash = ${await hashPin(nuevo)} WHERE id = ${usuario.id}`;
  return { ok: true };
}
