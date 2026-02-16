function TypingIndicator() {
  return (
    <div className="message doctor typing-indicator">
      <div className="message-avatar">👨‍⚕️</div>
      <div className="message-content">
        <div className="message-bubble typing">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
