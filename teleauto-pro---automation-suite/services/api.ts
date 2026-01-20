
const API_BASE_URL = 'http://127.0.0.1:8000';
const AUTH_KEY = 'telegram_secret_key_123'; // In a real app, this should be in .env

const headers = {
    'Content-Type': 'application/json',
    'AUTHENTICATION-KEY': AUTH_KEY,
};

export const apiService = {
    async startLogin(phoneNumber: string, apiId: string, apiHash: string) {
        const response = await fetch(`${API_BASE_URL}/startLogin`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phoneNumber, apiId, apiHash }),
        });
        return response.json();
    },

    async verifyOtp(phoneNumber: string, otpCode: string, password?: string) {
        const response = await fetch(`${API_BASE_URL}/verifyOtp`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ phoneNumber, otpCode, password }),
        });
        return response.json();
    },

    async sendMessage(sessionString: string, chatIds: string[], messageText: string | { custom_message: string }) {
        // If messageText is an object (from the UI), extract the string
        const text = typeof messageText === 'string' ? messageText : messageText.custom_message;

        const response = await fetch(`${API_BASE_URL}/sendMessage`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ sessionString, chatIds, messageText: text }),
        });
        return response.json();
    },

    async sendMedia(sessionString: string, chatIds: string[], media: File, caption: string) {
        const formData = new FormData();
        formData.append('sessionString', sessionString);
        formData.append('chatIds', JSON.stringify(chatIds));
        formData.append('media', media);
        formData.append('caption', caption);

        const response = await fetch(`${API_BASE_URL}/sendMedia`, {
            method: 'POST',
            headers: {
                'AUTHENTICATION-KEY': AUTH_KEY,
                // Content-Type is set automatically by the browser for FormData
            },
            body: formData,
        });
        return response.json();
    },

    async fetchMembers(sessionString: string, groupId: string, limit: number = 100) {
        const response = await fetch(`${API_BASE_URL}/fetchMembers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ sessionString, groupId, limit }),
        });
        return response.json();
    },

    async getGroupChats(sessionString: string) {
        const response = await fetch(`${API_BASE_URL}/getGroupChats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ sessionString }),
        });
        return response.json();
    },

    async saveHistory(historyItem: any) {
        const response = await fetch(`${API_BASE_URL}/saveHistory`, {
            method: 'POST',
            headers,
            body: JSON.stringify(historyItem),
        });
        return response.json();
    },

    async getHistory() {
        const response = await fetch(`${API_BASE_URL}/getHistory`, {
            method: 'GET',
            headers,
        });
        return response.json();
    },
};
