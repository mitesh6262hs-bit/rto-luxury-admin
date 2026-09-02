'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPanel() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalFavourites: 0,
    pendingBackups: 0,
  });

  useEffect(() => {
    // Mock API call - aap isko Firebase se connect karein
    setStats({
      totalDevices: 42,
      activeDevices: 28,
      totalFavourites: 15,
      pendingBackups: 3,
    });
  }, []);

  const statCards = [
    { title: 'Total Devices', value: stats.totalDevices, icon: '📱', color: 'blue' },
    { title: 'Active Devices', value: stats.activeDevices, icon: '🟢', color: 'green' },
    { title: 'Favourites', value: stats.totalFavourites, icon: '⭐', color: 'yellow' },
    { title: 'Pending Backups', value: stats.pendingBackups, icon: '⏳', color: 'red' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        📊 Analytics Dashboard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-700 dark:text-${stat.color}-300`}>
                {stat.title}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Placeholder for Chart */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 h-40 flex items-center justify-center">
        <p className="text-gray-400 dark:text-gray-500">
          📈 Chart will be displayed here (Integrate with Recharts or Chart.js)
        </p>
      </div>
    </div>
  );
}
