// Lógica pura del flujo de pagos del delegado (pestaña Pagos).
// Extraída de PagosTab para poder testearla barato como función pura (ver spec 0011).

export const ESTADO_PENDIENTE_PAGO = 'PENDIENTE_PAGO';

/**
 * Devuelve el comprobante asociado a una inscripción (match por referenciaId === inscripcionId),
 * o null si no hay ninguno.
 */
export function comprobanteDeInscripcion(comprobantes, inscripcionId) {
  if (!Array.isArray(comprobantes)) return null;
  return comprobantes.find((c) => c.referenciaId === inscripcionId) ?? null;
}

/**
 * ¿El delegado puede subir (o REEMPLAZAR) un comprobante para esta inscripción ahora mismo?
 * Sí mientras la inscripción siga PENDIENTE_PAGO, sin importar el estado del comprobante:
 * así puede corregir una foto mal subida aunque esté "en revisión" (spec 0014). Si el admin
 * ya aprobó la inscripción, esta deja de estar PENDIENTE_PAGO y no aparece para subir.
 */
export function puedeSubir(inscripcion) {
  return !!inscripcion && inscripcion.estadoInscripcion === ESTADO_PENDIENTE_PAGO;
}

/**
 * Conjunto de inscripciones a las que el delegado puede subir/reemplazar comprobante.
 * Es la lista de opciones del selector de torneo en la pestaña Pagos.
 */
export function inscripcionesSubibles(inscripciones) {
  if (!Array.isArray(inscripciones)) return [];
  return inscripciones.filter((i) => puedeSubir(i));
}
