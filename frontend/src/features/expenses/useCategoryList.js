import { useState, useEffect } from 'react';
import { expenseCategoryApi } from './expenseCategoryApi';

/**
 * Hook to fetch and cache the list of expense categories.
 * Returns { categories, isLoading }
 */
export const useCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    expenseCategoryApi
      .getAllCategories()
      .then((res) => {
        if (mounted && res.data) setCategories(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { categories, isLoading };
};
