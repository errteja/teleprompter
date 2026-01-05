import React, { useState, useEffect, useRef } from 'react';

import { Play, Pause, SkipForward, RotateCcw, Sparkles } from 'lucide-react';

export default function TeleprompterApp() {
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Settings
  const [wordDelay, setWordDelay] = useState(200);
  const [errorRate, setErrorRate] = useState(10);
  const [questionAnswerDelay, setQuestionAnswerDelay] = useState(1000);
  const [punctuationCorrectionRate, setPunctuationCorrectionRate] = useState(70);
  
  const generationRef = useRef(null);
  const currentIndexRef = useRef(0);

  const generateAnswer = async () => {
    if (!question.trim()) return;
    
    setIsGenerating(true);
    setDisplayedAnswer('');
    currentIndexRef.current = 0;
    
    try {
      // Wait for question-answer delay
      await new Promise(resolve => setTimeout(resolve, questionAnswerDelay));
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Topic: ${topic}\n\nQuestion: ${question}\n\nProvide a clear, concise answer (2-3 sentences).`
            }
          ]
        })
      });
      
      const data = await response.json();
      const generatedAnswer = data.content[0].text;
      setAnswer(generatedAnswer);
      
      // Start word-by-word generation
      typeAnswer(generatedAnswer);
    } catch (error) {
      console.error('Error generating answer:', error);
      setAnswer('Error generating answer. Please try again.');
      setIsGenerating(false);
    }
  };

  const typeAnswer = async (text) => {
    const words = text.split(' ');
    let result = '';
    
    for (let i = currentIndexRef.current; i < words.length; i++) {
      if (!isGenerating || isPaused) break;
      
      currentIndexRef.current = i;
      let word = words[i];
      
      // Add typing error
      if (Math.random() * 100 < errorRate && word.length > 2) {
        const errorWord = introduceTypingError(word);
        result += errorWord + ' ';
        setDisplayedAnswer(result);
        
        // Wait and maybe correct it
        await new Promise(resolve => setTimeout(resolve, wordDelay * 2));
        
        if (!isGenerating || isPaused) break;
        
        // Correct the error (word errors are always corrected)
        result = result.slice(0, -errorWord.length - 1) + word + ' ';
        setDisplayedAnswer(result);
      } else {
        result += word + ' ';
        setDisplayedAnswer(result);
      }
      
      // Check for punctuation errors (these may not be corrected)
      if (Math.random() * 100 < errorRate) {
        const lastChar = result.trim().slice(-1);
        if (['.', ',', '!', '?'].includes(lastChar)) {
          if (Math.random() * 100 > punctuationCorrectionRate) {
            // Don't correct punctuation error - remove it
            result = result.trim().slice(0, -1) + ' ';
            setDisplayedAnswer(result);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, wordDelay));
    }
    
    if (currentIndexRef.current >= words.length - 1) {
      setIsGenerating(false);
      setIsPaused(false);
    }
  };

  const introduceTypingError = (word) => {
    const chars = word.split('');
    const pos = Math.floor(Math.random() * (chars.length - 1)) + 1;
    
    // Random error type: swap, wrong char, or duplicate
    const errorType = Math.floor(Math.random() * 3);
    
    if (errorType === 0 && pos < chars.length - 1) {
      // Swap adjacent characters
      [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
    } else if (errorType === 1) {
      // Wrong character
      const wrongChars = 'abcdefghijklmnopqrstuvwxyz';
      chars[pos] = wrongChars[Math.floor(Math.random() * wrongChars.length)];
    } else {
      // Duplicate character
      chars.splice(pos, 0, chars[pos]);
    }
    
    return chars.join('');
  };

  const handleAsk = () => {
    generateAnswer();
  };

  const handleReset = () => {
    setQuestion('');
    setDisplayedAnswer('');
    setAnswer('');
    setIsGenerating(false);
    setIsPaused(false);
    currentIndexRef.current = 0;
  };

  const handleRandomGenerate = async () => {
    if (!topic.trim()) {
      alert('Please enter a topic first');
      return;
    }
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Generate a thoughtful interview question about: ${topic}`
            }
          ]
        })
      });
      
      const data = await response.json();
      const generatedQuestion = data.content[0].text.replace(/[\"]/g, '');
      setQuestion(generatedQuestion);
      
      // Auto-generate answer after setting question
      setTimeout(() => {
        setAnswer('');
        setDisplayedAnswer('');
        generateAnswer();
      }, 100);
    } catch (error) {
      console.error('Error generating question:', error);
    }
  };

  const handleNext = () => {
    handleRandomGenerate();
  };

  const handleStop = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    if (isGenerating && answer) {
      typeAnswer(answer);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Teleprompting Practice Tool
        </h1>
        
        {/* Section 1: Input and Display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Question & Answer</h2>
          
          <div className="mb-4">
            <label className="block text-white mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic (e.g., Artificial Intelligence, Climate Change)"
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-white mb-2">Question</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question"
                className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={handleAsk}
                disabled={isGenerating || !question.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
              >
                Ask
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-white mb-2">Answer</label>
            <div className="min-h-32 px-4 py-3 rounded-lg bg-black/30 text-white border border-white/30">
              {displayedAnswer || <span className="text-white/50">Answer will appear here...</span>}
            </div>
          </div>
        </div>
        
        {/* Section 2: Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              <RotateCcw size={18} />
              Reset
            </button>
            <button
              onClick={handleRandomGenerate}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              <Sparkles size={18} />
              Random Q&A
            </button>
            <button
              onClick={handleNext}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              <SkipForward size={18} />
              Next Question
            </button>
            <button
              onClick={handleStop}
              disabled={!isGenerating || isPaused}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              <Pause size={18} />
              Stop
            </button>
            <button
              onClick={handleResume}
              disabled={!isGenerating || !isPaused}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              <Play size={18} />
              Resume
            </button>
          </div>
        </div>
        
        {/* Section 3: Settings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">
                Word Delay: {wordDelay}ms
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={wordDelay}
                onChange={(e) => setWordDelay(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">
                Error Rate: {errorRate}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={errorRate}
                onChange={(e) => setErrorRate(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">
                Question-Answer Delay: {questionAnswerDelay}ms
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={questionAnswerDelay}
                onChange={(e) => setQuestionAnswerDelay(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">
                Punctuation Correction Rate: {punctuationCorrectionRate}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={punctuationCorrectionRate}
                onChange={(e) => setPunctuationCorrectionRate(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

