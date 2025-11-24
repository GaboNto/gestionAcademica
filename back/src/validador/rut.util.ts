export function normalizeRut(value: string): string {
  if (!value) return value;

  const str = String(value).trim().toUpperCase();

  const limpio = str.replace(/[^0-9Kk]/g, "");

  const dv = limpio.slice(-1).toUpperCase();

  const cuerpo = limpio.slice(0, -1);

  if (!/^[0-9]+$/.test(cuerpo)) {
    return str; // devolver como vino, dejar que la validación falle después
  }

  return `${cuerpo}-${dv}`;
}
