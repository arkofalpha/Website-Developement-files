import Link from 'next/link'

export default function Home() {
  return (
    <main className="container">
      <header>
        <h1>Business Self-Assessment</h1>
        <p>Welcome — start a new assessment or view past results.</p>
      </header>

      <section>
        <Link href="/assessments/new"><button className="btn">Start New Assessment</button></Link>
      </section>

      <style jsx>{`
        .container { max-width: 900px; margin: 40px auto; padding: 0 16px; }
        h1 { font-size: 28px; }
        .btn { background:#2B6CB0; color:#fff; padding:12px 18px; border-radius:6px; border:none; cursor:pointer; }
      `}</style>
    </main>
  )
}
