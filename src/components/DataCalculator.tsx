import React, { useState } from 'react';
import { Calculator, Plus, Minus, X, Divide, Equal, RotateCcw } from 'lucide-react';

interface DataCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type DataUnit = 'MB' | 'GB' | 'TB';
type Operation = '+' | '-' | '*' | '/' | null;

export const DataCalculator: React.FC<DataCalculatorProps> = ({ isOpen, onClose }) => {
  const [firstValue, setFirstValue] = useState('');
  const [firstUnit, setFirstUnit] = useState<DataUnit>('GB');
  const [operation, setOperation] = useState<Operation>(null);
  const [secondValue, setSecondValue] = useState('');
  const [secondUnit, setSecondUnit] = useState<DataUnit>('GB');
  const [result, setResult] = useState<{ value: number; unit: DataUnit } | null>(null);
  const [resultUnit, setResultUnit] = useState<DataUnit>('GB');

  // Convert data to MB (base unit)
  const convertToMB = (value: number, unit: DataUnit): number => {
    switch (unit) {
      case 'MB': return value;
      case 'GB': return value * 1024;
      case 'TB': return value * 1024 * 1024;
      default: return value;
    }
  };

  // Convert MB to target unit
  const convertFromMB = (valueMB: number, targetUnit: DataUnit): number => {
    switch (targetUnit) {
      case 'MB': return valueMB;
      case 'GB': return valueMB / 1024;
      case 'TB': return valueMB / (1024 * 1024);
      default: return valueMB;
    }
  };

  // Format result for display
  const formatResult = (value: number): string => {
    if (value >= 1000000) {
      return value.toExponential(2);
    }
    return value.toFixed(3);
  };

  const calculate = () => {
    if (!firstValue || !operation || !secondValue) return;

    const val1 = parseFloat(firstValue);
    const val2 = parseFloat(secondValue);

    if (isNaN(val1) || isNaN(val2)) return;

    // Convert both values to MB for calculation
    const val1MB = convertToMB(val1, firstUnit);
    const val2MB = convertToMB(val2, secondUnit);

    let resultMB: number;

    switch (operation) {
      case '+':
        resultMB = val1MB + val2MB;
        break;
      case '-':
        resultMB = val1MB - val2MB;
        break;
      case '*':
        // For multiplication, we multiply the raw values (not both converted to MB)
        resultMB = val1 * val2MB;
        break;
      case '/':
        // For division, we divide the MB values
        resultMB = val2MB !== 0 ? val1MB / val2MB : 0;
        break;
      default:
        return;
    }

    // Convert result to desired unit
    const resultValue = convertFromMB(resultMB, resultUnit);
    setResult({ value: resultValue, unit: resultUnit });
  };

  const clear = () => {
    setFirstValue('');
    setSecondValue('');
    setOperation(null);
    setResult(null);
  };

  const getOperationSymbol = (op: Operation) => {
    switch (op) {
      case '+': return <Plus className="w-4 h-4" />;
      case '-': return <Minus className="w-4 h-4" />;
      case '*': return <X className="w-4 h-4" />;
      case '/': return <Divide className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Data Calculator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calculator Body */}
        <div className="p-6 space-y-6">
          {/* First Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Value</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                value={firstValue}
                onChange={(e) => setFirstValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
              />
              <select
                value={firstUnit}
                onChange={(e) => setFirstUnit(e.target.value as DataUnit)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MB">MB</option>
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </div>
          </div>

          {/* Operation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { op: '+' as const, icon: Plus, label: 'Add' },
                { op: '-' as const, icon: Minus, label: 'Subtract' },
                { op: '*' as const, icon: X, label: 'Multiply' },
                { op: '/' as const, icon: Divide, label: 'Divide' }
              ].map(({ op, icon: Icon, label }) => (
                <button
                  key={op}
                  onClick={() => setOperation(op)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                    operation === op
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Second Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Second Value</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                value={secondValue}
                onChange={(e) => setSecondValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
              />
              <select
                value={secondUnit}
                onChange={(e) => setSecondUnit(e.target.value as DataUnit)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MB">MB</option>
                <option value="GB">GB</option>
                <option value="TB">TB</option>
              </select>
            </div>
          </div>

          {/* Result Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Result Unit</label>
            <select
              value={resultUnit}
              onChange={(e) => setResultUnit(e.target.value as DataUnit)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MB">MB</option>
              <option value="GB">GB</option>
              <option value="TB">TB</option>
            </select>
          </div>

          {/* Calculation Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-lg font-mono">
              <span className={firstValue ? 'text-gray-900' : 'text-gray-400'}>
                {firstValue || '0'} {firstUnit}
              </span>
              <span className="text-gray-600">
                {operation ? getOperationSymbol(operation) : '?'}
              </span>
              <span className={secondValue ? 'text-gray-900' : 'text-gray-400'}>
                {secondValue || '0'} {secondUnit}
              </span>
              <Equal className="w-4 h-4 text-gray-600" />
              <span className={result ? 'text-blue-600 font-bold' : 'text-gray-400'}>
                {result ? `${formatResult(result.value)} ${result.unit}` : '? ' + resultUnit}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={calculate}
              disabled={!firstValue || !operation || !secondValue}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Equal className="w-4 h-4" />
              Calculate
            </button>
            <button
              onClick={clear}
              className="px-4 py-3 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              title="Clear all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Conversion Examples */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Reference</h3>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>1 GB =</span>
                <span>1,024 MB</span>
              </div>
              <div className="flex justify-between">
                <span>1 TB =</span>
                <span>1,024 GB</span>
              </div>
              <div className="flex justify-between">
                <span>1 TB =</span>
                <span>1,048,576 MB</span>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Usage Examples</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Add: 5 GB + 500 MB = 5.488 GB</li>
              <li>• Subtract: 10 GB - 2.5 GB = 7.5 GB</li>
              <li>• Multiply: 2.5 × 4 GB = 10 GB</li>
              <li>• Divide: 100 GB ÷ 30 days = 3.333 GB/day</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};