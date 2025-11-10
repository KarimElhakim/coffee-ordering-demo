import { useState, useEffect, useRef } from 'react';
import { X, Send, Coffee, Zap, Trophy, Target } from 'lucide-react';
import { Button, Card, Input } from '@coffee-demo/ui';
import { getMenuItems } from '@coffee-demo/api-client';
import { useCart } from '../store/cart';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  options?: Array<{ text: string; action: string; data?: any }>;
}

const ENCOURAGEMENTS = [
  "Need help choosing? Ask me!",
  "Want a discount? Play a game!",
  "Looking for recommendations?",
  "Try our mini-games for rewards!",
  "Not sure what to order? Chat with me!",
];

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentEncouragement, setCurrentEncouragement] = useState(0);
  const [gameMode, setGameMode] = useState<string | null>(null);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [hasWonDiscount, setHasWonDiscount] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const addItem = useCart((state) => state.addItem);
  const setGameDiscount = useCart((state) => state.setGameDiscount);

  // Rotate encouragements
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEncouragement((prev) => (prev + 1) % ENCOURAGEMENTS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check session storage for game state
  useEffect(() => {
    const played = sessionStorage.getItem('chatbot_played_game');
    const won = sessionStorage.getItem('chatbot_won_discount');
    if (played === 'true') setHasPlayedGame(true);
    if (won === 'true') setHasWonDiscount(true);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text: string, isBot: boolean, options?: any[]) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text, isBot, options },
    ]);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage(
          "Hi there! I'm your coffee assistant. How can I help you today?",
          true,
          [
            { text: '☕ Get a recommendation', action: 'recommendation' },
            { text: '🎮 Play a game for discount', action: 'games' },
            { text: '📋 View menu', action: 'menu' },
          ]
        );
      }, 500);
    }
  };

  const handleOptionClick = async (action: string, data?: any) => {
    if (action === 'recommendation') {
      addMessage("I'd love to help you find the perfect drink!", false);
      setTimeout(() => {
        addMessage(
          "What's your mood today?",
          true,
          [
            { text: '☀️ Energized & Ready', action: 'mood_energized' },
            { text: '😌 Relaxed & Calm', action: 'mood_relaxed' },
            { text: '🍫 Sweet Tooth', action: 'mood_sweet' },
            { text: '❄️ Cold & Refreshing', action: 'mood_cold' },
          ]
        );
      }, 800);
    } else if (action.startsWith('mood_')) {
      const mood = action.replace('mood_', '');
      addMessage(`${data?.text || 'Got it!'}`, false);
      
      setTimeout(async () => {
        const items = await getMenuItems();
        let recommendation: any;

        if (mood === 'energized') {
          recommendation = items.find((i: any) => i.name.includes('Espresso') || i.name.includes('Americano'));
        } else if (mood === 'relaxed') {
          recommendation = items.find((i: any) => i.name.includes('Latte') || i.name.includes('Cappuccino'));
        } else if (mood === 'sweet') {
          recommendation = items.find((i: any) => i.name.includes('Mocha') || i.name.includes('Caramel'));
        } else if (mood === 'cold') {
          recommendation = items.find((i: any) => i.name.includes('Iced') || i.name.includes('Frappuccino'));
        }

        if (!recommendation) recommendation = items[0];

        addMessage(
          `Perfect! I recommend the ${recommendation.name}. It's ${recommendation.base_price.toFixed(0)} EGP.`,
          true,
          [
            { text: '➕ Add to cart', action: 'add_to_cart', data: recommendation },
            { text: '🔄 Try another', action: 'recommendation' },
            { text: '🏠 Main menu', action: 'main' },
          ]
        );
      }, 1000);
    } else if (action === 'add_to_cart' && data) {
      addItem({
        menu_item_id: data.id,
        name: data.name,
        base_price: data.base_price,
        options: [],
        image_url: data.image_url,
        local_image_path: data.local_image_path,
        category: data.category,
      });
      addMessage('Added to cart!', false);
      setTimeout(() => {
        addMessage(
          "Great choice! Your item has been added. Anything else?",
          true,
          [
            { text: '☕ Another recommendation', action: 'recommendation' },
            { text: '🎮 Play a game', action: 'games' },
            { text: '✅ Done', action: 'close' },
          ]
        );
      }, 800);
    } else if (action === 'games') {
      if (hasPlayedGame) {
        addMessage('I want to play a game!', false);
        setTimeout(() => {
          addMessage(
            "You've already played a game this session! The discount is one-time only. Would you like to do something else?",
            true,
            [
              { text: '☕ Get a recommendation', action: 'recommendation' },
              { text: '🏠 Main menu', action: 'main' },
            ]
          );
        }, 800);
      } else {
        addMessage('Let me play a game!', false);
        setTimeout(() => {
          addMessage(
            "Awesome! Win a game and get 5% off your lowest priced item. Choose a game:",
            true,
            [
              { text: '⚡ Reaction Tap', action: 'game_reaction' },
              { text: '🔤 Coffee Wordle', action: 'game_wordle' },
              { text: '🎯 Cup Shuffle', action: 'game_shuffle' },
              { text: '← Back', action: 'main' },
            ]
          );
        }, 800);
      }
    } else if (action.startsWith('game_')) {
      const game = action.replace('game_', '');
      setGameMode(game);
      sessionStorage.setItem('chatbot_played_game', 'true');
      setHasPlayedGame(true);
    } else if (action === 'main') {
      addMessage('Show me the main menu', false);
      setTimeout(() => {
        addMessage(
          "How can I help you today?",
          true,
          [
            { text: '☕ Get a recommendation', action: 'recommendation' },
            { text: '🎮 Play a game for discount', action: 'games' },
            { text: '📋 View menu', action: 'menu' },
          ]
        );
      }, 500);
    } else if (action === 'close') {
      setIsOpen(false);
    } else if (action === 'menu') {
      addMessage('Show me the menu', false);
      setTimeout(() => {
        addMessage(
          "You can browse our full menu on the main page! Would you like a personalized recommendation instead?",
          true,
          [
            { text: '☕ Yes, recommend me something', action: 'recommendation' },
            { text: '🏠 Main menu', action: 'main' },
          ]
        );
      }, 800);
    }
  };

  const handleGameWin = () => {
    sessionStorage.setItem('chatbot_won_discount', 'true');
    setHasWonDiscount(true);
    setGameMode(null);
    
    // Set discount in cart
    setGameDiscount(0.05);
    
    addMessage("Congratulations! You won!", false);
    setTimeout(() => {
      addMessage(
        "Amazing! You've earned a 5% discount on your lowest priced item. The discount will be applied automatically at checkout!",
        true,
        [
          { text: '☕ Get a recommendation', action: 'recommendation' },
          { text: '🏠 Main menu', action: 'main' },
        ]
      );
    }, 1000);
  };

  const handleGameLose = () => {
    setGameMode(null);
    addMessage("Good try! Better luck next time!", false);
    setTimeout(() => {
      addMessage(
        "No worries! You can still enjoy our amazing drinks. How else can I help?",
        true,
        [
          { text: '☕ Get a recommendation', action: 'recommendation' },
          { text: '🏠 Main menu', action: 'main' },
        ]
      );
    }, 800);
  };

  // Game Components
  const ReactionGame = () => {
    const [waiting, setWaiting] = useState(true);
    const [showTarget, setShowTarget] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [reactionTime, setReactionTime] = useState<number | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            if (!reactionTime) handleGameLose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const delay = 2000 + Math.random() * 3000;
      const timer = setTimeout(() => {
        setWaiting(false);
        setShowTarget(true);
        startTimeRef.current = Date.now();
      }, delay);

      return () => {
        clearTimeout(timer);
        clearInterval(countdown);
      };
    }, []);

    const handleTap = () => {
      if (waiting) {
        handleGameLose();
        return;
      }
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      if (time < 500) {
        setTimeout(() => handleGameWin(), 500);
      } else {
        setTimeout(() => handleGameLose(), 500);
      }
    };

    return (
      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-2xl border-4 border-black dark:border-white">
        <h3 className="text-2xl font-black text-center mb-4 text-black dark:text-white">
          Reaction Tap
        </h3>
        <p className="text-center text-sm mb-4 font-semibold text-gray-700 dark:text-gray-300">
          Tap the target when it appears in under 500ms!
        </p>
        <div className="text-center mb-4">
          <span className="text-3xl font-black text-black dark:text-white">
            {timeLeft}s
          </span>
        </div>
        <div
          onClick={handleTap}
          className={`w-full h-64 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
            waiting
              ? 'bg-gray-200 dark:bg-gray-800'
              : showTarget
              ? 'bg-green-400 dark:bg-green-600 animate-pulse'
              : 'bg-gray-900 dark:bg-white'
          }`}
        >
          {waiting && (
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
              Wait for it...
            </p>
          )}
          {showTarget && !reactionTime && (
            <Target className="h-24 w-24 text-white dark:text-black animate-bounce" />
          )}
          {reactionTime && (
            <div className="text-center">
              <p className="text-4xl font-black text-white dark:text-black mb-2">
                {reactionTime}ms
              </p>
              <p className="text-lg font-bold text-white dark:text-black">
                {reactionTime < 500 ? '🎉 You Win!' : '😔 Too slow!'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const WordleGame = () => {
    const WORDS = ['MOCHA', 'LATTE', 'STEAM', 'BEANS', 'ROAST', 'CREAM'];
    const [targetWord] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
      if (gameOver) return;
      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setGameOver(true);
            handleGameLose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }, [gameOver]);

    const handleSubmit = () => {
      if (currentGuess.length !== 5 || gameOver) return;
      
      const newGuesses = [...guesses, currentGuess.toUpperCase()];
      setGuesses(newGuesses);
      
      if (currentGuess.toUpperCase() === targetWord) {
        setGameOver(true);
        setTimeout(() => handleGameWin(), 500);
      } else if (newGuesses.length >= 6) {
        setGameOver(true);
        setTimeout(() => handleGameLose(), 500);
      }
      
      setCurrentGuess('');
    };

    const getLetterColor = (letter: string, index: number, guess: string) => {
      if (guess[index] === targetWord[index]) return 'bg-green-500 text-white border-green-700';
      if (targetWord.includes(letter)) return 'bg-yellow-500 text-white border-yellow-700';
      return 'bg-gray-400 text-white border-gray-600';
    };

    return (
      <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-2xl border-4 border-black dark:border-white">
        <h3 className="text-2xl font-black text-center mb-2 text-black dark:text-white">
          Coffee Wordle
        </h3>
        <p className="text-center text-xs mb-4 font-semibold text-gray-700 dark:text-gray-300">
          Guess the 5-letter coffee word! Time: {timeLeft}s
        </p>
        
        <div className="space-y-2 mb-4">
          {guesses.map((guess, gIdx) => (
            <div key={gIdx} className="flex gap-2 justify-center">
              {guess.split('').map((letter, lIdx) => (
                <div
                  key={lIdx}
                  className={`w-12 h-12 flex items-center justify-center text-2xl font-black rounded-lg border-4 ${getLetterColor(letter, lIdx, guess)}`}
                >
                  {letter}
                </div>
              ))}
            </div>
          ))}
          {guesses.length < 6 && !gameOver && (
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 flex items-center justify-center text-2xl font-black rounded-lg border-4 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  {currentGuess[i] || ''}
                </div>
              ))}
            </div>
          )}
        </div>

        {!gameOver && (
          <div className="flex gap-2">
            <Input
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value.toUpperCase().slice(0, 5))}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Type word..."
              className="flex-1 text-center font-black text-lg border-4 border-black dark:border-white"
              maxLength={5}
            />
            <Button
              onClick={handleSubmit}
              disabled={currentGuess.length !== 5}
              className="bg-black dark:bg-white text-white dark:text-black font-black"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const CupShuffleGame = () => {
    const [cups, setCups] = useState([0, 1, 2]);
    const [ballPosition] = useState(1);
    const [shuffling, setShuffling] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [selectedCup, setSelectedCup] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(45);

    useEffect(() => {
      if (!gameStarted) return;
      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            if (selectedCup === null) handleGameLose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }, [gameStarted, selectedCup]);

    const startGame = () => {
      setGameStarted(true);
      setShuffling(true);
      
      let shuffleCount = 0;
      const maxShuffles = 8;
      const shuffleInterval = setInterval(() => {
        setCups((prev) => {
          const newCups = [...prev];
          const i = Math.floor(Math.random() * 2);
          [newCups[i], newCups[i + 1]] = [newCups[i + 1], newCups[i]];
          return newCups;
        });
        
        shuffleCount++;
        if (shuffleCount >= maxShuffles) {
          clearInterval(shuffleInterval);
          setShuffling(false);
        }
      }, 400);
    };

    const handleCupClick = (index: number) => {
      if (shuffling || selectedCup !== null) return;
      setSelectedCup(index);
      
      const actualBallIndex = cups.indexOf(ballPosition);
      if (index === actualBallIndex) {
        setTimeout(() => handleGameWin(), 1000);
      } else {
        setTimeout(() => handleGameLose(), 1000);
      }
    };

    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-2xl border-4 border-black dark:border-white">
        <h3 className="text-2xl font-black text-center mb-2 text-black dark:text-white">
          Cup Shuffle
        </h3>
        <p className="text-center text-xs mb-4 font-semibold text-gray-700 dark:text-gray-300">
          Find the cup with the coffee bean! Time: {timeLeft}s
        </p>

        {!gameStarted && (
          <div className="flex gap-4 justify-center mb-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative">
                <Coffee className="h-24 w-24 text-amber-700 dark:text-amber-400" />
                {i === ballPosition && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-amber-800 dark:bg-amber-600 rounded-full animate-bounce" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {gameStarted && (
          <div className={`flex gap-4 justify-center mb-6 ${shuffling ? 'animate-pulse' : ''}`}>
            {cups.map((cup, i) => {
              const hasBall = cup === ballPosition && selectedCup !== null;
              const isSelected = selectedCup === i;
              
              return (
                <button
                  key={i}
                  onClick={() => handleCupClick(i)}
                  disabled={shuffling || selectedCup !== null}
                  className={`relative transition-all ${shuffling ? '' : 'hover:scale-110'} ${
                    isSelected ? 'scale-110' : ''
                  }`}
                >
                  <Coffee className={`h-24 w-24 ${
                    isSelected && hasBall
                      ? 'text-green-600 dark:text-green-400'
                      : isSelected && !hasBall
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-400'
                  }`} />
                  {selectedCup !== null && hasBall && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 bg-amber-800 dark:bg-amber-600 rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!gameStarted && (
          <Button
            onClick={startGame}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-black text-lg py-6 hover:scale-105 transition-all"
          >
            <Zap className="h-5 w-5 mr-2" />
            Start Game
          </Button>
        )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50 animate-fade-in">
        <button
          onClick={handleOpen}
          className="relative group"
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 bg-black dark:bg-white rounded-full animate-ping opacity-20"></div>
          
          {/* Main button */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-200 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 border-4 border-white dark:border-black">
            <Coffee className="h-10 w-10 text-white dark:text-black animate-bounce" />
          </div>
          
          {/* Rotating text bubble */}
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-2xl shadow-xl whitespace-nowrap animate-bounce border-2 border-white dark:border-black">
            <p className="text-sm font-bold">
              {ENCOURAGEMENTS[currentEncouragement]}
            </p>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-black dark:bg-white border-r-2 border-b-2 border-white dark:border-black"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[420px] h-[600px] animate-fade-in-up">
      <Card className="w-full h-full flex flex-col border-4 border-black dark:border-white shadow-2xl bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="bg-black dark:bg-white p-4 flex items-center justify-between border-b-4 border-black dark:border-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-black rounded-full flex items-center justify-center">
              <Coffee className="h-7 w-7 text-black dark:text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white dark:text-black">Coffee Assistant</h3>
              <p className="text-xs text-gray-300 dark:text-gray-700 font-semibold">Always here to help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 p-2 rounded-full transition-all hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Messages or Game */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
          {gameMode ? (
            <div>
              {gameMode === 'reaction' && <ReactionGame />}
              {gameMode === 'wordle' && <WordleGame />}
              {gameMode === 'shuffle' && <CupShuffleGame />}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div className="max-w-[80%]">
                    <div
                      className={`p-4 rounded-2xl ${
                        message.isBot
                          ? 'bg-white dark:bg-gray-800 text-black dark:text-white border-3 border-gray-900 dark:border-white shadow-lg'
                          : 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                      }`}
                    >
                      <p className="text-sm font-semibold">{message.text}</p>
                    </div>
                    
                    {message.options && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(option.action, { text: option.text, ...option.data })}
                            className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-xl font-bold text-sm transition-all hover:scale-105 border-2 border-gray-900 dark:border-white"
                          >
                            {option.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Discount indicator */}
        {hasWonDiscount && !gameMode && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 text-center font-black text-sm animate-pulse border-t-4 border-black dark:border-white">
            <Trophy className="h-5 w-5 inline mr-2" />
            5% Discount Active on Lowest Item!
          </div>
        )}
      </Card>
    </div>
  );
}

