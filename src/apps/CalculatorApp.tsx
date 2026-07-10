import { useState, useCallback } from 'react';

type Op = '+' | '-' | '×' | '÷' | null;

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState('');

  const inputDigit = useCallback(
    (d: string) => {
      if (waiting) {
        setDisplay(d);
        setWaiting(false);
      } else {
        setDisplay(display === '0' ? d : display + d);
      }
    },
    [display, waiting]
  );

  const inputDot = useCallback(() => {
    if (waiting) {
      setDisplay('0.');
      setWaiting(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, waiting]);

  const clearAll = () => {
    setDisplay('0');
    setPrevious(null);
    setOp(null);
    setWaiting(false);
    setHistory('');
  };

  const toggleSign = () => {
    setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d));
  };

  const percent = () => {
    setDisplay((d) => String(parseFloat(d) / 100));
  };

  const compute = (a: number, b: number, operator: Op): number => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const handleOp = (nextOp: Op) => {
    const current = parseFloat(display);
    if (previous === null) {
      setPrevious(current);
    } else if (op && !waiting) {
      const result = compute(previous, current, op);
      setPrevious(result);
      setDisplay(String(result));
      setHistory(`${formatNum(result)} ${nextOp}`);
    }
    setOp(nextOp);
    setWaiting(true);
    if (previous !== null) {
      setHistory(`${formatNum(previous)} ${nextOp}`);
    }
  };

  const handleEquals = () => {
    if (op === null || previous === null) return;
    const current = parseFloat(display);
    const result = compute(previous, current, op);
    setHistory(`${formatNum(previous)} ${op} ${formatNum(current)} =`);
    setDisplay(String(result));
    setPrevious(null);
    setOp(null);
    setWaiting(true);
  };

  const formatNum = (n: number) => {
    if (isNaN(n)) return 'Error';
    if (!isFinite(n)) return 'Error';
    return String(Math.round(n * 1e10) / 1e10);
  };

  const Btn = ({
    label,
    onClick,
    variant = 'num',
    wide = false,
  }: {
    label: string;
    onClick: () => void;
    variant?: 'num' | 'op' | 'fn' | 'eq';
    wide?: boolean;
  }) => {
    const styles = {
      num: 'bg-slate-700/60 text-white hover:bg-slate-600/60',
      op: 'bg-accent-500/20 text-accent-300 hover:bg-accent-500/30',
      fn: 'bg-slate-600/40 text-slate-300 hover:bg-slate-500/40',
      eq: 'bg-accent-500 text-white hover:bg-accent-600',
    };
    return (
      <button
        onClick={onClick}
        className={`flex items-center justify-center rounded-xl text-lg font-medium transition active:scale-95 ${styles[variant]} ${
          wide ? 'col-span-2' : ''
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 p-4">
      {/* Display */}
      <div className="mb-4 flex flex-1 flex-col items-end justify-end gap-1 overflow-hidden rounded-xl bg-slate-800/50 p-4">
        <span className="h-5 text-xs text-slate-500">{history}</span>
        <span className="truncate text-4xl font-light tabular-nums text-white">
          {display}
        </span>
      </div>

      {/* Buttons */}
      <div className="grid flex-1 grid-cols-4 gap-2">
        <Btn label="AC" onClick={clearAll} variant="fn" />
        <Btn label="±" onClick={toggleSign} variant="fn" />
        <Btn label="%" onClick={percent} variant="fn" />
        <Btn label="÷" onClick={() => handleOp('÷')} variant="op" />

        <Btn label="7" onClick={() => inputDigit('7')} />
        <Btn label="8" onClick={() => inputDigit('8')} />
        <Btn label="9" onClick={() => inputDigit('9')} />
        <Btn label="×" onClick={() => handleOp('×')} variant="op" />

        <Btn label="4" onClick={() => inputDigit('4')} />
        <Btn label="5" onClick={() => inputDigit('5')} />
        <Btn label="6" onClick={() => inputDigit('6')} />
        <Btn label="−" onClick={() => handleOp('-')} variant="op" />

        <Btn label="1" onClick={() => inputDigit('1')} />
        <Btn label="2" onClick={() => inputDigit('2')} />
        <Btn label="3" onClick={() => inputDigit('3')} />
        <Btn label="+" onClick={() => handleOp('+')} variant="op" />

        <Btn label="0" onClick={() => inputDigit('0')} wide />
        <Btn label="." onClick={inputDot} />
        <Btn label="=" onClick={handleEquals} variant="eq" />
      </div>
    </div>
  );
}
