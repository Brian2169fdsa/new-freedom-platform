import { useState, useEffect } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

const INITIAL_STATE: GeolocationState = {
  latitude: null,
  longitude: null,
  error: null,
  loading: true,
};

/**
 * Hook that retrieves the user's current geographic position
 * using the browser Geolocation API.
 *
 * Returns loading=true initially, then resolves with coordinates
 * or an error message if geolocation is unavailable or denied.
 */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(INITIAL_STATE);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      });
      return;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!cancelled) {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
            loading: false,
          });
        }
      },
      (err) => {
        if (!cancelled) {
          let message: string;
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = 'Location permission denied';
              break;
            case err.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case err.TIMEOUT:
              message = 'Location request timed out';
              break;
            default:
              message = 'An unknown error occurred';
              break;
          }
          setState({
            latitude: null,
            longitude: null,
            error: message,
            loading: false,
          });
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache position for 5 minutes
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
