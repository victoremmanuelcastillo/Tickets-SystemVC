const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateRequiredFields } = require('../helpers/validation');

const router = express.Router();

/* POST /api/ai/suggest
   Body: { problem_name, existing_suggestion? }
   Llama a Claude desde el servidor para que la API key nunca llegue al frontend. */
router.post('/suggest', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { problem_name, existing_suggestion } = validateRequiredFields(req.body, ['problem_name']);

    const prompt = existing_suggestion
      ? `Eres un especialista en soporte técnico de TI corporativo. La sugerencia actual para el problema "${problem_name}" es:\n"${existing_suggestion}"\n\nMejórala o genera una alternativa más útil. Responde SOLO con el texto de la nueva sugerencia, sin comillas ni explicaciones. Máximo 2-3 oraciones. Empieza con un emoji relevante.`
      : `Eres un especialista en soporte técnico de TI corporativo. Genera una sugerencia de solución rápida para el problema técnico: "${problem_name}". Responde SOLO con el texto de la sugerencia, sin comillas ni explicaciones. Máximo 2-3 oraciones. Empieza con un emoji relevante.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      const aiError = new Error(data.error.message || 'Error de la API de IA');
      aiError.statusCode = 502;
      throw aiError;
    }

    const suggestion = data.content?.[0]?.text?.trim() || '';
    res.json({ suggestion });
  } catch (err) { next(err); }
});

module.exports = router;
