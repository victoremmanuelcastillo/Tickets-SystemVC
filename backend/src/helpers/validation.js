/**
 * Valida que los campos requeridos estén presentes y no estén vacíos.
 * Retorna el body con trim() aplicado a todos los strings.
 * Lanza un error con statusCode 400 si falta algún campo.
 *
 * @param {Object} body            — req.body de Express
 * @param {string[]} requiredFields — nombres de los campos obligatorios
 * @returns {Object} body saneado con trim() en todos los strings
 */
function validateRequiredFields(body, requiredFields) {
  for (const fieldName of requiredFields) {
    if (!body[fieldName] || String(body[fieldName]).trim() === '') {
      const error = new Error(`El campo "${fieldName}" es obligatorio`);
      error.statusCode = 400;
      throw error;
    }
  }
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ])
  );
}

module.exports = { validateRequiredFields };
