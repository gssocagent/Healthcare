import React, { useState, useEffect } from 'react';
import ConversationList from './components/ConversationList';
import ChatWindow from './components/ChatWindow';

import {
    getConversations,
    createConversation,
    getConversation,
    deleteConversation,

} from './services/api';

function App() {
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [activeConversation, setActiveConversation] = useState(null);
    const [isCreating, setIsCreating] = useState(false);



    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const handleCreateConversation = async () => {
        setIsCreating(true);
        try {
            const newConv = await createConversation();
            setConversations((prev) => [newConv, ...prev]);
            setActiveConversationId(newConv.id);
            setActiveConversation({ ...newConv, messages: [] });

        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectConversation = async (id) => {

        try {
            const conv = await getConversation(id);
            setActiveConversationId(id);
            setActiveConversation(conv);

        } catch (error) {
            console.error('Error fetching conversation:', error);

        }
    };

    const handleDeleteConversation = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this conversation?')) return;

        try {
            await deleteConversation(id);
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (activeConversationId === id) {
                setActiveConversationId(null);
                setActiveConversation(null);
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };



    return (
        <div className="app">
            {isCreating && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Creating new conversation...</p>
                </div>
            )}
            <ConversationList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={handleSelectConversation}
                onCreate={handleCreateConversation}
                onDelete={handleDeleteConversation}
            />
            <div className="main-content">
                <ChatWindow
                    conversationId={activeConversationId}
                    initialMessages={activeConversation?.messages || []}
                />
            </div>
        </div>
    );
}

export default App;
