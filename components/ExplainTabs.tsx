'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { BookOpen, GraduationCap, Calculator, Target, AlertCircle } from 'lucide-react'

interface ExplainTabsProps {
  negotiationBreakdownCost?: number;
  localMinimumWage?: number;
  workerIdeal?: number;
  workerMinimum?: number;
}

export default function ExplainTabs({ 
  negotiationBreakdownCost, 
  localMinimumWage, 
  workerIdeal, 
  workerMinimum 
}: ExplainTabsProps = {}) {
  const [activeTab, setActiveTab] = useState<'simple' | 'complete'>('simple')

  const CompleteExplanation = () => (
    <div className="space-y-6">
      {/* 基础参数与锚点 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            基础参数与锚点设定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">工资锚点</h4>
              <div className="text-sm space-y-1">
                <p>• 底薪基准：base = 2500 元</p>
                <p>• 实际工资：w = base × c（c为加班工资系数）</p>
                <p>• 可行区间：[3500, 7000] 元</p>
                <p>• 计算步长：50 元</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">满意度锚点</h4>
              <div className="text-sm space-y-1">
                <p>• 雇主理想：w_E_ideal = 2500（满意度=1.0）</p>
                <p>• 雇主上限：w_E_max = 用户设置的谈判破裂成本{negotiationBreakdownCost ? `（${negotiationBreakdownCost} 元）` : ''}（满意度=0.1）</p>
                <p className="text-xs text-blue-600 ml-4">💡 实际心理上限会低于破裂成本，如8000元破裂成本对应约7500元心理承受上限</p>
                <p>• 工人底线：w_W_min = 用户设置的工人底线工资{workerMinimum ? `（${workerMinimum} 元）` : ''}（满意度=0.1）</p>
                <p>• 工人理想：w_W_ideal = 用户设置的工人理想工资{workerIdeal ? `（${workerIdeal} 元）` : ''}（满意度=1.0）</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan B 映射 */}
      <Card>
        <CardHeader>
          <CardTitle>Plan B 效用底线映射</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">映射公式</h4>
            <div className="font-mono text-sm space-y-1">
              <p>u_E0_raw = 0.1 + 0.9 × (w_E_max - 雇主Plan B成本) / (w_E_max - w_E_ideal)</p>
              <p>u_W0_raw = 0.1 + 0.9 × (工人Plan B收入 - w_W_min) / (w_W_ideal - w_W_min)</p>
              <p>u_E0 = clamp(u_E0_raw, 0.1, 0.9)</p>
              <p>u_W0 = clamp(u_W0_raw, 0.1, 0.9)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Badge variant="outline" className="mb-2">雇主Plan B</Badge>
              <p className="text-sm">成本：用户设置的谈判破裂成本{negotiationBreakdownCost ? `（${negotiationBreakdownCost} 元）` : ''} → 计算得出u_E0</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">工人Plan B</Badge>
              <p className="text-sm">收入：用户设置的当地最低工资{localMinimumWage ? `（${localMinimumWage} 元）` : ''} → 计算得出u_W0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nash 目标函数 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nash谈判目标函数
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">优化目标</h4>
            <div className="font-mono text-lg text-center">
              max F(w) = (u_E(w) - u_E0)^β × (u_W(w) - u_W0)^(1-β)
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              在可行区间内寻找使目标函数最大的工资 w*
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">效用函数</h4>
            <div className="font-mono text-sm space-y-1">
              <p>u_E(w) = clamp(0.1 + 0.9 × (w_E_max - w) / (w_E_max - w_E_ideal), 0, 1)</p>
              <p>u_W(w) = clamp(0.1 + 0.9 × (w - w_W_min) / (w_W_ideal - w_W_min), 0, 1)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 闭式解推导 */}
      <Card>
        <CardHeader>
          <CardTitle>关键点位闭式解</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">工人底线 w_WA</h4>
              <div className="text-sm">
                <p>求解：u_W(w_WA) = u_W0</p>
                <div className="font-mono bg-gray-50 p-2 rounded mt-1">
                  w_WA = 工人底线{workerMinimum ? `（${workerMinimum}）` : ''} + ((u_W0 - 0.1)/0.9) × (工人理想{workerIdeal ? `（${workerIdeal}）` : ''} - 工人底线{workerMinimum ? `（${workerMinimum}）` : ''})
                </div>
                <p className="text-gray-600">基于用户填写的工人参数计算</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">雇主上限 w_EMP</h4>
              <div className="text-sm">
                <p>求解：u_E(w_EMP) = u_E0</p>
                <div className="font-mono bg-gray-50 p-2 rounded mt-1">
                  w_EMP = 谈判破裂成本{negotiationBreakdownCost ? `（${negotiationBreakdownCost}）` : ''} - ((u_E0 - 0.1)/0.9) × (谈判破裂成本{negotiationBreakdownCost ? `（${negotiationBreakdownCost}）` : ''} - 2500)
                </div>
                <p className="text-gray-600">基于用户设置的谈判破裂成本计算雇主心理承受上限</p>
                <p className="text-xs text-blue-600 mt-1">💡 例如：破裂成本8000元时，雇主心理上限约为7500元，反映其在正常谈判中的真实承受能力</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ZOPA 解释 */}
      <Card>
        <CardHeader>
          <CardTitle>ZOPA 交易区间</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm">
              <strong>ZOPA (Zone of Possible Agreement)</strong> 是双方都能接受的工资区间：
            </p>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="font-mono">ZOPA = [max(可行下限, w_WA), min(谈判破裂成本, w_EMP)]</p>
            </div>
            <div className="text-sm space-y-1">
              <p>• 下界：工人最低可接受工资</p>
              <p>• 上界：雇主最高愿意支付工资</p>
              <p>• 若 ZOPA 为空（下界 &gt; 上界），则无交易可能</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 政策影响 */}
      <Card>
        <CardHeader>
          <CardTitle>四档政策对β的影响</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="font-medium">一般保护</div>
              <div className="text-sm text-gray-600">市场主导</div>
              <div className="font-mono text-lg">β = 0.48</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="font-medium">中度保护</div>
              <div className="text-sm text-gray-600">偏向工人</div>
              <div className="font-mono text-lg">β = 0.42</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-medium">较强保护</div>
              <div className="text-sm text-gray-600">集体谈判</div>
              <div className="font-mono text-lg">β = 0.35</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-medium">强保护</div>
              <div className="text-sm text-gray-600">强工会/监管</div>
              <div className="font-mono text-lg">β = 0.28</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            💡 β 越小，Nash解越偏向工人利益；β 越大，越偏向雇主利益
          </p>
        </CardContent>
      </Card>

      {/* 可解性护栏 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            可解性护栏机制
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">无解情况</h4>
              <p className="text-sm mb-2">当整个可行区间内都满足以下条件之一时，Nash解不存在：</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• 所有 w 都有 u_E(w) ≤ u_E0（雇主效用不足）</li>
                <li>• 所有 w 都有 u_W(w) ≤ u_W0（工人效用不足）</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">修复策略</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-sm">调整政策</div>
                  <div className="text-xs text-gray-600">选择更有利于工人的β值</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="font-medium text-sm">改善Plan B</div>
                  <div className="text-xs text-gray-600">提升备选方案质量</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="font-medium text-sm">放宽锚点</div>
                  <div className="text-xs text-gray-600">调整满意度参考点</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const SimpleExplanation = () => (
    <div className="space-y-6">
      {/* 什么是博弈论 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            什么是博弈论？
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm">
              博弈论就像是研究"聪明人之间如何做决定"的学问。想象你和朋友一起分蛋糕，
              你们都想要更大的那块，但又不想闹翻——博弈论就是研究这种情况的。
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🎯 核心思想</h4>
              <p className="text-sm">
                每个人都想要对自己最好的结果，但最终的结果取决于所有人的选择。
                聪明的策略是找到一个"大家都还算满意"的平衡点。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nash谈判解 */}
      <Card>
        <CardHeader>
          <CardTitle>Nash谈判解：找到双赢的平衡点</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>John Nash</strong>（电影《美丽心灵》的主角）发现了一个神奇的公式，
                能找到让双方都比较满意的解决方案。
              </p>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">🤝 基本原理</h4>
                <div className="text-sm space-y-2">
                  <p>1. <strong>满意度</strong>：每个人对不同结果的满意程度（0-1分）</p>
                  <p>2. <strong>底线</strong>：如果谈判失败，各自能得到的最低保障</p>
                  <p>3. <strong>增益</strong>：比底线多得到的好处</p>
                  <p>4. <strong>平衡</strong>：找到让"双方增益的乘积"最大的点</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🍰 分蛋糕的例子</h4>
              <p className="text-sm">
                假设你和朋友分一个10块的蛋糕。如果谈判失败，你们各自只能得到3块。
                Nash解会找到一个分法，让你们比各得3块都要开心，而且这个开心程度的"乘积"是最大的。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 工资谈判中的应用 */}
      <Card>
        <CardHeader>
          <CardTitle>在工资谈判中的应用</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">👨‍💼 雇主的想法</h4>
                <div className="text-sm space-y-1">
                  <p>• 工资越低越开心（节省成本）</p>
                  <p>• 但太低了招不到好员工</p>
                  <p>• 底线：重新招人的成本</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">👨‍💻 工人的想法</h4>
                <div className="text-sm space-y-1">
                  <p>• 工资越高越开心（改善生活）</p>
                  <p>• 但要求太高可能丢工作</p>
                  <p>• 底线：找其他工作的收入</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">⚖️ Nash解的智慧</h4>
              <p className="text-sm">
                Nash解不是简单的"中间价"，而是考虑了双方的满意度曲线和底线，
                找到一个让双方"超出底线的开心程度乘积"最大的工资。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 政策的影响 */}
      <Card>
        <CardHeader>
          <CardTitle>政策如何影响谈判？</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              政策就像谈判桌上的"规则"，决定了天平偏向哪一方。
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">市场主导政策</div>
                  <div className="text-xs text-gray-600">雇主话语权更大，Nash解偏向雇主</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">强保护政策</div>
                  <div className="text-xs text-gray-600">工人权益受保护，Nash解偏向工人</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🎛️ β参数的作用</h4>
              <p className="text-sm">
                β就像一个"偏向调节器"：
                <br />• β大（接近1）→ 更重视雇主的满意度
                <br />• β小（接近0）→ 更重视工人的满意度
                <br />• β=0.5 → 完全公平，双方地位相等
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 实际应用建议 */}
      <Card>
        <CardHeader>
          <CardTitle>💡 实际谈判建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">📊 准备工作</h4>
                <div className="text-sm space-y-1">
                  <p>• 了解自己的底线（Plan B）</p>
                  <p>• 研究对方可能的底线</p>
                  <p>• 评估当前的政策环境</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🎯 谈判策略</h4>
                <div className="text-sm space-y-1">
                  <p>• 用Nash解作为目标价位</p>
                  <p>• 适当高于Nash解开价（锚点）</p>
                  <p>• 绝不低于自己的底线</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🌟 核心思想</h4>
              <p className="text-sm">
                好的谈判不是"你死我活"，而是"合作共赢"。
                Nash解帮你找到一个科学、公平、双方都能接受的平衡点。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'simple' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('simple')}
          className="flex-1"
        >
          <GraduationCap className="h-4 w-4 mr-2" />
          通俗解释
        </Button>
        <Button
          variant={activeTab === 'complete' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('complete')}
          className="flex-1"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          完整解释
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'simple' ? <SimpleExplanation /> : <CompleteExplanation />}
    </div>
  )
}