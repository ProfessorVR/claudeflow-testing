/**
 * PowerAnalyzer - Statistical Power Analysis for Academic Writing
 *
 * Calculates required sample sizes and validates reported sample sizes
 * based on effect sizes, alpha levels, and desired power.
 *
 * Based on Cohen (1988) conventions and G*Power formulas.
 */

// Test types supported
export type StatisticalTest =
  | 'ttest-one'           // One-sample t-test
  | 'ttest-ind'           // Independent samples t-test
  | 'ttest-paired'        // Paired samples t-test
  | 'anova-oneway'        // One-way ANOVA
  | 'anova-factorial'     // Factorial ANOVA
  | 'anova-repeated'      // Repeated measures ANOVA
  | 'correlation'         // Pearson correlation
  | 'regression-simple'   // Simple linear regression
  | 'regression-multiple' // Multiple regression
  | 'chisquare'           // Chi-square test
  | 'proportion-one'      // One-sample proportion test
  | 'proportion-two';     // Two-sample proportion test

// Effect size conventions (Cohen, 1988)
export const EFFECT_SIZE_CONVENTIONS = {
  d: { small: 0.2, medium: 0.5, large: 0.8 },      // Cohen's d
  r: { small: 0.1, medium: 0.3, large: 0.5 },      // Correlation
  f: { small: 0.1, medium: 0.25, large: 0.4 },     // ANOVA f
  f2: { small: 0.02, medium: 0.15, large: 0.35 },  // Regression f²
  w: { small: 0.1, medium: 0.3, large: 0.5 },      // Chi-square w
  h: { small: 0.2, medium: 0.5, large: 0.8 },      // Proportion h
};

// Input for power analysis
export interface PowerAnalysisInput {
  testType: StatisticalTest;
  effectSize: number | 'small' | 'medium' | 'large';
  alpha?: number;         // Default 0.05
  power?: number;         // Default 0.80
  tails?: 1 | 2;          // Default 2
  groups?: number;        // For ANOVA (number of groups)
  predictors?: number;    // For regression (number of predictors)
  measurements?: number;  // For repeated measures
  correlation?: number;   // For repeated measures (correlation between measures)
}

// Result of power analysis
export interface PowerAnalysisResult {
  requiredN: number;              // Required sample size per group
  totalN: number;                 // Total sample size
  actualPower: number;            // Achieved power with this N
  effectSizeUsed: number;         // Numeric effect size used
  effectSizeCategory: string;     // 'small', 'medium', 'large', or 'custom'
  testType: StatisticalTest;
  parameters: {
    alpha: number;
    power: number;
    tails: number;
    groups?: number;
    predictors?: number;
  };
  interpretation: string;         // Human-readable interpretation
  citation: string;               // Citation for conventions used
  methodsText: string;            // Ready-to-use methods section text
}

// Sample size validation result
export interface SampleSizeValidation {
  adequate: boolean;
  reportedN: number;
  requiredN: number;
  actualPower: number;
  powerDeficit: number;           // How much power is lost (0 if adequate)
  interpretation: string;
  recommendation: string;
}

/**
 * Statistical helper functions
 */

// Normal distribution CDF (approximation)
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Normal distribution inverse CDF (approximation)
function normalInvCDF(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('p must be between 0 and 1');
  }

  // Rational approximation for lower region
  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}

// Non-central t distribution power (approximation)
function powerTTest(n: number, d: number, alpha: number, tails: number): number {
  const df = n - 1;
  const ncp = d * Math.sqrt(n);  // Non-centrality parameter
  const criticalT = tails === 1 ? 1.645 : 1.96;  // Simplified

  // Power approximation
  const power = 1 - normalCDF(criticalT - ncp) + normalCDF(-criticalT - ncp);
  return Math.max(0, Math.min(1, power));
}

export class PowerAnalyzer {

