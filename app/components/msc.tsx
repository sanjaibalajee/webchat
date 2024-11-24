'use client'

import React, { useState } from 'react'
import { Send, Bot, User, Download, RefreshCw } from 'lucide-react'
import { MLCEngine } from "@mlc-ai/web-llm"
import { ChatUI } from "../utils/chat_ui"

type Message = {
  kind: 'user' | 'assistant' | 'system' | 'init'
  text: string
  timestamp: Date
  id: string
}

const ChatComponent = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState("")
  const [runtimeStats, setRuntimeStats] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chat_ui] = useState(new ChatUI(new MLCEngine()))
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const updateMessage = (kind: string, text: string, append: boolean) => {
    if (kind === 'assistant') {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.kind === 'user' && lastMessage.text === text) {
        return
      }
    }

    const newMessage: Message = {
      kind: kind as Message['kind'],
      text: kind === "init" ? "[System Initialize] " + text : text,
      timestamp: new Date(),
      id: generateMessageId()
    }

    setMessages(prevMessages => {
      if (prevMessages.length === 0 || append) {
        return [...prevMessages, newMessage]
      } else {
        const updatedMessages = [...prevMessages]
        updatedMessages[updatedMessages.length - 1] = newMessage
        return updatedMessages
      }
    })
  }

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setIsLoading(true)

    const userMessage: Message = {
      kind: 'user',
      text: prompt,
      timestamp: new Date(),
      id: generateMessageId()
    }
    setMessages(prev => [...prev, userMessage])
    setPrompt("")

    try {
      await chat_ui.onGenerate(prompt, updateMessage, setRuntimeStats)
    } catch (error) {
      console.error('Error generating response:', error)
      updateMessage('system', 'Error generating response', true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-content">
        {/* Header */}
        <div className="chat-header">
          <div className="flex items-center space-x-3">
            <div className="header-icon-container">
              <Bot className="text-white" size={24} />
            </div>
            <h1 className="header-title">AI Assistant</h1>
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="menu-button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex space-y-2 md:space-y-0 md:space-x-3 absolute right-0 top-14 md:relative md:top-0 menu-content`}>
              <button
                onClick={() => {
                  chat_ui.asyncInitChat(updateMessage).catch((error) => {
                    console.error('Init error:', error)
                    updateMessage('system', 'Error initializing chat', true)
                  })
                  setIsMenuOpen(false)
                }}
                className="menu-action-button"
              >
                <Download size={16} />
                <span className="font-medium">Download Model</span>
              </button>
              <button
                onClick={() => {
                  chat_ui
                    .onReset(() => {
                      setMessages([])
                    })
                    .catch((error) => {
                      console.error('Reset error:', error)
                      updateMessage('system', 'Error resetting chat', true)
                    })
                  setIsMenuOpen(false)
                }}
                className="menu-action-button"
              >
                <RefreshCw size={16} />
                <span className="font-medium">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.kind === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`message-bubble ${
                  message.kind === 'user'
                    ? 'flex-row-reverse space-x-reverse'
                    : 'flex-row'
                }`}
              >
                <div
                  className={`message-icon-container ${
                    message.kind === 'user'
                      ? 'user-icon-container'
                      : message.kind === 'assistant'
                      ? 'assistant-icon-container'
                      : 'system-icon-container'
                  }`}
                >
                  {message.kind === 'user' ? (
                    <User size={20} className="text-indigo-600" />
                  ) : (
                    <Bot size={20} className="text-violet-600" />
                  )}
                </div>
                <div
                  className={`message-content ${
                    message.kind === 'user'
                      ? 'user-message'
                      : message.kind === 'assistant'
                      ? 'assistant-message'
                      : 'system-message'
                  }`}
                >
                  <p className="message-text">{message.text}</p>
                  <span className={`message-timestamp ${
                    message.kind === 'user'
                      ? 'user-timestamp'
                      : 'assistant-timestamp'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="loading-container">
              <div className="loading-bubble">
                <div className="loading-dots">
                  <div className="loading-dot" />
                  <div className="loading-dot delay-100" />
                  <div className="loading-dot delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </div>
          {runtimeStats && (
            <div className="runtime-stats">{runtimeStats}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatComponent