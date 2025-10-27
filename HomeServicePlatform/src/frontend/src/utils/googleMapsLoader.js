let isLoaded = false;
let isLoading = false;
let loadPromise = null;

export function loadGoogleMapsAPI() {
  if (isLoaded && window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  const existingScript = document.getElementById('google-maps-api-script');
  
  if (existingScript) {
    if (window.google?.maps?.places) {
      isLoaded = true;
      return Promise.resolve(window.google);
    }
    
    loadPromise = new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          isLoaded = true;
          isLoading = false;
          resolve(window.google);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkLoaded);
        reject(new Error('Google Maps API load timeout'));
      }, 10000);
    });
    
    return loadPromise;
  }

  isLoading = true;
  
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-maps-api-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const checkPlaces = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkPlaces);
          isLoaded = true;
          isLoading = false;
          resolve(window.google);
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkPlaces);
        if (!window.google?.maps?.places) {
          reject(new Error('Google Maps Places library failed to load'));
        }
      }, 5000);
    };

    script.onerror = (error) => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}