import { API_CONFIG } from './config.js';

class ApiService {
    async fetchExistingQuotes() {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/?count=${API_CONFIG.MAX_QUOTE_COUNT}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.quotes;
        } catch (error) {
            console.error('Error fetching existing quotes:', error);
            throw error;
        }
    }

    async getQuoteCoordinates(quote) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/get-coords/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify([quote]),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.coords[0];
        } catch (error) {
            console.error('Error getting quote coordinates:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();
export default apiService; 