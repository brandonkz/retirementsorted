/**
 * RetirementSorted - Two-Pot Calculator
 */

// SA Tax Brackets 2024/2025 (for lump sum withdrawals)
const TAX_BRACKETS = [
  { min: 0, max: 27500, rate: 0, base: 0 },
  { min: 27501, max: 726000, rate: 0.18, base: 0 },
  { min: 726001, max: 1089000, rate: 0.27, base: 125730 },
  { min: 1089001, max: 1577000, rate: 0.36, base: 223740 },
  { min: 1577001, max: Infinity, rate: 0.45, base: 399420 }
];

// DOM Elements
const calcForm = document.getElementById('calc-form');
const resultsDiv = document.getElementById('results');
const decisionForm = document.getElementById('decision-form');
const decisionResult = document.getElementById('decision-result');

// Calculator Form
calcForm.addEventListener('submit', (e) => {
  e.preventDefault();
  calculateWithdrawal();
});

// Update max withdrawal helper text on fund value change
document.getElementById('fund-value').addEventListener('input', updateMaxWithdrawalHelper);
document.getElementById('withdrawal-amount').addEventListener('input', validateWithdrawalAmount);

function updateMaxWithdrawalHelper() {
  const fundValue = parseFloat(document.getElementById('fund-value').value) || 0;
  const savingsPot = fundValue / 3;
  const maxWithdrawal = savingsPot * 0.1;
  
  const helper = document.getElementById('max-withdrawal-helper');
  if (fundValue > 0) {
    helper.textContent = `Maximum you can withdraw: R ${formatNumber(maxWithdrawal)}`;
    helper.style.color = 'var(--color-primary)';
  } else {
    helper.textContent = '';
  }
}

function validateWithdrawalAmount() {
  const fundValue = parseFloat(document.getElementById('fund-value').value) || 0;
  const withdrawalAmount = parseFloat(document.getElementById('withdrawal-amount').value) || 0;
  const savingsPot = fundValue / 3;
  const maxWithdrawal = savingsPot * 0.1;
  
  const helper = document.getElementById('max-withdrawal-helper');
  
  if (withdrawalAmount > maxWithdrawal && fundValue > 0) {
    helper.textContent = `⚠️ Exceeds maximum withdrawal of R ${formatNumber(maxWithdrawal)}`;
    helper.style.color = 'var(--color-danger)';
  } else if (fundValue > 0) {
    helper.textContent = `Maximum you can withdraw: R ${formatNumber(maxWithdrawal)}`;
    helper.style.color = 'var(--color-primary)';
  }
}

