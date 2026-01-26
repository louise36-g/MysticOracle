import React, { createContext, useContext, useState, useCallback } from 'react';
import { SpreadType, InterpretationStyle } from '../types';

interface CardSelection {
  cardId: string;
  position: number;
  isReversed: boolean;
}

interface ReadingState {
  spreadType: SpreadType | null;
  interpretationStyle: InterpretationStyle | null;
  question: string;
  cards: CardSelection[] | null;
  interpretation: string | null;
  interpretationStatus: 'idle' | 'loading' | 'complete' | 'error';
  readingId: string | null;
  error: string | null;
}

interface ReadingContextValue {
  state: ReadingState;
  setSpreadType: (type: SpreadType) => void;
  setInterpretationStyle: (style: InterpretationStyle) => void;
  setQuestion: (question: string) => void;
  setCards: (cards: CardSelection[]) => void;
  setInterpretation: (text: string) => void;
  setInterpretationStatus: (status: ReadingState['interpretationStatus']) => void;
  setReadingId: (id: string) => void;
  setError: (error: string | null) => void;
  clearReading: () => void;
  canProceedTo: (step: ReadingStep) => boolean;
  hasStartedReading: () => boolean;
}

type ReadingStep = 'select-spread' | 'question' | 'draw-cards' | 'reveal' | 'result';

const initialState: ReadingState = {
  spreadType: null,
  interpretationStyle: null,
  question: '',
  cards: null,
  interpretation: null,
  interpretationStatus: 'idle',
  readingId: null,
  error: null,
};

const ReadingContext = createContext<ReadingContextValue | null>(null);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ReadingState>(initialState);

  const setSpreadType = useCallback((type: SpreadType) => {
    setState(prev => ({ ...prev, spreadType: type }));
  }, []);

  const setInterpretationStyle = useCallback((style: InterpretationStyle) => {
    setState(prev => ({ ...prev, interpretationStyle: style }));
  }, []);

  const setQuestion = useCallback((question: string) => {
    setState(prev => ({ ...prev, question }));
  }, []);

  const setCards = useCallback((cards: CardSelection[]) => {
    setState(prev => ({ ...prev, cards }));
  }, []);

  const setInterpretation = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      interpretation: text,
      interpretationStatus: 'complete'
    }));
  }, []);

  const setInterpretationStatus = useCallback((status: ReadingState['interpretationStatus']) => {
    setState(prev => ({ ...prev, interpretationStatus: status }));
  }, []);

  const setReadingId = useCallback((id: string) => {
    setState(prev => ({ ...prev, readingId: id }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      interpretationStatus: error ? 'error' : prev.interpretationStatus
    }));
  }, []);

  const clearReading = useCallback(() => {
    setState(initialState);
  }, []);

  const canProceedTo = useCallback((step: ReadingStep): boolean => {
    switch (step) {
      case 'select-spread':
        return true;
      case 'question':
        return state.spreadType !== null;
      case 'draw-cards':
        return state.spreadType !== null;
      case 'reveal':
        return state.spreadType !== null && state.cards !== null && state.cards.length > 0;
      case 'result':
        return state.interpretation !== null || state.readingId !== null;
      default:
        return false;
    }
  }, [state]);

  const hasStartedReading = useCallback((): boolean => {
    return state.spreadType !== null || state.cards !== null || state.interpretation !== null;
  }, [state]);

  const value: ReadingContextValue = {
    state,
    setSpreadType,
    setInterpretationStyle,
    setQuestion,
    setCards,
    setInterpretation,
    setInterpretationStatus,
    setReadingId,
    setError,
    clearReading,
    canProceedTo,
    hasStartedReading,
  };

  return (
    <ReadingContext.Provider value={value}>
      {children}
    </ReadingContext.Provider>
  );
}

export function useReading(): ReadingContextValue {
  const context = useContext(ReadingContext);
  if (!context) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
}
