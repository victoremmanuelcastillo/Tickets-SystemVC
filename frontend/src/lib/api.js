const req = async (method, path, body, token) => {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
};

export const api = {
  // Auth
  login:         (email, pw)          => req('POST',   '/api/auth/login',          { email, password: pw }),
  register:      (token, data)        => req('POST',   '/api/auth/register',       data, token),
  getUsers:      (token)              => req('GET',    '/api/auth/users',           null, token),
  searchUsers:   (token, q)           => req('GET',    `/api/auth/users/search?q=${encodeURIComponent(q)}`, null, token),
  deleteUser:    (token, id)          => req('DELETE', `/api/auth/users/${id}`,    null, token),
  updateUserProfile: (token, id, data) => req('PATCH', `/api/auth/users/${id}`,    data, token),

  // Catalogs
  getCategories:    (token)             => req('GET',    '/api/categories',          null, token),
  createCategory:   (token, data)       => req('POST',   '/api/categories',          data, token),
  updateCategory:   (token, id, data)   => req('PATCH',  `/api/categories/${id}`,    data, token),
  deleteCategory:   (token, id)         => req('DELETE', `/api/categories/${id}`,    null, token),

  getProblems:      (token, catId)      => req('GET',    `/api/problems${catId ? `?category_id=${catId}` : ''}`, null, token),
  createProblem:    (token, data)       => req('POST',   '/api/problems',            data, token),
  updateProblem:    (token, id, data)   => req('PATCH',  `/api/problems/${id}`,      data, token),
  deleteProblem:    (token, id)         => req('DELETE', `/api/problems/${id}`,      null, token),

  // Suggestions
  getSuggestions:   (token, probId)     => req('GET',    `/api/suggestions${probId ? `?problem_id=${probId}` : ''}`, null, token),
  createSuggestion: (token, data)       => req('POST',   '/api/suggestions',         data, token),
  updateSuggestion: (token, id, text)   => req('PUT',    `/api/suggestions/${id}`,   { content: text }, token),
  deleteSuggestion: (token, id)         => req('DELETE', `/api/suggestions/${id}`,   null, token),

  // Tickets
  getTickets:         (token, params)       => req('GET',   `/api/tickets${params ? `?${params}` : ''}`, null, token),
  createTicket:       (token, data)         => req('POST',  '/api/tickets',              data, token),
  updateTicketStatus: (token, id, body)     => req('PATCH', `/api/tickets/${id}/status`, body, token),
  getTicketPosition:  (token, id)           => req('GET',   `/api/tickets/${id}/position`, null, token),
  getTicketNotes:     (token, id)           => req('GET',   `/api/tickets/${id}/notes`,  null, token),
  addTicketNote:      (token, id, note)     => req('POST',  `/api/tickets/${id}/notes`,  { note }, token),
  getTicketsByStatus: (token, status)       => req('GET',   `/api/tickets?status=${status}&all=1`, null, token),
  getReports:         (token)               => req('GET',   '/api/tickets/reports/summary', null, token),
  getUserTickets:     (token, userId)       => req('GET',   `/api/tickets/reports/user/${userId}`, null, token),
  getAgentTickets:    (token, name)         => req('GET',   `/api/tickets/reports/agent/${encodeURIComponent(name)}`, null, token),
  getAgents:          (token)               => req('GET',   '/api/tickets/agents',       null, token),

  // AI
  aiSuggest: (token, problem_name, existing_suggestion) =>
    req('POST', '/api/ai/suggest', { problem_name, existing_suggestion }, token),
};
