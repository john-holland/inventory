/**
 * Route Map Component
 * 
 * Displays route from user's location to item location
 * - Shows distance
 * - Draws route line
 * - Shows origin and destination markers
 * - Item location shown at block level for privacy
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  LocationOn as LocationIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import type { InventoryItem } from '../data/mockInventoryItems';
import { ShippingService } from '../services/ShippingService';

interface RouteMapProps {
  item: InventoryItem;
  userLocation?: {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
  };
}

export const RouteMap: React.FC<RouteMapProps> = ({
  item,
  userLocation = {
    city: 'San Francisco',
    state: 'CA',
    latitude: 37.7749,
    longitude: -122.4194
  }
}) => {
  const shippingService = ShippingService.getInstance();

  // Calculate distance
  const distance = shippingService.calculateDistance(
    { street: '', city: userLocation.city, state: userLocation.state, zipCode: '', country: 'USA' },
    { street: '', city: item.location.split(',')[0], state: item.location.split(',')[1]?.trim() || '', zipCode: '', country: 'USA' }
  );

  // Calculate approximate route line positions for visualization
  const originX = 50;
  const originY = 400;
  const destX = 550;
  const destY = 100;

  return (
    <Box>
      {/* Distance Info */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <Chip
          icon={<RouteIcon />}
          label={`${distance.toFixed(1)} miles`}
          sx={{
            backgroundColor: '#2e7d32',
            color: '#fff',
            fontWeight: 'bold'
          }}
        />
        <Typography variant="caption" sx={{ color: '#999' }}>
          Estimated route distance
        </Typography>
      </Box>

      {/* Map Visualization */}
      <Box
        sx={{
          height: 400,
          backgroundColor: '#1a1a1a',
          borderRadius: 1,
          position: 'relative',
          border: '1px solid #333',
          overflow: 'hidden'
        }}
      >
        {/* Grid pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Route Line */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#4caf50" />
            </marker>
          </defs>
          <line
            x1={originX}
            y1={originY}
            x2={destX}
            y2={destY}
            stroke="#4caf50"
            strokeWidth="3"
            strokeDasharray="10,5"
            markerEnd="url(#arrowhead)"
            opacity="0.7"
          />
        </svg>

        {/* Origin Marker (User Location) */}
        <Box
          sx={{
            position: 'absolute',
            left: originX - 30,
            top: originY - 60,
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#2196f3',
              border: '3px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.5)'
            }}
          >
            <MyLocationIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              display: 'block',
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.7)',
              px: 1,
              borderRadius: 1,
              fontSize: '0.7rem'
            }}
          >
            Your Location
            <br />
            {userLocation.city}, {userLocation.state}
          </Typography>
        </Box>

        {/* Destination Marker (Item Location - Block Level) */}
        <Box
          sx={{
            position: 'absolute',
            left: destX - 30,
            top: destY - 60,
            textAlign: 'center'
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              border: '3px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.5)'
            }}
          >
            <LocationIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Typography
            variant="caption"
            sx={{
              mt: 0.5,
              display: 'block',
              color: '#fff',
              backgroundColor: 'rgba(0,0,0,0.7)',
              px: 1,
              borderRadius: 1,
              fontSize: '0.7rem'
            }}
          >
            Item Location
            <br />
            {item.location} (Block Level)
          </Typography>
        </Box>

        {/* Distance Label on Route */}
        <Box
          sx={{
            position: 'absolute',
            left: (originX + destX) / 2 - 40,
            top: (originY + destY) / 2 - 15,
            backgroundColor: 'rgba(76, 175, 80, 0.9)',
            color: '#fff',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.875rem',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {distance.toFixed(1)} mi
        </Box>
      </Box>

      <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
        Note: Item location shown at block level for privacy. Exact address revealed upon agreement.
      </Typography>
    </Box>
  );
};

