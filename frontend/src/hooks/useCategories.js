import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export function useCategories(token) {
  const [categoryList, setCategoryList] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getCategories(token)
      .then(setCategoryList)
      .catch(() => setCategoryList([]))
      .finally(() => setIsLoading(false));
  }, [token]);

  return { categoryList, isLoading };
}
