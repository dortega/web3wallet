import { useCallback, useRef, useState } from 'react';

interface PasswordRequest {
  resolve: (password: string) => void;
  reject: (reason: Error) => void;
  confirm: boolean;
}

export function usePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const requestRef = useRef<PasswordRequest | null>(null);

  const requestPassword = useCallback((needConfirm = false): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      requestRef.current = { resolve, reject, confirm: needConfirm };
      setConfirm(needConfirm);
      setOpen(true);
    });
  }, []);

  const submit = useCallback((password: string) => {
    requestRef.current?.resolve(password);
    requestRef.current = null;
    setOpen(false);
  }, []);

  const cancel = useCallback(() => {
    requestRef.current?.reject(new Error('Cancelled'));
    requestRef.current = null;
    setOpen(false);
  }, []);

  return { open, confirm, requestPassword, submit, cancel };
}
