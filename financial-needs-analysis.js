
    let currentSection = 1;
    const totalSections = 7;

    const trackEvent = (...args) => {
      if (typeof gtag === 'function') {
        gtag(...args);
      }
    };

    function updateProgress() {
      const progress = (currentSection / totalSections) * 100;
      document.getElementById('progressBar').style.width = progress + '%';
      document.getElementById('stepIndicator').textContent = `Step ${currentSection} of ${totalSections}`;
      
      // Track progress in GA
      trackEvent('event', 'fna_step_' + currentSection, {
        event_category: 'FNA',
        event_label: 'Step ' + currentSection
      });
    }

    function showSection(n) {
      console.log('showSection called with n=', n);
      const section = document.getElementById('section' + n);
      if (!section) {
        console.error('Section not found: section' + n);
        alert('Section ' + n + ' not found!');
        return;
      }
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      section.classList.add('active');
      currentSection = n;
      updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function nextSection() {
      try {
        console.log('nextSection called, current:', currentSection);
        if (currentSection < totalSections) {
          showSection(currentSection + 1);
        } else {
          console.log('Already at last section');
        }
      } catch(e) {
        console.error('nextSection error:', e);
        alert('Navigation error: ' + e.message);
      }
    }

    function prevSection() {
      if (currentSection > 1) {
        showSection(currentSection - 1);
      }
    }

    function restart() {
      showSection(1);
      document.querySelectorAll('input[type="number"]').forEach(i => i.value = '');
      document.getElementById('married').checked = true;
      document.getElementById('willNo').checked = true;
      document.getElementById('benNo').checked = true;
    }

    function formatRand(num) {
      return 'R ' + Math.round(num).toLocaleString('en-ZA');
    }

    function calculate() {
      try {
        console.log('Calculate function called');
        // Get all inputs
        const age = parseInt(document.getElementById('age').value) || 35;
      const dependents = parseInt(document.getElementById('dependents').value) || 0;
      const youngestAge = parseInt(document.getElementById('youngestAge').value) || 0;
      const income = parseFloat(document.getElementById('income').value) || 0;
      const spouseIncome = parseFloat(document.getElementById('spouseIncome').value) || 0;
      const expenses = parseFloat(document.getElementById('expenses').value) || 0;
      const emergencyFund = parseFloat(document.getElementById('emergencyFund').value) || 0;
      const retirementSavings = parseFloat(document.getElementById('retirementSavings').value) || 0;
      const propertyValue = parseFloat(document.getElementById('propertyValue').value) || 0;
      const investments = parseFloat(document.getElementById('investments').value) || 0;
      const homeLoan = parseFloat(document.getElementById('homeLoan').value) || 0;
      const otherDebt = parseFloat(document.getElementById('otherDebt').value) || 0;
      const lifeCover = parseFloat(document.getElementById('lifeCover').value) || 0;
      const disabilityCover = parseFloat(document.getElementById('disabilityCover').value) || 0;
      const criticalCover = parseFloat(document.getElementById('criticalCover').value) || 0;
      const retirementAge = parseInt(document.getElementById('retirementAge').value) || 65;
      const retirementIncome = parseFloat(document.getElementById('retirementIncome').value) || 0;
      const retirementContribution = parseFloat(document.getElementById('retirementContribution').value) || 0;

      // Life Insurance Need Calculation
      // Capital needed = (Income replacement × years) + Debt settlement + Education fund + Final expenses
      const yearsToProvide = dependents > 0 ? Math.max(0, 22 - youngestAge) : 10;
      const incomeReplacement = income * 12 * yearsToProvide * 0.75; // 75% of income
      const debtSettlement = homeLoan + otherDebt;
      const educationFund = dependents * 500000; // R500k per child for tertiary
      const finalExpenses = 100000; // Funeral & estate costs
      
      const totalLifeNeed = incomeReplacement + debtSettlement + educationFund + finalExpenses;
      const lifeGap = totalLifeNeed - lifeCover;

      // Disability / Income Protection
      const disabilityNeed = income * 0.75; // 75% of income
      const disabilityGap = disabilityNeed - disabilityCover;

      // Critical Illness
      const criticalNeed = income * 12 * 3; // 3 years of income
      const criticalGap = criticalNeed - criticalCover;

      // Emergency Fund (3-6 months expenses)
      const emergencyNeed = expenses * 6;
      const emergencyGap = emergencyNeed - emergencyFund;

      // Asset Growth Projections
      const yearsToRetirement = retirementAge - age;
      const inflationRate = 0.06; // 6% annual inflation (SA average)
      const propertyGrowthRate = 0.07; // 7% annual property appreciation (nominal)
      const investmentGrowthRate = 0.08; // 8% annual investment growth (nominal)
      
      // Real (inflation-adjusted) growth rates
      const realPropertyGrowth = (1 + propertyGrowthRate) / (1 + inflationRate) - 1; // ~0.94%
      const realInvestmentGrowth = (1 + investmentGrowthRate) / (1 + inflationRate) - 1; // ~1.89%
      
      // Future property value (NOMINAL)
      const futurePropertyValueNominal = propertyValue * Math.pow(1 + propertyGrowthRate, yearsToRetirement);
      
      // Future property value (REAL - today's purchasing power)
      const futurePropertyValue = propertyValue * Math.pow(1 + realPropertyGrowth, yearsToRetirement);
      
      // Mortgage payoff projection
      // Assume 20-year bond term (standard in SA)
      const bondTerm = 20;
      const remainingBondYears = Math.max(0, bondTerm - (yearsToRetirement > bondTerm ? yearsToRetirement - bondTerm : 0));
      
      // If retirement is 20+ years away, bond is fully paid off
      let loanAtRetirement = homeLoan;
      if (yearsToRetirement >= bondTerm) {
        loanAtRetirement = 0; // Bond fully paid
      } else {
        // Pro-rata reduction (simplified - ignores interest compounding but close enough)
        loanAtRetirement = homeLoan * (1 - yearsToRetirement / bondTerm);
      }
      
      const propertyEquity = futurePropertyValue - (loanAtRetirement / Math.pow(1 + inflationRate, yearsToRetirement)); // Loan shrinks in real terms
      
      // Downsizing scenario - assume selling property and buying smaller at 40% of future value
      const downsizeRelease = propertyEquity * 0.6; // 60% of equity freed up
      
      // Future investment portfolio (REAL)
      const futureInvestments = investments * Math.pow(1 + realInvestmentGrowth, yearsToRetirement);
      
      // Retirement Capital Needed (already in today's rands)
      // Only adjust if bond will be paid off DURING retirement (not before)
      let adjustedRetirementIncome = retirementIncome;
      let bondSavings = 0;
      // bondTerm already declared above
      
      // If you retire BEFORE bond is paid (e.g., retire in 15 yrs, 20yr bond), you'll save the bond payment in retirement
      if (yearsToRetirement < bondTerm && homeLoan > 0) {
        // Estimate monthly bond payment (simplified: total loan / 240 months)
        bondSavings = homeLoan / 240; // Rough monthly payment estimate
        adjustedRetirementIncome = Math.max(10000, retirementIncome - bondSavings); // Don't go below R10k
      }
      // If you retire AFTER bond is paid (e.g., retire in 27 yrs, 20yr bond), you're already living without it - no adjustment needed
      
      const retirementCapitalNeed = adjustedRetirementIncome * 12 * 25;
      
      // Future retirement savings (REAL)
      const futureRetirementSavings = retirementSavings * Math.pow(1 + realInvestmentGrowth, yearsToRetirement);
      const futureContributions = retirementContribution * 12 * ((Math.pow(1 + realInvestmentGrowth, yearsToRetirement) - 1) / realInvestmentGrowth);
      
      // Total projected wealth at retirement (IN TODAY'S RANDS)
      const projectedRetirement = futureRetirementSavings + futureContributions + futureInvestments;
      const projectedRetirementWithProperty = projectedRetirement + downsizeRelease;
      
      // Calculate total assets including property equity
      const totalProjectedAssets = projectedRetirement + propertyEquity;
      
      // Gap analysis WITH property included
      const totalRetirementGap = retirementCapitalNeed - totalProjectedAssets;
      const monthlyGapFill = totalRetirementGap > 0 ? (totalRetirementGap / ((Math.pow(1 + realInvestmentGrowth, yearsToRetirement) - 1) / realInvestmentGrowth)) / 12 : 0;
      
      // Adjusted Life Insurance Need (accounting for growing assets)
      // Your family could liquidate property equity if needed
      const netDebt = debtSettlement - propertyEquity;
      const adjustedLifeNeed = incomeReplacement + Math.max(0, netDebt) + educationFund + finalExpenses;
      const adjustedLifeGap = adjustedLifeNeed - lifeCover;

      // Display Results
      const currentMonthlyInvestment = retirementContribution;
      const neededMonthlyInvestment = currentMonthlyInvestment + monthlyGapFill;
      
      if (totalRetirementGap > 0) {
        if (monthlyGapFill > 1000) {
          document.getElementById('monthlyNeed').textContent = formatRand(neededMonthlyInvestment);
          document.getElementById('investmentSubtext').textContent = `Increase to ${formatRand(neededMonthlyInvestment)}/month (+ ${formatRand(monthlyGapFill)} more) until age ${retirementAge}. All amounts in today's money.`;
        } else {
          document.getElementById('monthlyNeed').textContent = formatRand(currentMonthlyInvestment);
          document.getElementById('investmentSubtext').textContent = `Almost there! Your property equity covers most of the gap. Keep investing ${formatRand(currentMonthlyInvestment)}/month.`;
        }
      } else {
        // Calculate max affordable income with current trajectory
        const maxMonthlyIncome = (totalProjectedAssets / 25) / 12;
        // Change the label when showing surplus
        const resultLabel = document.querySelector('.result-label');
        if (resultLabel) {
          resultLabel.innerHTML = '🎉 Maximum Retirement Income (in today\'s money)';
        }
        document.getElementById('monthlyNeed').textContent = formatRand(maxMonthlyIncome) + '/month';
        document.getElementById('investmentSubtext').textContent = `That's ${formatRand(maxMonthlyIncome - adjustedRetirementIncome)} MORE than your ${formatRand(adjustedRetirementIncome)} goal. Your current ${formatRand(currentMonthlyInvestment)}/month investment + property equity gets you there. No extra investment needed.`;
      }
      
      // Retirement Plan
      let planHTML = '';
      
      planHTML += `<div class="gap-item">
        <span class="gap-label">Desired retirement income (today's Rands)</span>
        <span class="gap-amount">${formatRand(retirementIncome)}/month</span>
      </div>`;
      
      if (bondSavings > 0) {
        planHTML += `<div class="insight-box success">
          💡 Since your bond will be paid off during retirement, you won't need the full ${formatRand(retirementIncome)}/month. Adjusted need: ${formatRand(adjustedRetirementIncome)}/month.
        </div>`;
      } else if (yearsToRetirement >= bondTerm && homeLoan > 0) {
        planHTML += `<div class="insight-box">
          💡 Your bond will be fully paid ${bondTerm - yearsToRetirement} years before retirement. Your ${formatRand(retirementIncome)}/month target already accounts for living without a bond payment.
        </div>`;
      }
      
      planHTML += `<div class="gap-item">
        <span class="gap-label">Capital needed at retirement (today's rands)</span>
        <span class="gap-amount">${formatRand(retirementCapitalNeed)}</span>
      </div>`;
      
      planHTML += `<div class="gap-item">
        <span class="gap-label">Years until retirement</span>
        <span class="gap-amount">${yearsToRetirement} years</span>
      </div>`;

      planHTML += `<hr style="margin: 20px 0">`;

      planHTML += `<div class="gap-item">
        <span class="gap-label">Current monthly investment</span>
        <span class="gap-amount">${formatRand(currentMonthlyInvestment)}</span>
      </div>`;
      
      planHTML += `<div class="gap-item">
        <span class="gap-label">Projected investments at ${retirementAge} (today's rands)</span>
        <span class="gap-amount">${formatRand(projectedRetirement)}</span>
      </div>`;
      
      planHTML += `<div class="gap-item">
        <span class="gap-label">+ Property equity (today's rands)</span>
        <span class="gap-amount">${formatRand(propertyEquity)}</span>
      </div>`;
      
      planHTML += `<div class="gap-item">
        <span class="gap-label"><strong>= Total projected wealth (today's purchasing power)</strong></span>
        <span class="gap-amount" style="font-size: 1.2rem; color: var(--success)">${formatRand(totalProjectedAssets)}</span>
      </div>`;

      if (totalRetirementGap > 0) {
        planHTML += `<div class="gap-item">
          <span class="gap-label"><strong>Shortfall</strong></span>
          <span class="gap-amount negative">${formatRand(totalRetirementGap)}</span>
        </div>`;
        
        if (monthlyGapFill > 1000) {
          planHTML += `<div class="insight-box danger">
            ⚠️ To close the gap, <strong>increase your monthly investment by ${formatRand(monthlyGapFill)}</strong> (from ${formatRand(currentMonthlyInvestment)} to ${formatRand(neededMonthlyInvestment)}).
          </div>`;
        } else {
          planHTML += `<div class="insight-box success">
            💡 You're close! Your property equity covers most of the gap. Keep investing ${formatRand(currentMonthlyInvestment)}/month.
          </div>`;
        }
      } else {
        // Calculate maximum monthly income they could afford
        const maxMonthlyIncome = (totalProjectedAssets / 25) / 12; // 4% withdrawal rule
        
        planHTML += `<div class="gap-item">
          <span class="gap-label"><strong>Surplus (today's rands)</strong></span>
          <span class="gap-amount">${formatRand(Math.abs(totalRetirementGap))}</span>
        </div>`;
        
        planHTML += `<hr style="margin: 20px 0">`;
        
        planHTML += `<div class="gap-item">
          <span class="gap-label">💰 Maximum monthly income you could afford</span>
          <span class="gap-amount" style="font-size: 1.2rem; color: var(--success)">${formatRand(maxMonthlyIncome)}/month</span>
        </div>`;
        
        planHTML += `<div class="insight-box success">
          ✅ You're on track for ${formatRand(maxMonthlyIncome)}/month! That's ${formatRand(maxMonthlyIncome - adjustedRetirementIncome)}/month MORE than your ${formatRand(adjustedRetirementIncome)} target. You could retire earlier, live better, or leave more to your family.
        </div>`;
      }

      document.getElementById('retirementPlan').innerHTML = planHTML;

      // Wealth Projection
      let wealthHTML = '';
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label">Property value today</span>
        <span class="gap-amount">${formatRand(propertyValue)}</span>
      </div>`;
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label">Property value at ${retirementAge} (in today's rands)</span>
        <span class="gap-amount">${formatRand(futurePropertyValue)}</span>
      </div>`;
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label" style="font-size: 0.85rem; color: var(--text-muted)">Nominal value (not inflation-adjusted)</span>
        <span class="gap-amount" style="font-size: 0.85rem; color: var(--text-muted)">${formatRand(futurePropertyValueNominal)}</span>
      </div>`;
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label">Home loan outstanding (today)</span>
        <span class="gap-amount negative">${formatRand(homeLoan)}</span>
      </div>`;
      
      if (yearsToRetirement >= 20) {
        wealthHTML += `<div class="gap-item">
          <span class="gap-label">Home loan at retirement</span>
          <span class="gap-amount" style="color: var(--success)">R 0 (fully paid off)</span>
        </div>`;
      } else {
        wealthHTML += `<div class="gap-item">
          <span class="gap-label">Home loan at retirement (estimated)</span>
          <span class="gap-amount negative">${formatRand(loanAtRetirement)}</span>
        </div>`;
      }
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label"><strong>Property equity at retirement</strong></span>
        <span class="gap-amount">${formatRand(propertyEquity)}</span>
      </div>`;

      if (yearsToRetirement >= 20) {
        wealthHTML += `<div class="insight-box success">
          ✅ <strong>Debt-free at retirement:</strong> Your bond will be fully paid off by age ${retirementAge}. Your property equity: <strong>${formatRand(propertyEquity)}</strong>.
        </div>`;
      }
      
      if (propertyEquity > 5000000) {
        wealthHTML += `<div class="insight-box">
          🏡 <strong>Downsizing option:</strong> You could sell and downsize, freeing up <strong>${formatRand(downsizeRelease)}</strong> for retirement income.
        </div>`;
      }

      wealthHTML += `<hr style="margin: 20px 0">`;

      wealthHTML += `<div class="gap-item">
        <span class="gap-label">Investments today (TFSA, unit trusts, shares)</span>
        <span class="gap-amount">${formatRand(investments)}</span>
      </div>`;
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label">Projected value at ${retirementAge} (in today's rands)</span>
        <span class="gap-amount">${formatRand(futureInvestments)}</span>
      </div>`;

      wealthHTML += `<hr style="margin: 20px 0">`;

      wealthHTML += `<div class="gap-item">
        <span class="gap-label">Retirement savings today</span>
        <span class="gap-amount">${formatRand(retirementSavings)}</span>
      </div>`;
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label">+ Future contributions (${formatRand(retirementContribution)}/month)</span>
        <span class="gap-amount">${formatRand(futureContributions)}</span>
      </div>`;
      
      wealthHTML += `<div class="gap-item">
        <span class="gap-label"><strong>Total retirement savings at ${retirementAge}</strong></span>
        <span class="gap-amount">${formatRand(projectedRetirement)}</span>
      </div>`;

      wealthHTML += `<hr style="margin: 20px 0">`;

      const totalWealthAtRetirement = propertyEquity + futureInvestments + projectedRetirement;
      wealthHTML += `<div class="gap-item">
        <span class="gap-label"><strong>Total projected wealth at ${retirementAge}</strong></span>
        <span class="gap-amount" style="font-size: 1.3rem; color: var(--success)">${formatRand(totalWealthAtRetirement)}</span>
      </div>`;

      if (totalWealthAtRetirement > retirementCapitalNeed) {
        wealthHTML += `<div class="insight-box success">
          🎉 <strong>You're on track to be financially independent!</strong> Your projected assets (${formatRand(totalWealthAtRetirement)}) exceed your retirement capital need (${formatRand(retirementCapitalNeed)}).
        </div>`;
      }

      document.getElementById('wealthProjection').innerHTML = wealthHTML;

      // Insurance Gaps
      let insuranceHTML = '';
      
      insuranceHTML += `<div class="insight-box">
        💡 <strong>Why insurance matters:</strong> You're building ${formatRand(projectedRetirement)} over ${yearsToRetirement} years. If something happens to you, your family needs a safety net while they adjust.
      </div>`;

      insuranceHTML += `<div class="gap-item">
        <span class="gap-label">Life cover needed (income replacement + debts)</span>
        <span class="gap-amount">${formatRand(totalLifeNeed)}</span>
      </div>`;
      
      if (propertyEquity > debtSettlement) {
        insuranceHTML += `<div class="gap-item">
          <span class="gap-label">Less: Property equity covers debt</span>
          <span class="gap-amount" style="color: var(--success)">-${formatRand(Math.min(propertyEquity, debtSettlement))}</span>
        </div>`;
        
        insuranceHTML += `<div class="gap-item">
          <span class="gap-label"><strong>Adjusted life insurance needed</strong></span>
          <span class="gap-amount">${formatRand(adjustedLifeNeed)}</span>
        </div>`;

        insuranceHTML += `<div class="insight-box success">
          💡 Your property equity (${formatRand(propertyEquity)}) can cover most/all of your debts. Your family could sell the property to settle debts and still have ${formatRand(propertyEquity - debtSettlement)} left over.
        </div>`;
      } else {
        insuranceHTML += `<div class="gap-item">
          <span class="gap-label"><strong>Life insurance needed</strong></span>
          <span class="gap-amount">${formatRand(totalLifeNeed)}</span>
        </div>`;
      }
      
      insuranceHTML += `<div class="gap-item">
        <span class="gap-label">Current life cover</span>
        <span class="gap-amount">${formatRand(lifeCover)}</span>
      </div>`;
      
      const finalLifeGap = propertyEquity > debtSettlement ? adjustedLifeGap : lifeGap;
      insuranceHTML += `<div class="gap-item">
        <span class="gap-label"><strong>Life insurance gap</strong></span>
        <span class="gap-amount ${finalLifeGap > 0 ? 'negative' : ''}">${formatRand(finalLifeGap)}</span>
      </div>`;

      if (finalLifeGap > 100000) {
        insuranceHTML += `<div class="insight-box danger">
          ⚠️ <strong>Critical gap:</strong> You're under-insured by ${formatRand(finalLifeGap)}. Your family could struggle financially if something happens to you.
        </div>`;
      } else if (finalLifeGap < 0) {
        insuranceHTML += `<div class="insight-box success">
          ✅ You're adequately covered for life insurance. Well done!
        </div>`;
      }

      insuranceHTML += `<hr style="margin: 20px 0">`;

      insuranceHTML += `<div class="gap-item">
        <span class="gap-label">Income protection needed</span>
        <span class="gap-amount">${formatRand(disabilityNeed)}/month</span>
      </div>`;
      
      insuranceHTML += `<div class="gap-item">
        <span class="gap-label">Current disability cover</span>
        <span class="gap-amount">${formatRand(disabilityCover)}/month</span>
      </div>`;
      
      insuranceHTML += `<div class="gap-item">
        <span class="gap-label"><strong>Disability gap</strong></span>
        <span class="gap-amount ${disabilityGap > 0 ? 'negative' : ''}">${formatRand(disabilityGap)}/month</span>
      </div>`;

      if (disabilityGap > 5000) {
        insuranceHTML += `<div class="insight-box danger">
          ⚠️ If you become disabled, you'll be short ${formatRand(disabilityGap)} per month to maintain your lifestyle.
        </div>`;
      }

      insuranceHTML += `<hr style="margin: 20px 0">`;

      insuranceHTML += `<div class="gap-item">
        <span class="gap-label">Critical illness recommended</span>
        <span class="gap-amount">${formatRand(criticalNeed)}</span>
      </div>`;
      
      insuranceHTML += `<div class="gap-item">
        <span class="gap-label">Current critical illness cover</span>
        <span class="gap-amount">${formatRand(criticalCover)}</span>
      </div>`;

      document.getElementById('insuranceGaps').innerHTML = insuranceHTML;

      // Retirement gap analysis now handled in retirementPlan section

      // Emergency Fund
      let emergencyHTML = '';
      
      emergencyHTML += `<div class="gap-item">
        <span class="gap-label">Recommended emergency fund</span>
        <span class="gap-amount">${formatRand(emergencyNeed)}</span>
      </div>`;
      
      emergencyHTML += `<div class="gap-item">
        <span class="gap-label">Current emergency fund</span>
        <span class="gap-amount">${formatRand(emergencyFund)}</span>
      </div>`;
      
      emergencyHTML += `<div class="gap-item">
        <span class="gap-label"><strong>Emergency fund gap</strong></span>
        <span class="gap-amount ${emergencyGap > 0 ? 'negative' : ''}">${formatRand(emergencyGap)}</span>
      </div>`;

      if (emergencyGap > 10000) {
        emergencyHTML += `<div class="insight-box">
          💡 Aim to save ${formatRand(emergencyGap)} in an accessible savings account for emergencies.
        </div>`;
      } else {
        emergencyHTML += `<div class="insight-box success">
          ✅ Your emergency fund is adequate. Keep it liquid and accessible.
        </div>`;
      }

      document.getElementById('emergencyGaps').innerHTML = emergencyHTML;

      // Recommendations
      let recommendations = '';
      const hasWill = document.querySelector('input[name="will"]:checked').value === 'yes';
      const hasBeneficiaries = document.querySelector('input[name="beneficiaries"]:checked').value === 'yes';

      if (!hasWill) {
        recommendations += `<div class="insight-box danger">
          📋 <strong>Urgent:</strong> You don't have a valid will. Without one, the state decides who gets your assets and who looks after your children.
        </div>`;
      }

      if (!hasBeneficiaries) {
        recommendations += `<div class="insight-box danger">
          👨‍👩‍👧‍👦 <strong>Important:</strong> Nominate beneficiaries on all policies to avoid delays and executor fees.
        </div>`;
      }

      if (retirementContribution / income < 0.1) {
        recommendations += `<div class="insight-box">
          💰 You're saving ${((retirementContribution / income) * 100).toFixed(1)}% of your income for retirement. Aim for at least 15% to retire comfortably.
        </div>`;
      }

      const netWorth = emergencyFund + retirementSavings + propertyValue + investments - homeLoan - otherDebt;
      recommendations += `<div class="insight-box">
        📊 Your current net worth is <strong>${formatRand(netWorth)}</strong>.
      </div>`;

      if (otherDebt > income * 3) {
        recommendations += `<div class="insight-box danger">
          💳 Your non-mortgage debt is high (${(otherDebt / (income * 12) * 100).toFixed(0)}% of annual income). Focus on paying this down before increasing investments.
        </div>`;
      }

      document.getElementById('recommendations').innerHTML = recommendations;

      // Interactive slider for extra investment
      const slider = document.getElementById('extraInvestment');
      const updateSlider = () => {
        const extra = parseInt(slider.value);
        document.getElementById('extraAmount').textContent = formatRand(extra);
        
        const newMonthly = currentMonthlyInvestment + extra;
        const newContributions = newMonthly * 12 * ((Math.pow(1 + realInvestmentGrowth, yearsToRetirement) - 1) / realInvestmentGrowth);
        const newTotal = futureRetirementSavings + newContributions + futureInvestments;
        const newGap = retirementCapitalNeed - newTotal;
        
        const impactHTML = `
          <div class="gap-item">
            <span class="gap-label">New monthly investment</span>
            <span class="gap-amount">${formatRand(newMonthly)}</span>
          </div>
          <div class="gap-item">
            <span class="gap-label">Projected retirement wealth</span>
            <span class="gap-amount">${formatRand(newTotal)}</span>
          </div>
          <div class="gap-item">
            <span class="gap-label"><strong>${newGap > 0 ? 'Remaining gap' : 'Surplus'}</strong></span>
            <span class="gap-amount ${newGap > 0 ? 'negative' : ''}">${formatRand(Math.abs(newGap))}</span>
          </div>
          ${newGap <= 0 ? '<div class="insight-box success">✅ With this increase, you\'ll hit your retirement goal!</div>' : ''}
        `;
        document.getElementById('extraImpact').innerHTML = impactHTML;
      };
      
      slider.addEventListener('input', updateSlider);
      updateSlider(); // Initialize

      // Track completion
      trackEvent('event', 'fna_completed', {
        event_category: 'FNA',
        life_gap: finalLifeGap,
        retirement_gap: totalRetirementGap
      });

      showSection(7);
      } catch(e) {
        console.error('Calculate error:', e);
        alert('Error calculating: ' + e.message);
      }
    }

    // Auto-save to localStorage
    setInterval(() => {
      const data = {};
      document.querySelectorAll('input[type="number"], input[type="text"]').forEach(input => {
        data[input.id] = input.value;
      });
      document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
        data[input.name] = input.value;
      });
      localStorage.setItem('fnaData', JSON.stringify(data));
    }, 5000);

    // Restore from localStorage on load
    window.addEventListener('load', () => {
      const saved = localStorage.getItem('fnaData');
      if (saved) {
        const data = JSON.parse(saved);
        Object.keys(data).forEach(key => {
          const input = document.getElementById(key) || document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
          if (input) {
            if (input.type === 'radio') {
              input.checked = true;
            } else {
              input.value = data[key];
            }
          }
        });
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-action="next"]').forEach(button => {
        button.addEventListener('click', nextSection);
      });

      document.querySelectorAll('[data-action="prev"]').forEach(button => {
        button.addEventListener('click', prevSection);
      });

      const calculateButton = document.querySelector('[data-action="calculate"]');
      if (calculateButton) {
        calculateButton.addEventListener('click', calculate);
      }

      const restartButton = document.querySelector('[data-action="restart"]');
      if (restartButton) {
        restartButton.addEventListener('click', restart);
      }
    });
  
