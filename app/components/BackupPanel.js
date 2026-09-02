'use client';

import { useState } from 'react';

export default function BackupPanel() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackup, setLastBackup] = useState('2026-09-02 09:00 AM');

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      setLastBackup(new Date().toLocaleString());
      alert('✅ Backup created successfully!');
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        💾 Backup & Restore
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Create Backup</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Backup all device data, credentials, and settings.
          </p>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg transition-colors"
          >
            {isBackingUp ? '⏳ Creating...' : '📥 Create Full Backup'}
          </button>
          {lastBackup && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Last backup: {lastBackup}
            </p>
          )}
        </div>

        {/* Restore Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Restore Data</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload a backup file to restore previous data.
          </p>
          <input
            type="file"
            accept=".json,.zip"
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-100 dark:file:bg-gray-700
              file:text-gray-700 dark:file:text-gray-300
              hover:file:bg-gray-200 dark:hover:file:bg-gray-600"
          />
          <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors">
            ⬆ Restore from File
          </button>
        </div>
      </div>
    </div>
  );
}
