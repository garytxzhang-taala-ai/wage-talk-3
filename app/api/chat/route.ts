/// <reference types="node" />
import { NextRequest, NextResponse } from 'next/server'

// 声明全局process对象类型
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DEEPSEEK_API_KEY: string
      DEEPSEEK_BASE_URL: string
    }
  }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatRequest {
  message: string
  history: Message[]
}

export async function POST(request: NextRequest) {
  try {
    const { message, history }: ChatRequest = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }

    // 获取环境变量
    const apiKey = (globalThis as any).process?.env?.DEEPSEEK_API_KEY
    const baseUrl = (globalThis as any).process?.env?.DEEPSEEK_BASE_URL

    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        { error: 'API配置错误' },
        { status: 500 }
      )
    }

    // 构建对话历史
    const conversationHistory = history
      .slice(-10) // 只保留最近10条消息以控制token数量
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

    // 添加系统提示词
    const systemPrompt = {
      role: 'system',
      content: `你是一个专业的AI法务助手，专门帮助解决各种劳动纠纷问题。你的专业领域包括：

工资谈判策略和技巧、劳动合同条款解读和建议、加班费计算和相关法律规定、离职补偿和赔偿标准、劳动争议处理流程、职场权益保护、社保公积金相关问题等。

重要对话原则：
- 采用对话式交流，不要一次性输出大量信息或长篇报告
- 每次回复控制在200字以内，重点突出
- 主动询问用户的具体情况，引导深入对话
- 根据用户回答逐步提供针对性建议
- 用友善、专业但不冗长的语气回答
- 如果问题复杂，分步骤引导用户提供更多信息
- 避免一次性列出所有可能的解决方案，而是先了解用户的具体需求
- 绝对不要使用星号(*)、井号(#)、破折号(-)等格式化符号
- 使用自然的中文表达，避免markdown格式

请始终保持互动性，让用户感受到真正的对话体验。`
    }

    // 构建完整的消息数组
    const messages = [
      systemPrompt,
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // 调用DeepSeek API (流式输出)
    const deepseekResponse = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true
      }),
    })

    if (!deepseekResponse.ok) {
      console.error('DeepSeek API错误:', await deepseekResponse.text())
      return NextResponse.json(
        { error: 'AI服务暂时不可用，请稍后再试' },
        { status: 500 }
      )
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepseekResponse.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }
                
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        } catch (error) {
          console.error('流式处理错误:', error)
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('API路由错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    )
  }
}