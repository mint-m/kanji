import { api } from './apiClient';
import { ApiResponse, ProgressType, CurrentDeck } from './types';

const deckService = {
  async getCurrentDeck(progressType: ProgressType): Promise<ApiResponse<CurrentDeck>> {
    return api.get(`/api/users/me/progress/${progressType}/current`);
  },

  async completeDeck(progressType: ProgressType): Promise<ApiResponse<any>> {
    return api.post(`/api/users/me/progress/${progressType}/complete-deck`, {});
  },
};

export default deckService;
