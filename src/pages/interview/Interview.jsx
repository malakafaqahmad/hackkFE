import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ChatHeader from '../../components/chat/ChatHeader'
import Message from '../../components/chat/Message'
import MessageInput from '../../components/chat/MessageInput'
import TypingIndicator from '../../components/chat/TypingIndicator'
import CacheIndicator from '../../components/common/CacheIndicator'
import { sendInterviewMessage, generateDiagnosis, sendSecondInterviewMessage, generateFinalReport } from '../../services/api'
import { saveInterviewState, loadInterviewState, clearInterviewState } from '../../utils/storage'
import './Interview.css'

function Interview() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  
  // Load persisted state or use defaults
  const getInitialState = () => {
    try {
      const saved = loadInterviewState(patientId)
      if (saved) {
        console.log('📂 Loaded interview state from cache:', {
          messageCount: saved.messages?.length || 0,
          conversationId: saved.conversationId,
          doctorQuestionCount: saved.doctorQuestionCount,
          isRound2: saved.isRound2
        })
        return { ...saved, wasRestored: true }
      }
    } catch (error) {
      console.error('Error loading saved state:', error)
    }
    return {
      messages: [],
      report: `## Chief Complaint
To be determined from patient interview.

## History of Present Illness (HPI)
To be filled based on patient interview.

## Relevant Medical History
To be extracted from EHR and interview.

## Current Medications
To be extracted from EHR.

## Allergies
To be extracted from EHR.`,
      conversationId: null,
      secondInterviewConversationId: null,
      doctorQuestionCount: 0,
      round2UserMessageCount: 0,
      isRound2: false,
      diagnosisData: null,
      finalReportData: null,
      isInitialized: false,
      wasRestored: false
    }
  }
  
  const initialState = getInitialState()
  const [messages, setMessages] = useState(initialState.messages)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [report, setReport] = useState(initialState.report)
  const [conversationId, setConversationId] = useState(initialState.conversationId)
  const [secondInterviewConversationId, setSecondInterviewConversationId] = useState(initialState.secondInterviewConversationId || null)
  const [doctorQuestionCount, setDoctorQuestionCount] = useState(initialState.doctorQuestionCount)
  const [round2UserMessageCount, setRound2UserMessageCount] = useState(initialState.round2UserMessageCount || 0)
  const [isRound2, setIsRound2] = useState(initialState.isRound2)
  const [diagnosisData, setDiagnosisData] = useState(initialState.diagnosisData)
  const [finalReportData, setFinalReportData] = useState(initialState.finalReportData || null)
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [showCacheIndicator, setShowCacheIndicator] = useState(initialState.wasRestored)
  const messagesEndRef = useRef(null)
  const isInitializedRef = useRef(initialState.isInitialized)
  
  // Auto-hide cache indicator after 3 seconds
  useEffect(() => {
    if (showCacheIndicator) {
      const timer = setTimeout(() => setShowCacheIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showCacheIndicator])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0 || conversationId || isRound2) {
      const stateToSave = {
        messages,
        report,
        conversationId,
        secondInterviewConversationId,
        doctorQuestionCount,
        round2UserMessageCount,
        isRound2,
        diagnosisData,
        finalReportData,
        isInitialized: isInitializedRef.current
      }
      saveInterviewState(patientId, stateToSave)
      console.log('💾 Saved interview state:', {
        messageCount: messages.length,
        conversationId,
        secondInterviewConversationId,
        doctorQuestionCount,
        round2UserMessageCount,
        isRound2
      })
    }
  }, [messages, report, conversationId, secondInterviewConversationId, doctorQuestionCount, round2UserMessageCount, isRound2, diagnosisData, finalReportData, patientId])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Helper function to parse differential diagnoses from response
  const parseDifferentialDiagnoses = (diagnosisResponse) => {
    console.log('🔍 parseDifferentialDiagnoses called with:', {
      hasDifferentialDiagnoses: !!diagnosisResponse.differential_diagnoses,
      differentialLength: diagnosisResponse.differential_diagnoses?.length || 0,
      hasRawResponse: !!diagnosisResponse.raw_response,
      rawResponsePreview: diagnosisResponse.raw_response?.substring(0, 100)
    })
    
    let parsedDiagnoses = diagnosisResponse.differential_diagnoses || []
    
    // If empty, try to parse from raw_response
    if (parsedDiagnoses.length === 0 && diagnosisResponse.raw_response) {
      console.log('🔍 Attempting to parse from raw_response...')
      console.log('Raw response length:', diagnosisResponse.raw_response.length)
      
      try {
        // Try multiple regex patterns
        let jsonMatch = diagnosisResponse.raw_response.match(/```json\s*\n([\s\S]*?)\n```/)
        console.log('Pattern 1 result:', !!jsonMatch)
        
        if (!jsonMatch) {
          jsonMatch = diagnosisResponse.raw_response.match(/```\s*\n([\s\S]*?)\n```/)
          console.log('Pattern 2 result:', !!jsonMatch)
        }
        
        if (!jsonMatch) {
          jsonMatch = diagnosisResponse.raw_response.match(/```json([\s\S]*?)```/)
          console.log('Pattern 3 result:', !!jsonMatch)
        }
        
        if (jsonMatch && jsonMatch[1]) {
          const jsonString = jsonMatch[1].trim()
          console.log('📝 Extracted JSON (first 200 chars):', jsonString.substring(0, 200))
          
          const parsedData = JSON.parse(jsonString)
          parsedDiagnoses = parsedData.differential_diagnoses || []
          console.log('✅ Successfully parsed:', parsedDiagnoses.length, 'diagnoses')
          console.log('First diagnosis:', parsedDiagnoses[0]?.disease)
        } else {
          console.warn('⚠️ Could not find JSON block in raw_response')
          console.log('Trying direct JSON parse...')
          try {
            const parsedData = JSON.parse(diagnosisResponse.raw_response)
            parsedDiagnoses = parsedData.differential_diagnoses || []
            console.log('✅ Direct parse successful:', parsedDiagnoses.length, 'diagnoses')
          } catch (e) {
            console.error('❌ Direct parse also failed:', e.message)
          }
        }
      } catch (error) {
        console.error('❌ Error parsing differential:', error)
        console.error('Error stack:', error.stack)
      }
    } else if (parsedDiagnoses.length > 0) {
      console.log('✅ Using existing differential_diagnoses array:', parsedDiagnoses.length, 'diagnoses')
    }
    
    return parsedDiagnoses
  }

  const triggerRound2 = async (conversationHistory, currentReport) => {
    try {
      setIsTyping(true)
      
      // Add system message about round 2
      const round2Message = {
        id: messages.length + 1,
        sender: 'system',
        text: '🎯 Round 2 Interview Started - Generating differential diagnosis...'
      }
      setMessages(prev => [...prev, round2Message])
      
      // Generate differential diagnosis
      const diagnosisResult = await generateDiagnosis(patientId, conversationHistory, currentReport)
      
      console.log('Diagnosis Result:', diagnosisResult)
      console.log('Differential Diagnoses:', diagnosisResult.differential_diagnoses)
      
      if (diagnosisResult.success) {
        // Parse differential_diagnoses from raw_response if main array is empty
        const parsedDiagnoses = parseDifferentialDiagnoses(diagnosisResult)
        
        console.log('🎯 Setting diagnosis data with', parsedDiagnoses?.length || 0, 'diagnoses')
        console.log('Parsed diagnoses:', parsedDiagnoses)
        
        const diagnosisDataToSet = {
          ...diagnosisResult,
          differential_diagnoses: parsedDiagnoses
        }
        
        console.log('💾 Final diagnosisDataToSet:', {
          patient_id: diagnosisDataToSet.patient_id,
          diagnosesCount: diagnosisDataToSet.differential_diagnoses?.length || 0,
          hasRawResponse: !!diagnosisDataToSet.raw_response
        })
        
        setDiagnosisData(diagnosisDataToSet)
        setIsRound2(true)
        
        // Automatically open the diagnosis panel if we have diagnoses
        if (parsedDiagnoses && parsedDiagnoses.length > 0) {
          console.log('✅ Auto-opening diagnosis panel with', parsedDiagnoses.length, 'diagnoses')
          setShowDiagnosis(true)
        }
        
        // Add diagnosis results as a message
        const diagnosisCount = parsedDiagnoses?.length || 0
        const diagnosisMessage = {
          id: messages.length + 2,
          sender: 'system',
          text: `✅ Round 2 Interview has started.\n\n${diagnosisCount} differential ${diagnosisCount === 1 ? 'diagnosis' : 'diagnoses'} generated. Click the "🔬 Differential Diagnosis" button above to view detailed analysis.`
        }
        setMessages(prev => [...prev, diagnosisMessage])
        
        // Automatically start second interview without user message
        console.log('🚀 Automatically starting second interview...')
        try {
          const secondInterviewData = await sendSecondInterviewMessage(
            patientId,
            null, // No message for first call
            conversationHistory,
            null, // No conversation_id for first call
            currentReport,
            parsedDiagnoses
          )
          
          if (secondInterviewData.success && secondInterviewData.message) {
            console.log('✅ Received second interview initial response')
            
            // Add doctor's response from second interview
            const secondInterviewResponse = {
              id: messages.length + 3,
              sender: 'doctor',
              text: secondInterviewData.message
            }
            setMessages(prev => [...prev, secondInterviewResponse])
            
            // Save the second interview conversation ID
            if (secondInterviewData.conversation_id) {
              console.log('💾 Saving second interview conversation ID:', secondInterviewData.conversation_id)
              setSecondInterviewConversationId(secondInterviewData.conversation_id)
            }
            
            // Update report if provided
            if (secondInterviewData.updated_report) {
              setReport(secondInterviewData.updated_report)
            }
            
            // Update differential diagnoses if provided
            if (secondInterviewData.updated_differential) {
              console.log('🔄 Updating differential diagnoses from second interview')
              const parsedUpdatedDiagnoses = parseDifferentialDiagnoses(secondInterviewData.updated_differential)
              
              setDiagnosisData(prev => ({
                ...prev,
                ...secondInterviewData.updated_differential,
                differential_diagnoses: parsedUpdatedDiagnoses
              }))
            }
          } else {
            console.error('❌ Second interview initialization failed:', secondInterviewData.error)
            const errorMessage = {
              id: messages.length + 3,
              sender: 'system',
              text: '⚠️ Error starting second interview. You can continue typing messages.'
            }
            setMessages(prev => [...prev, errorMessage])
          }
        } catch (error) {
          console.error('❌ Error calling second interview:', error)
          const errorMessage = {
            id: messages.length + 3,
            sender: 'system',
            text: '⚠️ Error starting second interview. You can continue typing messages.'
          }
          setMessages(prev => [...prev, errorMessage])
        }
      } else {
        const errorMessage = {
          id: messages.length + 2,
          sender: 'system',
          text: `⚠️ Error generating diagnosis: ${diagnosisResult.error || 'Unknown error'}`
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error triggering round 2:', error)
      const errorMessage = {
        id: messages.length + 2,
        sender: 'system',
        text: '⚠️ Error starting Round 2. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const generateAndDisplayFinalReport = async () => {
    try {
      console.log('🔵 Starting final report generation...')
      setIsTyping(true)
      
      // Build complete conversation history as string
      const conversationHistoryString = messages
        .filter(msg => msg.sender !== 'system')
        .map(msg => `${msg.sender === 'doctor' ? 'Doctor' : 'Patient'}: ${msg.text}`)
        .join('\n\n')
      
      console.log('📋 Generating final report with data:', {
        patientId: patientId || 'direct-chat',
        conversationLength: conversationHistoryString.length,
        reportLength: report.length,
        hasDiagnosisData: !!diagnosisData
      })
      
      // Generate final report
      const finalResult = await generateFinalReport(
        patientId || 'direct-chat',
        conversationHistoryString,
        report,
        diagnosisData?.raw_response || diagnosisData?.differential_diagnoses || []
      )
      
      console.log('📋 Final Report Result:', finalResult)
      console.log('📋 Final Report Success:', finalResult?.success)
      console.log('📋 Final Report Keys:', Object.keys(finalResult || {}))
      
      if (finalResult && finalResult.success) {
        const reportContent = finalResult.final_report || finalResult.report || finalResult.raw_response
        console.log('📋 Report content exists:', !!reportContent)
        console.log('📋 Report content length:', reportContent?.length || 0)
        
        if (reportContent) {
          console.log('✅ Setting final report data and showing modal')
          setFinalReportData(finalResult)
          // Use setTimeout to ensure state is updated before showing modal
          setTimeout(() => {
            setShowFinalReport(true)
            console.log('✅ Modal should now be visible')
          }, 100)
        } else {
          console.error('⚠️ No report content found in response')
          alert('Final report was generated but contains no content.')
        }
      } else {
        console.error('❌ Final report generation failed:', finalResult)
        alert(`Error generating final report: ${finalResult?.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('❌ Error generating final report:', error)
      console.error('Error details:', error.message, error.stack)
      alert(`Error generating final report: ${error.message || 'Please try again.'}`)
    } finally {
      console.log('🔵 Final report generation complete, setting isTyping to false')
      setIsTyping(false)
    }
  }

  const handleFinalReportClick = () => {
    if (finalReportData) {
      // If report already exists, just show it
      console.log('👁️ Showing existing final report')
      setShowFinalReport(true)
    } else {
      // If no report exists, generate it
      console.log('🔄 Generating new final report')
      generateAndDisplayFinalReport()
    }
  }

  const initializeInterview = async () => {
    if (!patientId) {
      setMessages([{
        id: 1,
        sender: 'doctor',
        text: 'Hello! I\'m MedGemma. How are you feeling today? Please describe any symptoms you\'re experiencing.'
      }])
      setIsInitializing(false)
      return
    }

    setIsTyping(true)
    setIsInitializing(true)

    try {
      // Send automatic first message (no conversation_id on first call)
      const data = await sendInterviewMessage(patientId, 'Hello, I need medical consultation.', [], null, report)

      if (data.success && data.message) {
        setMessages([{
          id: 1,
          sender: 'doctor',
          text: data.message
        }])
        
        // Increment doctor question count
        setDoctorQuestionCount(1)
        
        // Save conversation_id for future messages
        if (data.conversation_id) {
          setConversationId(data.conversation_id)
        }
        
        // Update report if provided
        if (data.updated_report) {
          setReport(data.updated_report)
        }
      } else {
        setMessages([{
          id: 1,
          sender: 'doctor',
          text: data.error || 'Hello! I\'m MedGemma. How are you feeling today? Please describe any symptoms you\'re experiencing.'
        }])
      }
    } catch (error) {
      console.error('Error starting interview:', error)
      setMessages([{
        id: 1,
        sender: 'doctor',
        text: 'I apologize, but I\'m having trouble connecting to the system. Please ensure the backend is running and try again.'
      }])
    } finally {
      setIsTyping(false)
      setIsInitializing(false)
    }
  }

  useEffect(() => {
    // Initialize interview when component mounts (only once)
    if (!isInitializedRef.current) {
      console.log('🚀 Initializing new interview for patient:', patientId)
      isInitializedRef.current = true
      initializeInterview()
    } else {
      // If already initialized (from localStorage), just turn off loading
      console.log('✅ Interview already initialized, skipping initialization')
      console.log('📋 Current state:', {
        messageCount: messages.length,
        conversationId,
        doctorQuestionCount
      })
      setIsInitializing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Cleanup function to optionally clear state when navigating away
  const handleClearInterview = () => {
    if (window.confirm('Are you sure you want to clear this interview? This will reset all conversation history.')) {
      clearInterviewState(patientId)
      window.location.reload()
    }
  }
  
  // Add cleanup to navigation
  const handleBackToPatients = () => {
    // State is preserved in localStorage, so user can return
    navigate('/')
  }

  const handleSend = async () => {
    if (inputValue.trim() === '') return

    const patientMessage = {
      id: messages.length + 1,
      sender: 'patient',
      text: inputValue
    }
    
    const newMessages = [...messages, patientMessage]
    setMessages(newMessages)
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      // Build conversation history from all messages (excluding system messages)
      const conversationHistory = newMessages
        .filter(msg => msg.sender !== 'system')
        .map(msg => ({
          role: msg.sender === 'doctor' ? 'assistant' : 'user',
          content: msg.text
        }))
      
      console.log('📤 Sending message with conversation history:', {
        historyLength: conversationHistory.length,
        currentMessage: currentInput,
        conversationId,
        isRound2,
        secondInterviewConversationId
      })

      let data
      
      // Use different endpoint based on whether we're in Round 2
      if (isRound2) {
        console.log('🔬 Using second-interview endpoint')
        data = await sendSecondInterviewMessage(
          patientId,
          currentInput,
          conversationHistory,
          secondInterviewConversationId, // Use second interview conversation ID
          report,
          diagnosisData?.differential_diagnoses || []
        )
      } else {
        console.log('💬 Using regular interview endpoint')
        data = await sendInterviewMessage(patientId, currentInput, conversationHistory, conversationId, report)
      }

      if (data.success && data.message) {
        const doctorResponse = {
          id: newMessages.length + 1,
          sender: 'doctor',
          text: data.message
        }
        setMessages([...newMessages, doctorResponse])
        
        // Increment doctor question count
        const newCount = doctorQuestionCount + 1
        setDoctorQuestionCount(newCount)
        
        // Update conversation_id based on which interview we're in
        if (isRound2) {
          // For Round 2, save the second interview conversation ID
          if (data.conversation_id && data.conversation_id !== secondInterviewConversationId) {
            console.log('💾 Saving second interview conversation ID:', data.conversation_id)
            setSecondInterviewConversationId(data.conversation_id)
          }
          
          // Increment Round 2 user message count
          const newRound2Count = round2UserMessageCount + 1
          setRound2UserMessageCount(newRound2Count)
          console.log('📊 Round 2 user messages:', newRound2Count)
          
          // Update differential diagnoses if provided
          if (data.updated_differential) {
            console.log('🔄 Updating differential diagnoses from second interview')
            const parsedUpdatedDiagnoses = parseDifferentialDiagnoses(data.updated_differential)
            
            setDiagnosisData(prev => ({
              ...prev,
              ...data.updated_differential,
              differential_diagnoses: parsedUpdatedDiagnoses
            }))
          }
          
          // Generate final report after 10 user messages in Round 2
          if (newRound2Count === 10 && !finalReportData) {
            console.log('📋 Triggering final report generation after 10 Round 2 messages')
            setTimeout(() => {
              generateAndDisplayFinalReport()
            }, 1000)
          }
        } else {
          // For Round 1, save the regular conversation ID
          if (data.conversation_id && data.conversation_id !== conversationId) {
            setConversationId(data.conversation_id)
          }
        }
        
        // Update report if provided
        let updatedReport = report
        if (data.updated_report) {
          setReport(data.updated_report)
          updatedReport = data.updated_report
        }
        
        // Check if we've reached 15 doctor questions and trigger round 2
        if (newCount === 13 && !isRound2) {
          const fullHistory = [...newMessages, doctorResponse].map(msg => ({
            role: msg.sender === 'doctor' ? 'assistant' : 'user',
            content: msg.text
          }))
          await triggerRound2(fullHistory, updatedReport)
        }
      } else {
        setMessages([...newMessages, {
          id: newMessages.length + 1,
          sender: 'doctor',
          text: data.error || 'I apologize, but I encountered an issue processing your message. Could you please try again?'
        }])
      }

    } catch (error) {
      console.error('Error calling interview API:', error)
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        sender: 'doctor',
        text: 'I apologize, but I\'m having trouble connecting to the system. Please ensure the backend is running and try again.'
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  return (
    <div className="app-container">
      <CacheIndicator 
        show={showCacheIndicator} 
        message="Interview restored from cache" 
      />
      
      <div className="interview-nav">
        <button onClick={handleBackToPatients} className="nav-back-btn">
          ← Back to Patients
        </button>
        <div className="nav-right">
          {diagnosisData && (
            <>
              <button 
                onClick={() => {
                  console.log('🔬 Toggle diagnosis panel. Current diagnosisData:', diagnosisData)
                  console.log('Differential diagnoses count:', diagnosisData.differential_diagnoses?.length || 0)
                  setShowDiagnosis(!showDiagnosis)
                }} 
                className="diagnosis-toggle-btn"
              >
                {showDiagnosis ? '❌ Hide' : '🔬'} Differential Diagnosis
                {diagnosisData.differential_diagnoses?.length > 0 && 
                  ` (${diagnosisData.differential_diagnoses.length})`
                }
              </button>
              <button 
                onClick={handleFinalReportClick}
                disabled={isTyping}
                className="final-report-btn"
              >
                {finalReportData ? '👁️ View Final Report' : '📋 Generate Final Report'}
              </button>
            </>
          )}
          {patientId && (
            <button onClick={() => navigate(`/patient/${patientId}`)} className="nav-details-btn">
              📄 View Patient Details
            </button>
          )}
          {messages.length > 0 && (
            <button onClick={handleClearInterview} className="clear-interview-btn" title="Clear interview history">
              🗑️ Clear Interview
            </button>
          )}
        </div>
      </div>


      <ChatHeader />
      
      {/* Differential Diagnosis Modal */}
      {showDiagnosis && diagnosisData && (
        <div className="diagnosis-modal-overlay" onClick={() => setShowDiagnosis(false)}>
          <div className="diagnosis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="diagnosis-modal-header">
              <h3>🔬 Differential Diagnosis Data</h3>
              <button onClick={() => setShowDiagnosis(false)} className="close-modal-btn">
                ✕
              </button>
            </div>
            <div className="diagnosis-modal-content">
              {diagnosisData.raw_response ? (
                <>
                  <h4 style={{marginTop: 0, marginBottom: '1rem', color: '#2d3748'}}>Raw Response:</h4>
                  <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>{diagnosisData.raw_response}</pre>
                </>
              ) : (
                <>
                  <h4 style={{marginTop: 0, marginBottom: '1rem', color: '#2d3748'}}>Full Diagnosis Data:</h4>
                  <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>{JSON.stringify(diagnosisData, null, 2)}</pre>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final Report Modal */}
      {showFinalReport && finalReportData && (() => {
        console.log('🎨 Rendering Final Report Modal', {
          showFinalReport,
          hasFinalReportData: !!finalReportData,
          reportKeys: Object.keys(finalReportData || {})
        })
        return (
          <div className="diagnosis-modal-overlay" onClick={() => {
            console.log('🔴 Closing final report modal (overlay click)')
            setShowFinalReport(false)
          }}>
            <div className="diagnosis-modal final-report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="diagnosis-modal-header">
                <h3>📋 Final Medical Report</h3>
                <button onClick={() => {
                  console.log('🔴 Closing final report modal (X button)')
                  setShowFinalReport(false)
                }} className="close-modal-btn">
                  ✕
                </button>
              </div>
              <div className="diagnosis-modal-content final-report-content">
                {(() => {
                  const reportContent = finalReportData.response || finalReportData.final_report || finalReportData.report || finalReportData.raw_response
                  console.log('📄 Report content type:', typeof reportContent)
                  
                  // Convert to string if it's an object
                  const displayContent = typeof reportContent === 'object' 
                    ? JSON.stringify(reportContent, null, 2)
                    : reportContent
                  
                  if (displayContent) {
                    // Convert markdown-style formatting to more readable format
                    const formattedContent = displayContent
                      .split('\n')
                      .map((line) => {
                        // Headers
                        if (line.startsWith('## ')) {
                          return `<h2 class="report-h2">${line.substring(3)}</h2>`
                        }
                        if (line.startsWith('# ')) {
                          return `<h1 class="report-h1">${line.substring(2)}</h1>`
                        }
                        // Bold text
                        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        // Bullet points
                        if (line.trim().startsWith('*   ')) {
                          return `<li class="report-li">${line.substring(4)}</li>`
                        }
                        if (line.trim().startsWith('* ')) {
                          return `<li class="report-li">${line.substring(2)}</li>`
                        }
                        // Numbered lists
                        if (line.match(/^\d+\.\s+/)) {
                          return `<li class="report-li-numbered">${line.replace(/^\d+\.\s+/, '')}</li>`
                        }
                        // Empty lines
                        if (line.trim() === '') {
                          return '<br/>'
                        }
                        // Regular paragraphs
                        return `<p class="report-p">${line}</p>`
                      })
                      .join('\n')
                    
                    return (
                      <div 
                        className="formatted-report" 
                        dangerouslySetInnerHTML={{ __html: formattedContent }}
                      />
                    )
                  } else {
                    return (
                      <>
                        <h4 style={{marginTop: 0, marginBottom: '1rem', color: '#2d3748'}}>Full Report Data:</h4>
                        <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>
                          {JSON.stringify(finalReportData, null, 2)}
                        </pre>
                      </>
                    )
                  }
                })()}
              </div>
            </div>
          </div>
        )
      })()}
      
      <div className="interview-content">
        {/* Left Side - Chat */}
        <div className="chat-section">
          <div className="messages-container">
            <div className="messages-wrapper">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <MessageInput
            disabled={isInitializing || isTyping}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSend={handleSend}
            onKeyPress={handleKeyPress}
          />
        </div>

        {/* Right Side - Report */}
        <div className="report-section">
          <div className="report-header">
            <h3>📋 Medical Report</h3>
          </div>
          <div className="report-content">
            <pre className="report-text">{report}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview
