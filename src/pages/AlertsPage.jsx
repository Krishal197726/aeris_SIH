// src/pages/AlertsPage.jsx

import React, {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

import {
  getWeatherAlerts
} from '../services/aiService';

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] =
    useState('ALL');

  const [alerts, setAlerts] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [location, setLocation] =
    useState(null);

  const loadAlerts = useCallback(
    async (latitude, longitude) => {
      try {
        setIsLoading(true);
        setError('');

        const result =
          await getWeatherAlerts(
            latitude,
            longitude
          );

        setAlerts(
          Array.isArray(result.alerts)
            ? result.alerts
            : []
        );

        setLocation({
          latitude,
          longitude,
          regionCode:
            result.regionCode
        });
      } catch (err) {
        console.error(
          'Failed to load live weather alerts:',
          err
        );

        setError(
          err.message ||
            'Unable to retrieve live weather alerts.'
        );

        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setError(
        'Location access is not supported by this browser.'
      );

      setIsLoading(false);

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadAlerts(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (geoError) => {
        console.error(
          'Browser location error:',
          geoError
        );

        setError(
          'Location permission is required to retrieve alerts for your current area.'
        );

        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [loadAlerts]);

  const normalizedFilter =
    severityFilter.toUpperCase();

  const filteredAlerts =
    alerts.filter((alert) => {
      if (
        normalizedFilter === 'ALL'
      ) {
        return true;
      }

      return (
        String(alert.severity || '')
          .toUpperCase() ===
        normalizedFilter
      );
    });

  const severityCounts = {
    SEVERE: alerts.filter(
      (alert) =>
        alert.severity === 'Severe'
    ).length,

    HIGH: alerts.filter(
      (alert) =>
        alert.severity === 'High'
    ).length,

    MODERATE: alerts.filter(
      (alert) =>
        alert.severity === 'Moderate'
    ).length
  };

  const getSeverityClasses = (
    severity
  ) => {
    if (severity === 'Severe') {
      return {
        badge:
          'bg-red-500/20 text-red-300 border-red-500/40',

        border:
          'border-red-500/30 hover:border-red-500/50',

        icon: '🔴'
      };
    }

    if (severity === 'High') {
      return {
        badge:
          'bg-orange-500/20 text-orange-300 border-orange-500/40',

        border:
          'border-orange-500/30 hover:border-orange-500/50',

        icon: '🟠'
      };
    }

    return {
      badge:
        'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',

      border:
        'border-yellow-500/30 hover:border-yellow-500/50',

      icon: '🟡'
    };
  };

  const formatDate = (
    value
  ) => {
    if (!value) {
      return 'N/A';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#040711] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-mono mb-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />

              <span>
                LIVE PUBLIC ALERT FEED
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              Extreme Weather Alerts
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Official public weather alerts returned for your current location.
            </p>

            {location && (
              <p className="text-[11px] text-slate-500 font-mono mt-2">
                Location:{" "}
                {location.latitude.toFixed(4)},
                {" "}
                {location.longitude.toFixed(4)}
                {location.regionCode
                  ? ` • ${location.regionCode}`
                  : ''}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={
              isLoading ||
              !location
            }
            onClick={() => {
              if (location) {
                loadAlerts(
                  location.latitude,
                  location.longitude
                );
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/40 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isLoading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto">

          <button
            onClick={() =>
              setSeverityFilter('ALL')
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              severityFilter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Alerts ({alerts.length})
          </button>

          <button
            onClick={() =>
              setSeverityFilter('SEVERE')
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
              severityFilter === 'SEVERE'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Severe ({severityCounts.SEVERE})
          </button>

          <button
            onClick={() =>
              setSeverityFilter('HIGH')
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
              severityFilter === 'HIGH'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            High ({severityCounts.HIGH})
          </button>

          <button
            onClick={() =>
              setSeverityFilter('MODERATE')
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
              severityFilter === 'MODERATE'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Moderate ({severityCounts.MODERATE})
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Unable to load live alerts
                </p>

                <p className="text-xs mt-1 text-red-200/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-cyan-300">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />

            <span className="font-mono text-sm">
              Retrieving official weather alerts...
            </span>
          </div>
        )}

        {/* No alerts */}
        {!isLoading &&
          !error &&
          filteredAlerts.length === 0 && (
            <div className="p-10 rounded-3xl bg-slate-900/80 border border-slate-800 text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />

              <h2 className="text-lg font-bold text-white">
                No active public weather alerts
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                No Google Weather public alert currently intersects this location.
              </p>
            </div>
          )}

        {/* Alerts */}
        {!isLoading &&
          filteredAlerts.length > 0 && (
            <div className="space-y-4">

              {filteredAlerts.map(
                (alert) => {
                  const styles =
                    getSeverityClasses(
                      alert.severity
                    );

                  return (
                    <article
                      key={alert.id}
                      className={`p-5 sm:p-6 rounded-3xl glass-panel bg-slate-900/80 border ${styles.border} transition-all duration-200 shadow-xl`}
                    >

                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">

                        <div className="flex items-center gap-3 flex-wrap">

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${styles.badge}`}
                          >
                            {styles.icon}{' '}
                            {alert.severity}
                            {' • '}
                            {alert.category}
                          </span>

                          {alert.alertCode && (
                            <span className="text-xs text-slate-400 font-mono">
                              CODE:{' '}
                              {alert.alertCode}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 font-mono">
                          <Clock className="inline w-3.5 h-3.5 mr-1 text-cyan-400" />

                          {alert.time}
                        </div>
                      </div>

                      {/* Main */}
                      <div className="my-4">

                        <div className="flex items-start gap-2">

                          <MapPin className="w-4 h-4 text-cyan-400 mt-1 shrink-0" />

                          <div>
                            <h3 className="text-lg font-bold text-white font-display">
                              {alert.title}
                            </h3>

                            <p className="text-xs text-slate-400 mt-1">
                              {alert.location}
                            </p>
                          </div>
                        </div>

                        {alert.description && (
                          <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
                            {alert.description}
                          </p>
                        )}
                      </div>

                      {/* Timing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="block text-[10px] text-slate-500 uppercase">
                            Starts
                          </span>

                          <span className="text-xs text-slate-200">
                            {formatDate(
                              alert.issuedAt
                            )}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                          <span className="block text-[10px] text-slate-500 uppercase">
                            Expires
                          </span>

                          <span className="text-xs text-slate-200">
                            {formatDate(
                              alert.expiresAt
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm leading-relaxed text-slate-200 mb-3">

                        <div className="flex items-start gap-2.5">

                          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />

                          <div>
                            <span className="font-bold text-emerald-300 block mb-1">
                              Official Guidance
                            </span>

                            {alert.recommendedAction}
                          </div>
                        </div>
                      </div>

                      {/* Source */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">

                        <span className="text-[11px] text-slate-500 font-mono">
                          Source:{' '}
                          {alert.source}
                        </span>

                        {alert.sourceUrl && (
                          <a
                            href={
                              alert.sourceUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                          >
                            Official source
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                }
              )}

            </div>
          )}
      </div>
    </div>
  );
}
