// Validaciones compartidas por los formularios y las rutas de la web.

export const limiteEspecialidad = 80;

// Teléfono opcional: si se escribe, solo puede tener dígitos, espacios, guiones, paréntesis
// y un "+" al inicio, con entre 8 y 15 dígitos en total (ejemplos: 7000-0000, +503 7000 0000).
export function esTelefonoValido(telefono: string) {
  const texto = telefono.trim();
  if (!texto) return true;
  if (!/^\+?[\d\s()-]+$/.test(texto)) return false;
  const digitos = texto.replace(/\D/g, '').length;
  return digitos >= 8 && digitos <= 15;
}
