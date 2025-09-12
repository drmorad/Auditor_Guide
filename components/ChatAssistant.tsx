import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { XIcon, ChatBubbleLeftRightIcon } from './icons';

interface ChatAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    history: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

// A simple utility to convert markdown-like syntax to HTML
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\n/g, '<br />'); // New lines
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-2">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-300"></div>
    </div>
);

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ isOpen, onClose, history, onSendMessage, isLoading }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isLoading]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out animate-fade-in-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-assistant-title"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary-500" />
                    <h2 id="chat-assistant-title" className="text-lg font-bold text-slate-800 dark:text-white">AI Assistant</h2>
                </div>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">🤖</div>}
                        <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user'
                            ? 'bg-primary-500 text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                        }`}>
                            <SimpleMarkdown text={msg.text} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">🤖</div>
                        <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 rounded-bl-none">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask about your documents..."
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-primary-500 focus:border-primary-500"
                        aria-label="Your message"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};