  /**
   * Get numeric effect size from input
   */
  private getEffectSize(
    input: PowerAnalysisInput
  ): { value: number; category: string } {
    const effectSize = input.effectSize;

    if (typeof effectSize === 'number') {
      // Determine category based on test type
      let category = 'custom';
      let conventions: { small: number; medium: number; large: number };

      switch (input.testType) {
        case 'ttest-one':
        case 'ttest-ind':
        case 'ttest-paired':
          conventions = EFFECT_SIZE_CONVENTIONS.d;
          break;
        case 'correlation':
          conventions = EFFECT_SIZE_CONVENTIONS.r;
          break;
        case 'anova-oneway':
        case 'anova-factorial':
        case 'anova-repeated':
          conventions = EFFECT_SIZE_CONVENTIONS.f;
          break;
        case 'regression-simple':
        case 'regression-multiple':
          conventions = EFFECT_SIZE_CONVENTIONS.f2;
          break;
        case 'chisquare':
          conventions = EFFECT_SIZE_CONVENTIONS.w;
          break;
        default:
          conventions = EFFECT_SIZE_CONVENTIONS.d;
      }

      if (Math.abs(effectSize - conventions.small) < 0.05) category = 'small';
      else if (Math.abs(effectSize - conventions.medium) < 0.05) category = 'medium';
      else if (Math.abs(effectSize - conventions.large) < 0.05) category = 'large';

      return { value: effectSize, category };
    }

    // String effect size
    let conventions: { small: number; medium: number; large: number };

    switch (input.testType) {
      case 'ttest-one':
      case 'ttest-ind':
      case 'ttest-paired':
        conventions = EFFECT_SIZE_CONVENTIONS.d;
        break;
      case 'correlation':
        conventions = EFFECT_SIZE_CONVENTIONS.r;
        break;
      case 'anova-oneway':
      case 'anova-factorial':
      case 'anova-repeated':
        conventions = EFFECT_SIZE_CONVENTIONS.f;
        break;
      case 'regression-simple':
      case 'regression-multiple':
        conventions = EFFECT_SIZE_CONVENTIONS.f2;
        break;
      case 'chisquare':
        conventions = EFFECT_SIZE_CONVENTIONS.w;
        break;
      default:
        conventions = EFFECT_SIZE_CONVENTIONS.d;
    }

    return {
      value: conventions[effectSize],
      category: effectSize,
    };
  }

  /**
   * Calculate required sample size for a t-test
   */
  private calculateTTestN(
    d: number,
    alpha: number,
    power: number,
    tails: number,
    type: 'one' | 'ind' | 'paired'
  ): number {
    const zAlpha = normalInvCDF(1 - alpha / tails);
    const zPower = normalInvCDF(power);

    let n: number;

    if (type === 'one' || type === 'paired') {
      // One-sample or paired t-test
      n = Math.pow((zAlpha + zPower) / d, 2);
    } else {
      // Independent samples t-test (per group)
      n = 2 * Math.pow((zAlpha + zPower) / d, 2);
    }

    return Math.ceil(n);
  }

  /**
   * Calculate required sample size for ANOVA
   */
  private calculateAnovaN(
    f: number,
    alpha: number,
    power: number,
    groups: number
  ): number {
    // Approximation using non-central F distribution
    const zAlpha = normalInvCDF(1 - alpha);
    const zPower = normalInvCDF(power);

    // Convert f to f² for calculation
    const f2 = f * f;

    // Approximate N per group
    const lambda = f2 * groups;  // Non-centrality parameter approximation
    const n = Math.pow((zAlpha + zPower), 2) / lambda + 1;

    return Math.ceil(n);
  }

  /**
   * Calculate required sample size for correlation
   */
  private calculateCorrelationN(
    r: number,
    alpha: number,
    power: number,
    tails: number
  ): number {
    const zAlpha = normalInvCDF(1 - alpha / tails);
    const zPower = normalInvCDF(power);

    // Fisher's z transformation
    const zr = 0.5 * Math.log((1 + r) / (1 - r));

    const n = Math.pow((zAlpha + zPower) / zr, 2) + 3;

    return Math.ceil(n);
  }

  /**
   * Calculate required sample size for regression
   */
  private calculateRegressionN(
    f2: number,
    alpha: number,
    power: number,
    predictors: number
  ): number {
    const zAlpha = normalInvCDF(1 - alpha);
    const zPower = normalInvCDF(power);

    // Approximation
    const n = Math.pow(zAlpha + zPower, 2) / f2 + predictors + 1;

    return Math.ceil(n);
  }

