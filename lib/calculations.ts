// 常量定义
export const CONSTANTS = {
  base: 2500,
  w_E_ideal: 2500,
  w_E_max: 8000,
  w_W_min: 3500,
  w_W_ideal: 8000,
  feasible_min: 3500,
  feasible_max: 8000,
  grid_step: 1500,
  employer_fallback_cost_money: 6000,
  worker_fallback_income_money: 2490
};

// 政策情景映射
export const POLICY_OPTIONS = [
  { label: "一般保护（市场主导）", value: "market", beta: 0.48 },
  { label: "中度保护（偏向工人）", value: "moderate", beta: 0.42 },
  { label: "较强保护（集体谈判）", value: "strong", beta: 0.35 },
  { label: "强保护（强工会/强监管）", value: "strongest", beta: 0.28 }
];

// 夹逼函数
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 四舍五入到最近的步长
function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

// 计算Plan B映射的效用底线
export function calculateUtilityFloors(negotiationBreakdownCost?: number, localMinimumWage?: number, workerIdeal?: number, workerMinimum?: number) {
  const { w_E_ideal } = CONSTANTS;
  
  // 使用动态参数或默认值
  const w_E_max = negotiationBreakdownCost || CONSTANTS.w_E_max;
  const employer_fallback_cost = negotiationBreakdownCost || CONSTANTS.employer_fallback_cost_money;
  const worker_fallback_income = localMinimumWage || CONSTANTS.worker_fallback_income_money;
  const w_W_min = workerMinimum || CONSTANTS.w_W_min;
  const w_W_ideal = workerIdeal || CONSTANTS.w_W_ideal;
  
  const uE0_raw = 0.1 + 0.9 * (w_E_max - employer_fallback_cost) / (w_E_max - w_E_ideal);
  const uW0_raw = 0.1 + 0.9 * (worker_fallback_income - w_W_min) / (w_W_ideal - w_W_min);
  
  const u_E0 = clamp(uE0_raw, 0.1, 0.9);
  const u_W0 = clamp(uW0_raw, 0.1, 0.9);
  
  return { u_E0, u_W0 };
}

// 雇主效用函数
export function utilityEmployer(w: number, negotiationBreakdownCost?: number): number {
  const { w_E_ideal } = CONSTANTS;
  const w_E_max = negotiationBreakdownCost || CONSTANTS.w_E_max;
  return clamp(0.1 + 0.9 * (w_E_max - w) / (w_E_max - w_E_ideal), 0, 1);
}

// 工人效用函数
export function utilityWorker(w: number, workerIdeal?: number, workerMinimum?: number): number {
  const w_W_min = workerMinimum || CONSTANTS.w_W_min;
  const w_W_ideal = workerIdeal || CONSTANTS.w_W_ideal;
  return clamp(0.1 + 0.9 * (w - w_W_min) / (w_W_ideal - w_W_min), 0, 1);
}

// Nash谈判解
export function calculateNashSolution(beta: number, u_E0: number, u_W0: number, negotiationBreakdownCost?: number, workerIdeal?: number, workerMinimum?: number): number | null {
  const { feasible_min, grid_step } = CONSTANTS;
  // 动态调整搜索上限，考虑用户输入的参数
  const w_E_max = negotiationBreakdownCost || CONSTANTS.w_E_max;
  const w_W_ideal = workerIdeal || CONSTANTS.w_W_ideal;
  const dynamicMax = Math.max(CONSTANTS.feasible_max, w_E_max, w_W_ideal);
  
  let bestWage = feasible_min;
  let maxObjective = -Infinity;
  let hasValidSolution = false;
  
  for (let w = feasible_min; w <= dynamicMax; w += grid_step) {
    const u_E = utilityEmployer(w, negotiationBreakdownCost);
    const u_W = utilityWorker(w, workerIdeal, workerMinimum);
    
    // 跳过无效区域
    if (u_E <= u_E0 || u_W <= u_W0) continue;
    
    hasValidSolution = true;
    const objective = Math.pow(u_E - u_E0, beta) * Math.pow(u_W - u_W0, 1 - beta);
    
    if (objective > maxObjective) {
      maxObjective = objective;
      bestWage = w;
    } else if (objective === maxObjective) {
      // 如果目标函数相等，选择更接近区间中点的
      const midpoint = (feasible_min + dynamicMax) / 2;
      if (Math.abs(w - midpoint) < Math.abs(bestWage - midpoint)) {
        bestWage = w;
      }
    }
  }
  
  // 如果没有找到有效解，返回null
  if (!hasValidSolution) {
    return null;
  }
  
  return bestWage;
}

// 计算工人底线工资
export function calculateWorkerWalkAway(u_W0: number, workerIdeal?: number, workerMinimum?: number): number {
  const { feasible_min, feasible_max, grid_step } = CONSTANTS;
  const w_W_min = workerMinimum || CONSTANTS.w_W_min;
  const w_W_ideal = workerIdeal || CONSTANTS.w_W_ideal;
  
  const w_WA_raw = w_W_min + ((u_W0 - 0.1) / 0.9) * (w_W_ideal - w_W_min);
  const w_WA_clamped = clamp(w_WA_raw, feasible_min, feasible_max);
  
  return roundToStep(w_WA_clamped, grid_step);
}

