import './CacheIndicator.css'

function CacheIndicator({ show, message = 'Data loaded from cache' }) {
  if (!show) return null
  
  return (
    <div className="cache-indicator">
      <span className="cache-icon">⚡</span>
      <span className="cache-message">{message}</span>
    </div>
  )
}

export default CacheIndicator
