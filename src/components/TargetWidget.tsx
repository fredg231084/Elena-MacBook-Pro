import { useEffect, useState } from 'react';
import { Target, Calendar } from 'lucide-react';

type VisualType = 'progress' | 'pie' | 'funnel';

interface TargetItem {
  id: string;
  type: 'revenue' | 'profit' | 'units' | 'margin';
  title: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  createdAt: string;
  completed: boolean;
  visualType: VisualType;
}

interface TargetWidgetProps {
  revenue: number;
  profit: number;
  units: number;
  margin: number;
}

// Progress Bar Visualization
function ProgressBarVisual({ percentage }: { percentage: number }) {
  const getProgressColor = (p: number): string => {
    if (p >= 100) return 'bg-green-500';
    if (p >= 70) return 'bg-green-400';
    if (p >= 40) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
      <div
        className={`h-full transition-all duration-500 ${getProgressColor(percentage)}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}

// Pie Chart Visualization
function PieChartVisual({ percentage }: { percentage: number }) {
  const getColor = (p: number): string => {
    if (p >= 100) return '#22c55e'; // green-500
    if (p >= 70) return '#4ade80'; // green-400
    if (p >= 40) return '#facc15'; // yellow-400
    return '#ef4444'; // red-400
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex justify-center my-4">
      <div className="relative" style={{ width: 160, height: 160 }}>
        <svg className="transform -rotate-90" width="160" height="160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="20"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={getColor(percentage)}
            strokeWidth="20"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Funnel/Pyramid Visualization
function FunnelVisual({ percentage }: { percentage: number }) {
  const getColor = (p: number): string => {
    if (p >= 100) return 'bg-green-500';
    if (p >= 70) return 'bg-green-400';
    if (p >= 40) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const sections = [
    { min: 0, max: 25, label: '0-25%', width: '100%' },
    { min: 25, max: 50, label: '25-50%', width: '85%' },
    { min: 50, max: 75, label: '50-75%', width: '70%' },
    { min: 75, max: 100, label: '75-100%', width: '55%' },
  ];

  return (
    <div className="flex flex-col items-center gap-2 my-4">
      {sections.map((section, index) => {
        const isFilled = percentage >= section.min;
        const isPartial = percentage > section.min && percentage < section.max;
        const fillPercentage = isPartial 
          ? ((percentage - section.min) / (section.max - section.min)) * 100 
          : isFilled ? 100 : 0;

        return (
          <div
            key={index}
            className="relative transition-all duration-500"
            style={{ width: section.width }}
          >
            <div className={`h-10 bg-gray-200 rounded-lg overflow-hidden shadow-sm border border-gray-300`}>
              <div
                className={`h-full ${getColor(percentage)} transition-all duration-500`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-700">
                {section.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TargetWidget({ revenue, profit, units, margin }: TargetWidgetProps) {
  const [targets, setTargets] = useState<TargetItem[]>([]);

  useEffect(() => {
    loadTargets();
  }, [revenue, profit, units, margin]);

  const loadTargets = () => {
    const stored = localStorage.getItem('unitflow_targets');
    if (stored) {
      const allTargets: TargetItem[] = JSON.parse(stored);
      
      // Update current values based on actual data
      const updated = allTargets.map(t => ({
        ...t,
        currentValue: getCurrentValue(t.type),
        visualType: t.visualType || 'progress', // Default to progress if not set
      }));
      
      // Filter active targets only
      const active = updated.filter(t => !t.completed);
      setTargets(active);
    }
  };

  const getCurrentValue = (type: string): number => {
    switch (type) {
      case 'revenue': return revenue;
      case 'profit': return profit;
      case 'units': return units;
      case 'margin': return margin;
      default: return 0;
    }
  };

  const getProgressTextColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-green-700';
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMotivationMessage = (percentage: number, daysRemaining: number): string => {
    if (percentage >= 100) return "🎉 Objectif atteint! Tu es incroyable Elena!";
    if (percentage >= 90) return "💪 Presque là! Plus qu'un petit effort!";
    if (percentage >= 70) return "🚀 Excellent progrès! Continue comme ça!";
    if (percentage >= 50) return "👍 Tu es sur la bonne voie!";
    if (daysRemaining <= 3) return "🔥 Dernière ligne droite! Tu peux le faire!";
    if (daysRemaining <= 7) return "⏰ Accélère un peu! Tu y es presque!";
    return "💪 Allez Elena! Tu as ça en toi!";
  };

  const getDaysRemaining = (deadline: string): number => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatValue = (type: string, value: number): string => {
    if (type === 'margin') return `${value.toFixed(1)}%`;
    if (type === 'units') return value.toString();
    return `$${value.toFixed(0)}`;
  };

  const getEmoji = (percentage: number): string => {
    if (percentage >= 100) return '🎉';
    if (percentage >= 70) return '🟢';
    if (percentage >= 40) return '🟡';
    return '🔴';
  };

  if (targets.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Target className="text-blue-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Tes Targets</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {targets.map((target) => {
          const percentage = (target.currentValue / target.targetValue) * 100;
          const daysRemaining = getDaysRemaining(target.deadline);
          const isExpired = daysRemaining < 0;
          const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;
          const remaining = target.targetValue - target.currentValue;

          return (
            <div
              key={target.id}
              className={`bg-white border-2 rounded-lg p-6 shadow-sm ${
                percentage >= 100 
                  ? 'border-green-400 bg-green-50' 
                  : isUrgent 
                  ? 'border-orange-400' 
                  : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    🎯 {target.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    {isExpired ? (
                      <span className="text-red-600 font-medium">
                        ⏰ Échéance dépassée ({Math.abs(daysRemaining)} jours)
                      </span>
                    ) : (
                      <span className={isUrgent ? 'text-orange-600 font-medium' : ''}>
                        {new Date(target.deadline).toLocaleDateString('fr-FR')} 
                        {' '}({daysRemaining} jour{daysRemaining > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-3xl">
                  {getEmoji(percentage)}
                </div>
              </div>

              {/* Values */}
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatValue(target.type, target.currentValue)}
                  </div>
                  <div className="text-sm text-gray-600">
                    sur {formatValue(target.type, target.targetValue)}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getProgressTextColor(percentage)}`}>
                  {percentage.toFixed(0)}%
                </div>
              </div>

              {/* Visualization - Dynamic based on type */}
              <div className="mb-4">
                {target.visualType === 'progress' && <ProgressBarVisual percentage={percentage} />}
                {target.visualType === 'pie' && <PieChartVisual percentage={percentage} />}
                {target.visualType === 'funnel' && <FunnelVisual percentage={percentage} />}
              </div>

              {/* Remaining */}
              {remaining > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-900 font-medium text-center">
                    Encore {formatValue(target.type, remaining)} à aller! 💪
                  </p>
                </div>
              )}

              {/* Motivation */}
              <div className="text-center">
                <p className="text-sm text-gray-700 italic font-medium">
                  {getMotivationMessage(percentage, daysRemaining)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TargetWidget;