// 计算雇主无差异上限
export function calculateEmployerCeiling(u_E0: number, negotiationBreakdownCost?: number): number {
  const { w_E_ideal, feasible_min, grid_step } = CONSTANTS;
  const w_E_max = negotiationBreakdownCost || CONSTANTS.w_E_max;
  
  const w_EMP_raw = w_E_max - ((u_E0 - 0.1) / 0.9) * (w_E_max - w_E_ideal);
  // 雇主上限不应该超过谈判破裂成本，但可以低于feasible_max
  const w_EMP_clamped = clamp(w_EMP_raw, feasible_min, w_E_max);
  
  return roundToStep(w_EMP_clamped, grid_step);
}

// 计算ZOPA
export function calculateZOPA(w_WA: number, w_EMP: number): { min: number; max: number; valid: boolean } {
  const { feasible_min } = CONSTANTS;
  
  const zopa_min = Math.max(feasible_min, w_WA);
  // 不限制ZOPA上限在固定的feasible_max，允许根据w_EMP动态调整
  const zopa_max = w_EMP;
  
  return {
    min: zopa_min,
    max: zopa_max,
    valid: zopa_min <= zopa_max
  };
}

// 计算工人锚点价格
export function calculateWorkerAnchor(w_nash: number, w_EMP: number): number {
  const { grid_step } = CONSTANTS;
  
  const w_anchor_raw = Math.min(w_nash + 0.08 * (w_EMP - w_nash), w_EMP);
  return roundToStep(w_anchor_raw, grid_step);
}

// 计算期望区间
export function calculateAspirationBand(w_nash: number, w_WA: number, w_EMP: number): { top: number; floor: number } {
  const { grid_step } = CONSTANTS;
  
  const w_top_raw = Math.min(w_nash + 0.15 * (w_EMP - w_WA), w_EMP);
  const w_floor_raw = Math.max(w_WA, w_nash - 0.05 * (w_nash - w_WA));
  
  return {
    top: roundToStep(w_top_raw, grid_step),
    floor: roundToStep(w_floor_raw, grid_step)
  };
}

// 主计算函数
export function calculateNegotiationPlan(policyValue: string, customAsk?: number, negotiationBreakdownCost?: number, localMinimumWage?: number, workerIdeal?: number, workerMinimum?: number) {
  const policy = POLICY_OPTIONS.find(p => p.value === policyValue) || POLICY_OPTIONS[2];
  const beta = policy.beta;
  
  const { u_E0, u_W0 } = calculateUtilityFloors(negotiationBreakdownCost, localMinimumWage, workerIdeal, workerMinimum);
  
  const w_WA = calculateWorkerWalkAway(u_W0, workerIdeal, workerMinimum);
  const w_EMP = calculateEmployerCeiling(u_E0, negotiationBreakdownCost);
  const zopa = calculateZOPA(w_WA, w_EMP);
  
  const w_nash = calculateNashSolution(beta, u_E0, u_W0, negotiationBreakdownCost, workerIdeal, workerMinimum);
  
  // 检查是否有Nash解
  if (w_nash === null) {
    return {
      policy,
      beta,
      u_E0,
      u_W0,
      w_nash: null,
      w_anchor: null,
      w_WA,
      w_EMP,
      zopa,
      aspirationBand: null,
      coefficients: {
        c_nash: null,
        c_anchor: null,
        c_ask: customAsk ? customAsk / CONSTANTS.base : undefined
      },
      customAsk,
      hasValidSolution: false,
      errorMessage: "工资期望过高，雇主效用不足，Nash解不存在"
    };
  }
  
  const w_anchor = calculateWorkerAnchor(w_nash, w_EMP);
  const aspirationBand = calculateAspirationBand(w_nash, w_WA, w_EMP);
  
  // 转换为加班系数
  const c_nash = w_nash / CONSTANTS.base;
  const c_anchor = w_anchor / CONSTANTS.base;
  const c_ask = customAsk ? customAsk / CONSTANTS.base : undefined;
  
  return {
    policy,
    beta,
    u_E0,
    u_W0,
    w_nash,
    w_anchor,
    w_WA,
    w_EMP,
    zopa,
    aspirationBand,
    coefficients: {
      c_nash,
      c_anchor,
      c_ask
    },
    customAsk,
    hasValidSolution: true
  };
}

// 图表数据类型
export interface ChartDataPoint {
  wage: number;
  u_E: number;
  u_W: number;
  nashProduct: number;
}

// 生成图表数据
export function generateChartData(u_E0: number, u_W0: number, negotiationBreakdownCost?: number, workerIdeal?: number, workerMinimum?: number): ChartDataPoint[] {
  const { grid_step } = CONSTANTS;
  // 从工人底线开始显示图表
  const w_W_min = workerMinimum || CONSTANTS.w_W_min;
  const chartMin = w_W_min;
  
  // 动态调整图表数据范围
  const w_E_max = negotiationBreakdownCost || CONSTANTS.w_E_max;
  const w_W_ideal = workerIdeal || CONSTANTS.w_W_ideal;
  const dynamicMax = Math.max(CONSTANTS.feasible_max, w_E_max, w_W_ideal);
  const data: ChartDataPoint[] = [];
  
  for (let w = chartMin; w <= dynamicMax; w += grid_step) {
    const u_E = utilityEmployer(w, negotiationBreakdownCost);
    const u_W = utilityWorker(w, workerIdeal, workerMinimum);
    
    data.push({
      wage: w,
      u_E,
      u_W,
      nashProduct: (u_E > u_E0 && u_W > u_W0) ? (u_E - u_E0) * (u_W - u_W0) : 0
    });
  }
  
  return data;
}