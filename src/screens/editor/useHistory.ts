import { useState, useCallback } from 'react';

export function useHistory(init: number[][]) {
  const [past, setPast] = useState<number[][][]>([]);
  const [present, setPresent] = useState<number[][]>(init);
  const [future, setFuture] = useState<number[][][]>([]);

  const push = useCallback(
    (next: number[][]) => {
      setPast((p) => [...p.slice(-50), present]);
      setPresent(next);
      setFuture([]);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [present],
  );

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture((f) => [present, ...f]);
    setPresent(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast((p) => [...p, present]);
    setPresent(future[0]);
    setFuture((f) => f.slice(1));
  }, [future, present]);

  return { grid: present, push, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
