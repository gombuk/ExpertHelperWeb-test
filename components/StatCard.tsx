
import React from 'react';

const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const DollarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 12v.01m0-4.01V12m0 4v.01m0-4V12m0 4c-1.11 0-2.08-.402-2.599-1M12 16v1m0-1v-.01M12 12c-1.657 0-3-.895-3-2s1.343-2 3-2m0 8c1.657 0 3-.895 3-2s-1.343-2-3-2m0 0l2.599-1M14.599 7l-2.599 1m0 0l-2.599 1M9.401 7l2.599 1" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

interface StatCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: 'document' | 'dollar' | 'calendar';
    color: 'blue' | 'green' | 'orange';
}

const ICONS = {
    document: <DocumentIcon />,
    dollar: <DollarIcon />,
    calendar: <CalendarIcon />,
};

const COLORS = {
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-900',
        text: 'text-blue-700 dark:text-blue-300',
    },
    green: {
        bg: 'bg-green-50 dark:bg-green-900',
        text: 'text-green-700 dark:text-green-300',
    },
    orange: {
        bg: 'bg-orange-50 dark:bg-orange-900',
        text: 'text-orange-700 dark:text-orange-300',
    }
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => {
    const colorClasses = COLORS[color];
    
    return (
        <div className={`${colorClasses.bg} p-4 rounded-lg flex justify-between items-start`}>
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-white">{value}</p>
                {subtitle && <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">{subtitle}</p>}
            </div>
            <div className={colorClasses.text}>
                {ICONS[icon]}
            </div>
        </div>
    );
};

export default StatCard;
