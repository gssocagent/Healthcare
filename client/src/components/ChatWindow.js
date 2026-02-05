import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import RoleSelector from './RoleSelector';
import LanguageSelector from './LanguageSelector';
import AudioRecorder from './AudioRecorder';
import ConversationSummary from './ConversationSummary';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { sendMessage, uploadAudio, createSummary, getLanguages } from '../services/api';

const DEFAULT_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese' },
    { code: 'pt', name: 'Portuguese' },
];

function ChatWindow({ conversationId, initialMessages, onToggleSidebar }) {
    const [messages, setMessages] = useState(initialMessages || []);
    const [inputText, setInputText] = useState('');
    const [role, setRole] = useState('doctor');
    const [doctorLanguage, setDoctorLanguage] = useState('en');
    const [patientLanguage, setPatientLanguage] = useState('es');
    const [languages, setLanguages] = useState(DEFAULT_LANGUAGES);
    const [summary, setSummary] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const { messages: wsMessages, clearMessages, isConnected } = useWebSocket(conversationId);
    const { isRecording, audioBlob, startRecording, stopRecording, clearAudio } = useAudioRecorder();

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const data = await getLanguages();
                if (data && data.length > 0) {
                    setLanguages(data);
                }
            } catch (error) {
                console.error('Error fetching languages:', error);
            }
        };
        fetchLanguages();
    }, []);

    useEffect(() => {
        setMessages(initialMessages || []);
        clearMessages();
        setSummary(null);
        setShowSummary(false);
    }, [conversationId, initialMessages, clearMessages]);

    useEffect(() => {
        if (wsMessages.length > 0) {
            const lastWsMessage = wsMessages[wsMessages.length - 1];

            setMessages((prev) => {
                // If we have a temporary message that matches the content/role, replace it? 
                // Hard to match exactly. 
                // Simpler strategy: Dedup by ID. If ID doesn't exist, add it.
                // BUT, we might have 'temp-...' messages. 
                // Ideally, the backend would return a client_id we sent.
                // For now, let's just add the real message. 
                // If we implemented robust optimistic updates, we'd replace the temp one.
                // To avoid duplicates if the temp one stays (it doesn't have the real ID),
                // we'll filter out *old* temp messages or just let them coexist until refresh?
                // Better: Remove any 'isTemp' message that matches the content of the new message.

                const exists = prev.some((m) => m.id === lastWsMessage.id);
                if (exists) return prev;

                // Try to find a matching temp message to remove (simple heuristic)
                const tempMatchIndex = prev.findIndex(m => m.isTemp && m.original_text === lastWsMessage.original_text && m.role === lastWsMessage.role);

                if (tempMatchIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[tempMatchIndex] = lastWsMessage; // Replace temp with real
                    return newMessages;
                }

                return [...prev, lastWsMessage];
            });
        }
    }, [wsMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() && !audioBlob) return;
        if (!conversationId) return;

        setSending(true);
        setError(null);

        // Optimistic Update
        const tempId = 'temp-' + Date.now();
        const optimisticMessage = {
            id: tempId,
            role: role,
            content: inputText, // Assuming text for now, audio is harder to preview optimistically without blob URL
            original_text: inputText,
            translated_text: 'Translating...', // Placeholder
            timestamp: new Date().toISOString(),
            isTemp: true
        };

        if (inputText.trim()) {
            setMessages((prev) => [...prev, optimisticMessage]);
        }

        try {
            let audioPath = null;

            if (audioBlob) {
                const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
                const uploadResult = await uploadAudio(audioFile);
                audioPath = uploadResult.filename;
                clearAudio();
            }

            const sourceLanguage = role === 'doctor' ? doctorLanguage : patientLanguage;
            const targetLanguage = role === 'doctor' ? patientLanguage : doctorLanguage;

            await sendMessage({
                conversation_id: conversationId,
                role: role,
                original_text: inputText,
                source_language: sourceLanguage,
                target_language: targetLanguage,
                audio_path: audioPath,
            });

            setInputText('');
        } catch (error) {
            console.error('Error sending message:', error);
            setError("Failed to send message. Please try again.");
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setLoading(false);
            setSending(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!conversationId) return;
        setLoading(true);
        try {
            const result = await createSummary(conversationId);
            setSummary(result);
            setShowSummary(true);
        } catch (error) {
            console.error('Error generating summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            <div className="chat-header">
                <div className="header-branding">
                    HealthcareTranslator
                    <span
                        className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
                        title={isConnected ? "Connected to server" : "Disconnected from server"}
                    ></span>
                </div>
                <div className="role-language-controls">
                    <RoleSelector role={role} onChange={setRole} />
                    <LanguageSelector
                        label="Doctor"
                        language={doctorLanguage}
                        languages={languages}
                        onChange={setDoctorLanguage}
                    />
                    <LanguageSelector
                        label="Patient"
                        language={patientLanguage}
                        languages={languages}
                        onChange={setPatientLanguage}
                    />
                </div>
                <div className="header-actions">
                    <button className="header-btn primary" onClick={handleGenerateSummary} disabled={loading || !conversationId}>
                        Generate Summary
                    </button>
                    <button className="mobile-menu-btn" onClick={onToggleSidebar}>
                        ☰
                    </button>
                </div>
            </div>

            {!conversationId ? (
                <div className="empty-state">Select or create a conversation to start</div>
            ) : (
                <>
                    <div className="chat-messages">
                        {error && <div className="error-banner">{error}</div>}
                        {messages.length === 0 ? (
                            <div className="empty-state">No messages yet. Start the conversation.</div>
                        ) : (
                            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                        )}
                        {sending && (
                            <div className={`message ${role}`}>
                                <div className="message-header">{role}</div>
                                <div className="message-bubble" style={{ opacity: 0.7 }}>
                                    <div className="message-original">Translating...</div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {showSummary && summary && (
                        <ConversationSummary summary={summary} onClose={() => setShowSummary(false)} />
                    )}

                    <div className="chat-input-area">
                        <div className="chat-input-container">
                            <textarea
                                className="chat-input"
                                placeholder={`Type your message as ${role}...`}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                rows={1}
                            />
                            <AudioRecorder
                                isRecording={isRecording}
                                onStart={startRecording}
                                onStop={stopRecording}
                            />
                            <button className="send-btn" onClick={handleSend} disabled={loading || (!inputText.trim() && !audioBlob)}>
                                Send
                            </button>
                        </div>
                        {audioBlob && (
                            <div style={{ marginTop: '8px', fontSize: '14px' }}>
                                Audio recorded. Click Send to include it with your message.
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}

export default ChatWindow;
