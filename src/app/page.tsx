'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Loader2, Plus, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { sendSuggestion } from '@/actions/send-suggestion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const BINGO_ITEMS = [
  // Animals
  'Amsel',
  'Blesshuhn',
  'Eichhörnchen',
  'Ente',
  'Fisch',
  'Graureiher',
  'Hund',
  'Möwe',
  'Rabe',
  'Ratte',
  'Taube',
  // People
  'Baby',
  'Banksitzer',
  'Fotograf',
  'Händchenhalter',
  'Senior',
  // Sport
  'Badminton',
  'Frisbee',
  'Fußballspieler',
  'Minigolfer',
  'Läufer',
  'Radfahrer',
  'Rollerfahrer',
  'Schachspieler',
  'Spikeball',
  'Tischtennisspieler',
  // Things
  '2er-Kinderwagen',
  'Buch',
  'Campingstuhl',
  'Flugzeug',
  'Grill',
  'Hubschrauber',
  'Over-Ears',
  'Picknick',
  'Regenbogen',
  'Rollstuhl',
  'Wikinger Schach',
];

interface BingoState {
  grid: string[];
  checked: boolean[];
  completedLines: number[];
  date: string;
}

export default function ParkBingo() {
  const imageAreaRef = useRef<HTMLDivElement>(null);

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
  const [isLoading, setIsLoading] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

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
    // date is in "YYYY-MM-DD" format
    const numericDate = Number(date.replaceAll('-', '')); // e.g. 20250102

    // Simple seeded PRNG (Mulberry32)
    function mulberry32(a: number): () => number {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const random = mulberry32(numericDate);

    const shuffled = [...BINGO_ITEMS];

    // Fisher-Yates shuffle using seeded RNG
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
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

  // Completely reset localStorage and local state
  const handleReset = () => {
    localStorage.removeItem('park-bingo'); // remove stored data

    const today = new Date().toISOString().split('T')[0];
    const newGrid = generateDailyGrid(today);

    const newState: BingoState = {
      grid: newGrid,
      checked: Array(25).fill(false),
      completedLines: [],
      date: today,
    };

    setBingoState(newState);
    localStorage.setItem('park-bingo', JSON.stringify(newState));
  };

  const handleShare = async () => {
    if (!imageAreaRef.current) return;

    try {
      const dataUrl = await toPng(imageAreaRef.current, { cacheBust: true });

      // Turn base64 into a File so Web Share API can use it
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `bingo-${bingoState.date}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '(Hammer) Park Bingo',
          text: `Mein Fortschritt vom ${formattedDate}`,
        });
      } else {
        // fallback: copy image to clipboard
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('Screenshot in die Zwischenablage kopiert 📋');
      }
    } catch (err) {
      console.error('Screenshot share failed', err);
      toast.error('Screenshot konnte nicht geteilt werden.');
    }
  };

  // Get cell classes for styling
  const getCellClasses = (index: number) => {
    const isChecked = bingoState.checked[index];
    const isAnimating = animatingCells.has(index);

    return `
      aspect-square flex items-center justify-center p-1.5 rounded-lg border-2 
      transition-all duration-300 cursor-pointer select-none text-center text-xs font-medium
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
    <div className='bg-background min-h-screen pb-4'>
      <div className='mx-auto max-w-md'>
        <div ref={imageAreaRef} className='bg-background p-4'>
          {/* Header */}
          <div className='mb-3 text-center'>
            <h1 className='text-foreground mb-2 text-3xl font-bold'>
              (Hammer) Park Bingo
            </h1>
            <p className='text-muted-foreground'>Spiel vom {formattedDate}</p>
            {bingoState.completedLines.length > 0 && (
              <div className='text-primary mt-2 flex items-center justify-center gap-1'>
                <Sparkles className='h-4 w-4' />
                <span className='text-sm font-medium'>
                  {bingoState.completedLines.length} Bingo
                  {bingoState.completedLines.length > 1 ? 's' : ''}!
                </span>
              </div>
            )}
          </div>

          {/* Bingo Grid */}
          <div
            className={`mb-3 grid grid-cols-5 gap-2 transition-all duration-500 ${
              hasCelebratingLines ? 'scale-105 animate-pulse shadow-2xl' : ''
            }`}
          >
            {bingoState.grid.map((item, index) => (
              <button
                key={index}
                onClick={() => toggleCell(index)}
                className={getCellClasses(index)}
                aria-label={`${item} - ${
                  bingoState.checked[index] ? 'abgeschlossen' : 'nicht abgeschlossen'
                }`}
              >
                <span className='leading-tight text-balance break-words hyphens-auto'>
                  {item}
                </span>
              </button>
            ))}
          </div>

          {/* Progress indicator */}
          <div className='text-center'>
            <div className='text-muted-foreground text-sm'>
              Fortschritt: {bingoState.checked.filter(Boolean).length}/25 abgeschlossen
            </div>
            <div className='bg-muted mt-2 h-2 w-full rounded-full'>
              <div
                className='bg-primary h-2 rounded-full transition-all duration-500'
                style={{
                  width: `${(bingoState.checked.filter(Boolean).length / 25) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className='-mt-1 px-4'>
          {/* Suggest Button */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' className='w-full bg-transparent' size='lg'>
                <Plus className='mr-2 h-4 w-4' />
                Neues Feld vorschlagen
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                className='space-y-4'
              >
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
                    className='flex-1'
                  >
                    Abbrechen
                  </Button>
                  <Button
                    type='submit'
                    disabled={!suggestion.trim() || isLoading}
                    className='flex-1'
                  >
                    {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                    {isLoading ? 'Senden...' : 'Senden'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className='mt-3 flex gap-3'>
            {/* Reset Button */}
            <Button
              variant='outline'
              className={`flex-1 transition-all duration-200 ${
                bingoState.checked.every(checked => !checked)
                  ? 'cursor-not-allowed border-red-200 text-red-300 hover:border-red-200 hover:text-red-300'
                  : 'border-red-500 text-red-500 hover:border-red-600 hover:bg-red-50 hover:text-red-600'
              }`}
              size='lg'
              onClick={handleReset}
              disabled={bingoState.checked.every(checked => !checked)}
            >
              Zurücksetzen
            </Button>

            {/* Share Button */}
            <Button
              variant='outline'
              className='border-primary text-primary hover:border-primary/80 hover:bg-primary/10 hover:text-primary flex-1 bg-transparent'
              size='lg'
              onClick={handleShare}
            >
              <Share2 className='mr-2 h-4 w-4' />
              Teilen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
