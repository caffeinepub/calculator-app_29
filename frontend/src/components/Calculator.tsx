import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useCalculate, type Operation } from '@/hooks/useQueries';
import { cn } from '@/lib/utils';

type ButtonVariant = 'digit' | 'operator' | 'function' | 'equals' | 'zero';

interface CalcButton {
  label: string;
  value: string;
  variant: ButtonVariant;
  action: 'digit' | 'operator' | 'decimal' | 'clear' | 'sign' | 'percent' | 'equals' | 'backspace';
}

const BUTTONS: CalcButton[] = [
  { label: 'AC', value: 'clear', variant: 'function', action: 'clear' },
  { label: '+/-', value: 'sign', variant: 'function', action: 'sign' },
  { label: '%', value: 'percent', variant: 'function', action: 'percent' },
  { label: '÷', value: 'divide', variant: 'operator', action: 'operator' },

  { label: '7', value: '7', variant: 'digit', action: 'digit' },
  { label: '8', value: '8', variant: 'digit', action: 'digit' },
  { label: '9', value: '9', variant: 'digit', action: 'digit' },
  { label: '×', value: 'multiply', variant: 'operator', action: 'operator' },

  { label: '4', value: '4', variant: 'digit', action: 'digit' },
  { label: '5', value: '5', variant: 'digit', action: 'digit' },
  { label: '6', value: '6', variant: 'digit', action: 'digit' },
  { label: '−', value: 'subtract', variant: 'operator', action: 'operator' },

  { label: '1', value: '1', variant: 'digit', action: 'digit' },
  { label: '2', value: '2', variant: 'digit', action: 'digit' },
  { label: '3', value: '3', variant: 'digit', action: 'digit' },
  { label: '+', value: 'add', variant: 'operator', action: 'operator' },

  { label: '0', value: '0', variant: 'zero', action: 'digit' },
  { label: '.', value: '.', variant: 'digit', action: 'decimal' },
  { label: '=', value: 'equals', variant: 'equals', action: 'equals' },
];

const OPERATOR_LABELS: Record<string, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

function formatNumber(value: string): string {
  if (value === 'Error' || value === '') return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  // Handle very large or very small numbers
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(4);
  }

  // Trim trailing zeros after decimal
  const parts = value.split('.');
  if (parts.length === 2) {
    // Keep the decimal point and trailing digits as typed
    return value;
  }

  return value;
}

function getFontSize(display: string): string {
  const len = display.length;
  if (len <= 6) return 'text-5xl';
  if (len <= 9) return 'text-4xl';
  if (len <= 12) return 'text-3xl';
  return 'text-2xl';
}

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Operation | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');
  const [isError, setIsError] = useState(false);
  const [animateResult, setAnimateResult] = useState(false);
  const [activeOperator, setActiveOperator] = useState<string | null>(null);

  const { mutate: calculate, isPending } = useCalculate();

  const resetError = useCallback(() => {
    setIsError(false);
  }, []);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setStoredValue(null);
    setPendingOp(null);
    setWaitingForOperand(false);
    setExpression('');
    setIsError(false);
    setActiveOperator(null);
  }, []);

  const handleDigit = useCallback((digit: string) => {
    resetError();
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(prev => {
        if (prev === '0' && digit !== '.') return digit;
        if (prev.length >= 12) return prev;
        return prev + digit;
      });
    }
  }, [waitingForOperand, resetError]);

  const handleDecimal = useCallback(() => {
    resetError();
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  }, [display, waitingForOperand, resetError]);

  const handleSign = useCallback(() => {
    resetError();
    setDisplay(prev => {
      const num = parseFloat(prev);
      if (isNaN(num) || num === 0) return prev;
      return String(-num);
    });
  }, [resetError]);

  const handlePercent = useCallback(() => {
    resetError();
    setDisplay(prev => {
      const num = parseFloat(prev);
      if (isNaN(num)) return prev;
      return String(num / 100);
    });
  }, [resetError]);

  const handleOperator = useCallback((op: Operation) => {
    resetError();
    const currentValue = parseFloat(display);

    if (storedValue !== null && pendingOp && !waitingForOperand) {
      // Chain operations: compute previous first
      calculate(
        { operation: pendingOp, x: storedValue, y: currentValue },
        {
          onSuccess: (result) => {
            const resultStr = String(result);
            setDisplay(resultStr);
            setStoredValue(result);
            setPendingOp(op);
            setActiveOperator(op);
            setWaitingForOperand(true);
            setExpression(`${resultStr} ${OPERATOR_LABELS[op]}`);
          },
          onError: () => {
            setDisplay('Error');
            setIsError(true);
            setStoredValue(null);
            setPendingOp(null);
            setActiveOperator(null);
            setWaitingForOperand(false);
            setExpression('');
          }
        }
      );
    } else {
      setStoredValue(currentValue);
      setPendingOp(op);
      setActiveOperator(op);
      setWaitingForOperand(true);
      setExpression(`${display} ${OPERATOR_LABELS[op]}`);
    }
  }, [display, storedValue, pendingOp, waitingForOperand, calculate, resetError]);

  const handleEquals = useCallback(() => {
    if (storedValue === null || pendingOp === null) return;
    resetError();

    const currentValue = parseFloat(display);
    const fullExpression = `${storedValue} ${OPERATOR_LABELS[pendingOp]} ${display}`;

    calculate(
      { operation: pendingOp, x: storedValue, y: currentValue },
      {
        onSuccess: (result) => {
          // Format result nicely
          let resultStr: string;
          if (Number.isInteger(result) && Math.abs(result) < 1e12) {
            resultStr = String(result);
          } else if (Math.abs(result) >= 1e12 || (Math.abs(result) < 1e-6 && result !== 0)) {
            resultStr = result.toExponential(6);
          } else {
            // Remove trailing zeros
            resultStr = parseFloat(result.toPrecision(12)).toString();
          }

          setDisplay(resultStr);
          setExpression(`${fullExpression} =`);
          setStoredValue(null);
          setPendingOp(null);
          setActiveOperator(null);
          setWaitingForOperand(true);
          setAnimateResult(true);
          setTimeout(() => setAnimateResult(false), 300);
        },
        onError: (error) => {
          const isDivByZero = error.message?.toLowerCase().includes('zero') ||
            error.message?.toLowerCase().includes('divide');
          setDisplay(isDivByZero ? 'Cannot ÷ 0' : 'Error');
          setIsError(true);
          setExpression('');
          setStoredValue(null);
          setPendingOp(null);
          setActiveOperator(null);
          setWaitingForOperand(false);
        }
      }
    );
  }, [storedValue, pendingOp, display, calculate, resetError]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === '.') handleDecimal();
      else if (e.key === '+') handleOperator('add');
      else if (e.key === '-') handleOperator('subtract');
      else if (e.key === '*') handleOperator('multiply');
      else if (e.key === '/') { e.preventDefault(); handleOperator('divide'); }
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Escape') handleClear();
      else if (e.key === 'Backspace') {
        setDisplay(prev => {
          if (prev.length <= 1 || prev === 'Error') return '0';
          return prev.slice(0, -1);
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleClear]);

  const handleButtonClick = useCallback((btn: CalcButton) => {
    switch (btn.action) {
      case 'digit': handleDigit(btn.value); break;
      case 'decimal': handleDecimal(); break;
      case 'operator': handleOperator(btn.value as Operation); break;
      case 'equals': handleEquals(); break;
      case 'clear': handleClear(); break;
      case 'sign': handleSign(); break;
      case 'percent': handlePercent(); break;
    }
  }, [handleDigit, handleDecimal, handleOperator, handleEquals, handleClear, handleSign, handlePercent]);

  const getButtonClasses = (btn: CalcButton): string => {
    const base = 'calc-btn-press relative flex items-center justify-center rounded-2xl font-semibold select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    switch (btn.variant) {
      case 'digit':
        return cn(base, 'bg-calc-btn-digit hover:bg-calc-btn-digit-hover text-calc-text-primary shadow-btn-digit text-xl h-16');
      case 'zero':
        return cn(base, 'bg-calc-btn-digit hover:bg-calc-btn-digit-hover text-calc-text-primary shadow-btn-digit text-xl h-16 col-span-2 justify-start pl-6');
      case 'function':
        return cn(base, 'bg-calc-btn-fn hover:bg-calc-btn-fn-hover text-calc-text-primary text-xl h-16');
      case 'operator':
        return cn(
          base,
          'text-calc-text-operator text-2xl h-16 shadow-btn-operator',
          activeOperator === btn.value && !waitingForOperand
            ? 'bg-calc-text-primary text-calc-btn-operator'
            : 'bg-calc-btn-operator hover:bg-calc-btn-operator-hover'
        );
      case 'equals':
        return cn(base, 'bg-calc-btn-equals hover:bg-calc-btn-equals-hover text-calc-text-operator text-2xl h-16 shadow-btn-operator');
      default:
        return base;
    }
  };

  const displayFontSize = getFontSize(display);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      {/* Calculator Card */}
      <div
        className="w-full max-w-xs rounded-3xl shadow-calc overflow-hidden"
        style={{
          background: 'oklch(var(--calc-surface))',
          border: '1px solid oklch(var(--border))',
        }}
      >
        {/* Display Area */}
        <div
          className="px-5 pt-8 pb-4 shadow-display"
          style={{ background: 'oklch(var(--calc-display-bg))' }}
        >
          {/* Expression line */}
          <div className="h-6 flex items-center justify-end mb-1">
            <span className="text-calc-text-secondary text-sm font-mono truncate max-w-full">
              {expression}
            </span>
            {isPending && (
              <Loader2 className="ml-2 h-3 w-3 animate-spin text-calc-text-secondary flex-shrink-0" />
            )}
          </div>

          {/* Main display */}
          <div
            className={cn(
              'flex items-end justify-end min-h-[4rem]',
              animateResult && 'animate-result-pop',
              isError && 'animate-error-shake'
            )}
          >
            <span
              className={cn(
                'font-mono font-semibold leading-none tracking-tight transition-all duration-150',
                displayFontSize,
                isError ? 'text-destructive' : 'text-calc-text-primary'
              )}
            >
              {formatNumber(display)}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: 'oklch(var(--border))' }} />

        {/* Button Grid */}
        <div className="p-4 grid grid-cols-4 gap-3">
          {BUTTONS.map((btn) => (
            <button
              key={btn.value}
              className={getButtonClasses(btn)}
              onClick={() => handleButtonClick(btn)}
              disabled={isPending && btn.action === 'equals'}
              aria-label={btn.label}
            >
              {btn.action === 'equals' && isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                btn.label
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-0 text-center">
          <p className="text-xs" style={{ color: 'oklch(var(--calc-text-secondary))' }}>
            Keyboard shortcuts supported
          </p>
        </div>
      </div>

      {/* Attribution Footer */}
      <footer className="mt-8 text-center">
        <p className="text-sm" style={{ color: 'oklch(var(--calc-text-secondary))' }}>
          © {new Date().getFullYear()} · Built with{' '}
          <span style={{ color: 'oklch(var(--calc-btn-operator))' }}>♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'calculator-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            style={{ color: 'oklch(var(--calc-btn-operator))' }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
