import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getApiBaseUrl } from '../lib/utils'; // Assumindo que existe essa função utilitária

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // A URL do socket geralmente é a mesma da API base (sem o /api se for o caso, ou a raiz do servidor)
        // Se getApiBaseUrl retorna "http://localhost:3000/api", precisamos pegar apenas "http://localhost:3000"
        const apiUrl = getApiBaseUrl();
        // Se a API for "https://api.checkin.simplisoft.com.br/api", extraímos "https://api.checkin.simplisoft.com.br"
        let socketUrl = apiUrl.replace(/\/api\/?$/, '');

        // Garantir que a URL não termine com barra para o Socket.io
        if (socketUrl.endsWith('/')) socketUrl = socketUrl.slice(0, -1);

        console.log('Connecting to Socket.io at:', socketUrl);

        const newSocket = io(socketUrl, {
            path: '/socket.io', // Path padrão, mas explícito
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
