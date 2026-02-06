import { createContext, useContext, useEffect, useState } from "react";
import { Toaster } from "./ui/sonner";

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  /* 
  useEffect(() => {
    // Removido auto-request para evitar erro "permission handled: false" ou bloqueios do navegador.
    // A permissão deve ser solicitada apenas via interação do usuário (ex: botão).
  }, []);
  */

  const showNotification = (title, options = {}) => {
    if (typeof Notification === "undefined") {
      console.warn("Notificações não são suportadas neste navegador");
      return;
    }

    if (permission === "granted") {
      new Notification(title, {
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        ...options,
      });
    }
  };

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      return "denied";
    }

    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  };

  return (
    <NotificationContext.Provider
      value={{
        permission,
        showNotification,
        requestPermission,
      }}
    >
      {children}
      <Toaster position="top-right" />
    </NotificationContext.Provider>
  );
};
