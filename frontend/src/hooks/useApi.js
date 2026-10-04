import { useState, useCallback } from 'react';
import { useToast } from './useToast';

export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      addToast(err.message || 'An error occurred', 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc, addToast]);

  return { data, loading, error, execute, setData };
};
