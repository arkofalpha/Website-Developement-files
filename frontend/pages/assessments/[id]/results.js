import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { assessmentAPI } from '../../../lib/api';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function AssessmentResults() {
  const router = useRouter();
  const { id } = router.query;
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadResults();
    }
  }, [id]);

  const loadResults = async () => {
    try {
      const response = await assessmentAPI.getResults(id);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBandColor = (band) => {
    switch (band) {
      case 'needs_improvement':
        return '#E53E3E';
      case 'below_average':
        return '#ED8936';
      case 'moderate':
        return '#ECC94B';
      case 'strong':
        return '#48BB78';
      default:
        return '#718096';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading results...</div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Results not found</div>
      </div>
    );
  }

  // Prepare chart data
  const radarData = {
    labels: results.themeScores.map((ts) => ts.themeName),
    datasets: [
      {
        label: 'Performance Score',
        data: results.themeScores.map((ts) => ts.meanScore),
        backgroundColor: 'rgba(43, 108, 176, 0.2)',
        borderColor: 'rgba(43, 108, 176, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(43, 108, 176, 1)',
      },
    ],
  };

  const barData = {
    labels: results.themeScores.map((ts) => ts.themeName),
    datasets: [
      {
        label: 'Percentage Score',
        data: results.themeScores.map((ts) => ts.percentage),
        backgroundColor: results.themeScores.map((ts) =>
          getPerformanceBandColor(ts.performanceBand || 'moderate')
        ),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + '%';
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-dark">Assessment Results</h1>
            <Link href="/" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Composite Score</h3>
            <div className="text-4xl font-bold text-primary-main">
              {results.summary?.compositeMean?.toFixed(2)}/5
            </div>
            <div className="text-sm text-neutral-600 mt-2">
              {results.summary?.compositePercentage?.toFixed(1)}%
            </div>
          </div>
          <div className="card text-center">
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Performance Band</h3>
            <div
              className="text-xl font-bold text-white px-4 py-2 rounded-lg inline-block mt-2"
              style={{
                backgroundColor: getPerformanceBandColor(results.summary?.performanceBand),
              }}
            >
              {results.summary?.performanceBand?.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
          <div className="card text-center">
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">Business</h3>
            <div className="text-lg font-semibold">{results.business?.name}</div>
            <div className="text-sm text-neutral-600">{results.business?.sector}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Performance Radar Chart</h3>
            <div style={{ height: '400px' }}>
              <Radar data={radarData} options={chartOptions} />
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Theme Performance</h3>
            <div style={{ height: '400px' }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Theme Scores Table */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Detailed Theme Scores</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-300">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Theme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Mean Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-300">
                {results.themeScores.map((themeScore) => (
                  <tr key={themeScore.themeId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                      {themeScore.themeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {themeScore.meanScore.toFixed(2)}/5
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {themeScore.percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{
                          backgroundColor: getPerformanceBandColor(themeScore.performanceBand || 'moderate'),
                        }}
                      >
                        {themeScore.performanceBand?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

