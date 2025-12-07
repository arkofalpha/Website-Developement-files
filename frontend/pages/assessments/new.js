import { useState } from 'react'
import Question from '../../components/Question'
import api from '../../lib/api'
import { useRouter } from 'next/router'

export default function NewAssessment() {
  const [themes, setThemes] = useState([])
  const [responses, setResponses] = useState({})
  const [assessmentId, setAssessmentId] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function startAssessment() {
    setLoading(true)
    try {
      const res = await api.post('/assessments', { businessProfileId: 'bp1' })
      const data = res.data
      setThemes(data.themes)
      // store assessment id returned by backend
      if (data.id) setAssessmentId(data.id)
      // initialize responses state
      const initial = {}
      data.themes.forEach(t => t.questions.forEach(q => { initial[q.id] = 0 }))
      setResponses(initial)
    } catch (err) {
      console.error(err)
      alert('Failed to start assessment')
    } finally { setLoading(false) }
  }

  function setAnswer(questionId, score) {
    setResponses(prev => ({ ...prev, [questionId]: score }))
  }

  async function saveResponses(assessmentId) {
    setLoading(true)
    try {
      const id = assessmentId || assessmentId === 0 ? assessmentId : null
      if (!id) {
        alert('No assessment id available. Start an assessment first.')
        return
      }
      const payload = { responses: Object.keys(responses).map(qid => ({ questionId: qid, score: responses[qid] })) }
      await api.put(`/assessments/${id}/responses`, payload)
      alert('Saved')
    } catch (err) {
      console.error(err)
      alert('Failed to save')
    } finally { setLoading(false) }
  }

  async function submitAssessment(assessmentId) {
    setLoading(true)
    try {
      const id = assessmentId || assessmentId === 0 ? assessmentId : null
      if (!id) {
        alert('No assessment id available. Start an assessment first.')
        return
      }
      await api.post(`/assessments/${id}/submit`)
      alert('Submitted — redirecting to results')
      router.push('/')
    } catch (err) {
      console.error(err)
      alert('Failed to submit. Are all questions answered?')
    } finally { setLoading(false) }
  }

  return (
    <main className="container">
      <h1>New Assessment</h1>

      {themes.length === 0 ? (
        <div>
          <p>Click below to begin the assessment.</p>
          <button className="btn" onClick={startAssessment} disabled={loading}>{loading ? 'Starting...' : 'Start Assessment'}</button>
        </div>
      ) : (
        <div>
          {themes.map(t => (
            <section key={t.id} className="theme">
              <h2>{t.name}</h2>
              {t.questions.map(q => (
                <Question key={q.id} id={q.id} text={q.text} value={responses[q.id] || 0} onChange={setAnswer} />
              ))}
            </section>
          ))}

          <div className="actions">
            <button className="btn" onClick={() => saveResponses(assessmentId)} disabled={!assessmentId || loading}>Save</button>
            <button className="btn secondary" onClick={() => submitAssessment(assessmentId)} disabled={!assessmentId || loading}>Submit</button>
            {!assessmentId && <p style={{ color: '#666', marginLeft: 12 }}>Start the assessment to enable save/submit.</p>}
          </div>
        </div>
      )}

      <style jsx>{`
        .container { max-width: 900px; margin: 24px auto; padding: 0 16px }
        .theme { margin-bottom: 20px; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px }
        .actions { margin-top: 16px; display:flex; gap:12px }
        .btn { background:#2B6CB0; color:#fff; padding:10px 14px; border-radius:6px; border:none }
        .btn.secondary { background:#48BB78 }
      `}</style>
    </main>
  )
}
