import { useState } from 'react';
import { useRouter } from 'next/router';
import { businessProfileAPI } from '../../lib/api';

export default function ProfileSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    sector: '',
    country: '',
    city: '',
    employeeCount: '',
    registrationType: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await businessProfileAPI.create({
        ...formData,
        employeeCount: parseInt(formData.employeeCount),
      });
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create business profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-primary-dark mb-6">Setup Business Profile</h2>
        
        {error && (
          <div className="bg-performance-red text-white p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="businessName" className="label">
              Business Name *
            </label>
            <input
              id="businessName"
              type="text"
              required
              className="input"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="sector" className="label">
              Sector *
            </label>
            <input
              id="sector"
              type="text"
              required
              className="input"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className="label">
                Country *
              </label>
              <input
                id="country"
                type="text"
                required
                className="input"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="city" className="label">
                City *
              </label>
              <input
                id="city"
                type="text"
                required
                className="input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="employeeCount" className="label">
              Employee Count *
            </label>
            <input
              id="employeeCount"
              type="number"
              min="0"
              required
              className="input"
              value={formData.employeeCount}
              onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="registrationType" className="label">
              Registration Type
            </label>
            <input
              id="registrationType"
              type="text"
              className="input"
              value={formData.registrationType}
              onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="label">
              Contact Email
            </label>
            <input
              id="contactEmail"
              type="email"
              className="input"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="label">
              Contact Phone
            </label>
            <input
              id="contactPhone"
              type="tel"
              className="input"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading ? 'Creating...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