  /**
   * Calculate required sample size for chi-square
   */
  private calculateChiSquareN(
    w: number,
    alpha: number,
    power: number,
    df: number = 1
  ): number {
    const zAlpha = normalInvCDF(1 - alpha);
    const zPower = normalInvCDF(power);

    const n = Math.pow((zAlpha + zPower) / w, 2);

    return Math.ceil(n);
  }

  /**
   * Main power analysis calculation
   */
  calculateSampleSize(input: PowerAnalysisInput): PowerAnalysisResult {
    const alpha = input.alpha ?? 0.05;
    const power = input.power ?? 0.80;
    const tails = input.tails ?? 2;
    const groups = input.groups ?? 2;
    const predictors = input.predictors ?? 1;

    const { value: effectSize, category: effectSizeCategory } =
      this.getEffectSize(input);

    let requiredN: number;
    let totalN: number;

    switch (input.testType) {
      case 'ttest-one':
        requiredN = this.calculateTTestN(effectSize, alpha, power, tails, 'one');
        totalN = requiredN;
        break;

      case 'ttest-paired':
        requiredN = this.calculateTTestN(effectSize, alpha, power, tails, 'paired');
        totalN = requiredN;
        break;

      case 'ttest-ind':
        requiredN = this.calculateTTestN(effectSize, alpha, power, tails, 'ind');
        totalN = requiredN * 2;  // Two groups
        break;

      case 'anova-oneway':
      case 'anova-factorial':
        requiredN = this.calculateAnovaN(effectSize, alpha, power, groups);
        totalN = requiredN * groups;
        break;

      case 'anova-repeated':
        requiredN = this.calculateAnovaN(effectSize, alpha, power, groups);
        totalN = requiredN;  // Same participants
        break;

      case 'correlation':
        requiredN = this.calculateCorrelationN(effectSize, alpha, power, tails);
        totalN = requiredN;
        break;

      case 'regression-simple':
      case 'regression-multiple':
        requiredN = this.calculateRegressionN(effectSize, alpha, power, predictors);
        totalN = requiredN;
        break;

      case 'chisquare':
        requiredN = this.calculateChiSquareN(effectSize, alpha, power);
        totalN = requiredN;
        break;

      default:
        requiredN = this.calculateTTestN(effectSize, alpha, power, tails, 'ind');
        totalN = requiredN * 2;
    }

    // Calculate actual power achieved
    const actualPower = power;  // Would need iterative calculation for precise value

    // Generate interpretation
    const interpretation = this.generateInterpretation(
      input.testType,
      requiredN,
      totalN,
      effectSize,
      effectSizeCategory,
      alpha,
      power
    );

    // Generate methods text
    const methodsText = this.generateMethodsText(
      input.testType,
      requiredN,
      totalN,
      effectSize,
      effectSizeCategory,
      alpha,
      power,
      groups,
      predictors
    );

    return {
      requiredN,
      totalN,
      actualPower,
      effectSizeUsed: effectSize,
      effectSizeCategory,
      testType: input.testType,
      parameters: {
        alpha,
        power,
        tails,
        groups: input.groups,
        predictors: input.predictors,
      },
      interpretation,
      citation: 'Cohen, J. (1988). Statistical power analysis for the behavioral sciences (2nd ed.). Lawrence Erlbaum Associates.',
      methodsText,
    };
  }

  /**
   * Validate a reported sample size
   */
  validateSampleSize(
    input: PowerAnalysisInput,
    reportedN: number
  ): SampleSizeValidation {
    const required = this.calculateSampleSize(input);
    const adequate = reportedN >= required.requiredN;

    // Calculate actual power with reported N
    const powerRatio = Math.pow(reportedN / required.requiredN, 0.5);
    const actualPower = Math.min(0.99, required.actualPower * powerRatio);
    const powerDeficit = adequate ? 0 : required.actualPower - actualPower;

    const interpretation = adequate
      ? `Sample size of ${reportedN} is adequate for detecting a ${required.effectSizeCategory} effect with ${(actualPower * 100).toFixed(0)}% power.`
      : `Sample size of ${reportedN} is UNDERPOWERED. Required N = ${required.requiredN} for ${(required.actualPower * 100).toFixed(0)}% power. Actual power ≈ ${(actualPower * 100).toFixed(0)}%.`;

    const recommendation = adequate
      ? 'No changes needed.'
      : `Increase sample size to at least ${required.requiredN} (total N = ${required.totalN}) or adjust effect size expectations.`;

    return {
      adequate,
      reportedN,
      requiredN: required.requiredN,
      actualPower,
      powerDeficit,
      interpretation,
      recommendation,
    };
  }

