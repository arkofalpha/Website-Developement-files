import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { assessmentAPI } from '../lib/api';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const response = await assessmentAPI.getAll();
      setAssessments(response.data.data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBandColor = (band) => {
    switch (band) {
      case 'needs_improvement':
        return 'bg-performance-red';
      case 'below_average':
        return 'bg-performance-orange';
      case 'moderate':
        return 'bg-performance-yellow';
      case 'strong':
        return 'bg-performance-green';
      default:
        return 'bg-neutral-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-dark">Business Self-Assessment</h1>
            <div className="flex gap-4">
              <Link href="/assessments/new" className="btn btn-primary">
                Start New Assessment
              </Link>
              <Link href="/profile" className="btn btn-secondary">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Assessments</h2>
          <p className="text-neutral-700">View and manage your completed assessments</p>
        </div>

        {assessments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-neutral-700 mb-4">You haven't completed any assessments yet.</p>
            <Link href="/assessments/new" className="btn btn-primary inline-block">
              Start Your First Assessment
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {assessments.map((assessment) => (
              <Link
                key={assessment.id}
                href={`/assessments/${assessment.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Assessment #{assessment.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-neutral-700">
                      Started: {new Date(assessment.startedAt).toLocaleDateString()}
                    </p>
                    {assessment.completedAt && (
                      <p className="text-sm text-neutral-700">
                        Completed: {new Date(assessment.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      assessment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {assessment.status}
                    </span>
                    {assessment.summary && (
                      <div className="mt-2">
                        <div className="text-2xl font-bold">
                          {assessment.summary.compositeMean?.toFixed(1)}/5
                        </div>
                        <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${getPerformanceBandColor(assessment.summary.performanceBand)}`}>
                          {assessment.summary.performanceBand.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
