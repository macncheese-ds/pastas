/**
 * =====================================================
 * Reports Tab Component - Enhanced Version
 * =====================================================
 */

import { useState, useEffect, useMemo } from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import { useLanguage } from '../../i18n';
import {
  ChartBarIcon,
  ArrowPathIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export default function ReportsTab() {
  const { t } = useLanguage();
  const [pastes, setPastes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchPastes();
  }, []);

  const fetchPastes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pastes?include_removed=true');
      if (!response.ok) throw new Error('Error al cargar datos');
      const result = await response.json();
      setPastes(result.data || result);
    } catch (err) {
      console.error('Error fetching pastes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter pastes by date range
  const filteredPastes = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return pastes.filter((paste) => {
      const pasteDate = new Date(paste.fridge_in_datetime);
      
      switch (dateRange) {
        case 'today':
          return pasteDate >= today;
        case 'week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return pasteDate >= weekAgo;
        }
        case 'month': {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return pasteDate >= monthAgo;
        }
        case 'all':
        default:
          return true;
      }
    });
  }, [pastes, dateRange]);

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const total = filteredPastes.length;
    const inFridge = filteredPastes.filter((p) => p.status === 'in_fridge').length;
    const outFridge = filteredPastes.filter((p) => p.status === 'out_fridge').length;
    const mixing = filteredPastes.filter((p) => p.status === 'mixing').length;
    const viscosityOk = filteredPastes.filter((p) => p.status === 'viscosity_ok').length;
    const opened = filteredPastes.filter((p) => p.status === 'opened').length;
    const removed = filteredPastes.filter((p) => p.status === 'removed').length;
    const rejected = filteredPastes.filter((p) => p.status === 'rejected').length;
    
    // Efficiency calculations
    const completed = removed + opened + viscosityOk;
    const efficiencyRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;
    
    // Active pastes (in process)
    const inProcess = inFridge + outFridge + mixing;
    
    return {
      total,
      inFridge,
      outFridge,
      mixing,
      viscosityOk,
      opened,
      removed,
      rejected,
      completed,
      efficiencyRate,
      rejectionRate,
      inProcess,
    };
  }, [filteredPastes]);

  // Average times calculation
  const avgTimes = useMemo(() => {
    const calculateAvg = (fromField, toField) => {
      const pastesWithBothDates = filteredPastes.filter(
        (p) => p[fromField] && p[toField]
      );
      
      if (pastesWithBothDates.length === 0) return null;
      
      const totalMinutes = pastesWithBothDates.reduce((sum, p) => {
        const from = new Date(p[fromField]);
        const to = new Date(p[toField]);
        return sum + (to - from) / (1000 * 60);
      }, 0);
      
      return totalMinutes / pastesWithBothDates.length;
    };

    const formatTime = (minutes) => {
      if (!minutes) return '-';
      if (minutes < 60) return `${Math.round(minutes)} min`;
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    };

    const fridgeTimeMinutes = calculateAvg('fridge_in_datetime', 'fridge_out_datetime');
    const waitTimeMinutes = calculateAvg('fridge_out_datetime', 'mixing_start_datetime');
    const totalProcessMinutes = calculateAvg('fridge_in_datetime', 'removed_datetime');

    return {
      fridgeTime: formatTime(fridgeTimeMinutes),
      fridgeTimeMinutes,
      waitTime: formatTime(waitTimeMinutes),
      waitTimeMinutes,
      totalProcess: formatTime(totalProcessMinutes),
      totalProcessMinutes,
      // Check if wait time is within 4 hours (240 minutes)
      waitTimeCompliant: waitTimeMinutes ? waitTimeMinutes <= 240 : null,
    };
  }, [filteredPastes]);

  // SMT line distribution
  const smtDistribution = useMemo(() => {
    return filteredPastes.reduce((acc, paste) => {
      const loc = paste.smt_location || 'Sin asignar';
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});
  }, [filteredPastes]);

  // Part number distribution
  const partNumberDistribution = useMemo(() => {
    return filteredPastes.reduce((acc, paste) => {
      const pn = paste.part_number || 'Sin número';
      acc[pn] = (acc[pn] || 0) + 1;
      return acc;
    }, {});
  }, [filteredPastes]);

  // Viscosity statistics
  const viscosityStats = useMemo(() => {
    const values = filteredPastes
      .filter((p) => p.viscosity_value)
      .map((p) => p.viscosity_value);
    
    if (values.length === 0) return null;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const inRange = values.filter(v => v >= 150 && v <= 180).length;
    const outOfRange = values.length - inRange;
    
    return {
      avg: avg.toFixed(1),
      min,
      max,
      count: values.length,
      inRange,
      outOfRange,
      complianceRate: ((inRange / values.length) * 100).toFixed(1),
    };
  }, [filteredPastes]);

  // Daily breakdown for the last 7 days
  const dailyBreakdown = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayPastes = pastes.filter(p => {
        const pasteDate = new Date(p.fridge_in_datetime);
        return pasteDate >= date && pasteDate < nextDate;
      });
      
      days.push({
        date: date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
        fullDate: date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
        total: dayPastes.length,
        completed: dayPastes.filter(p => ['removed', 'opened', 'viscosity_ok'].includes(p.status)).length,
        rejected: dayPastes.filter(p => p.status === 'rejected').length,
      });
    }
    
    return days;
  }, [pastes]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return [...filteredPastes]
      .sort((a, b) => {
        const dateA = new Date(a.removed_datetime || a.opened_datetime || a.viscosity_datetime || a.mixing_start_datetime || a.fridge_out_datetime || a.fridge_in_datetime);
        const dateB = new Date(b.removed_datetime || b.opened_datetime || b.viscosity_datetime || b.mixing_start_datetime || b.fridge_out_datetime || b.fridge_in_datetime);
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [filteredPastes]);

  // Export to Excel
  const handleExport = async () => {
    try {
      const response = await fetch('/api/pastes/export/excel');
      if (!response.ok) throw new Error('Error al exportar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_pastas_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Error al exportar el reporte');
    }
  };

  const maxDaily = Math.max(...dailyBreakdown.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <ChartBarIcon className="h-7 w-7 text-zinc-400 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-white">{t('reports.title')}</h2>
            <p className="text-sm text-zinc-400">{t('reports.subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-deadtimes-accent rounded-lg p-1 border border-deadtimes-border">
            <CalendarIcon className="h-4 w-4 text-zinc-400 ml-2 mr-1" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-sm text-zinc-400 border-0 focus:ring-0 pr-8 cursor-pointer"
            >
              <option value="today">{t('reports.today')}</option>
              <option value="week">{t('reports.lastWeek')}</option>
              <option value="month">{t('reports.lastMonth')}</option>
              <option value="all">{t('reports.allHistory')}</option>
            </select>
          </div>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-deadtimes-card border border-deadtimes-border rounded-lg hover:bg-deadtimes-hover transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {t('table.exportExcel')}
          </button>
          
          <button
            onClick={fetchPastes}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-zinc-400 bg-deadtimes-accent border border-deadtimes-border rounded-lg hover:bg-deadtimes-hover transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Pastes */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-deadtimes-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">{t('reports.totalRegistered')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-deadtimes-card rounded-full flex items-center justify-center">
              <CubeIcon className="h-6 w-6 text-zinc-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-zinc-400">
            <span>{stats.inProcess} {t('reports.inProcess')}</span>
          </div>
        </div>

        {/* Efficiency Rate */}
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-300 uppercase tracking-wide font-medium">{t('reports.successRate')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.efficiencyRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-green-900/50 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats.efficiencyRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Rejection Rate */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-300 uppercase tracking-wide font-medium">{t('reports.rejectionRate')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.rejectionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircleIcon className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-red-300">
            <span>{stats.rejected} {t('reports.rejected')}</span>
          </div>
        </div>

        {/* In Fridge */}
        <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-cyan-300 uppercase tracking-wide font-medium">{t('reports.inFridge')}</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.inFridge}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <BeakerIcon className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-cyan-300">
            <span>{t('reports.readyToUse')}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Flow */}
          <div className="bg-deadtimes-accent rounded-xl p-6 border border-deadtimes-border">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TableCellsIcon className="h-5 w-5 mr-2 text-purple-400" />
              {t('reports.statusFlow')}
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(STATUS_LABELS).map(([status, label]) => {
                const count = status === 'in_fridge' ? stats.inFridge : 
                  status === 'out_fridge' ? stats.outFridge :
                  status === 'viscosity_ok' ? stats.viscosityOk :
                  stats[status] || 0;
                const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0;
                
                return (
                  <div key={status} className="text-center">
                    <div className="bg-gray-100 rounded-lg p-3 hover:bg-deadtimes-accent transition-colors">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                        {label.split(' ')[0]}
                      </span>
                      <p className="text-2xl font-bold text-white mt-2">{count}</p>
                      <p className="text-xs text-zinc-400">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Trend Chart */}
          <div className="bg-deadtimes-accent rounded-xl p-6 border border-deadtimes-border">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-zinc-400" />
              {t('reports.weeklyTrend')}
            </h3>
            <div className="flex items-end justify-between h-40 gap-2">
              {dailyBreakdown.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-32">
                    {/* Rejected bar */}
                    {day.rejected > 0 && (
                      <div 
                        className="w-full bg-red-500/60 rounded-t transition-all duration-300"
                        style={{ height: `${(day.rejected / maxDaily) * 100}%`, minHeight: day.rejected > 0 ? '4px' : '0' }}
                        title={`${day.rejected} rechazadas`}
                      />
                    )}
                    {/* Completed bar */}
                    <div 
                      className="w-full bg-green-500/60 transition-all duration-300"
                      style={{ height: `${(day.completed / maxDaily) * 100}%`, minHeight: day.completed > 0 ? '4px' : '0' }}
                      title={`${day.completed} completadas`}
                    />
                    {/* Total bar (remaining) */}
                    <div 
                      className="w-full bg-deadtimes-card rounded-b transition-all duration-300"
                      style={{ height: `${((day.total - day.completed - day.rejected) / maxDaily) * 100}%`, minHeight: (day.total - day.completed - day.rejected) > 0 ? '4px' : '0' }}
                      title={`${day.total - day.completed - day.rejected} en proceso`}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">{day.date}</p>
                  <p className="text-sm font-semibold text-white">{day.total}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-deadtimes-card rounded" />
                <span className="text-zinc-400">{t('reports.inProcessLabel')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500/60 rounded" />
                <span className="text-zinc-400">{t('reports.completedLabel')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500/60 rounded" />
                <span className="text-zinc-400">{t('reports.rejectedLabel')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Time Statistics */}
          <div className="bg-deadtimes-accent rounded-xl p-6 border border-deadtimes-border">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-amber-400" />
              {t('reports.avgTimes')}
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{t('reports.timeInFridge')}</span>
                  <span className="text-lg font-bold text-zinc-400">{avgTimes.fridgeTime}</span>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{t('reports.waitTime4h')}</span>
                  <span className={`text-lg font-bold ${avgTimes.waitTimeCompliant === false ? 'text-red-300' : avgTimes.waitTimeCompliant ? 'text-green-300' : 'text-amber-300'}`}>
                    {avgTimes.waitTime}
                  </span>
                </div>
                {avgTimes.waitTimeCompliant === false && (
                  <p className="text-xs text-red-400 mt-1 flex items-center">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    {t('reports.exceedsRecommended')}
                  </p>
                )}
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{t('reports.fullProcess')}</span>
                  <span className="text-lg font-bold text-purple-300">{avgTimes.totalProcess}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Viscosity Stats */}
          {viscosityStats && (
            <div className="bg-deadtimes-accent rounded-xl p-6 border border-deadtimes-border">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BeakerIcon className="h-5 w-5 mr-2 text-green-400" />
                {t('reports.viscosity')}
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-neutral-400">{t('reports.min')}</p>
                  <p className="text-xl font-bold text-white">{viscosityStats.min}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-neutral-400">{t('reports.average')}</p>
                  <p className="text-xl font-bold text-green-300">{viscosityStats.avg}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-400">{t('reports.min')}</p>
                  <p className="text-xl font-bold text-white">{viscosityStats.max}</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">{t('reports.inRange')}</span>
                  <span className="text-sm font-bold text-green-300">{viscosityStats.complianceRate}%</span>
                </div>
                <div className="w-full bg-blue-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${viscosityStats.complianceRate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-neutral-400">
                  <span>{viscosityStats.inRange} {t('reports.ok')}</span>
                  <span>{viscosityStats.outOfRange} {t('reports.outOf')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMT Line Distribution */}
        <div className="bg-deadtimes-accent rounded-xl p-6 border border-deadtimes-border">
          <h3 className="text-lg font-semibold text-white mb-4">{t('reports.smtDistribution')}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(smtDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([smt, count]) => {
                const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0;
                return (
                <div className="flex items-center justify-between p-3 bg-deadtimes-card rounded-lg hover:bg-deadtimes-hover transition-colors">
                    <span className="text-sm font-medium text-white">{smt}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-blue-600 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-purple-300 w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Part Number Distribution */}
        <div className="bg-deadtimes-accent rounded-xl p-6 border border-deadtimes-border">
          <h3 className="text-lg font-semibold text-white mb-4">{t('reports.topPartNumbers')}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(partNumberDistribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([pn, count]) => {
                const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0;
                return (
                <div className="flex items-center justify-between p-3 bg-deadtimes-card rounded-lg hover:bg-deadtimes-hover transition-colors">
                    <span className="text-sm font-medium text-white font-mono">{pn}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-blue-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-zinc-400 w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-deadtimes-accent rounded-xl p-6 border border-deadtimes-border">
        <h3 className="text-lg font-semibold text-white mb-4">{t('reports.recentActivity')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-deadtimes-border">
                <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase">{t('reports.tableHeaders.did')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase">{t('reports.tableHeaders.lot')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase">{t('reports.tableHeaders.part')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase">{t('reports.tableHeaders.line')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase">{t('reports.tableHeaders.status')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase">{t('reports.tableHeaders.viscosity')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase">{t('reports.tableHeaders.entry')}</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((paste) => (
                <tr key={paste.id} className="border-b border-deadtimes-border hover:bg-deadtimes-card transition-colors">
                  <td className="py-3 px-3 text-sm text-white font-mono">{paste.did || '-'}</td>
                  <td className="py-3 px-3 text-sm text-zinc-400">{paste.lot_number}</td>
                  <td className="py-3 px-3 text-sm text-zinc-400 font-mono">{paste.part_number}</td>
                  <td className="py-3 px-3 text-sm text-zinc-400">{paste.smt_location || '-'}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[paste.status]}`}>
                      {t('status.' + paste.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-sm text-zinc-400">
                    {paste.viscosity_value || '-'}
                  </td>
                  <td className="py-3 px-3 text-sm text-zinc-400">
                    {paste.fridge_in_datetime ? new Date(paste.fridge_in_datetime).toLocaleString('es-MX', { 
                      day: '2-digit', 
                      month: '2-digit',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : '-'}
                  </td>
                </tr>
              ))}
              {recentActivity.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    {t('reports.noRecentActivity')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
