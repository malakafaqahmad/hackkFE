function Message({ message }) {
  // Handle system messages differently
  if (message.sender === 'system') {
    return (
      <div className="message system">
        <div className="system-message-content">
          <p>{message.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`message ${message.sender}`}>
      <div className="message-avatar">
        {message.sender === 'doctor' ? '👨‍⚕️' : '👤'}
      </div>
      <div className="message-content">
        <div className="message-sender">
          {message.sender === 'doctor' ? 'Dr. Smith' : 'You'}
        </div>
        <div className="message-bubble">
          <p>{message.text}</p>
        </div>
        <div className="message-time">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

export default Message
