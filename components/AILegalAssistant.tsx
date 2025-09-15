'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function AILegalAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // 初始化消息，避免hydration不匹配
    if (!isInitialized) {
      setMessages([{
        id: 'initial-1',
        role: 'assistant',
        content: '您好！我是AI法务助手，专门帮助解决各种劳动纠纷问题。您可以向我咨询工资谈判、劳动合同、加班费计算、离职补偿等相关法律问题。请问有什么可以帮助您的吗？',
        timestamp: new Date().toLocaleTimeString()
      }])
      setIsInitialized(true)
    }
  }, [isInitialized])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          history: messages
        }),
      })

      if (!response.ok) {
        throw new Error('网络请求失败')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || '抱歉，我现在无法回答您的问题，请稍后再试。',
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，发生了网络错误，请检查网络连接后重试。',
        timestamp: new Date().toLocaleTimeString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI法务助手
        </CardTitle>
        <p className="text-sm text-gray-600">
          专业的劳动法律咨询助手，为您解答工资谈判、劳动纠纷等相关问题
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-green-500 text-white'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`inline-block p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-white border shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">正在思考中...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入框 */}
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入您的法律问题..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* 提示信息 */}
        <div className="mt-2 text-xs text-gray-500">
          💡 提示：您可以询问工资谈判策略、劳动合同条款、加班费计算、离职补偿等问题
        </div>
      </CardContent>
    </Card>
  )
}