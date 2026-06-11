import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICON = {
  success: CheckCircle,
  error:   XCircle,
  info:    Info,
};

const TOAST_STYLE = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-blue-600 text-white',
};

function ToastContainer({ toastList }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toastList.map(toast => {
        const ToastIcon = TOAST_ICON[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
              ${TOAST_STYLE[toast.type]}`}
          >
            <ToastIcon className="w-4 h-4 shrink-0" />
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toastList, setToastList] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const toastId = Date.now();
    setToastList(currentToasts => [...currentToasts, { id: toastId, message, type }]);

    // Auto-remover después de 3.5s
    setTimeout(() => {
      setToastList(currentToasts => currentToasts.filter(toast => toast.id !== toastId));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toastList={toastList} />
    </ToastContext.Provider>
  );
}
