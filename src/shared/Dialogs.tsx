import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useI18n } from './i18n';

interface Dialogs {
  /** 自定义确认弹层，替代原生 confirm */
  confirmDialog: (message: string) => Promise<boolean>;
  /** 短暂提示，替代原生 alert */
  toast: (message: string) => void;
}

const DialogContext = createContext<Dialogs>({
  confirmDialog: async () => false,
  toast: () => {},
});

export function useDialogs(): Dialogs {
  return useContext(DialogContext);
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [confirmState, setConfirmState] = useState<{ message: string; resolve: (ok: boolean) => void } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const confirmDialog = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ message, resolve });
      }),
    [],
  );

  const toast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2200);
  }, []);

  const answer = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  return (
    <DialogContext.Provider value={{ confirmDialog, toast }}>
      {children}
      {confirmState && (
        <div className="modal-mask center" onClick={() => answer(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{confirmState.message}</p>
            <div className="modal-actions">
              <button className="btn grow" onClick={() => answer(false)}>
                {t.cancel}
              </button>
              <button className="btn primary grow" onClick={() => answer(true)}>
                {t.ok}
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </DialogContext.Provider>
  );
}
