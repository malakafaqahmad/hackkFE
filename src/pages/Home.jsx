import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-header">
          <h1>🏥 Medical Interview System</h1>
          <p>Choose how you'd like to proceed</p>
        </div>

        <div className="home-options">
          <div 
            className="home-card chat-card"
            onClick={() => navigate('/interview/p1')}
          >
            <div className="card-icon">💬</div>
            <h2>Start Direct Chat</h2>
            <p>Begin an interview without selecting a patient</p>
            <button className="card-button">Start Chat</button>
          </div>

          <div 
            className="home-card patients-card"
            onClick={() => navigate('/patients')}
          >
            <div className="card-icon">👥</div>
            <h2>View Patients</h2>
            <p>Browse patient list and start an interview</p>
            <button className="card-button">View Patients</button>
          </div>
        </div>

        <div className="home-footer">
          <p>AI-Powered Medical Interview Assistant</p>
        </div>
      </div>
    </div>
  )
}
