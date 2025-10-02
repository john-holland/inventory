import React, { useState, useEffect } from 'react';
import { apiBridge } from '../services/DropShippingAPIBridge';
import { CharityFeatureToggle } from './CharityFeatureToggle';

export const APITestingExample: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [complianceReport, setComplianceReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const report = await apiBridge.getComplianceReport();
      setComplianceReport(report);
      
      if (report.charityFeaturesEnabled) {
        const results = await apiBridge.getAPITestResults();
        setTestResults(results);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const runAPITests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Running API tests...');
      
      // Connect to APIs
      const connected = await apiBridge.connect();
      console.log('Connection result:', connected);
      
      // Get test results
      const results = await apiBridge.getAPITestResults();
      setTestResults(results);
      
      // Get compliance report
      const report = await apiBridge.getComplianceReport();
      setComplianceReport(report);
      
      console.log('✅ API tests completed');
    } catch (error) {
      console.error('❌ API tests failed:', error);
      setError(error instanceof Error ? error.message : 'API tests failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testItemLookup = async () => {
    if (!apiBridge.isCharityFeaturesEnabled()) {
      setError('Charity features must be enabled to test item lookup');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing item lookup...');
      
      // Test with sample item IDs
      const testItems = [
        { platform: 'amazon', itemId: 'B08N5WRWNW' },
        { platform: 'ebay', itemId: '123456789' },
        { platform: 'walmart', itemId: '123456789' }
      ];
      
      const results = await Promise.allSettled(
        testItems.map(item => 
          apiBridge.getItemInfo(item.platform, item.itemId)
        )
      );
      
      console.log('Item lookup results:', results);
      
      const successfulLookups = results.filter(result => 
        result.status === 'fulfilled'
      ).length;
      
      setSuccess(`Item lookup test completed: ${successfulLookups}/${testItems.length} successful`);
    } catch (error) {
      console.error('Item lookup test failed:', error);
      setError(error instanceof Error ? error.message : 'Item lookup test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const setSuccess = (message: string) => {
    // In a real app, you'd show this in the UI
    console.log('✅ Success:', message);
  };

  const handleCharityToggle = (enabled: boolean) => {
    console.log(`🎛️ Charity features ${enabled ? 'enabled' : 'disabled'}`);
    if (enabled) {
      runAPITests();
    } else {
      setTestResults([]);
      setComplianceReport(null);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🧪 API Testing & Charity Features
        </h2>
        
        <p className="text-gray-600 mb-6">
          Test the drop shipping API bridge and toggle charity features on/off.
          This demonstrates the Unleash feature flag system for controlling charity functionality.
        </p>

        {/* Charity Feature Toggle */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Feature Toggle
          </h3>
          <CharityFeatureToggle onToggle={handleCharityToggle} />
        </div>

        {/* API Test Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            API Testing
          </h3>
          <div className="flex space-x-4">
            <button
              onClick={runAPITests}
              disabled={isLoading || !apiBridge.isCharityFeaturesEnabled()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Run API Tests'}
            </button>
            <button
              onClick={testItemLookup}
              disabled={isLoading || !apiBridge.isCharityFeaturesEnabled()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Item Lookup
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Running tests...</span>
          </div>
        )}

        {/* API Test Results */}
        {testResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              API Test Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {result.platform}
                    </h4>
                    <span className={`text-lg ${getStatusColor(result.success)}`}>
                      {getStatusIcon(result.success)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Status:</strong> {result.success ? 'Connected' : 'Failed'}</p>
                    <p><strong>Response Time:</strong> {result.responseTime}ms</p>
                    <p><strong>Endpoint:</strong> {result.endpoint}</p>
                    {result.error && (
                      <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Report */}
        {complianceReport && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Compliance Report
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Overall Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Charity Features:</span>
                      <span className={complianceReport.charityFeaturesEnabled ? 'text-green-600' : 'text-gray-500'}>
                        {complianceReport.charityFeaturesEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {complianceReport.overall && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Platform Status</h4>
                  <div className="space-y-1 text-sm">
                    {['amazon', 'ebay', 'walmart'].map(platform => {
                      const platformData = complianceReport[platform];
                      if (!platformData) return null;
                      
                      return (
                        <div key={platform} className="flex justify-between">
                          <span className="capitalize">{platform}:</span>
                          <span className={platformData.connected ? 'text-green-600' : 'text-gray-500'}>
                            {platformData.connected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {complianceReport.message && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-sm">{complianceReport.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documentation */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📚 How It Works
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Unleash Toggle:</strong> The charity features can be enabled/disabled using the toggle above.
              When disabled, all charity-related functionality is completely turned off.
            </p>
            <p>
              <strong>API Testing:</strong> Tests connectivity to Amazon, eBay, and Walmart APIs using read-only operations.
              Only validates credentials without making any changes to listings.
            </p>
            <p>
              <strong>Compliance:</strong> Ensures we use only official charity channels (Amazon Smile, eBay for Charity, 
              Walmart Foundation) and don't interfere with existing drop shipping operations.
            </p>
            <p>
              <strong>Safety:</strong> All operations are read-only except for charity orders, which use official 
              platform charity programs with proper tax handling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITestingExample; 