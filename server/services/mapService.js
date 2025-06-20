const axios = require("axios");

class MapService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.mapboxApiKey = process.env.MAPBOX_API_KEY;
  }

  // Get coordinates from address using Google Geocoding API
  async getCoordinatesFromAddress(address) {
    if (!this.googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address,
            key: this.googleMapsApiKey
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lon: location.lng,
          formattedAddress: response.data.results[0].formatted_address
        };
      } else {
        throw new Error("Address not found");
      }
    } catch (error) {
      throw new Error(`Geocoding failed: ${error.message}`);
    }
  }

  // Get address from coordinates using reverse geocoding
  async getAddressFromCoordinates(lat, lon) {
    if (!this.googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${lat},${lon}`,
            key: this.googleMapsApiKey
          }
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        return {
          address: response.data.results[0].formatted_address,
          components: response.data.results[0].address_components
        };
      } else {
        throw new Error("Location not found");
      }
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
  }

  // Calculate optimal route between multiple points
  async calculateOptimalRoute(points) {
    if (!this.googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const waypoints = points.slice(1, -1).map(point => `${point.lat},${point.lon}`);
      const origin = `${points[0].lat},${points[0].lon}`;
      const destination = `${points[points.length - 1].lat},${points[points.length - 1].lon}`;

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin,
            destination,
            waypoints: waypoints.join('|'),
            optimize: true,
            key: this.googleMapsApiKey
          }
        }
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          distance: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
          duration: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
          waypointOrder: route.waypoint_order,
          polyline: route.overview_polyline.points
        };
      } else {
        throw new Error("Route not found");
      }
    } catch (error) {
      throw new Error(`Route calculation failed: ${error.message}`);
    }
  }

  // Get static map image
  getStaticMapUrl(center, markers = [], zoom = 12, size = "600x400") {
    if (!this.googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
    const params = new URLSearchParams({
      center: `${center.lat},${center.lon}`,
      zoom,
      size,
      key: this.googleMapsApiKey
    });

    // Add markers
    markers.forEach((marker, index) => {
      params.append('markers', `${marker.lat},${marker.lon}`);
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Calculate distance matrix between multiple points
  async getDistanceMatrix(origins, destinations, mode = "driving") {
    if (!this.googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json`,
        {
          params: {
            origins: origins.map(point => `${point.lat},${point.lon}`).join('|'),
            destinations: destinations.map(point => `${point.lat},${point.lon}`).join('|'),
            mode,
            key: this.googleMapsApiKey
          }
        }
      );

      if (response.data.rows) {
        return response.data.rows.map(row => 
          row.elements.map(element => ({
            distance: element.distance,
            duration: element.duration,
            status: element.status
          }))
        );
      } else {
        throw new Error("Distance matrix calculation failed");
      }
    } catch (error) {
      throw new Error(`Distance matrix failed: ${error.message}`);
    }
  }

  // Find nearby places (for potential shipping hubs)
  async findNearbyPlaces(location, radius = 5000, type = "post_office") {
    if (!this.googleMapsApiKey) {
      throw new Error("Google Maps API key not configured");
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${location.lat},${location.lon}`,
            radius,
            type,
            key: this.googleMapsApiKey
          }
        }
      );

      if (response.data.results) {
        return response.data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          location: place.geometry.location,
          address: place.vicinity,
          rating: place.rating,
          types: place.types
        }));
      } else {
        return [];
      }
    } catch (error) {
      throw new Error(`Nearby places search failed: ${error.message}`);
    }
  }

  // Validate coordinates
  validateCoordinates(lat, lon) {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      return false;
    }
    
    if (latNum < -90 || latNum > 90) {
      return false;
    }
    
    if (lonNum < -180 || lonNum > 180) {
      return false;
    }
    
    return true;
  }

  // Calculate bounding box for a location and radius
  calculateBoundingBox(center, radiusKm) {
    const lat = center.lat;
    const lon = center.lon;
    
    // Earth's radius in kilometers
    const earthRadius = 6371;
    
    // Convert radius to radians
    const radiusRad = radiusKm / earthRadius;
    
    // Calculate bounding box
    const latMin = lat - (radiusRad * 180 / Math.PI);
    const latMax = lat + (radiusRad * 180 / Math.PI);
    const lonMin = lon - (radiusRad * 180 / Math.PI / Math.cos(lat * Math.PI / 180));
    const lonMax = lon + (radiusRad * 180 / Math.PI / Math.cos(lat * Math.PI / 180));
    
    return {
      north: latMax,
      south: latMin,
      east: lonMax,
      west: lonMin
    };
  }
}

module.exports = { MapService }; 