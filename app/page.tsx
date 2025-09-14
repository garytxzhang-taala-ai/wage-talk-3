'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Calculator, TrendingUp, AlertTriangle } from 'lucide-react'
import { POLICY_OPTIONS, calculateNegotiationPlan, generateChartData, CONSTANTS } from '../lib/calculations'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
import Navbar from '../components/Navbar'
import ExplainTabs from '../components/ExplainTabs'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'home' | 'explain'>('home')
  const [selectedPolicy, setSelectedPolicy] = useState('strong')
  const [workerIdeal, setWorkerIdeal] = useState<number | undefined>(undefined)
  const [workerMinimum, setWorkerMinimum] = useState<number | undefined>(undefined)
  const [negotiationBreakdownCost, setNegotiationBreakdownCost] = useState<number>(8000)
  const [localMinimumWage, setLocalMinimumWage] = useState<number>(2490)
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)

  const handleCalculate = () => {
    // 输入验证
    if (workerMinimum && workerMinimum < localMinimumWage) {
      alert(`工人底线不能低于当地最低工资 ${localMinimumWage} 元`)
      return
    }
    if (workerIdeal && workerIdeal > negotiationBreakdownCost * 1.2) {
      alert(`工人理想工资不能超过谈判破裂成本的1.2倍 (${Math.round(negotiationBreakdownCost * 1.2)} 元)`)
      return
    }
    if (workerMinimum && workerIdeal && workerMinimum >= workerIdeal) {
      alert('工人底线不能高于或等于理想工资')
      return
    }
    
    const calculationResults = calculateNegotiationPlan(
      selectedPolicy, 
      undefined, // customAsk
      negotiationBreakdownCost, 
      localMinimumWage, 
      workerIdeal, 
      workerMinimum
    )
    setResults(calculationResults)
    setShowResults(true)
  }



  interface RiskWarning {
    type: 'error' | 'warning';
    message: string;
  }

  const getRiskWarnings = (): RiskWarning[] => {
    if (!results) return []
    
    const warnings: RiskWarning[] = []
    const { w_WA, w_EMP, w_anchor, coefficients, zopa } = results
    
    if (!zopa.valid || w_WA >= w_EMP) {
      warnings.push({
        type: 'error',
        message: '无交易风险：Plan B过强或目标不相容，建议调整预期或改善备选方案。'
      })
    }
    
    if (Math.abs(w_anchor - w_EMP) < 200) {
      warnings.push({
        type: 'warning', 
        message: '锚点偏高：建议留出更多让步空间以促进谈判。'
      })
    }
    
    if (coefficients.c_nash > 3.2) {
      warnings.push({
        type: 'warning',
        message: '隐含加班强度过高：请注意工作强度的现实性和可持续性。'
      })
    }
    
    return warnings
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            工资谈判助手
          </h1>
          <p className="text-lg text-gray-600">
            基于Nash谈判解决方案的最优工资谈判策略
          </p>
        </div>
        
        <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        {currentPage === 'home' ? (
           <CalculatorPage 
          selectedPolicy={selectedPolicy}
          setSelectedPolicy={setSelectedPolicy}
          workerIdeal={workerIdeal}
          setWorkerIdeal={setWorkerIdeal}
          workerMinimum={workerMinimum}
          setWorkerMinimum={setWorkerMinimum}
          negotiationBreakdownCost={negotiationBreakdownCost}
          setNegotiationBreakdownCost={setNegotiationBreakdownCost}
          localMinimumWage={localMinimumWage}
          setLocalMinimumWage={setLocalMinimumWage}
          results={results}
          setResults={setResults}
          showResults={showResults}
          setShowResults={setShowResults}
          handleCalculate={handleCalculate}
          getRiskWarnings={getRiskWarnings}
        />
         ) : (
           <ExplainTabs 
          negotiationBreakdownCost={negotiationBreakdownCost}
          localMinimumWage={localMinimumWage}
          workerIdeal={workerIdeal}
          workerMinimum={workerMinimum}
        />
         )}
        
        {/* 项目声明 */}
        <div className="text-center mt-12 py-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 space-y-2">
            <p className="font-medium">📝 项目声明</p>
            <p>
              这是一个高中生的作品，模型基于Nash谈判理论构建。
              当前版本未考虑信息不对称、多轮谈判、外部市场波动等复杂情况，
              待后续版本更新完善。
            </p>
            <p className="text-xs text-gray-400">
              仅供学习参考，实际谈判请结合具体情况谨慎决策。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalculatorPage({ 
   selectedPolicy,
   setSelectedPolicy,
   workerIdeal,
   setWorkerIdeal,
   workerMinimum,
   setWorkerMinimum,
   negotiationBreakdownCost,
   setNegotiationBreakdownCost,
   localMinimumWage,
   setLocalMinimumWage,
   results,
   setResults,
   showResults,
   setShowResults,
   handleCalculate,
   getRiskWarnings
 }: {
   selectedPolicy: string
   setSelectedPolicy: (policy: string) => void
   workerIdeal: number | undefined
   setWorkerIdeal: (ideal: number | undefined) => void
   workerMinimum: number | undefined
   setWorkerMinimum: (minimum: number | undefined) => void
   negotiationBreakdownCost: number
   setNegotiationBreakdownCost: (cost: number) => void
   localMinimumWage: number
   setLocalMinimumWage: (wage: number) => void
   results: any
   setResults: (results: any) => void
   showResults: boolean
   setShowResults: (show: boolean) => void
   handleCalculate: () => void
   getRiskWarnings: () => any[]
 }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
      {/* Left Panel - Controls */}
      <div className="space-y-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              政策与工人参数
            </CardTitle>
            <CardDescription>
              选择政策情景并设置工人参数，生成最优谈判方案
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1 space-y-6">
                {/* Policy Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">政策情景选择</Label>
                  <RadioGroup value={selectedPolicy} onValueChange={setSelectedPolicy}>
                    {POLICY_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          {option.label}
                          <span className="text-sm text-muted-foreground ml-2">
                            (β = {option.beta})
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground">
                    💡 β 越小 → 模型越偏向工人侧满意度
                  </p>
                </div>

                {/* Worker Parameters */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="workerIdeal" className="text-base font-medium">
                      工人理想工资 (可选)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="workerIdeal"
                        type="number"
                        placeholder="请输入理想工资"
                        min={localMinimumWage}
                        max={negotiationBreakdownCost * 1.2}
                        step={CONSTANTS.grid_step}
                        value={workerIdeal || ''}
                        onChange={(e) => setWorkerIdeal(e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <span className="text-sm text-muted-foreground">元</span>
                    </div>
                    {workerIdeal && (
                      <p className="text-sm text-muted-foreground">
                        对应加班工资系数：{(workerIdeal / CONSTANTS.base).toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="workerMinimum" className="text-base font-medium">
                      工人底线工资 (可选)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="workerMinimum"
                        type="number"
                        placeholder="请输入底线工资"
                        min={localMinimumWage}
                        max={negotiationBreakdownCost}
                        step={CONSTANTS.grid_step}
                        value={workerMinimum || ''}
                        onChange={(e) => setWorkerMinimum(e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <span className="text-sm text-muted-foreground">元</span>
                    </div>
                    {workerMinimum && (
                      <p className="text-sm text-muted-foreground">
                        对应加班工资系数：{(workerMinimum / CONSTANTS.base).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Plan B Parameters */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Plan B 参数设置</Label>
                  
                  <div className="space-y-3">
                    <Label htmlFor="negotiationBreakdownCost" className="text-sm font-medium">
                      谈判破裂成本 (雇主)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="negotiationBreakdownCost"
                        type="number"
                        placeholder="请输入谈判破裂成本"
                        min={3000}
                        max={15000}
                        step={100}
                        value={negotiationBreakdownCost}
                        onChange={(e) => setNegotiationBreakdownCost(Number(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">元</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="localMinimumWage" className="text-sm font-medium">
                      当地最低工资 (工人)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="localMinimumWage"
                        type="number"
                        placeholder="请输入当地最低工资"
                        min={1500}
                        max={5000}
                        step={10}
                        value={localMinimumWage}
                        onChange={(e) => setLocalMinimumWage(Number(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">元</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    💡 这些参数将映射为效用底线并夹至[0.1, 0.9]区间以确保模型稳定性
                  </p>
                </div>
                  </div>
                  
                  {/* Fox Image */}
                  <div className="flex-shrink-0 flex items-center justify-center w-48 h-48 -ml-8 -mt-4">
                    <img 
                      src="/Generated Image September 14, 2025 - 10_18AM.png" 
                      alt="工资谈判助手" 
                      className="w-40 opacity-80 rounded-lg shadow-sm"
                    />
                  </div>
                </div>

                {/* Calculate Button */}
                <Button onClick={handleCalculate} className="w-full" size="lg">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  生成最优方案
                </Button>
                
                {/* 核心指标解释 */}
                {showResults && results && (
                  <div className={`mt-4 p-4 rounded-lg border-l-4 ${
                    results.hasValidSolution === false 
                      ? 'bg-red-50 border-red-400' 
                      : 'bg-gray-50 border-blue-400'
                  }`}>
                    <h4 className="font-medium text-gray-800 mb-2">
                      {results.hasValidSolution === false ? '❌ 无解情况' : '💡 核心指标解释'}
                    </h4>
                    {results.hasValidSolution === false ? (
                      <div className="text-sm text-red-700 space-y-2">
                        <p><strong>{results.errorMessage}</strong></p>
                        <p>建议：</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>降低工人理想工资期望</li>
                          <li>提高雇主的谈判破裂成本</li>
                          <li>调整政策情景选择</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-700 space-y-2">
                        <p><strong>Nash建议工资 (¥{results.w_nash})</strong>：基于博弈论计算出的最公平工资，让双方的"超出底线的满意度乘积"达到最大。</p>
                        <p><strong>建议锚点价 (¥{results.w_anchor})</strong>：谈判开价建议，通常高于Nash解，为后续让步留出空间。</p>
                        <p><strong>最小可接受 (¥{results.w_WA})</strong>：基于你的Plan B计算，低于这个数就不如不谈判。</p>
                        <p><strong>雇主上限 (¥{results.w_EMP})</strong>：基于雇主Plan B推算，高于这个数雇主可能拒绝。</p>
                        {results.zopa.valid ? (
                          <p><strong>ZOPA区间</strong>：双方都能接受的工资范围，在这个区间内谈判成功率最高。</p>
                        ) : (
                          <p><strong>无ZOPA</strong>：当前条件下双方期望差距太大，建议改善Plan B或调整策略。</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6 flex flex-col">
            {showResults && results ? (
              <>
                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>核心指标</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {results.hasValidSolution === false ? (
                      <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-3xl font-bold text-red-600 mb-2">无解</div>
                        <div className="text-sm text-red-700">{results.errorMessage}</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            ¥{results.w_nash}
                          </div>
                          <div className="text-sm text-gray-600">Nash建议工资</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            ¥{results.w_anchor}
                          </div>
                          <div className="text-sm text-gray-600">建议锚点价</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            ¥{results.w_WA}
                          </div>
                          <div className="text-sm text-gray-600">最小可接受</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            ¥{results.w_EMP}
                          </div>
                          <div className="text-sm text-gray-600">雇主无差异上限</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium mb-2">ZOPA 交易区间</div>
                      {results.zopa.valid ? (
                        <div className="text-lg font-semibold text-green-600">
                          ¥{results.zopa.min} - ¥{results.zopa.max}
                        </div>
                      ) : (
                        <div className="text-lg font-semibold text-red-600">
                          无交易：Plan B 过强或目标不相容
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Chart */}
                <Card className="border-2 border-gradient-to-r from-blue-100 to-purple-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      效用函数可视化分析
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      双方效用曲线与关键谈判节点的动态展示
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-red-500"></div>
                        <span className="text-sm font-medium text-red-700">雇主效用</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-blue-500"></div>
                        <span className="text-sm font-medium text-blue-700">工人效用</span>
                      </div>
                      {results.zopa.valid && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-3 bg-green-200 border border-green-300 rounded"></div>
                          <span className="text-sm font-medium text-green-700">ZOPA区间</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5 bg-green-600"></div>
                        <span className="text-sm font-medium text-green-700">Nash解</span>
                      </div>
                    </div>
                    
                    {/* Chart Container */}
                    <div className="h-[480px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-6 shadow-lg">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">双方效用函数可视化分析</h3>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-gradient-to-r from-red-500 to-red-400 rounded-full"></div>
                            <span className="text-slate-600">雇主效用曲线</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"></div>
                            <span className="text-slate-600">工人效用曲线</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full opacity-60"></div>
                            <span className="text-slate-600">协商区间 (ZOPA)</span>
                          </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height="85%">
                        <LineChart 
                          data={generateChartData(results.u_E0, results.u_W0, negotiationBreakdownCost, workerIdeal, workerMinimum)}
                          margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="employerGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                            </linearGradient>
                            <linearGradient id="workerGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                            </linearGradient>
                            <linearGradient id="employerLine" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#dc2626"/>
                              <stop offset="100%" stopColor="#ef4444"/>
                            </linearGradient>
                            <linearGradient id="workerLine" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#2563eb"/>
                              <stop offset="100%" stopColor="#3b82f6"/>
                            </linearGradient>
                          </defs>
                          
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#cbd5e1" 
                            strokeOpacity={0.4}
                            horizontal={true}
                            vertical={true}
                          />
                          
                          <XAxis 
                            dataKey="wage"
                            type="number"
                            scale="linear"
                            domain={['dataMin', 'dataMax']}
                            interval="preserveStartEnd"
                            tickCount={Math.floor((results.maxWage - results.minWage) / 4000) + 1}
                            tickFormatter={(value) => {
                              return value.toString();
                            }}
                            tick={{ fontSize: 12, fill: '#64748b', fontWeight: '500' }}
                            axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                            tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                            label={{ value: '工资水平 (元)', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fontSize: '13px', fill: '#475569', fontWeight: '600' } }}
                          />
                          
                          <YAxis 
                            domain={[0, 1]} 
                            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                            tick={{ fontSize: 12, fill: '#64748b', fontWeight: '500' }}
                            axisLine={{ stroke: '#94a3b8', strokeWidth: 1.5 }}
                            tickLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                            label={{ value: '效用水平', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '13px', fill: '#475569', fontWeight: '600' } }}
                          />
                          
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                              fontSize: '13px',
                              backdropFilter: 'blur(8px)'
                            }}
                            formatter={(value, name) => {
                              const formattedValue = typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
                              const displayName = name === 'u_E' ? '🏢 雇主效用' : name === 'u_W' ? '👤 工人效用' : name;
                              return [formattedValue, displayName];
                            }}
                            labelFormatter={(wage) => `💰 工资水平: ${wage?.toLocaleString()}`}
                            labelStyle={{ color: '#1e293b', fontWeight: '600', marginBottom: '4px' }}
                          />
                          
                          {/* Utility Area Charts */}
                          <defs>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                              <feMerge> 
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          
                          {/* Utility Floor Reference Lines */}

                          
                          {/* Nash Solution Point */}
                          {results.w_nash && (
                            <ReferenceLine 
                              x={results.w_nash} 
                              stroke="#059669" 
                              strokeWidth={3}
                              strokeOpacity={0.8}
                              label={{ value: `Nash解`, position: 'top', style: { fontSize: '12px', fill: '#059669', fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px' } }}
                            />
                          )}
                          
                          {/* Enhanced Utility Lines with Gradient and Glow */}
                          <Line 
                            type="monotone" 
                            dataKey="u_E" 
                            stroke="url(#employerLine)" 
                            name="u_E" 
                            strokeWidth={4} 
                            dot={false} 
                            activeDot={{ 
                              r: 6, 
                              fill: '#ef4444', 
                              stroke: '#ffffff', 
                              strokeWidth: 3,
                              filter: 'url(#glow)'
                            }}
                            filter="url(#glow)"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="u_W" 
                            stroke="url(#workerLine)" 
                            name="u_W" 
                            strokeWidth={4} 
                            dot={false} 
                            activeDot={{ 
                              r: 6, 
                              fill: '#3b82f6', 
                              stroke: '#ffffff', 
                              strokeWidth: 3,
                              filter: 'url(#glow)'
                            }}
                            filter="url(#glow)"
                          />
                          
                          {/* ZOPA Area with Enhanced Styling */}
                          {results.zopa.valid && (
                            <>
                              <ReferenceArea 
                                x1={results.zopa.min} 
                                x2={results.zopa.max} 
                                fill="url(#zopaGradient)" 
                                fillOpacity={0.2}
                                stroke="#059669"
                                strokeOpacity={0.5}
                                strokeWidth={2}
                                strokeDasharray="8 4"
                              />
                              <defs>
                                <linearGradient id="zopaGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="100%" stopColor="#059669" stopOpacity={0.1}/>
                                </linearGradient>
                              </defs>
                            </>
                          )}
                          
                          {/* Worker Walk-Away and Employer Ceiling Lines */}
                           {results.w_WA && (
                             <ReferenceLine 
                               x={results.w_WA} 
                               stroke="#7c3aed" 
                               strokeWidth={2}
                               strokeDasharray="4 4"
                               strokeOpacity={0.7}
                               label={{ value: `工人底价`, position: 'top', style: { fontSize: '11px', fill: '#7c3aed', fontWeight: '600' } }}
                             />
                           )}
                           {results.w_EMP && (
                             <ReferenceLine 
                               x={results.w_EMP} 
                               stroke="#dc2626" 
                               strokeWidth={2}
                               strokeDasharray="4 4"
                               strokeOpacity={0.7}
                               label={{ value: `雇主上限`, position: 'top', style: { fontSize: '11px', fill: '#dc2626', fontWeight: '600' } }}
                             />
                           )}
                          
                           {/* Aspiration Band Visualization */}
                           {results.aspiration_band && (
                             <ReferenceArea 
                               x1={results.aspiration_band.floor} 
                               x2={results.aspiration_band.top} 
                               fill="#8b5cf6" 
                               fillOpacity={0.1}
                               stroke="#8b5cf6"
                               strokeOpacity={0.3}
                               strokeWidth={1}
                               strokeDasharray="2 2"
                             />
                           )}
                           
                           {/* Anchor Point */}
                           {results.w_anchor && (
                             <ReferenceLine 
                               x={results.w_anchor} 
                               stroke="#8b5cf6" 
                               strokeDasharray="6 3" 
                               strokeWidth={3}
                               strokeOpacity={0.8}
                               label={{ 
                                  value: `建议锚点`, 
                                  position: "bottom", 
                                  offset: 10,
                                  style: { fontSize: '11px', fill: '#8b5cf6', fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: '4px' } 
                                }} 
                             />
                           )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>



                {/* Risk Warnings */}
                {getRiskWarnings().length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="h-5 w-5" />
                        风险提示
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getRiskWarnings().map((warning, index) => (
                          <div 
                            key={index}
                            className={`p-3 rounded-lg ${
                              warning.type === 'error' 
                                ? 'bg-red-50 text-red-700 border border-red-200' 
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}
                          >
                            {warning.message}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">点击"生成最优方案"查看谈判建议</p>
                </CardContent>
              </Card>
            )}
            
          </div>
    </div>
  )
}