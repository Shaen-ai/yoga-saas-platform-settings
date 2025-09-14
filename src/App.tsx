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
  FormControl,
  FormLabel,
  Chip,
  Paper,
  Slider,
  Stack,
  Grid,
  Card,
  Alert,
  InputLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Dashboard as LayoutIcon,
  Palette as PaletteIcon,
  CalendarMonth as CalendarIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  ViewModule as ViewModuleIcon,
  FormatSize as FormatSizeIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  BorderStyle as BorderIcon
} from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import axios from 'axios';
import { ToastProvider, useToast } from './hooks/useToast';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Professional Color Palette
const COLOR_PRESETS = [
  { name: 'Professional Blue', value: '#2563eb' },
  { name: 'Corporate Gray', value: '#475569' },
  { name: 'Business Green', value: '#059669' },
  { name: 'Executive Purple', value: '#7c3aed' },
  { name: 'Classic Navy', value: '#1e40af' },
  { name: 'Modern Teal', value: '#0891b2' }
];

// Calendar view options
const CALENDAR_VIEWS = [
  { value: 'month', label: 'Month', icon: '📅', description: 'Monthly view' },
  { value: 'week', label: 'Week', icon: '📆', description: 'Weekly view' },
  { value: 'day', label: 'Day', icon: '📖', description: 'Daily view' },
  { value: 'list', label: 'List', icon: '📋', description: 'List view' }
];

