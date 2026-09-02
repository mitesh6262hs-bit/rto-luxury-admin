'use client';

import { useFavourites } from '../hooks/useFavourites';

export default function FavouritesCatalog() {
  const { favourites, loading, toggleFavourite } = useFavourites();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-gray-500">Loading favourites...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          ⭐ Favourite Devices
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {favourites?.length || 0} items
        </span>
      </div>

      {favourites && favourites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favourites.map((device) => (
            <div
              key={device.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {device.name || 'Unnamed Device'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {device.model || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavourite(device.id)}
                  className="text-yellow-500 hover:text-yellow-600 text-xl"
                >
                  ★
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                ID: {device.id?.slice(0, 8)}...
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <p>No favourite devices added yet.</p>
          <p className="text-sm">Go to devices and click the star icon to add!</p>
        </div>
      )}
    </div>
  );
}
