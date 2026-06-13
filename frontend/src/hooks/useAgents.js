import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export function useAgents(token) {
  const [agentList, setAgentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getAgents(token)
      .then(setAgentList)
      .catch(() => setAgentList([]))
      .finally(() => setIsLoading(false));
  }, [token]);

  return { agentList, isLoading };
}
