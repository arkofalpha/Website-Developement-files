import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { assessmentAPI } from '../../lib/api';

export default function NewAssessment() {
  const router = useRouter();
  const [assessment, setAssessment] = useState(null);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createAssessment();
  }, []);

  const createAssessment = async () => {
    try {
      const response = await assessmentAPI.create();
      setAssessment(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to create assessment:', error);
      router.push('/');
    }
  };

  const handleResponse = (questionId, score) => {
    setResponses({
      ...responses,
      [questionId]: { questionId, score },
    });
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const responsesArray = Object.values(responses);
      await assessmentAPI.saveResponses(assessment.id, responsesArray);
      alert('Progress saved!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
      setSaving(true);
      try {
        // Save all responses first
        const responsesArray = Object.values(responses);
        await assessmentAPI.saveResponses(assessment.id, responsesArray);
        
        // Submit assessment
        await assessmentAPI.submit(assessment.id);
        router.push(`/assessments/${assessment.id}/results`);
      } catch (error) {
        console.error('Failed to submit:', error);
        alert(error.response?.data?.error?.message || 'Failed to submit assessment');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading assessment...</div>
      </div>
    );
  }

  const currentTheme = assessment.themes[currentThemeIndex];
  const currentQuestion = currentTheme?.questions[currentQuestionIndex];
  const totalQuestions = assessment.themes.reduce((sum, theme) => sum + theme.questions.length, 0);
  const answeredQuestions = Object.keys(responses).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">No questions available</div>
      </div>
    );
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < currentTheme.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentThemeIndex < assessment.themes.length - 1) {
      setCurrentThemeIndex(currentThemeIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentThemeIndex > 0) {
      setCurrentThemeIndex(currentThemeIndex - 1);
      const prevTheme = assessment.themes[currentThemeIndex - 1];
      setCurrentQuestionIndex(prevTheme.questions.length - 1);
    }
  };

  const isLastQuestion = 
    currentThemeIndex === assessment.themes.length - 1 &&
    currentQuestionIndex === currentTheme.questions.length - 1;

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-primary-dark">Assessment</h1>
            <button
              onClick={saveProgress}
              disabled={saving}
              className="btn btn-secondary"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-neutral-700 mb-2">
              <span>Progress: {answeredQuestions} / {totalQuestions} questions</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-neutral-300 rounded-full h-2">
              <div
                className="bg-primary-main h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="mb-4">
            <span className="text-sm text-neutral-500">
              Theme {currentThemeIndex + 1} of {assessment.themes.length}
            </span>
            <h2 className="text-2xl font-bold text-primary-dark mt-1">
              {currentTheme.name}
            </h2>
            {currentTheme.description && (
              <p className="text-neutral-700 mt-2">{currentTheme.description}</p>
            )}
          </div>

          <div className="mb-6">
            <span className="text-sm text-neutral-500">
              Question {currentQuestionIndex + 1} of {currentTheme.questions.length}
            </span>
            <h3 className="text-xl font-semibold mt-2 mb-4">
              {currentQuestion.text}
            </h3>
            {currentQuestion.helpText && (
              <p className="text-sm text-neutral-600 mb-4 italic">
                {currentQuestion.helpText}
              </p>
            )}

            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={score}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    responses[currentQuestion.id]?.score === score
                      ? 'border-primary-main bg-primary-light bg-opacity-10'
                      : 'border-neutral-300 hover:border-primary-light'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={score}
                    checked={responses[currentQuestion.id]?.score === score}
                    onChange={() => handleResponse(currentQuestion.id, score)}
                    className="mr-3"
                  />
                  <span className="font-semibold mr-2">{score}.</span>
                  <span>
                    {score === 1 && 'Strongly Disagree / Very Poor'}
                    {score === 2 && 'Disagree / Poor'}
                    {score === 3 && 'Neutral / Moderate'}
                    {score === 4 && 'Agree / Good'}
                    {score === 5 && 'Strongly Agree / Very Good'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentThemeIndex === 0 && currentQuestionIndex === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={saving || answeredQuestions < totalQuestions}
                className="btn btn-primary"
              >
                {saving ? 'Submitting...' : 'Submit Assessment'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="btn btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
