import { describe, test, expect } from '@jest/globals';
import {
  calculateThemeMean,
  calculatePercentage,
  determinePerformanceBand,
  calculateScores,
} from '../utils/scoring.js';

describe('Scoring Utilities', () => {
  describe('calculateThemeMean', () => {
    test('should calculate mean for array of scores', () => {
      expect(calculateThemeMean([5, 5, 5])).toBe(5);
      expect(calculateThemeMean([1, 1, 1])).toBe(1);
      expect(calculateThemeMean([1, 3, 5])).toBe(3);
      expect(calculateThemeMean([2, 4, 3, 5, 1])).toBe(3);
    });

    test('should return null for empty array', () => {
      expect(calculateThemeMean([])).toBeNull();
      expect(calculateThemeMean(null)).toBeNull();
    });
  });

  describe('calculatePercentage', () => {
    test('should convert mean to percentage', () => {
      expect(calculatePercentage(5)).toBe(100);
      expect(calculatePercentage(1)).toBe(0);
      expect(calculatePercentage(3)).toBe(50);
      expect(calculatePercentage(2.5)).toBe(37.5);
    });

    test('should return null for null input', () => {
      expect(calculatePercentage(null)).toBeNull();
      expect(calculatePercentage(undefined)).toBeNull();
    });
  });

  describe('determinePerformanceBand', () => {
    test('should return correct performance band', () => {
      expect(determinePerformanceBand(1.5)).toBe('needs_improvement');
      expect(determinePerformanceBand(2.0)).toBe('needs_improvement');
      expect(determinePerformanceBand(2.5)).toBe('below_average');
      expect(determinePerformanceBand(3.0)).toBe('below_average');
      expect(determinePerformanceBand(3.5)).toBe('moderate');
      expect(determinePerformanceBand(4.0)).toBe('moderate');
      expect(determinePerformanceBand(4.5)).toBe('strong');
      expect(determinePerformanceBand(5.0)).toBe('strong');
    });

    test('should return null for null input', () => {
      expect(determinePerformanceBand(null)).toBeNull();
      expect(determinePerformanceBand(undefined)).toBeNull();
    });
  });

  describe('calculateScores', () => {
    test('should calculate scores for all 5s', () => {
      const responses = [
        { question_id: 'q1', score: 5 },
        { question_id: 'q2', score: 5 },
        { question_id: 'q3', score: 5 },
      ];
      const questions = [
        { id: 'q1', theme_id: 't1', reverse_scored: false },
        { id: 'q2', theme_id: 't1', reverse_scored: false },
        { id: 'q3', theme_id: 't1', reverse_scored: false },
      ];
      const themes = [
        { id: 't1', weight: 1.0 },
      ];

      const result = calculateScores(responses, questions, themes);

      expect(result.summary.composite_mean).toBe(5);
      expect(result.summary.composite_percentage).toBe(100);
      expect(result.summary.performance_band).toBe('strong');
      expect(result.themeScores[0].mean_score).toBe(5);
      expect(result.themeScores[0].percentage).toBe(100);
    });

    test('should calculate scores for all 1s', () => {
      const responses = [
        { question_id: 'q1', score: 1 },
        { question_id: 'q2', score: 1 },
      ];
      const questions = [
        { id: 'q1', theme_id: 't1', reverse_scored: false },
        { id: 'q2', theme_id: 't1', reverse_scored: false },
      ];
      const themes = [
        { id: 't1', weight: 1.0 },
      ];

      const result = calculateScores(responses, questions, themes);

      expect(result.summary.composite_mean).toBe(1);
      expect(result.summary.composite_percentage).toBe(0);
      expect(result.summary.performance_band).toBe('needs_improvement');
    });

    test('should handle reverse scored questions', () => {
      const responses = [
        { question_id: 'q1', score: 5 }, // Should become 1
        { question_id: 'q2', score: 1 }, // Stays 1
      ];
      const questions = [
        { id: 'q1', theme_id: 't1', reverse_scored: true },
        { id: 'q2', theme_id: 't1', reverse_scored: false },
      ];
      const themes = [
        { id: 't1', weight: 1.0 },
      ];

      const result = calculateScores(responses, questions, themes);

      expect(result.themeScores[0].mean_score).toBe(1); // (1 + 1) / 2 = 1
    });

    test('should handle weighted themes', () => {
      const responses = [
        { question_id: 'q1', score: 3 },
        { question_id: 'q2', score: 5 },
      ];
      const questions = [
        { id: 'q1', theme_id: 't1', reverse_scored: false },
        { id: 'q2', theme_id: 't2', reverse_scored: false },
      ];
      const themes = [
        { id: 't1', weight: 1.0 },
        { id: 't2', weight: 2.0 },
      ];

      const result = calculateScores(responses, questions, themes);

      // Theme 1: mean = 3, weight = 1
      // Theme 2: mean = 5, weight = 2
      // Composite: (3*1 + 5*2) / (1+2) = 13/3 = 4.33
      expect(result.summary.composite_mean).toBeCloseTo(4.33, 2);
    });

    test('should handle mixed scores', () => {
      const responses = [
        { question_id: 'q1', score: 1 },
        { question_id: 'q2', score: 3 },
        { question_id: 'q3', score: 5 },
      ];
      const questions = [
        { id: 'q1', theme_id: 't1', reverse_scored: false },
        { id: 'q2', theme_id: 't1', reverse_scored: false },
        { id: 'q3', theme_id: 't1', reverse_scored: false },
      ];
      const themes = [
        { id: 't1', weight: 1.0 },
      ];

      const result = calculateScores(responses, questions, themes);

      expect(result.themeScores[0].mean_score).toBe(3);
      expect(result.themeScores[0].percentage).toBe(50);
      expect(result.summary.performance_band).toBe('moderate');
    });
  });
});

