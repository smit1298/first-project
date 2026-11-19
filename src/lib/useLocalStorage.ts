import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

/** useState that is read from and written to localStorage under `key`. */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full or unavailable (e.g. private mode) — keep working in memory
    }
  }, [key, value]);

  return [value, setValue];
}
