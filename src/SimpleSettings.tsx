import React, { useState, useEffect } from 'react';
import './SimpleSettings.css';

const SimpleSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    title: 'Yoga Classes & Events',
    defaultView: 'calendar',
    showHeader: true,
    enableBookings: true,
    primaryColor: '#6B46C1',
    fontSize: 14,
    borderRadius: 8,
    language: 'en',
    timeFormat: '12h',
    enableAnimations: false,
  });

  // Determine API URL based on environment
  const getApiUrl = () => {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:8000/api';
    }
    return 'https://yoga-backend.nextechspires.com/api';
  };

  useEffect(() => {
    // Get instance from URL params (for Wix integration)
    const urlParams = new URLSearchParams(window.location.search);
    const instance = urlParams.get('instance');
    if (instance) {
      setInstanceId(instance);
    }

    // Fetch settings from backend
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/settings/widget-config`, {
        headers: {
          'Content-Type': 'application/json',
          // Add instance ID as header if available
          ...(instanceId && { 'X-Instance-Id': instanceId })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          title: data.general?.title || 'Yoga Classes & Events',
          defaultView: data.appearance?.layout || 'calendar',
          showHeader: data.appearance?.showHeader !== false,
          enableBookings: data.features?.enableBooking !== false,
          primaryColor: data.appearance?.primaryColor || '#6B46C1',
          fontSize: settings.fontSize, // Keep local value as it's not in backend yet
          borderRadius: settings.borderRadius, // Keep local value
          language: data.general?.language || 'en',
          timeFormat: settings.timeFormat, // Keep local value
          enableAnimations: settings.enableAnimations, // Keep local value
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDashboard = () => {
    let dashboardUrl = '';

    if (window.location.hostname === 'localhost') {
      // Local development
      dashboardUrl = 'http://localhost:3002';
    } else {
      // Production - use instance from Wix
      if (instanceId) {
        dashboardUrl = `https://yoga-dashboard.nextechspires.com/?instance=${instanceId}`;
      } else {
        // Fallback if no instance provided
        dashboardUrl = 'https://yoga-dashboard.nextechspires.com/';
      }
    }

    window.open(dashboardUrl, '_blank');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const apiUrl = getApiUrl();

      // Prepare data for backend
      const payload = {
        general: {
          title: settings.title,
          language: settings.language,
        },
        appearance: {
          layout: settings.defaultView,
          showHeader: settings.showHeader,
          primaryColor: settings.primaryColor,
        },
        features: {
          enableBooking: settings.enableBookings,
        }
      };

      const response = await fetch(`${apiUrl}/settings/widget-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(instanceId && { 'X-Instance-Id': instanceId })
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = 'Settings saved successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Failed to save settings. Please try again.';
      document.body.appendChild(errorMsg);
      setTimeout(() => errorMsg.remove(), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="settings-panel">
        <div className="loading-message">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <div className="panel-header">
        <h2>Widget Settings</h2>
        <div className="header-buttons">
          <button className="btn-dashboard" onClick={openDashboard}>
            Dashboard
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveTab('appearance')}
        >
          Appearance
        </button>
        <button
          className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>

      <div className="panel-content">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="tab-content">
            <div className="setting-group">
              <label className="setting-label">Widget Title</label>
              <input
                type="text"
                className="setting-input"
                value={settings.title}
                onChange={(e) => updateSetting('title', e.target.value)}
                placeholder="e.g., Yoga Classes & Events"
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">Default View</label>
              <select
                className="setting-select"
                value={settings.defaultView}
                onChange={(e) => updateSetting('defaultView', e.target.value)}
              >
                <option value="calendar">Calendar</option>
                <option value="list">List</option>
                <option value="grid">Grid</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.showHeader}
                  onChange={(e) => updateSetting('showHeader', e.target.checked)}
                />
                <span>Show header</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.enableBookings}
                  onChange={(e) => updateSetting('enableBookings', e.target.checked)}
                />
                <span>Enable bookings</span>
              </label>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="tab-content">
            <div className="setting-group">
              <label className="setting-label">Primary Color</label>
              <div className="color-picker">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting('primaryColor', e.target.value)}
                />
                <span className="color-value">{settings.primaryColor}</span>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Font Size: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="18"
                value={settings.fontSize}
                className="setting-slider"
                onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
              />
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Border Radius: {settings.borderRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={settings.borderRadius}
                className="setting-slider"
                onChange={(e) => updateSetting('borderRadius', Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="tab-content">
            <div className="setting-group">
              <label className="setting-label">Language</label>
              <select
                className="setting-select"
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-label">Time Format</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="timeFormat"
                    value="12h"
                    checked={settings.timeFormat === '12h'}
                    onChange={(e) => updateSetting('timeFormat', e.target.value)}
                  />
                  <span>12 Hour</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="timeFormat"
                    value="24h"
                    checked={settings.timeFormat === '24h'}
                    onChange={(e) => updateSetting('timeFormat', e.target.value)}
                  />
                  <span>24 Hour</span>
                </label>
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.enableAnimations}
                  onChange={(e) => updateSetting('enableAnimations', e.target.checked)}
                />
                <span>Enable animations</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleSettings;