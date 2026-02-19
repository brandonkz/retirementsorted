/**
 * RetirementSorted — Two-Pot Calculator + RA Tax Saver
 * Updated Feb 2026 — Fixed tax calc, added compound growth, RA saver
 */

// ─── SARS 2025/2026 Marginal Income Tax Brackets ───────────────────────────
// Two-pot savings pot withdrawals are added to income and taxed at marginal rate.
// The R27,500 retirement lump sum exemption does NOT apply to savings pot withdrawals.
const INCOME_TAX_2026 = [
  { min: 0,        max: 237100,   rate: 0.18, base: 0       },
  { min: 237101,   max: 370500,   rate: 0.26, base: 42678   },
  { min: 370501,   max: 512800,   rate: 0.31, base: 77362   },
  { min: 512801,   max: 673000,   rate: 0.36, base: 121475  },
  { min: 673001,   max: 857900,   rate: 0.39, base: 179147  },
  { min: 857901,   max: 1817000,  rate: 0.41, base: 251258  },
  { min: 1817001,  max: Infinity, rate: 0.45, base: 644489  }
];
const PRIMARY_REBATE_2026 = 17235;

// RA contribution limits (SARS 2025/2026)
const RA_MAX_DEDUCTION_RATE = 0.275; // 27.5% of gross remuneration
const RA_MAX_DEDUCTION_RAND = 350000; // Annual rand cap

// Compound growth assumption for future-value projections
const GROWTH_RATE = 0.10; // 10% p.a. (SA equity fund long-run average)

// ─── Tax Calculations ───────────────────────────────────────────────────────

function calculateIncomeTax(annualIncome) {
  if (annualIncome <= 0) return 0;
  for (let b of INCOME_TAX_2026) {
    if (annualIncome <= b.max) {
      const tax = b.base + (annualIncome - b.min) * b.rate;
      return Math.max(0, tax - PRIMARY_REBATE_2026);
    }
  }
  return 0;
}

function getMarginalRate(annualIncome) {
  for (let b of INCOME_TAX_2026) {
    if (annualIncome <= b.max) return b.rate;
  }
  return 0.45;
}

// Tax on withdrawal = tax(salary + withdrawal) - tax(salary)
function calculateWithdrawalTax(annualSalary, withdrawalAmount) {
  return Math.max(0, calculateIncomeTax(annualSalary + withdrawalAmount) - calculateIncomeTax(annualSalary));
}

// Compound future value
function futureValue(presentValue, years, rate) {
  return presentValue * Math.pow(1 + rate, years);
}

// ─── DOM Elements ───────────────────────────────────────────────────────────
const calcForm     = document.getElementById('calc-form');
const resultsDiv   = document.getElementById('results');
const decisionForm = document.getElementById('decision-form');
const decisionResult = document.getElementById('decision-result');

// ─── Main Calculator ────────────────────────────────────────────────────────

let calcTimer;
function scheduleCalculation() {
  clearTimeout(calcTimer);
  calcTimer = setTimeout(calculateWithdrawal, 200);
}

calcForm.querySelectorAll('input').forEach(input => input.addEventListener('input', scheduleCalculation));

document.getElementById('fund-value').addEventListener('input', updateMaxWithdrawalHelper);
document.getElementById('withdrawal-amount').addEventListener('input', validateWithdrawalAmount);

function updateMaxWithdrawalHelper() {
  const fundValue = CalculatorUtils.getCurrencyValue('fund-value');
  const savingsPot = fundValue / 3;
  const maxWithdrawal = savingsPot * 0.1;
  const helper = document.getElementById('max-withdrawal-helper');
  if (fundValue > 0) {
    helper.textContent = `Maximum you can withdraw: R ${fmt(maxWithdrawal)}`;
    helper.style.color = 'var(--color-primary)';
  } else {
    helper.textContent = '';
  }
}

function validateWithdrawalAmount() {
  const fundValue = CalculatorUtils.getCurrencyValue('fund-value');
  const withdrawalAmount = CalculatorUtils.getCurrencyValue('withdrawal-amount');
  const savingsPot = fundValue / 3;
  const maxWithdrawal = savingsPot * 0.1;
  const helper = document.getElementById('max-withdrawal-helper');
  if (withdrawalAmount > maxWithdrawal && fundValue > 0) {
    helper.textContent = `⚠️ Exceeds maximum withdrawal of R ${fmt(maxWithdrawal)}`;
    helper.style.color = 'var(--color-danger)';
  } else if (fundValue > 0) {
    helper.textContent = `Maximum you can withdraw: R ${fmt(maxWithdrawal)}`;
    helper.style.color = 'var(--color-primary)';
  }
}

function calculateWithdrawal() {
  const annualSalary    = CalculatorUtils.getCurrencyValue('annual-salary');
  const fundValue       = CalculatorUtils.getCurrencyValue('fund-value');
  const withdrawalAmount = CalculatorUtils.getCurrencyValue('withdrawal-amount');
  const yearsToRetire   = parseInt(document.getElementById('years-to-retirement').value) || 20;

  if (!annualSalary || !fundValue || !withdrawalAmount) {
    CalculatorUtils.showError('calc-error', 'Please fill in all fields to see your results.');
    resultsDiv.classList.add('hidden');
    return;
  }

  const savingsPot   = fundValue / 3;
  const maxWithdrawal = savingsPot * 0.1;

  if (withdrawalAmount < 2000) {
    CalculatorUtils.showError('calc-error', 'Minimum withdrawal is R2,000.');
    resultsDiv.classList.add('hidden');
    return;
  }

  if (withdrawalAmount > maxWithdrawal) {
    CalculatorUtils.showError('calc-error', `Maximum withdrawal is R ${fmt(maxWithdrawal)} (10% of your savings pot).`);
    resultsDiv.classList.add('hidden');
    return;
  }

  CalculatorUtils.showError('calc-error', '');

  // ── Core calc ──────────────────────────────────────────────────────────────
  const tax           = calculateWithdrawalTax(annualSalary, withdrawalAmount);
  const netAmount     = withdrawalAmount - tax;
  const effectiveRate = withdrawalAmount > 0 ? (tax / withdrawalAmount) * 100 : 0;
  const marginalRate  = getMarginalRate(annualSalary) * 100;

  // Future value of withdrawal if left invested
  const fvAmount = futureValue(withdrawalAmount, yearsToRetire, GROWTH_RATE);

  // ── Display results ────────────────────────────────────────────────────────
  document.getElementById('result-withdrawal').textContent = `R ${fmt(withdrawalAmount)}`;
  document.getElementById('result-tax').textContent        = `-R ${fmt(tax)}`;
  document.getElementById('result-net').textContent        = `R ${fmt(netAmount)}`;

  // Info list
  document.getElementById('result-info-list').innerHTML = `
    <li>Your savings pot: <strong>R ${fmt(savingsPot)}</strong> (1/3 of total fund)</li>
    <li>Maximum annual withdrawal: <strong>R ${fmt(maxWithdrawal)}</strong> (10% of savings pot)</li>
    <li>Your marginal tax rate: <strong>${marginalRate.toFixed(0)}%</strong></li>
    <li>Effective tax on this withdrawal: <strong>${effectiveRate.toFixed(1)}%</strong></li>
    <li>Remaining in savings pot after withdrawal: <strong>R ${fmt(savingsPot - withdrawalAmount)}</strong></li>
  `;

  // True retirement cost card
  const futureCostCard = document.getElementById('future-cost-card');
  if (futureCostCard) {
    futureCostCard.innerHTML = `
      <div class="future-cost-inner">
        <div class="future-cost-icon">📉</div>
        <div class="future-cost-content">
          <div class="future-cost-title">True Cost at Retirement</div>
          <div class="future-cost-amount">R ${fmt(fvAmount)}</div>
          <div class="future-cost-sub">That's what R ${fmt(withdrawalAmount)} invested today could grow to in <strong>${yearsToRetire} years</strong> at 10% p.a.</div>
          <div class="future-cost-context">You receive R ${fmt(netAmount)} now — but give up <strong>R ${fmt(fvAmount - netAmount)}</strong> in future growth.</div>
        </div>
      </div>
    `;
  }

  // Viral card
  document.getElementById('viral-main').textContent    = `R${fmt(netAmount)}`;
  document.getElementById('viral-subtitle').textContent = `After ${effectiveRate.toFixed(1)}% tax`;

  resultsDiv.classList.remove('hidden');
  resultsDiv.style.display = 'block';
  CalculatorUtils.trackCalculatorUse('two-pot');
}

function fmt(num) {
  return Math.round(num).toLocaleString('en-ZA');
}

// ─── Decision Tool ──────────────────────────────────────────────────────────

decisionForm.addEventListener('submit', e => {
  e.preventDefault();
  generateAdvice();
});

function generateAdvice() {
  const reason          = document.querySelector('input[name="reason"]:checked').value;
  const emergencyFund   = document.querySelector('input[name="emergency-fund"]:checked').value;
  const debtRate        = document.querySelector('input[name="debt-rate"]:checked').value;
  const yearsToRetirement = document.querySelector('input[name="years-to-retirement"]:checked').value;

  let advice = { recommendation: '', color: '', reasons: [], alternatives: [] };
  let score = 0;

  if (reason === 'emergency')                        { score += 3; advice.reasons.push('Emergency situations may justify a withdrawal'); }
  else if (reason === 'debt' && debtRate === 'high') { score += 2; advice.reasons.push('Paying off 20%+ debt saves money long-term — retirement growth averages ~10%'); }
  else if (reason === 'debt' && debtRate === 'medium') { score += 1; advice.reasons.push('Medium-rate debt — consider whether savings outweigh retirement impact'); }
  else if (reason === 'expense')                     { score -= 2; advice.reasons.push('Large expenses are better funded through savings or loans'); }
  else if (reason === 'investment')                  { score -= 1; advice.reasons.push('Investment returns are uncertain — retirement savings offer guaranteed tax benefits'); }

  if (emergencyFund === 'no')   { score -= 2; advice.reasons.push('⚠️ No emergency fund — withdrawing leaves you more exposed'); advice.alternatives.push('Build a 3-month emergency fund first'); }
  else if (emergencyFund === 'some') { score -= 1; advice.reasons.push('Limited emergency savings — use the two-pot carefully'); }

  if (yearsToRetirement === 'far')   { score += 1; advice.reasons.push('20+ years gives time to rebuild — but compound growth means early withdrawals are expensive'); }
  else if (yearsToRetirement === 'close') { score -= 2; advice.reasons.push('⚠️ Under 10 years to retirement — much harder to rebuild savings'); }

  if (score >= 3)      { advice.recommendation = 'Consider Withdrawing';  advice.color = 'green';  advice.summary = 'Your situation may justify a withdrawal. Still exhaust alternatives first and take only what you need.'; }
  else if (score >= 0) { advice.recommendation = 'Proceed with Caution';  advice.color = 'yellow'; advice.summary = 'Borderline. Carefully weigh short-term benefit vs long-term retirement impact.'; }
  else                 { advice.recommendation = 'Avoid if Possible';     advice.color = 'red';    advice.summary = 'Withdrawing now could seriously harm your retirement. Explore every alternative first.'; }

  if (!advice.alternatives.length) {
    advice.alternatives = [
      'Personal loan (if interest rate < retirement fund growth rate)',
      'Negotiate a payment plan with creditors',
      'Sell unused assets',
      'Side income or gig work',
      'Interest-free family loan',
      'Increase RA contribution to reduce tax bill — see the RA Tax Saver below ↓'
    ];
  }

  displayAdvice(advice);
}

function displayAdvice(advice) {
  decisionResult.innerHTML = `
    <span class="advice-tag ${advice.color}">${advice.recommendation}</span>
    <h3>${advice.summary}</h3>
    <h4 style="margin-top:1.5rem;margin-bottom:.75rem;">Key Considerations:</h4>
    <ul>${advice.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
    <h4 style="margin-top:1.5rem;margin-bottom:.75rem;">Alternatives to Consider:</h4>
    <ul>${advice.alternatives.map(a => `<li>${a}</li>`).join('')}</ul>
    <div style="margin-top:2rem;padding:1.5rem;background:#fef3c7;border-radius:var(--radius);border-left:4px solid var(--color-warning);">
      <strong>Important:</strong> This is general guidance only. Consult a registered financial advisor for advice based on your full financial picture.
    </div>
  `;
  decisionResult.classList.remove('hidden');
  decisionResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── RA Tax Saver Calculator ────────────────────────────────────────────────

const raForm = document.getElementById('ra-saver-form');
if (raForm) {
  raForm.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      clearTimeout(raForm._timer);
      raForm._timer = setTimeout(calculateRASaver, 200);
    });
  });
}

function calculateRASaver() {
  const monthlySalary     = CalculatorUtils.getCurrencyValue('ra-monthly-salary');
  const currentMonthlyRA  = CalculatorUtils.getCurrencyValue('ra-current-contribution');
  const additionalMonthlyRA = CalculatorUtils.getCurrencyValue('ra-extra-contribution');

  if (!monthlySalary) return;

  const annualSalary       = monthlySalary * 12;
  const currentAnnualRA    = (currentMonthlyRA || 0) * 12;
  const extraAnnualRA      = (additionalMonthlyRA || 0) * 12;

  // SARS allows deduction of 27.5% of gross remuneration (capped at R350k/year)
  const maxDeductibleAnnual = Math.min(annualSalary * RA_MAX_DEDUCTION_RATE, RA_MAX_DEDUCTION_RAND);
  const headroomAnnual      = Math.max(0, maxDeductibleAnnual - currentAnnualRA);
  const headroomMonthly     = headroomAnnual / 12;

  // How much of the extra contribution is within the deductible limit?
  const deductibleExtra    = Math.min(extraAnnualRA, headroomAnnual);
  const marginalRate       = getMarginalRate(annualSalary);

  // Monthly tax saving from extra contribution
  const annualTaxSaving    = deductibleExtra * marginalRate;
  const monthlyTaxSaving   = annualTaxSaving / 12;

  // Net cost: you contribute R1,000 extra → SARS gives back R(marginalRate × 1,000) → net cost = R(1 - marginalRate) × 1,000
  const extraMonthly       = additionalMonthlyRA || 0;
  const netMonthlyCost     = extraMonthly - (extraMonthly * marginalRate);

  const raResultsDiv = document.getElementById('ra-saver-results');
  if (!raResultsDiv) return;

  const exceeded = extraAnnualRA > headroomAnnual;

  raResultsDiv.innerHTML = `
    <div class="ra-result-grid">
      <div class="ra-result-card">
        <div class="ra-result-label">Your SARS Deduction Limit</div>
        <div class="ra-result-value">R ${fmt(maxDeductibleAnnual / 12)}<span class="ra-result-sub">/month</span></div>
        <div class="ra-result-note">27.5% of salary, capped at R350k/year</div>
      </div>
      <div class="ra-result-card">
        <div class="ra-result-label">Unused Headroom</div>
        <div class="ra-result-value ${headroomMonthly > 0 ? 'positive' : ''}">R ${fmt(headroomMonthly)}<span class="ra-result-sub">/month</span></div>
        <div class="ra-result-note">Extra you can contribute &amp; still get the tax break</div>
      </div>
      <div class="ra-result-card">
        <div class="ra-result-label">Your Marginal Tax Rate</div>
        <div class="ra-result-value">${(marginalRate * 100).toFixed(0)}%</div>
        <div class="ra-result-note">SARS gives you back this % on every extra rand contributed</div>
      </div>
      ${extraMonthly > 0 ? `
      <div class="ra-result-card highlight-green">
        <div class="ra-result-label">Monthly Tax Saving</div>
        <div class="ra-result-value positive">R ${fmt(monthlyTaxSaving)}</div>
        <div class="ra-result-note">SARS effectively subsidises your extra contribution</div>
      </div>
      <div class="ra-result-card highlight-green">
        <div class="ra-result-label">Your Net Monthly Cost</div>
        <div class="ra-result-value">R ${fmt(netMonthlyCost)}</div>
        <div class="ra-result-note">What it actually costs you after the tax saving</div>
      </div>
      <div class="ra-result-card highlight-green">
        <div class="ra-result-label">Annual Tax Saving</div>
        <div class="ra-result-value positive">R ${fmt(annualTaxSaving)}</div>
        <div class="ra-result-note">Total SARS tax reduction for the year</div>
      </div>
      ` : ''}
    </div>
    ${extraMonthly > 0 ? `
    <div class="ra-insight-box">
      💡 <strong>You contribute R ${fmt(extraMonthly)}/month extra → SARS gives you back R ${fmt(monthlyTaxSaving)}/month in tax savings. Your real out-of-pocket cost is only R ${fmt(netMonthlyCost)}/month.</strong>
      ${exceeded ? `<br><br>⚠️ Note: R ${fmt((extraAnnualRA - headroomAnnual)/12)}/month of your extra contribution exceeds your SARS limit and won't be deductible — consider capping at R ${fmt(headroomMonthly)}/month.` : ''}
    </div>
    ` : `
    <div class="ra-insight-box neutral">
      Enter an extra monthly contribution above to see your instant tax saving.
    </div>
    `}
    <div class="ra-disclaimer">
      Based on 2025/2026 SARS marginal income tax rates. Verify with a tax advisor for your exact situation.
      <a href="https://www.sars.gov.za/types-of-tax/personal-income-tax/" target="_blank" rel="noopener">SARS individual tax →</a>
    </div>
  `;

  raResultsDiv.classList.remove('hidden');
}

// ─── Smooth scroll ──────────────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
