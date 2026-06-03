import { useState, useEffect } from "react";

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

export function useUserLocation(): UserLocation {
  const [state, setState] = useState<UserLocation>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: "Geolocation not supported" }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return state;
}
