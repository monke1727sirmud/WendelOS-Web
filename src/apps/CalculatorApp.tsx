import { useState, useCallback } from 'react';

type Op = '+' | '-' | '×' | '÷' | null;

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState('');

  const inputDigit = useCallback((d: string) => {
    if (waiting) { setDisplay(d); setWaiting(false); }
    else setDisplay(display === '0' ? d : display.length < 12 ? display + d : display);
  }, [display, waiting]);

  const inputDot = useCallback(() => {
    if (waiting) { setDisplay('0.'); setWaiting(false); }
    else if (!display.includes('.')) setDisplay(display + '.');
  }, [display, waiting]);

  const clearAll = () => { setDisplay('0'); setPrevious(null); setOp(null); setWaiting(false); setHistory(''); };
  const toggleSign = () => setDisplay(d => d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d);
  const percent = () => setDisplay(d => String(parseFloat(d) / 100));

  const compute = (a: number, b: number, o: Op): number => {
    switch (o) { case '+': return a + b; case '-': return a - b; case '×': return a * b; case '÷': return b === 0 ? NaN : a / b; default: return b; }
  };

  const formatNum = (n: number) => {
    if (isNaN(n) || !isFinite(n)) return 'Error';
    return String(Math.round(n * 1e10) / 1e10);
  };

  const handleOp = (nextOp: Op) => {
    const current = parseFloat(display);
    if (previous === null) { setPrevious(current); }
    else if (op && !waiting) {
      const result = compute(previous, current, op);
      setPrevious(result);
      setDisplay(formatNum(result));
      setHistory(`${formatNum(result)} ${nextOp}`);
    }
    setOp(nextOp);
    setWaiting(true);
    if (previous !== null) setHistory(`${formatNum(previous)} ${nextOp}`);
  };

  const handleEquals = () => {
    if (op === null || previous === null) return;
    const current = parseFloat(display);
    const result = compute(previous, current, op);
    setHistory(`${formatNum(previous)} ${op} ${formatNum(current)} =`);
    setDisplay(formatNum(result));
    setPrevious(null); setOp(null); setWaiting(true);
  };

  // macOS Calculator style button
  const Btn = ({ label, onClick, variant = 'num', wide = false }: {
    label: string; onClick: () => void;
    variant?: 'num' | 'op' | 'fn' | 'eq'; wide?: boolean;
  }) => {
    const styles = {
      num: 'bg-[#333336] text-white hover:bg-[#3d3d40] active:bg-[#2a2a2c]',
      op:  'bg-accent-500/80 text-white hover:bg-accent-500 active:bg-accent-600',
      fn:  'bg-[#464649] text-white hover:bg-[#505053] active:bg-[#3c3c3f]',
      eq:  'bg-accent-500 text-white hover:bg-accent-400 active:bg-accent-600',
    };
    return (
      <button onClick={onClick}
        className={`flex items-center justify-center rounded-full text-xl font-light transition-all duration-75 active:scale-95 select-none ${styles[variant]} ${wide ? 'col-span-2 rounded-full justify-start pl-7' : ''}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}>
        {label}
      </button>
    );
  };

  const displayNum = parseFloat(display);
  const displayText = isNaN(displayNum) ? 'Error' : display;

  return (
    <div className="flex h-full flex-col bg-[#1c1c1e] p-4 gap-3">
      {/* Display — macOS Calculator style */}
      <div className="flex flex-col items-end justify-end rounded-2xl bg-[#0d0d0f] px-5 py-4 min-h-[100px]">
        <span className="text-[11px] text-white/25 h-4 mb-1 font-mono">{history}</span>
        <span className={`font-thin tabular-nums text-white leading-none transition-all ${
          displayText.length > 9 ? 'text-3xl' : displayText.length > 6 ? 'text-4xl' : 'text-5xl'
        }`}>
          {displayText}
        </span>
      </div>

      {/* Buttons */}
      <div className="grid flex-1 grid-cols-4 gap-2.5">
        <Btn label={display !== '0' ? 'C' : 'AC'} onClick={clearAll} variant="fn" />
        <Btn label="±" onClick={toggleSign} variant="fn" />
        <Btn label="%" onClick={percent} variant="fn" />
        <Btn label="÷" onClick={() => handleOp('÷')} variant={op === '÷' && waiting ? 'eq' : 'op'} />

        <Btn label="7" onClick={() => inputDigit('7')} />
        <Btn label="8" onClick={() => inputDigit('8')} />
        <Btn label="9" onClick={() => inputDigit('9')} />
        <Btn label="×" onClick={() => handleOp('×')} variant={op === '×' && waiting ? 'eq' : 'op'} />

        <Btn label="4" onClick={() => inputDigit('4')} />
        <Btn label="5" onClick={() => inputDigit('5')} />
        <Btn label="6" onClick={() => inputDigit('6')} />
        <Btn label="−" onClick={() => handleOp('-')} variant={op === '-' && waiting ? 'eq' : 'op'} />

        <Btn label="1" onClick={() => inputDigit('1')} />
        <Btn label="2" onClick={() => inputDigit('2')} />
        <Btn label="3" onClick={() => inputDigit('3')} />
        <Btn label="+" onClick={() => handleOp('+')} variant={op === '+' && waiting ? 'eq' : 'op'} />

        <Btn label="0" onClick={() => inputDigit('0')} wide />
        <Btn label="." onClick={inputDot} />
        <Btn label="=" onClick={handleEquals} variant="eq" />
      </div>
    </div>
  );
}