function AppContent() {
  const { showSuccess, showError, showInfo } = useToast();
  const [activeSection, setActiveSection] = useState('appearance');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [settings, setSettings] = useState<any>({
    layout: {
      defaultView: 'yogaClasses',  // 'yogaClasses' or 'createPlan'
      defaultMode: 'calendar',  // 'form' or 'calendar' - main widget mode
      defaultCalendarLayout: 'month',  // 'month', 'week', 'day', 'list', 'agenda', 'timeline'
      calendarView: 'month',  // legacy - kept for backward compatibility
      showModeSwitcher: true,  // Show form/calendar mode switcher
      showCalendarHeader: true,  // Show calendar header with view options
      showHeader: true,
      showMainHeader: true,  // Main header with navigation tabs
      headerTitle: 'Yoga Classes',
      showFooter: false,
      compactMode: false,
      // New visibility settings
      showCreatePlanOption: true,
      showYogaClassesOption: true,
      showCalendarToggle: true,
      showLanguageSelector: true,
      showThemeToggle: true,
      showSearchBar: true,
      showFilters: true,
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
      maxTime: '22:00'
    },
    behavior: {
      autoSave: true,
      confirmBeforeDelete: true,
      animationsEnabled: true,
      showTooltips: true,
      language: 'en'
    }
  });

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: <PaletteIcon /> },
    { id: 'layout', label: 'Layout', icon: <ViewModuleIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon /> },
    { id: 'behavior', label: 'Settings', icon: <SettingsIcon /> }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings/ui-preferences`);
      if (response.data) {
        setSettings((prev: any) => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await axios.post(`${API_URL}/settings/ui-preferences`, settings);
      setShowSuccessMessage(true);
      showSuccess('Settings saved successfully');
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      showError('Failed to save settings');
    }
    setIsSaving(false);
  };

  const resetSettings = () => {
    loadSettings();
    showInfo('Settings reset to last saved state');
  };

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleColorSelect = (color: string) => {
    updateSetting('appearance', 'primaryColor', color);
    setShowColorPicker(false);
  };

  return (
    <Box className="settings-container">
      {/* Professional Header */}
      <Box className="settings-header">
        <Box className="header-content">
          <Box>
            <Typography className="header-title">
              Widget Settings
            </Typography>
            <Typography className="header-subtitle">
              Configure your yoga widget
            </Typography>
          </Box>
          <Box className="header-actions">
            <Button
              className="action-button secondary-button"
              startIcon={<RefreshIcon />}
              onClick={resetSettings}
              size="small"
            >
              Reset
            </Button>
            <Button
              className="action-button primary-button"
              startIcon={isSaving ? <span className="loading-spinner" /> : <SaveIcon />}
              onClick={saveSettings}
              disabled={isSaving}
              size="small"
            >
              {isSaving ? 'Saving' : 'Save'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Box className="nav-tabs">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </Box>

      {/* Scrollable Content Area */}
      <Box className="settings-content">
        {/* Content Sections */}
      {activeSection === 'appearance' && (
        <Box className="settings-section">
          <Typography className="section-title">
            Theme Colors
          </Typography>
          
          {/* Color Selection */}
          <Box className="form-group">
            <Typography className="form-label">Primary Color</Typography>
            <Box className="color-grid">
              {COLOR_PRESETS.map((preset) => (
                <Box
                  key={preset.name}
                  className={`color-option ${settings.appearance.primaryColor === preset.value ? 'selected' : ''}`}
                  onClick={() => handleColorSelect(preset.value)}
                  sx={{ backgroundColor: preset.value }}
                >
                  <Typography className="color-name">{preset.name}</Typography>
                  {settings.appearance.primaryColor === preset.value && (
                    <Box className="color-check">
                      <CheckIcon sx={{ fontSize: 14, color: preset.value }} />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <Divider className="divider" />

          {/* Typography Settings */}
          <Typography className="section-title" sx={{ mt: 3 }}>
            Typography
          </Typography>

          <Box className="form-group">
            <Typography className="form-label">
              <FormatSizeIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              Font Size
            </Typography>
            <Box className="slider-container">
              <Box className="slider-header">
                <Typography variant="caption" color="text.secondary">Size</Typography>
                <Box className="slider-value">
                  {settings.appearance.fontSize === 'small' ? '14px' : 
                   settings.appearance.fontSize === 'medium' ? '16px' : '18px'}
                </Box>
              </Box>
              <Slider
                value={settings.appearance.fontSize === 'small' ? 14 : 
                        settings.appearance.fontSize === 'medium' ? 16 : 18}
                onChange={(e, value) => updateSetting('appearance', 'fontSize', 
                  value === 14 ? 'small' : value === 16 ? 'medium' : 'large'
                )}
                min={14}
                max={18}
                step={2}
                marks={[
                  { value: 14, label: 'S' },
                  { value: 16, label: 'M' },
                  { value: 18, label: 'L' }
                ]}
              />
            </Box>
          </Box>

          <Box className="form-group">
            <Typography className="form-label">
              <BorderIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              Border Radius
            </Typography>
            <Box className="slider-container">
              <Box className="slider-header">
                <Typography variant="caption" color="text.secondary">Radius</Typography>
                <Box className="slider-value">{settings.appearance.borderRadius}px</Box>
              </Box>
              <Slider
                value={settings.appearance.borderRadius}
                onChange={(e, value) => updateSetting('appearance', 'borderRadius', value)}
                min={0}
                max={16}
                step={2}
                marks
              />
            </Box>
          </Box>
        </Box>
      )}

      {activeSection === 'layout' && (
        <Box className="settings-section">
          <Typography className="section-title">
            Default View Selection
          </Typography>

          {/* Default Starting View */}
          <Box className="form-group">
            <Typography className="form-label">Default Starting View</Typography>
            <RadioGroup
              value={settings.layout.defaultView}
              onChange={(e) => updateSetting('layout', 'defaultView', e.target.value)}
            >
              <FormControlLabel 
                value="yogaClasses" 
                control={<Radio size="small" />} 
                label={
                  <Box>
                    <Typography>Yoga Classes</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Show calendar view with scheduled classes
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel 
                value="createPlan" 
                control={<Radio size="small" />} 
                label={
                  <Box>
                    <Typography>Create Your Yoga Plan</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Show yoga plan creation form
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          <Divider className="divider" />

          <Typography className="section-title" sx={{ mt: 3 }}>
            Calendar Configuration
          </Typography>

          {/* Calendar View Selection */}
          <Box className="form-group">
            <Typography className="form-label">Default Calendar View</Typography>
            <Box className="view-options-grid">
              {CALENDAR_VIEWS.map((view) => (
                <Box
                  key={view.value}
                  className={`view-option-card ${settings.layout.calendarView === view.value ? 'selected' : ''}`}
                  onClick={() => updateSetting('layout', 'calendarView', view.value)}
                >
                  <Box className="view-option-icon">{view.icon}</Box>
                  <Typography className="view-option-title">{view.label}</Typography>
                  <Typography className="view-option-description">{view.description}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider className="divider" />

          {/* Layout Options */}
          <Typography className="section-title" sx={{ mt: 3 }}>
            Display Options
          </Typography>

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

            {/* Widget Control Toggles */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
              Widget Controls
            </Typography>

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

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Main Header</Typography>
                <Typography className="toggle-description">Display main navigation header with tabs</Typography>
              </Box>
              <Switch
                checked={settings.layout.showMainHeader}
                onChange={(e) => updateSetting('layout', 'showMainHeader', e.target.checked)}
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

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Calendar Toggle</Typography>
                <Typography className="toggle-description">Allow users to switch calendar views</Typography>
              </Box>
              <Switch
                checked={settings.layout.showCalendarToggle}
                onChange={(e) => updateSetting('layout', 'showCalendarToggle', e.target.checked)}
                size="small"
              />
            </Box>

            <Divider sx={{ my: 2 }} />
            
            {/* UI Elements */}
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
              Interface Elements
            </Typography>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Header</Typography>
                <Typography className="toggle-description">Display widget header with title</Typography>
              </Box>
              <Switch
                checked={settings.layout.showHeader}
                onChange={(e) => updateSetting('layout', 'showHeader', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Search Bar</Typography>
                <Typography className="toggle-description">Enable class search functionality</Typography>
              </Box>
              <Switch
                checked={settings.layout.showSearchBar}
                onChange={(e) => updateSetting('layout', 'showSearchBar', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Filters</Typography>
                <Typography className="toggle-description">Enable filtering options for classes</Typography>
              </Box>
              <Switch
                checked={settings.layout.showFilters}
                onChange={(e) => updateSetting('layout', 'showFilters', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Language Selector</Typography>
                <Typography className="toggle-description">Allow users to change language</Typography>
              </Box>
              <Switch
                checked={settings.layout.showLanguageSelector}
                onChange={(e) => updateSetting('layout', 'showLanguageSelector', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Theme Toggle</Typography>
                <Typography className="toggle-description">Allow users to switch between themes</Typography>
              </Box>
              <Switch
                checked={settings.layout.showThemeToggle}
                onChange={(e) => updateSetting('layout', 'showThemeToggle', e.target.checked)}
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

      {activeSection === 'calendar' && (
        <Box className="settings-section">
          <Typography className="section-title">
            <ScheduleIcon sx={{ mr: 1, fontSize: 20 }} />
            Calendar Preferences
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <FormLabel sx={{ mb: 1 }}>Week Starts On</FormLabel>
                <RadioGroup
                  value={settings.calendar.weekStartsOn}
                  onChange={(e) => updateSetting('calendar', 'weekStartsOn', e.target.value)}
                >
                  <FormControlLabel 
                    value="sunday" 
                    control={<Radio size="small" />} 
                    label="Sunday" 
                  />
                  <FormControlLabel 
                    value="monday" 
                    control={<Radio size="small" />} 
                    label="Monday" 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <FormLabel sx={{ mb: 1 }}>Time Format</FormLabel>
                <RadioGroup
                  value={settings.calendar.timeFormat}
                  onChange={(e) => updateSetting('calendar', 'timeFormat', e.target.value)}
                >
                  <FormControlLabel 
                    value="12h" 
                    control={<Radio size="small" />} 
                    label="12 Hour (AM/PM)" 
                  />
                  <FormControlLabel 
                    value="24h" 
                    control={<Radio size="small" />} 
                    label="24 Hour" 
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>

          <Divider className="divider" />

          <Box className="toggle-container">
            <Box className="toggle-label">
              <Typography className="toggle-text">Show Week Numbers</Typography>
              <Typography className="toggle-description">Display week numbers in calendar view</Typography>
            </Box>
            <Switch
              checked={settings.calendar.showWeekNumbers}
              onChange={(e) => updateSetting('calendar', 'showWeekNumbers', e.target.checked)}
              size="small"
            />
          </Box>

          {/* Info Card */}
          <Box className="info-card">
            <InfoIcon className="info-icon" />
            <Box className="info-content">
              <Typography className="info-title">Calendar Display</Typography>
              <Typography className="info-text">
                These settings affect how dates and times are displayed in the calendar widget.
                Changes will be applied immediately after saving.
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {activeSection === 'behavior' && (
        <Box className="settings-section">
          <Typography className="section-title">
            General Settings
          </Typography>

          <Stack spacing={2}>
            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Enable Animations</Typography>
                <Typography className="toggle-description">Smooth transitions and effects</Typography>
              </Box>
              <Switch
                checked={settings.behavior.animationsEnabled}
                onChange={(e) => updateSetting('behavior', 'animationsEnabled', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Auto-save</Typography>
                <Typography className="toggle-description">Automatically save user progress</Typography>
              </Box>
              <Switch
                checked={settings.behavior.autoSave}
                onChange={(e) => updateSetting('behavior', 'autoSave', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Show Tooltips</Typography>
                <Typography className="toggle-description">Display helpful hints on hover</Typography>
              </Box>
              <Switch
                checked={settings.behavior.showTooltips}
                onChange={(e) => updateSetting('behavior', 'showTooltips', e.target.checked)}
                size="small"
              />
            </Box>

            <Box className="toggle-container">
              <Box className="toggle-label">
                <Typography className="toggle-text">Confirm Deletions</Typography>
                <Typography className="toggle-description">Ask before removing items</Typography>
              </Box>
              <Switch
                checked={settings.behavior.confirmBeforeDelete}
                onChange={(e) => updateSetting('behavior', 'confirmBeforeDelete', e.target.checked)}
                size="small"
              />
            </Box>
          </Stack>

          <Divider className="divider" />

          {/* Language Selection */}
          <Box className="form-group">
            <Typography className="form-label">
              <LanguageIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
              Language
            </Typography>
            <Select
              value={settings.behavior.language}
              onChange={(e) => updateSetting('behavior', 'language', e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
              <MenuItem value="it">Italiano</MenuItem>
            </Select>
          </Box>
        </Box>
      )}

      </Box> {/* End of scrollable content */}

      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <Box className="success-overlay">
          <CheckIcon className="success-icon" />
          <Typography className="success-text">Settings saved</Typography>
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