import { NextRequest, NextResponse } from 'next/server'

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
    const apiKey = process.env.DEEPSEEK_API_KEY
    const baseUrl = process.env.DEEPSEEK_BASE_URL

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

1. 工资谈判策略和技巧
2. 劳动合同条款解读和建议
3. 加班费计算和相关法律规定
4. 离职补偿和赔偿标准
5. 劳动争议处理流程
6. 职场权益保护
7. 社保公积金相关问题

请用专业、友善的语气回答用户的问题，提供实用的法律建议和解决方案。如果涉及复杂的法律问题，建议用户咨询专业律师。回答要简洁明了，重点突出，便于用户理解。`
    }

    // 构建完整的消息数组
    const messages = [
      systemPrompt,
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    // 调用DeepSeek API
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
        stream: false
      }),
    })

    if (!deepseekResponse.ok) {
      console.error('DeepSeek API错误:', await deepseekResponse.text())
      return NextResponse.json(
        { error: 'AI服务暂时不可用，请稍后再试' },
        { status: 500 }
      )
    }

    const data = await deepseekResponse.json()
    const aiMessage = data.choices?.[0]?.message?.content

    if (!aiMessage) {
      return NextResponse.json(
        { error: 'AI回复异常，请重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: aiMessage,
      success: true
    })

  } catch (error) {
    console.error('API路由错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    )
  }
}