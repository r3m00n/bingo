'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { sendSuggestion } from '@/actions/send-suggestion';

const BINGO_ITEMS = [
  'Drink water',
  'Take a walk',
  'Call a friend',
  'Read 10 pages',
  'Stretch for 5 minutes',
  'Listen to music',
  'Write in journal',
  'Eat a healthy snack',
  'Meditate',
  'Clean desk',
  'Learn something new',
  'Help someone',
  'Take deep breaths',
  'Organize files',
  'Send a thank you',
  'Exercise for 15 min',
  'Watch sunrise/sunset',
  'Practice gratitude',
  'Smile at stranger',
  'Take photos',
  'Cook a meal',
  'Water plants',
  'Listen to podcast',
  'Do a puzzle',
  'Call family',
  'Write a letter',
  'Dance to music',
  'Try new recipe',
  'Read news',
  'Plan tomorrow',
  'Compliment someone',
  'Take vitamins',
  'Do laundry',
  'Backup files',
  'Update calendar',
];

interface BingoState {
  grid: string[];
  checked: boolean[];
  completedLines: number[];
  date: string;
}

export default function ParkBingo() {
  const [bingoState, setBingoState] = useState<BingoState>({
    grid: [],
    checked: Array(25).fill(false),
    completedLines: [],
    date: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [animatingCells, setAnimatingCells] = useState<Set<number>>(new Set());
  const [celebratingLines, setCelebratingLines] = useState<Set<number>>(new Set());
  const [formattedDate, setFormattedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'numeric',
      year: '2-digit',
    });
    setFormattedDate(today);
  }, []);

  // Generate consistent daily grid based on date
  const generateDailyGrid = useCallback((date: string): string[] => {
    const seed = date.split('-').reduce((acc, val) => acc + Number.parseInt(val), 0);
    const shuffled = [...BINGO_ITEMS];

    // Simple seeded shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor((((seed * (i + 1)) % 1000) / 1000) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 25);
  }, []);

  // Check for bingo lines
  const checkBingo = useCallback((checked: boolean[]): number[] => {
    const lines = [];

    // Rows
    for (let i = 0; i < 5; i++) {
      if (checked.slice(i * 5, (i + 1) * 5).every(Boolean)) {
        lines.push(i);
      }
    }

    // Columns
    for (let i = 0; i < 5; i++) {
      if ([0, 1, 2, 3, 4].every(row => checked[row * 5 + i])) {
        lines.push(5 + i);
      }
    }

    // Diagonals
    if ([0, 6, 12, 18, 24].every(i => checked[i])) {
      lines.push(10); // Main diagonal
    }
    if ([4, 8, 12, 16, 20].every(i => checked[i])) {
      lines.push(11); // Anti-diagonal
    }

    return lines;
  }, []);

  // Initialize or load state
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('park-bingo');

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        setBingoState(parsed);
        return;
      }
    }

    // New day or no stored data
    const newGrid = generateDailyGrid(today);
    const newState = {
      grid: newGrid,
      checked: Array(25).fill(false),
      completedLines: [],
      date: today,
    };

    setBingoState(newState);
    localStorage.setItem('park-bingo', JSON.stringify(newState));
  }, [generateDailyGrid]);

  // Handle cell toggle
  const toggleCell = (index: number) => {
    const newChecked = [...bingoState.checked];
    newChecked[index] = !newChecked[index];

    const newCompletedLines = checkBingo(newChecked);
    const newlyCompletedLines = newCompletedLines.filter(
      line => !bingoState.completedLines.includes(line)
    );

    // Animate the cell
    setAnimatingCells(prev => new Set([...prev, index]));
    setTimeout(() => {
      setAnimatingCells(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 300);

    // Celebrate new bingo lines
    if (newlyCompletedLines.length > 0) {
      setCelebratingLines(new Set(newlyCompletedLines));
      setTimeout(() => {
        setCelebratingLines(new Set());
      }, 2000);
    }

    const newState = {
      ...bingoState,
      checked: newChecked,
      completedLines: newCompletedLines,
    };

    setBingoState(newState);
    localStorage.setItem('park-bingo', JSON.stringify(newState));
  };

  // Handle suggestion submission
  const handleSuggestion = async () => {
    if (suggestion.trim()) {
      await sendSuggestion(suggestion.trim());
      setSuggestion('');
      setIsModalOpen(false);
      toast.success('Vorschlag gesendet! Danke 😊');
    }
  };

  // Handle reset function to clear all checked cells
  const handleReset = () => {
    const newState = {
      ...bingoState,
      checked: Array(25).fill(false),
      completedLines: [],
    };

    setBingoState(newState);
  };

  // Get cell classes for styling
  const getCellClasses = (index: number) => {
    const isChecked = bingoState.checked[index];
    const isAnimating = animatingCells.has(index);

    return `
      aspect-square flex items-center justify-center p-2 rounded-lg border-2 
      transition-all duration-300 cursor-pointer select-none text-center text-sm font-medium
      ${
        isChecked
          ? 'bg-primary text-primary-foreground border-primary shadow-lg'
          : 'bg-card text-card-foreground border-border hover:border-accent hover:bg-accent/10'
      }
      ${isAnimating ? 'animate-pulse scale-105' : 'hover:scale-105'}
      active:scale-95
    `;
  };

  // Check if any line is celebrating
  const hasCelebratingLines = celebratingLines.size > 0;

  return (
    <div className='min-h-screen bg-background p-4'>
      <div className='max-w-md mx-auto'>
        {/* Header */}
        <div className='text-center mb-6'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>(Hammer) Park Bingo</h1>
          <p className='text-muted-foreground'>Spiel vom {formattedDate}</p>
          {bingoState.completedLines.length > 0 && (
            <div className='mt-2 flex items-center justify-center gap-1 text-primary'>
              <Sparkles className='w-4 h-4' />
              <span className='text-sm font-medium'>
                {bingoState.completedLines.length} Bingo
                {bingoState.completedLines.length > 1 ? 's' : ''}!
              </span>
            </div>
          )}
        </div>

        {/* Bingo Grid */}
        <div
          className={`grid grid-cols-5 gap-2 mb-6 transition-all duration-500 ${
            hasCelebratingLines ? 'animate-pulse scale-105 shadow-2xl' : ''
          }`}>
          {bingoState.grid.map((item, index) => (
            <button
              key={index}
              onClick={() => toggleCell(index)}
              className={getCellClasses(index)}
              aria-label={`${item} - ${
                bingoState.checked[index] ? 'abgeschlossen' : 'nicht abgeschlossen'
              }`}>
              <span className='text-balance leading-tight'>{item}</span>
            </button>
          ))}
        </div>

        {/* Suggest Button */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant='outline' className='w-full bg-transparent' size='lg'>
              <Plus className='w-4 h-4 mr-2' />
              Neues Feld vorschlagen
            </Button>
          </DialogTrigger>
          <DialogContent className='mx-4'>
            <DialogHeader>
              <DialogTitle>Schlage ein neues Feld vor</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!suggestion.trim()) return;

                setIsLoading(true);
                try {
                  await handleSuggestion(); // assume this is async
                  setIsModalOpen(false);
                } finally {
                  setIsLoading(false);
                }
              }}
              className='space-y-4'>
              <div>
                <Input
                  placeholder="Feld Inhalt (z.B. 'Flugzeug')"
                  value={suggestion}
                  onChange={e => setSuggestion(e.target.value)}
                  maxLength={50}
                  disabled={isLoading}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className='flex-1'>
                  Abbrechen
                </Button>
                <Button
                  type='submit'
                  disabled={!suggestion.trim() || isLoading}
                  className='flex-1'>
                  {isLoading ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null}
                  {isLoading ? 'Senden...' : 'Senden'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Button */}
        <Button
          variant='outline'
          className={`w-full mt-3 transition-all duration-200 ${
            bingoState.checked.every(checked => !checked)
              ? 'border-red-200 text-red-300 hover:border-red-200 hover:text-red-300 cursor-not-allowed'
              : 'border-red-500 text-red-500 hover:border-red-600 hover:text-red-600 hover:bg-red-50'
          }`}
          size='lg'
          onClick={handleReset}
          disabled={bingoState.checked.every(checked => !checked)}>
          Zurücksetzen
        </Button>

        {/* Progress indicator */}
        <div className='mt-6 text-center'>
          <div className='text-sm text-muted-foreground'>
            Fortschritt: {bingoState.checked.filter(Boolean).length}/25 abgeschlossen
          </div>
          <div className='w-full bg-muted rounded-full h-2 mt-2'>
            <div
              className='bg-primary h-2 rounded-full transition-all duration-500'
              style={{
                width: `${(bingoState.checked.filter(Boolean).length / 25) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
