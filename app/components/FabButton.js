'use client';

export default function FabButton({ onClick, icon, label, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-8 right-8 z-40 
        ${colorClasses[color] || colorClasses.blue}
        text-white rounded-full p-4 
        shadow-2xl hover:shadow-lg 
        transition-all duration-200 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        flex items-center justify-center
        group
      `}
      aria-label={label || 'Action Button'}
    >
      <span className="text-2xl">{icon || '➕'}</span>
      {label && (
        <span className="ml-2 hidden group-hover:inline transition-all duration-200 text-sm font-medium">
          {label}
        </span>
      )}
    </button>
  );
}
