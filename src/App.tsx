import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Divider,
  Radio,
  RadioGroup,
  Paper,
  Stack,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Save as SaveIcon,
  ViewModule as ViewModuleIcon,
  CheckCircle as CheckIcon,
  Dashboard as DashboardIcon,
  Upgrade as UpgradeIcon
} from '@mui/icons-material';
import { ToastProvider, useToast } from './hooks/useToast';
import { settingsAPI, premiumAPI } from './services/api';
import { storeWixParams, buildDashboardUrl, isWixEnvironment, setAuthInfo } from './utils/wixUtils';
import { getWidgetProps, onSettingsUpdate, getEditorContext } from './services/wixEditor';
import { getCompId, getInstanceToken, updateWidgetConfig } from './services/wix-integration';
import './App.css';

function AppContent() {
  const { showSuccess, showError } = useToast();
  const [activeSection, setActiveSection] = useState('appearance');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string>('');
  const [premiumPlan, setPremiumPlan] = useState<string>('free');
  const [instanceId, setInstanceId] = useState<string>('');

  const [settings, setSettings] = useState<any>({
    layout: {
      defaultView: 'yogaClasses',  // 'yogaClasses' or 'createPlan'
      defaultMode: 'calendar',  // 'form' or 'calendar' - main widget mode
      defaultCalendarLayout: 'month',  // 'month', 'week', 'day', 'list', 'agenda', 'timeline'
      calendarView: 'month',  // legacy - kept for backward compatibility
      showModeSwitcher: true,  // Show form/calendar mode switcher
      showCalendarHeader: true,  // Show calendar header with view options
      headerTitle: 'Yoga Classes',
      showFooter: false,
      compactMode: false,
      // New visibility settings
      showCreatePlanOption: true,
      showYogaClassesOption: true,
      showInstructorInfo: true,
      showClassDuration: true,
      showClassLevel: true,
      showBookingButton: true,
      showWaitlistOption: true
    },
    appearance: {
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      headerColor: '#f8f9fa',
      borderRadius: 8,
      fontFamily: 'default',
      fontSize: 'medium'
    },
    calendar: {
      weekStartsOn: 'sunday',
      timeFormat: '12h',
      showWeekNumbers: false,
      eventDisplay: 'block',
      minTime: '06:00',
      maxTime: '22:00',
      showEventTime: false
    },
    behavior: {
      autoSave: true,
      confirmBeforeDelete: true,
      animationsEnabled: true,
      showTooltips: true,
      language: 'en'
    },
    uiPreferences: {
      clickAction: 'tooltip'  // 'tooltip' or 'popup'
    }
  });

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
    { id: 'layout', label: 'Layout', icon: <ViewModuleIcon /> }
  ];

  useEffect(() => {
    console.log('useEffect running - initializing settings');

    const loadSettings = async () => {
      console.log('loadSettings() called - attempting to fetch UI preferences');
      try {
        console.log('Calling settingsAPI.getUIPreferences()...');
        const data = await settingsAPI.getUIPreferences();
        console.log('Settings loaded successfully:', data);
        if (data) {
          // Store auth info and build dashboard URL
          // Use compId from wix-integration as fallback if backend doesn't return it
          const localCompId = getCompId();
          const localInstanceToken = getInstanceToken();

          const effectiveAuth = {
            compId: data.auth?.compId || localCompId,
            instanceToken: data.auth?.instanceToken || localInstanceToken,
            instanceId: data.auth?.instanceId,
            isAuthenticated: data.auth?.isAuthenticated || !!localInstanceToken
          };

          console.log('Auth info (with fallbacks):', {
            compId: effectiveAuth.compId,
            instanceToken: effectiveAuth.instanceToken ? 'present' : 'null',
            isAuthenticated: effectiveAuth.isAuthenticated,
            fromApi: !!data.auth?.compId,
            fromLocal: !!localCompId
          });

          setAuthInfo(effectiveAuth);

          // Store instanceId for upgrade URL
          if (effectiveAuth.instanceId) {
            setInstanceId(effectiveAuth.instanceId);
          }

          // Build dashboard URL with effective auth info
          const url = buildDashboardUrl(effectiveAuth);
          console.log('Dashboard URL built:', url);
          setDashboardUrl(url);

          // Extract premium plan name from settings
          if (data.premiumPlanName) {
            console.log('Premium plan from settings:', data.premiumPlanName);
            setPremiumPlan(data.premiumPlanName);
          }

          setSettings((prev: any) => ({
            ...prev,
            ...data
          }));
          console.log('Settings state updated');
        } else {
          console.log('No settings data returned from API');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        showError('Failed to load settings');
      }
    };

    const loadPremiumStatus = async () => {
      console.log('loadPremiumStatus() called - attempting to fetch premium status');
      try {
        const premiumData = await premiumAPI.getPremiumStatus();
        console.log('Premium status loaded:', premiumData);
        if (premiumData && premiumData.premiumPlanName) {
          setPremiumPlan(premiumData.premiumPlanName);
        }
      } catch (error) {
        console.error('Failed to load premium status:', error);
        // Don't show error to user, just log it
      }
    };

    const initializeSettings = async () => {
      // Store Wix params if present
      storeWixParams();

      // Get editor context for instance ID
      try {
        const context = await getEditorContext();
        if (context) {
          console.log('Editor context loaded:', context);
        }
      } catch (error) {
        console.log('Editor context not available');
      }

      // Load widget properties if available
      try {
        const props = await getWidgetProps();
        if (props) {
          console.log('Widget properties loaded:', props);
          // You can map widget props to settings here if needed
        }
      } catch (error) {
        console.log('Widget properties not available');
      }

      // Load settings from backend
      await loadSettings();

      // Load premium status
      await loadPremiumStatus();

      // Listen for settings updates from Wix
      onSettingsUpdate((data) => {
        console.log('Settings updated from Wix:', data);
        loadSettings();
        loadPremiumStatus();
      });

      // Listen for panel visibility changes in Wix Editor
      // When panel is reopened, reload settings
      if ((window as any).Wix?.addEventListener && (window as any).Wix?.Events) {
        console.log('Setting up Wix visibility listener');
        (window as any).Wix.addEventListener((window as any).Wix.Events.PAGE_NAVIGATION, () => {
          console.log('Wix PAGE_NAVIGATION event - reloading settings');
          loadSettings();
          loadPremiumStatus();
        });
      }

      // Also listen for custom event when panel becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log('Settings panel became visible - reloading settings');
          loadSettings();
          loadPremiumStatus();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    initializeSettings();
  }, [showError]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to backend API
      await settingsAPI.saveUIPreferences(settings);

      // Also update widget properties if in Wix Editor
      if (isWixEnvironment()) {
        const widgetProps = {
          primaryColor: settings.appearance.primaryColor,
          theme: settings.appearance.theme || 'light',
          fontSize: settings.appearance.fontSize,
          borderRadius: settings.appearance.borderRadius,
          defaultView: settings.layout.defaultView,
          calendarView: settings.layout.calendarView,
          showHeader: settings.layout.showHeader,
          headerTitle: settings.layout.headerTitle,
          compactMode: settings.layout.compactMode,
          language: settings.behavior.language,
          animations: settings.behavior.animationsEnabled,
        };

        await setWidgetProps(widgetProps);
        console.log('Widget properties updated');
      }

      setShowSuccessMessage(true);
      showSuccess('Settings saved successfully');
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev: any) => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };

      // Update widget preview interactively without saving to backend
      // Only update the specific changed property
      const flattenedUpdate: Record<string, any> = {};

      // Map nested settings to flat widget props
      if (section === 'appearance') {
        if (key === 'primaryColor') flattenedUpdate.primaryColor = value;
        if (key === 'fontSize') flattenedUpdate.fontSize = value;
        if (key === 'borderRadius') flattenedUpdate.borderRadius = value;
      } else if (section === 'layout') {
        if (key === 'defaultView') flattenedUpdate.defaultView = value;
        if (key === 'defaultMode') flattenedUpdate.defaultMode = value;
        if (key === 'defaultCalendarLayout') flattenedUpdate.defaultCalendarLayout = value;
        if (key === 'calendarView') flattenedUpdate.calendarView = value;
        if (key === 'showModeSwitcher') flattenedUpdate.showModeSwitcher = value;
        if (key === 'showCalendarHeader') flattenedUpdate.showCalendarHeader = value;
        if (key === 'headerTitle') flattenedUpdate.headerTitle = value;
        if (key === 'compactMode') flattenedUpdate.compactMode = value;
        if (key === 'showCreatePlanOption') flattenedUpdate.showCreatePlanOption = value;
        if (key === 'showYogaClassesOption') flattenedUpdate.showYogaClassesOption = value;
        if (key === 'showInstructorInfo') flattenedUpdate.showInstructorInfo = value;
        if (key === 'showClassDuration') flattenedUpdate.showClassDuration = value;
        if (key === 'showClassLevel') flattenedUpdate.showClassLevel = value;
        if (key === 'showBookingButton') flattenedUpdate.showBookingButton = value;
        if (key === 'showWaitlistOption') flattenedUpdate.showWaitlistOption = value;
      } else if (section === 'behavior') {
        if (key === 'language') flattenedUpdate.language = value;
        if (key === 'animationsEnabled') flattenedUpdate.animations = value;
      } else if (section === 'calendar') {
        if (key === 'weekStartsOn') flattenedUpdate.weekStartsOn = value;
        if (key === 'timeFormat') flattenedUpdate.timeFormat = value;
        if (key === 'showEventTime') flattenedUpdate.showEventTime = value;
      } else if (section === 'uiPreferences') {
        if (key === 'clickAction') flattenedUpdate.clickAction = value;
      }

      // Update widget in background if we have changes
      if (Object.keys(flattenedUpdate).length > 0 && isWixEnvironment()) {
        Promise.resolve().then(() => {
          updateWidgetConfig(flattenedUpdate, true).catch((err: any) => {
            console.error('[Settings] Failed to update widget preview:', err);
          });
        });
      }

      return newSettings;
    });
  };

  const handleUpgrade = () => {
    const APP_ID = '74a1061c-62ad-4926-94d7-ef7a94bc1330';
    const upgradeUrl = `https://www.wix.com/apps/upgrade/${APP_ID}${instanceId ? `?appInstanceId=${instanceId}` : ''}`;
    console.log('Opening upgrade URL:', upgradeUrl);
    window.open(upgradeUrl, '_blank');
  };

  return (
    <Box className="modern-settings-container">
      {/* Two Column Layout without header */}
      <Box className="modern-layout no-header">
        {/* Sidebar Navigation */}
        <Box className="sidebar">
          {/* Action buttons at top of sidebar */}
          <Box className="sidebar-actions" style={{ marginBottom: '16px' }}>
            {/* Upgrade and Dashboard buttons in one row */}
            <Stack direction="row" spacing={1} width="100%" mb={1.5}>
              {/* Upgrade Button - Only show if not on highest plan */}
              {premiumPlan !== 'business-pro' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UpgradeIcon />}
                  onClick={handleUpgrade}
                  sx={{
                    flex: 1,
                    borderColor: '#3899EC',
                    color: '#3899EC',
                    '&:hover': {
                      borderColor: '#2B7ACC',
                      backgroundColor: '#3899EC08',
                    },
                    fontSize: '13px',
                    fontWeight: 500,
                    textTransform: 'none',
                    py: 0.75,
                    minWidth: 0
                  }}
                >
                  Upgrade
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<DashboardIcon />}
                onClick={() => {
                  console.log('Opening dashboard with URL:', dashboardUrl);
                  window.open(dashboardUrl || buildDashboardUrl(), '_blank');
                }}
                className="dashboard-button"
                size="small"
                disabled={!dashboardUrl}
                sx={{
                  flex: 1,
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  color: 'rgba(0, 0, 0, 0.87)',
                  '&:hover': {
                    borderColor: 'rgba(0, 0, 0, 0.87)',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                  },
                  fontSize: '13px',
                  fontWeight: 500,
                  textTransform: 'none',
                  py: 0.75,
                  minWidth: 0
                }}
              >
                Dashboard
              </Button>
            </Stack>
            <Button
              variant="contained"
              fullWidth
              startIcon={isSaving ? <span className="loading-spinner" /> : <SaveIcon />}
              onClick={saveSettings}
              disabled={isSaving}
              className="save-button"
              size="large"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>

          <nav className="sidebar-nav" role="navigation" aria-label="Settings navigation" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sections.map((section) => (
              <button
                key={section.id}
                className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? 'page' : undefined}
                tabIndex={0}
                style={{ width: 'calc(50% - 4px)' }}
              >
                <span className="sidebar-icon" aria-hidden="true">{section.icon}</span>
                <span className="sidebar-label">{section.label}</span>
              </button>
            ))}
          </nav>
        </Box>

        {/* Main Content Area */}
        <Box className="main-content">
          <Box className="content-wrapper">
        {/* Content Sections */}
      {activeSection === 'appearance' && (
        <Box className="settings-section">
          {/* Color Selection Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFA'
            }}
          >
            <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1.5, color: '#334155', letterSpacing: '-0.01em' }}>
              Primary Color
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                type="color"
                value={settings.appearance.primaryColor || '#2563eb'}
                onChange={(e) => updateSetting('appearance', 'primaryColor', e.target.value)}
                size="small"
                sx={{
                  width: '60px',
                  '& input': {
                    height: '36px',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }
                }}
              />
              <Box
                sx={{
                  flex: 1,
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: settings.appearance.primaryColor || '#2563eb',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {settings.appearance.primaryColor || '#2563eb'}
              </Box>
            </Box>
          </Paper>

          {/* Event Click Behavior Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFA'
            }}
          >
            <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1.5, color: '#334155', letterSpacing: '-0.01em' }}>
              Event Click Behavior
            </Typography>
            <RadioGroup
              value={settings.uiPreferences?.clickAction || 'tooltip'}
              onChange={(e) => updateSetting('uiPreferences', 'clickAction', e.target.value)}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: settings.uiPreferences?.clickAction === 'tooltip'
                    ? settings.appearance.primaryColor || '#667eea'
                    : '#E2E8F0',
                  backgroundColor: settings.uiPreferences?.clickAction === 'tooltip'
                    ? `${settings.appearance.primaryColor}10` || '#667eea10'
                    : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FormControlLabel
                  value="tooltip"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>Tooltip</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                        Show event details in a compact tooltip near the event
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', margin: 0 }}
                />
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: settings.uiPreferences?.clickAction === 'popup'
                    ? settings.appearance.primaryColor || '#667eea'
                    : '#E2E8F0',
                  backgroundColor: settings.uiPreferences?.clickAction === 'popup'
                    ? `${settings.appearance.primaryColor}10` || '#667eea10'
                    : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FormControlLabel
                  value="popup"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>Popup Modal</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                        Show event details in a centered modal dialog
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', margin: 0 }}
                />
              </Paper>
            </RadioGroup>
          </Paper>

          {/* Language Selection Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFA'
            }}
          >
            <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1.5, color: '#334155', letterSpacing: '-0.01em' }}>
              Language
            </Typography>
            <Select
              value={settings.behavior?.language || 'en'}
              onChange={(e) => updateSetting('behavior', 'language', e.target.value)}
              size="small"
              fullWidth
              sx={{
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#E2E8F0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: settings.appearance.primaryColor || '#667eea'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: settings.appearance.primaryColor || '#667eea'
                }
              }}
            >
              <MenuItem value="en">🇬🇧 English</MenuItem>
              <MenuItem value="es">🇪🇸 Español</MenuItem>
              <MenuItem value="fr">🇫🇷 Français</MenuItem>
              <MenuItem value="de">🇩🇪 Deutsch</MenuItem>
              <MenuItem value="it">🇮🇹 Italiano</MenuItem>
            </Select>
          </Paper>

          {/* Calendar Settings Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFA'
            }}
          >
            <Typography sx={{ fontSize: '13px', fontWeight: 600, mb: 1.5, color: '#334155', letterSpacing: '-0.01em' }}>
              Calendar Preferences
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: '12px', color: '#64748B' }}>
                  Week Starts On
                </Typography>
                <RadioGroup
                  row
                  value={settings.calendar?.weekStartsOn || 'sunday'}
                  onChange={(e) => updateSetting('calendar', 'weekStartsOn', e.target.value)}
                >
                  <FormControlLabel
                    value="sunday"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: '12px' }}>Sunday</Typography>}
                    sx={{ mr: 2 }}
                  />
                  <FormControlLabel
                    value="monday"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: '12px' }}>Monday</Typography>}
                  />
                </RadioGroup>
              </Box>

              <Box sx={{ flex: '1 1 200px' }}>
                <Typography sx={{ fontWeight: 600, mb: 0.5, fontSize: '12px', color: '#64748B' }}>
                  Time Format
                </Typography>
                <RadioGroup
                  row
                  value={settings.calendar?.timeFormat || '12h'}
                  onChange={(e) => updateSetting('calendar', 'timeFormat', e.target.value)}
                >
                  <FormControlLabel
                    value="12h"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: '12px' }}>12h</Typography>}
                    sx={{ mr: 2 }}
                  />
                  <FormControlLabel
                    value="24h"
                    control={<Radio size="small" />}
                    label={<Typography sx={{ fontSize: '12px' }}>24h</Typography>}
                  />
                </RadioGroup>
              </Box>

              <Box sx={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '12px', color: '#64748B' }}>
                    Show Event Time
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                    Display time next to event titles
                  </Typography>
                </Box>
                <Switch
                  checked={settings.calendar?.showEventTime ?? false}
                  onChange={(e) => updateSetting('calendar', 'showEventTime', e.target.checked)}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {activeSection === 'layout' && (
        <Box className="settings-section">
          {/* Layout Options */}
          <Stack spacing={2}>
            {/* Default Mode Selection */}
            <Box className="form-group">
              <Typography className="form-label">Default Widget Mode</Typography>
              <RadioGroup
                value={settings.layout.defaultMode}
                onChange={(e) => updateSetting('layout', 'defaultMode', e.target.value)}
              >
                <FormControlLabel 
                  value="calendar" 
                  control={<Radio size="small" />} 
                  label={
                    <Box>
                      <Typography>Calendar View</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show events calendar by default
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="form" 
                  control={<Radio size="small" />} 
                  label={
                    <Box>
                      <Typography>Form View</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show yoga plan creation form by default
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>

            {/* Calendar Layout Selection (only shown when calendar mode is selected) */}
            {settings.layout.defaultMode === 'calendar' && (
              <Box className="form-group">
                <Typography className="form-label">Default Calendar Layout</Typography>
                <RadioGroup
                  value={settings.layout.defaultCalendarLayout || 'month'}
                  onChange={(e) => updateSetting('layout', 'defaultCalendarLayout', e.target.value)}
                >
                  <FormControlLabel 
                    value="month" 
                    control={<Radio size="small" />} 
                    label="Monthly View"
                  />
                  <FormControlLabel 
                    value="week" 
                    control={<Radio size="small" />} 
                    label="Weekly View"
                  />
                  <FormControlLabel 
                    value="day" 
                    control={<Radio size="small" />} 
                    label="Daily View"
                  />
                  <FormControlLabel 
                    value="list" 
                    control={<Radio size="small" />} 
                    label="List View"
                  />
                  <FormControlLabel 
                    value="agenda" 
                    control={<Radio size="small" />} 
                    label="Agenda View"
                  />
                  <FormControlLabel 
                    value="timeline" 
                    control={<Radio size="small" />} 
                    label="Timeline View"
                  />
                </RadioGroup>
              </Box>
            )}

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Mode Switcher</Typography>
                <Typography className="toggle-description">Allow users to switch between form and calendar modes</Typography>
              </Box>
              <Switch
                checked={settings.layout.showModeSwitcher}
                onChange={(e) => updateSetting('layout', 'showModeSwitcher', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Calendar Header</Typography>
                <Typography className="toggle-description">Display calendar header with view options (month/week/day)</Typography>
              </Box>
              <Switch
                checked={settings.layout.showCalendarHeader}
                onChange={(e) => updateSetting('layout', 'showCalendarHeader', e.target.checked)}
                size="small"
              />
            </Box>

            {/* Navigation Options */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Navigation Elements
            </Typography>
            
            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Create Plan Option</Typography>
                <Typography className="toggle-description">Allow users to create yoga plans</Typography>
              </Box>
              <Switch
                checked={settings.layout.showCreatePlanOption}
                onChange={(e) => updateSetting('layout', 'showCreatePlanOption', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Yoga Classes Option</Typography>
                <Typography className="toggle-description">Allow users to view scheduled classes</Typography>
              </Box>
              <Switch
                checked={settings.layout.showYogaClassesOption}
                onChange={(e) => updateSetting('layout', 'showYogaClassesOption', e.target.checked)}
                size="small"
              />
            </Box>

            <Divider sx={{ my: 2 }} />
            
            {/* Class Information */}
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
              Class Information Display
            </Typography>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Instructor Info</Typography>
                <Typography className="toggle-description">Display instructor name and details</Typography>
              </Box>
              <Switch
                checked={settings.layout.showInstructorInfo}
                onChange={(e) => updateSetting('layout', 'showInstructorInfo', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Class Duration</Typography>
                <Typography className="toggle-description">Display class length in minutes</Typography>
              </Box>
              <Switch
                checked={settings.layout.showClassDuration}
                onChange={(e) => updateSetting('layout', 'showClassDuration', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Class Level</Typography>
                <Typography className="toggle-description">Display difficulty level indicator</Typography>
              </Box>
              <Switch
                checked={settings.layout.showClassLevel}
                onChange={(e) => updateSetting('layout', 'showClassLevel', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Booking Button</Typography>
                <Typography className="toggle-description">Enable class booking functionality</Typography>
              </Box>
              <Switch
                checked={settings.layout.showBookingButton}
                onChange={(e) => updateSetting('layout', 'showBookingButton', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Waitlist Option</Typography>
                <Typography className="toggle-description">Allow joining waitlist for full classes</Typography>
              </Box>
              <Switch
                checked={settings.layout.showWaitlistOption}
                onChange={(e) => updateSetting('layout', 'showWaitlistOption', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Compact Mode</Typography>
                <Typography className="toggle-description">Reduce spacing for smaller displays</Typography>
              </Box>
              <Switch
                checked={settings.layout.compactMode}
                onChange={(e) => updateSetting('layout', 'compactMode', e.target.checked)}
                size="small"
              />
            </Box>
          </Stack>

          {settings.layout.showHeader && (
            <Box className="form-group" sx={{ mt: 3 }}>
              <Typography className="form-label">Header Title</Typography>
              <TextField
                fullWidth
                size="small"
                value={settings.layout.headerTitle}
                onChange={(e) => updateSetting('layout', 'headerTitle', e.target.value)}
                placeholder="Enter header title"
                variant="outlined"
              />
            </Box>
          )}
        </Box>
      )}



          </Box> {/* End of content-wrapper */}
        </Box> {/* End of main-content */}
      </Box> {/* End of modern-layout */}

      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <Box className="success-overlay">
          <CheckIcon className="success-icon" />
          <Typography className="success-text">Settings saved successfully</Typography>
        </Box>
      )}
    </Box>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;