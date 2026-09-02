'use client';

import { useState } from 'react';

export default function CredentialsCatalog() {
  // Temporary mock data - aap isko apne Firebase se connect kar sakte hain
  const [credentials] = useState([
    { id: 1, name: 'Admin Portal', username: 'admin@rto.com', password: '••••••••', platform: 'Web' },
    { id: 2, name: 'Database Server', username: 'root', password: '••••••••', platform: 'SSH' },
  ]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          🔐 Credentials Vault
        </h2>
        <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">
          + Add New
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Username
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {credentials.map((cred) => (
              <tr key={cred.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {cred.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {cred.username}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                    {cred.platform}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                    View
                  </button>
                  <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
