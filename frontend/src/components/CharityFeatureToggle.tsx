import React, { useState, useEffect } from 'react';
import { apiBridge } from '../services/DropShippingAPIBridge';
import { CharityLendingService } from '../services/CharityLendingService';

interface CharityFeatureToggleProps {
  onToggle?: (enabled: boolean) => void;
}

export const CharityFeatureToggle: React.FC<CharityFeatureToggleProps> = ({ onToggle }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [complianceReport, setComplianceReport] = useState<any>(null);

  useEffect(() => {
    // Initialize with current state
    setIsEnabled(apiBridge.isCharityFeaturesEnabled());
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const report = await apiBridge.getComplianceReport();
      setComplianceReport(report);
      
      if (report.charityFeaturesEnabled) {
        const status = await apiBridge.connect();
        setApiStatus(status);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      apiBridge.setCharityFeaturesEnabled(enabled);
      setIsEnabled(enabled);
      
      if (enabled) {
        // Reconnect APIs when enabling
        const status = await apiBridge.connect();
        setApiStatus(status);
      } else {
        setApiStatus(false);
      }
      
      // Reload compliance report
      const report = await apiBridge.getComplianceReport();
      setComplianceReport(report);
      
      onToggle?.(enabled);
    } catch (error) {
      console.error('Failed to toggle charity features:', error);
      // Revert on error
      setIsEnabled(!enabled);
      apiBridge.setCharityFeaturesEnabled(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!isEnabled) return 'text-gray-500';
    if (apiStatus) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (!isEnabled) return 'Disabled';
    if (apiStatus) return 'Connected';
    return 'Disconnected';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎛️ Charity Features
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          <div className="relative">
            <input
              type="checkbox"
              id="charity-toggle"
              checked={isEnabled}
              onChange={(e) => handleToggle(e.target.checked)}
              disabled={isLoading}
              className="sr-only"
            />
            <label
              htmlFor="charity-toggle"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </label>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      )}

      {complianceReport && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <p><strong>Status:</strong> {complianceReport.charityFeaturesEnabled ? 'Enabled' : 'Disabled'}</p>
            {complianceReport.message && (
              <p className="text-gray-500 italic">{complianceReport.message}</p>
            )}
          </div>

          {isEnabled && complianceReport.overall && (
            <div className="bg-gray-50 rounded p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Compliance Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>No Interference:</span>
                  <span className={complianceReport.overall.noInterference ? 'text-green-600' : 'text-red-600'}>
                    {complianceReport.overall.noInterference ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Official Channels:</span>
                  <span className={complianceReport.overall.usingOfficialChannels ? 'text-green-600' : 'text-red-600'}>
                    {complianceReport.overall.usingOfficialChannels ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Compliant:</span>
                  <span className={complianceReport.overall.compliant ? 'text-green-600' : 'text-red-600'}>
                    {complianceReport.overall.compliant ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {isEnabled 
            ? "Charity lending features are active. Items can be donated to shelters via drop shipping."
            : "Charity lending features are disabled. Only regular inventory sharing is available."
          }
        </p>
      </div>
    </div>
  );
};

export default CharityFeatureToggle; 