function calculateWithdrawal() {
  // Get inputs
  const annualSalary = parseFloat(document.getElementById('annual-salary').value);
  const fundValue = parseFloat(document.getElementById('fund-value').value);
  const withdrawalAmount = parseFloat(document.getElementById('withdrawal-amount').value);
  
  // Validate
  if (!annualSalary || !fundValue || !withdrawalAmount) {
    alert('Please fill in all fields');
    return;
  }
  
  // Calculate savings pot (1/3 of fund)
  const savingsPot = fundValue / 3;
  const maxWithdrawal = savingsPot * 0.1;
  
  // Validate withdrawal amount
  if (withdrawalAmount > maxWithdrawal) {
    alert(`Maximum withdrawal is R ${formatNumber(maxWithdrawal)} (10% of your savings pot)`);
    return;
  }
  
  // Calculate tax
  // Lump sum withdrawals are taxed using retirement lump sum tax table
  const tax = calculateLumpSumTax(withdrawalAmount);
  const netAmount = withdrawalAmount - tax;
  
  // Display results
  document.getElementById('result-withdrawal').textContent = `R ${formatNumber(withdrawalAmount)}`;
  document.getElementById('result-tax').textContent = `-R ${formatNumber(tax)}`;
  document.getElementById('result-net').textContent = `R ${formatNumber(netAmount)}`;
  
  // Generate info list
  const infoList = document.getElementById('result-info-list');
  infoList.innerHTML = `
    <li>Your savings pot is R ${formatNumber(savingsPot)} (1/3 of total fund)</li>
    <li>Maximum annual withdrawal: R ${formatNumber(maxWithdrawal)} (10% of savings pot)</li>
    <li>Tax rate on withdrawal: ${((tax / withdrawalAmount) * 100).toFixed(1)}%</li>
    <li>Remaining in savings pot: R ${formatNumber(savingsPot - withdrawalAmount)}</li>
    <li>This withdrawal reduces your retirement savings permanently</li>
  `;
  
  // Update viral card
  const taxRate = ((tax / withdrawalAmount) * 100).toFixed(1);
  document.getElementById('viral-main').textContent = `R${formatNumber(netAmount)}`;
  document.getElementById('viral-subtitle').textContent = `After ${taxRate}% tax`;
  
  // Show results
  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function calculateLumpSumTax(amount) {
  // SA Lump sum tax table for retirement withdrawals
  for (let bracket of TAX_BRACKETS) {
    if (amount <= bracket.max) {
      return bracket.base + ((amount - bracket.min) * bracket.rate);
    }
  }
  return 0;
}

function formatNumber(num) {
  return Math.round(num).toLocaleString('en-ZA');
}

// Decision Tool
decisionForm.addEventListener('submit', (e) => {
  e.preventDefault();
  generateAdvice();
});

function generateAdvice() {
  const reason = document.querySelector('input[name="reason"]:checked').value;
  const emergencyFund = document.querySelector('input[name="emergency-fund"]:checked').value;
  const debtRate = document.querySelector('input[name="debt-rate"]:checked').value;
  const yearsToRetirement = document.querySelector('input[name="years-to-retirement"]:checked').value;
  
  let advice = {
    recommendation: '',
    color: '',
    reasons: [],
    alternatives: []
  };
  
  // Score-based recommendation
  let withdrawScore = 0;
  
  // Reason analysis
  if (reason === 'emergency') {
    withdrawScore += 3;
    advice.reasons.push('Emergency situations may justify a withdrawal');
  } else if (reason === 'debt' && debtRate === 'high') {
    withdrawScore += 2;
    advice.reasons.push('Paying off high-interest debt (20%+) can save you money long-term');
  } else if (reason === 'debt' && debtRate === 'medium') {
    withdrawScore += 1;
    advice.reasons.push('Medium-interest debt - consider if the savings outweigh retirement impact');
  } else if (reason === 'expense') {
    withdrawScore -= 2;
    advice.reasons.push('Large expenses are usually better funded through savings or loans');
  } else if (reason === 'investment') {
    withdrawScore -= 1;
    advice.reasons.push('Investment returns are uncertain - retirement savings offer tax benefits');
  }
  
  // Emergency fund check
  if (emergencyFund === 'no') {
    withdrawScore -= 2;
    advice.reasons.push('⚠️ No emergency fund - withdrawing now leaves you more vulnerable');
    advice.alternatives.push('Consider building an emergency fund first (3-6 months expenses)');
  } else if (emergencyFund === 'some') {
    withdrawScore -= 1;
    advice.reasons.push('Limited emergency savings - use with caution');
  }
  
  // Time to retirement
  if (yearsToRetirement === 'far') {
    withdrawScore += 1;
    advice.reasons.push('20+ years to retirement gives time to rebuild savings');
  } else if (yearsToRetirement === 'close') {
    withdrawScore -= 2;
    advice.reasons.push('⚠️ Less than 10 years to retirement - harder to rebuild savings');
  }
  
  // Generate recommendation
  if (withdrawScore >= 3) {
    advice.recommendation = 'Consider Withdrawing';
    advice.color = 'green';
    advice.summary = 'Based on your situation, a withdrawal may be reasonable. However, always consider alternatives first and only withdraw what you absolutely need.';
  } else if (withdrawScore >= 0) {
    advice.recommendation = 'Proceed with Caution';
    advice.color = 'yellow';
    advice.summary = 'Your situation is borderline. Carefully weigh the short-term benefit against long-term retirement impact. Explore all alternatives before proceeding.';
  } else {
    advice.recommendation = 'Avoid if Possible';
    advice.color = 'red';
    advice.summary = 'Based on your situation, withdrawing now could seriously harm your retirement savings. Strongly consider alternatives.';
  }
  
  // Add general alternatives
  if (!advice.alternatives.length) {
    advice.alternatives = [
      'Personal loan (if interest rate is lower than retirement fund growth)',
      'Negotiate payment plans with creditors',
      'Sell unused assets',
      'Side income or gig work',
      'Family loan (interest-free)'
    ];
  }
  
  displayAdvice(advice);
}

function displayAdvice(advice) {
  decisionResult.innerHTML = `
    <span class="advice-tag ${advice.color}">${advice.recommendation}</span>
    <h3>${advice.summary}</h3>
    
    <h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem;">Key Considerations:</h4>
    <ul>
      ${advice.reasons.map(r => `<li>${r}</li>`).join('')}
    </ul>
    
    <h4 style="margin-top: 1.5rem; margin-bottom: 0.75rem;">Alternatives to Consider:</h4>
    <ul>
      ${advice.alternatives.map(a => `<li>${a}</li>`).join('')}
    </ul>
    
    <div style="margin-top: 2rem; padding: 1.5rem; background: #fef3c7; border-radius: var(--radius); border-left: 4px solid var(--color-warning);">
      <strong>Important:</strong> This is general guidance only. Consider consulting a registered financial advisor for personalized advice based on your complete financial situation.
    </div>
  `;
  
  decisionResult.classList.remove('hidden');
  decisionResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
