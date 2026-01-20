
import { useState, useEffect } from 'react';

export const useAuth = () => {
    const [sessionString, setSessionString] = useState<string | null>(localStorage.getItem('sessionString'));
    const [phoneNumber, setPhoneNumber] = useState<string | null>(localStorage.getItem('phoneNumber'));

    const login = (newSessionString: string, newPhoneNumber: string) => {
        localStorage.setItem('sessionString', newSessionString);
        localStorage.setItem('phoneNumber', newPhoneNumber);
        setSessionString(newSessionString);
        setPhoneNumber(newPhoneNumber);
    };

    const logout = () => {
        localStorage.removeItem('sessionString');
        localStorage.removeItem('phoneNumber');
        setSessionString(null);
        setPhoneNumber(null);
    };

    const isAuthenticated = !!sessionString;

    return { sessionString, phoneNumber, login, logout, isAuthenticated };
};
