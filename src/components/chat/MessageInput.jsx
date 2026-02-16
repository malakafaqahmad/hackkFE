function MessageInput({ value, onChange, onSend, onKeyPress, disabled = false }) {
  return (
    <div className="input-container">
      <div className="input-wrapper">
        <button className="attach-button" title="Attach file" disabled={disabled}>
          📎
        </button>
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          placeholder={disabled ? "Waiting for response..." : "Type your symptoms or concerns..."}
          className="message-input"
          disabled={disabled}
        />
        <button 
          onClick={onSend} 
          className="send-button"
          disabled={disabled || !value.trim()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MessageInput