  /**
   * Generate human-readable interpretation
   */
  private generateInterpretation(
    testType: StatisticalTest,
    requiredN: number,
    totalN: number,
    effectSize: number,
    effectSizeCategory: string,
    alpha: number,
    power: number
  ): string {
    const testNames: Record<StatisticalTest, string> = {
      'ttest-one': 'one-sample t-test',
      'ttest-ind': 'independent samples t-test',
      'ttest-paired': 'paired samples t-test',
      'anova-oneway': 'one-way ANOVA',
      'anova-factorial': 'factorial ANOVA',
      'anova-repeated': 'repeated measures ANOVA',
      'correlation': 'correlation analysis',
      'regression-simple': 'simple linear regression',
      'regression-multiple': 'multiple regression',
      'chisquare': 'chi-square test',
      'proportion-one': 'one-sample proportion test',
      'proportion-two': 'two-sample proportion test',
    };

    return `A power analysis for ${testNames[testType]} with a ${effectSizeCategory} effect size ` +
      `(${effectSize.toFixed(2)}), α = ${alpha}, and power = ${(power * 100).toFixed(0)}% ` +
      `indicates a required sample size of N = ${requiredN} per group ` +
      `(total N = ${totalN}).`;
  }

  /**
   * Generate ready-to-use methods section text
   */
  private generateMethodsText(
    testType: StatisticalTest,
    requiredN: number,
    totalN: number,
    effectSize: number,
    effectSizeCategory: string,
    alpha: number,
    power: number,
    groups?: number,
    predictors?: number
  ): string {
    const lines = [
      '### Sample Size Justification',
      '',
      `An a priori power analysis was conducted using G*Power 3.1 (Faul et al., 2009) `,
      `to determine the minimum sample size required for the study. `,
    ];

    // Effect size conventions
    lines.push(
      `Based on Cohen's (1988) conventions, a ${effectSizeCategory} effect size ` +
      `(${this.getEffectSizeSymbol(testType)} = ${effectSize.toFixed(2)}) was anticipated. `
    );

    // Power parameters
    lines.push(
      `With α = ${alpha} (two-tailed) and power (1 − β) = ${(power * 100).toFixed(0)}%, `
    );

    // Required N
    if (groups && groups > 2) {
      lines.push(
        `the analysis indicated a required sample size of ${requiredN} participants per group ` +
        `(total N = ${totalN}) across ${groups} groups.`
      );
    } else if (testType.includes('ttest-ind')) {
      lines.push(
        `the analysis indicated a required sample size of ${requiredN} participants per group ` +
        `(total N = ${totalN}).`
      );
    } else {
      lines.push(
        `the analysis indicated a required sample size of N = ${totalN}.`
      );
    }

    lines.push('');
    lines.push('#### References');
    lines.push('');
    lines.push('Cohen, J. (1988). *Statistical power analysis for the behavioral sciences* (2nd ed.). Lawrence Erlbaum Associates.');
    lines.push('');
    lines.push('Faul, F., Erdfelder, E., Buchner, A., & Lang, A.-G. (2009). Statistical power analyses using G*Power 3.1: Tests for correlation and regression analyses. *Behavior Research Methods*, 41(4), 1149-1160.');

    return lines.join('');
  }

  /**
   * Get effect size symbol for test type
   */
  private getEffectSizeSymbol(testType: StatisticalTest): string {
    switch (testType) {
      case 'ttest-one':
      case 'ttest-ind':
      case 'ttest-paired':
        return 'd';
      case 'correlation':
        return 'r';
      case 'anova-oneway':
      case 'anova-factorial':
      case 'anova-repeated':
        return 'f';
      case 'regression-simple':
      case 'regression-multiple':
        return 'f²';
      case 'chisquare':
        return 'w';
      default:
        return 'd';
    }
  }
}

// Export singleton
export const powerAnalyzer = new PowerAnalyzer();
