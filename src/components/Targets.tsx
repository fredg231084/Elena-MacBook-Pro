import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, BarChart3, PieChart, Triangle } from 'lucide-react';
import { fr } from '../lib/translations';

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

function Targets() {
  const tc = fr.common;
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'profit' as 'revenue' | 'profit' | 'units' | 'margin',
    title: '',
    targetValue: 0,
    deadline: '',
    visualType: 'progress' as VisualType,
  });

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = () => {
    const stored = localStorage.getItem('unitflow_targets');
    if (stored) {
      setTargets(JSON.parse(stored));
    }
  };

  const saveTargets = (updatedTargets: TargetItem[]) => {
    localStorage.setItem('unitflow_targets', JSON.stringify(updatedTargets));
    setTargets(updatedTargets);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.targetValue || !formData.deadline) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    if (editingId) {
      const updated = targets.map(t => 
        t.id === editingId 
          ? { ...t, ...formData }
          : t
      );
      saveTargets(updated);
      setEditingId(null);
    } else {
      const newTarget: TargetItem = {
        id: Date.now().toString(),
        ...formData,
        currentValue: 0,
        createdAt: new Date().toISOString(),
        completed: false,
      };
      saveTargets([...targets, newTarget]);
      setIsAdding(false);
    }

    setFormData({
      type: 'profit',
      title: '',
      targetValue: 0,
      deadline: '',
      visualType: 'progress',
    });
  };

  const handleEdit = (target: TargetItem) => {
    setEditingId(target.id);
    setFormData({
      type: target.type,
      title: target.title,
      targetValue: target.targetValue,
      deadline: target.deadline,
      visualType: target.visualType || 'progress',
    });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer ce target?')) {
      saveTargets(targets.filter(t => t.id !== id));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      type: 'profit',
      title: '',
      targetValue: 0,
      deadline: '',
      visualType: 'progress',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      revenue: 'Revenue total',
      profit: 'Profit net',
      units: 'Unités vendues',
      margin: 'Marge moyenne (%)',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return '💰';
      case 'profit': return '📈';
      case 'units': return '📦';
      case 'margin': return '📊';
      default: return '🎯';
    }
  };

  const formatValue = (type: string, value: number) => {
    if (type === 'margin') return `${value.toFixed(1)}%`;
    if (type === 'units') return value.toString();
    return `$${value.toFixed(2)}`;
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const activeTargets = targets.filter(t => !t.completed);
  const completedTargets = targets.filter(t => t.completed);

  const visualTypes = [
    { value: 'progress', label: 'Barre de progression', icon: BarChart3 },
    { value: 'pie', label: 'Graphique circulaire', icon: PieChart },
    { value: 'funnel', label: 'Entonnoir/Pyramide', icon: Triangle },
  ];

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Targets d'Elena</h1>
              <p className="text-gray-600 mt-1">Définis tes objectifs et atteins-les!</p>
            </div>
            {!isAdding && !editingId && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={18} />
                Nouveau Target
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 italic">
            Configure tes objectifs mensuels et suis ta progression en temps réel!
          </p>
        </div>

        {(isAdding || editingId) && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Modifier le target' : 'Nouveau target'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de target *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="profit">💰 Profit net</option>
                    <option value="revenue">📈 Revenue total</option>
                    <option value="units">📦 Unités vendues</option>
                    <option value="margin">📊 Marge moyenne (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre du target *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Target de Décembre"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objectif {formData.type === 'margin' ? '(%)' : formData.type === 'units' ? '(unités)' : '($)'} *
                  </label>
                  <input
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step={formData.type === 'margin' ? '0.1' : formData.type === 'units' ? '1' : '0.01'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date limite *
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Style de visualisation *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {visualTypes.map((vt) => {
                      const Icon = vt.icon;
                      return (
                        <button
                          key={vt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, visualType: vt.value as VisualType })}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            formData.visualType === vt.value
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon 
                            size={32} 
                            className={`mx-auto mb-2 ${
                              formData.visualType === vt.value ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          />
                          <p className={`text-sm font-medium text-center ${
                            formData.visualType === vt.value ? 'text-blue-900' : 'text-gray-700'
                          }`}>
                            {vt.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? tc.update : tc.save}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {tc.cancel}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Active Targets */}
        {activeTargets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🔥 Targets actifs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTargets.map((target) => {
                const daysRemaining = getDaysRemaining(target.deadline);
                const isExpired = daysRemaining < 0;
                const isUrgent = daysRemaining <= 7 && daysRemaining >= 0;

                return (
                  <div key={target.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getTypeIcon(target.type)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{target.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{getTypeLabel(target.type)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Style: {visualTypes.find(v => v.value === (target.visualType || 'progress'))?.label}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(target)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(target.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progrès</span>
                        <span className="font-semibold">
                          {formatValue(target.type, target.currentValue)} / {formatValue(target.type, target.targetValue)}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-500 mb-2">
                        {((target.currentValue / target.targetValue) * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="mb-4">
                      {isExpired ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                          <p className="text-red-800 font-medium">⏰ Échéance dépassée</p>
                          <p className="text-red-600 text-sm">Il y a {Math.abs(daysRemaining)} jours</p>
                        </div>
                      ) : (
                        <div className={`${isUrgent ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3 text-center`}>
                          <p className={`${isUrgent ? 'text-orange-800' : 'text-blue-800'} font-medium`}>
                            {isUrgent ? '🔥 Dernière ligne droite!' : '📅 Échéance'}
                          </p>
                          <p className={`${isUrgent ? 'text-orange-600' : 'text-blue-600'} text-sm`}>
                            {new Date(target.deadline).toLocaleDateString('fr-FR')} ({daysRemaining} jours)
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-sm text-gray-600 italic">
                      {target.currentValue >= target.targetValue 
                        ? "🎉 Objectif atteint! Tu es incroyable Elena!" 
                        : `Encore ${formatValue(target.type, target.targetValue - target.currentValue)} à aller! 💪`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTargets.length === 0 && !isAdding && !editingId && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Target size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun target actif</h3>
            <p className="text-gray-600 mb-6">Crée ton premier objectif pour commencer à suivre ta progression!</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} className="inline mr-2" />
              Créer mon premier target
            </button>
          </div>
        )}

        {/* Completed Targets */}
        {completedTargets.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ Targets complétés</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {completedTargets.map((target) => (
                <div key={target.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{getTypeIcon(target.type)}</span>
                    <h4 className="font-semibold text-gray-900">{target.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{getTypeLabel(target.type)}</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatValue(target.type, target.targetValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Complété le {new Date(target.deadline).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        {tc.footer}
      </footer>
    </div>
  );
}

export default Targets;
