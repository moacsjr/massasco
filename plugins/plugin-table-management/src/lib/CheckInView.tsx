'use client';

import React from 'react';
import {
  FeaturePlugin,
} from '@temp-workspace/plugin-loader';
import { useUI } from '@temp-workspace/ui-registry';

// ============================================================================
// Types
// ============================================================================

interface CheckInViewProps {
  tableToken?: string;
}

interface CheckInResponse {
  id: string;
  tableId: string;
  hostName: string;
  status: 'OPEN' | 'OCCUPIED' | 'CLOSING' | 'CLOSED';
  capacity: number;
  createdAt: string;
  host: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    role: 'HOST' | 'GUEST';
    joinedAt: string;
  };
  deviceSession: {
    id: string;
    sessionId: string;
    expiresAt: string;
  };
}

// ============================================================================
// CheckInView Component
// ============================================================================

const CheckInView: React.FC<CheckInViewProps> = ({ tableToken }) => {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');
  const Input = resolve('Input');

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [locationEnabled, setLocationEnabled] = React.useState(false);
  const [geolocationEnabled, setGeolocationEnabled] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<CheckInResponse | null>(null);
  const [showJoinRequest, setShowJoinRequest] = React.useState(false);
  const [joinRequestName, setJoinRequestName] = React.useState('');
  const [joinRequestEmail, setJoinRequestEmail] = React.useState('');
  const [tableSessionId, setTableSessionId] = React.useState<string | null>(null);

  // Load geolocation settings on mount
  React.useEffect(() => {
    const loadGeolocationSettings = async () => {
      try {
        const res = await fetch('/api/system-settings/geolocation');
        if (res.ok) {
          const data = await res.json();
          setGeolocationEnabled(data.enabled);
        }
      } catch (err) {
        console.error('Error loading geolocation settings:', err);
      }
    };
    loadGeolocationSettings();
  }, []);

  // Request location permission
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationEnabled(true);
        setError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Allow check-in without location for now
        setLocationEnabled(false);
        setError(null);
      }
    );
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const location = locationEnabled
        ? await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
              () => reject(new Error('Location permission denied'))
            );
          })
        : undefined;

      const res = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          location,
          ipAddress: undefined, // Can be added via server-side
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to check-in');
      }

      const data = await res.json();
      setSuccess(data);
      setTableSessionId(data.id);
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || 'Failed to check-in');
    } finally {
      setLoading(false);
    }
  };

  // Handle join request (for guests)
  const handleJoinRequest = async () => {
    if (!joinRequestName.trim()) {
      setError('Name is required for join request');
      return;
    }

    if (!tableSessionId) {
      setError('No active session to join');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/participant-join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableSessionId,
          requesterName: joinRequestName.trim(),
          requesterEmail: joinRequestEmail.trim() || undefined,
          ipAddress: undefined,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send join request');
      }

      setSuccess(null);
      setShowJoinRequest(false);
      setJoinRequestName('');
      setJoinRequestEmail('');
      setError(null);
      alert('Join request sent successfully! Waiting for host approval.');
    } catch (err: any) {
      console.error('Join request error:', err);
      setError(err.message || 'Failed to send join request');
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'OCCUPIED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CLOSING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'CLOSED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (success) {
    return (
      <div className="max-w-[1200px]">
        <Card title="Check-in Successful" padding="lg">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Check-in Complete!
            </h2>
            <p className="text-muted-foreground mb-6">
              Welcome, {success.hostName}! Your session has been created.
            </p>

            <div className="bg-card rounded-lg p-6 max-w-md mx-auto border border-border">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">Session ID</span>
                <span className="text-sm font-mono text-foreground">
                  {success.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">Status</span>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium border ${getStatusColor(success.status)}`}
                >
                  {success.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Capacity</span>
                <span className="text-sm text-foreground">{success.capacity} people</span>
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSuccess(null);
                  setName('');
                  setEmail('');
                  setPhone('');
                  setLocationEnabled(false);
                }}
              >
                New Check-in
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowJoinRequest(true)}
              >
                Invite Guest
              </Button>
            </div>
          </div>
        </Card>

        {/* Join Request Modal */}
        {showJoinRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4">Invite Guest</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Send a join request to this session. The host will need to approve.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Guest Name
                  </label>
                  <Input
                    name="joinRequestName"
                    label="Guest Name"
                    type="text"
                    value={joinRequestName}
                    onChange={(e) => setJoinRequestName(e.target.value)}
                    placeholder="Enter guest name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email (optional)
                  </label>
                  <Input
                    name="joinRequestEmail"
                    label="Email"
                    type="email"
                    value={joinRequestEmail}
                    onChange={(e) => setJoinRequestEmail(e.target.value)}
                    placeholder="guest@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setShowJoinRequest(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleJoinRequest}
                  isLoading={loading}
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      <Card title="Check-in" padding="lg">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="max-w-md mx-auto">
          <div className="space-y-6">
            {/* Name Input */}
            <Input
              name="name"
              label="Your Name *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            {/* Email Input (optional) */}
            <Input
              name="email"
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />

            {/* Phone Input (optional) */}
            <Input
              name="phone"
              label="Phone (optional)"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />

            {/* Location Permission - Only show if geolocation is enabled in settings */}
            {geolocationEnabled && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      Location Validation
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      For security, we require location validation within 100m of the restaurant.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestLocation}
                    >
                      {locationEnabled ? (
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Location Enabled
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Enable Location
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckIn}
              isLoading={loading}
              className="w-full"
            >
              Check-in
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By checking in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// Plugin Registration
// ============================================================================

export const checkInPlugin: FeaturePlugin = {
  id: 'check-in',
  name: 'Check-in',
  type: 'feature',
  layout: 'admin',
  icon: 'UserCheck',
  routes: [
    {
      path: '',
      component: CheckInView,
      label: 'Check-in',
      icon: 'UserCheck',
      showInMenu: true,
    },
  ],
};

// Named export for the component
export { CheckInView };