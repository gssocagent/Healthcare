import React from 'react';

function ConversationList({ conversations, activeId, onSelect, onCreate, onDelete, isOpen, onClose }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <h1>Healthcare Translation</h1>
            </div>

            <div className="sidebar-actions">
                <button className="new-chat-item" onClick={onCreate}>
                    <span className="plus-icon">+</span> New Conversation
                </button>
            </div>

            <div className="history-header">History</div>

            <div className="conversation-list">
                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`conversation-item ${conv.id === activeId ? 'active' : ''}`}
                        onClick={() => onSelect(conv.id)}
                    >
                        <div className="conversation-item-date">{formatDate(conv.created_at)}</div>
                        <div className="conversation-item-count">
                            {conv.message_count} message{conv.message_count !== 1 ? 's' : ''}
                        </div>
                        <button
                            className="delete-conversation-btn"
                            onClick={(e) => onDelete(e, conv.id)}
                            title="Delete Conversation"
                        >
                            ×
                        </button>
                    </div>
                ))}
                {conversations.length === 0 && (
                    <div className="empty-history">No history yet</div>
                )}
            </div>
        </div>
    );
}

export default ConversationList;
