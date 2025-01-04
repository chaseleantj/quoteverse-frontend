import { API_CONFIG } from './config.js';

class ApiService {
    async fetchExistingQuotes() {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/?count=${API_CONFIG.MAX_QUOTE_COUNT}&randomize=${API_CONFIG.RANDOMIZE_QUOTES}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data.quotes;
        } catch (error) {
            console.error('Error fetching existing quotes:', error);
            throw error;
        }
    }

    async getSimilarQuotes(quote) {
        const k = API_CONFIG.MAX_SIMILAR_QUOTE_COUNT;
        const max_distance = API_CONFIG.MAX_SIMILAR_QUOTE_DISTANCE;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/get-similar-quotes/?k=${k}&max_distance=${max_distance}`, {
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
            const result = await response.json();
            return result.data.queries[0].similar_quotes;
        } catch (error) {
            console.error('Error getting similar quotes:', error);
            throw error;
        }
    }

    async searchQuotes(searchText, searchMode = 'quote', k = 20) {
        try {
            let endpoint;
            let body;
            let params = new URLSearchParams();

            if (searchMode === 'quote') {
                endpoint = '/get-similar-quotes/';
                params.append('k', k);
                params.append('max_distance', API_CONFIG.MAX_SIMILAR_QUOTE_DISTANCE);
                body = [searchText];
            } else {
                endpoint = '/search-quotes/';
                params.append('search_by', searchMode);
                params.append('k', k);
                params.append('strict', false);
                body = [searchText];
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (searchMode === 'quote') {
                return result.data.queries[0].similar_quotes;
            } else {
                return result.data.queries[0].quotes;
            }
        } catch (error) {
            console.error('Error searching quotes:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();
export default apiService; 