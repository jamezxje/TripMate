import { create } from 'zustand';

export const useTripStore = create((set) => ({
  currentTrip: null,
  trips: [],
  isLoading: false,
  error: null,

  setCurrentTrip: (trip) => {
    if (trip?.id) {
      localStorage.setItem('activeTripId', trip.id);
    }
    set({ currentTrip: trip, error: null });
  },

  setTrips: (trips) => set({ trips, error: null }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearCurrentTrip: () => {
    localStorage.removeItem('activeTripId');
    set({ currentTrip: null });
  },
}));
