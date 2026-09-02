'use client';

import { useState } from 'react';

export default function BackupModal({ isOpen, onClose, onBackup }) {
  const [backupType, setBackupType] = useState('full');
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsRunning(true);
    
    // Simulate backup process
    setTimeout(() => {
      setIsRunning(false);
      if (onBackup) {
        onBackup({ type: backupType, timestamp: new Date().toISOString() });
      }
      alert(`✅ ${backupType.charAt(0).toUpperCase() + backupType.slice(1)} backup completed successfully!`);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          💾 Backup Options
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Choose the type of backup you want to create.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Backup Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="backupType"
                  value="full"
                  checked={backupType === 'full'}
                  onChange={(e) => setBackupType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Full Backup</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">All data including devices, credentials, and settings</p>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="backupType"
                  value="devices"
                  checked={backupType === 'devices'}
                  onChange={(e) => setBackupType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Devices Only</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Only device configurations and status</p>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="backupType"
                  value="credentials"
                  checked={backupType === 'credentials'}
                  onChange={(e) => setBackupType(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Credentials Only</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">All passwords and login data</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRunning}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isRunning ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Running...
                </>
              ) : (
                '🔒 Start Backup'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
