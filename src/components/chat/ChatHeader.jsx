function ChatHeader() {
  return (
    <div className="chat-header">
      <div className="header-content">
        <div className="doctor-info">
          <div className="doctor-avatar">👨‍⚕️</div>
          <div className="doctor-details">
            <h1>Dr. Smith</h1>
            <span className="status">
              <span className="status-dot"></span>
              Available Now
            </span>
          </div>
        </div>
        <p className="subtitle">Virtual Medical Consultation</p>
      </div>
    </div>
  )
}

export default ChatHeader
