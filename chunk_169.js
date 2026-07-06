const UNIFIED_GRADES = {
      ELITE:      { min: 90, color: '#ffd700', emoji: '⚡', label: 'ELITE',      desc: 'Top-tier, exceptional quality' },
      EXCELLENT:  { min: 80, color: '#00ff41', emoji: '🔥', label: 'EXCELLENT',  desc: 'High quality, recommended' },
      GOOD:       { min: 70, color: '#00bfff', emoji: '✓',  label: 'GOOD',       desc: 'Solid, meets standards' },
      ACCEPTABLE: { min: 60, color: '#ffaa00', emoji: '~',  label: 'ACCEPTABLE', desc: 'Passable, room to improve' },
      POOR:       { min: 0,  color: '#ff3e3e', emoji: '✗',  label: 'POOR',       desc: 'Below standards' }
    };

    function getGradeForScore(score) {
      if (score >= 90) return UNIFIED_GRADES.ELITE;
      if (score >= 80) return UNIFIED_GRADES.EXCELLENT;
      if (score >= 70) return UNIFIED_GRADES.GOOD;
      if (score >= 60) return UNIFIED_GRADES.ACCEPTABLE;
      return UNIFIED_GRADES.POOR;
    }

    function updateThresholdDisplay(value) {
      const thresholdValue = document.getElementById('thresholdValue');
      const thresholdGrade = document.getElementById('thresholdGrade');

      if (!thresholdValue) return;

      thresholdValue.textContent = value;

      // Update color and grade based on value
      if (value === 0) {
        thresholdValue.style.color = '#888';
        if (thresholdGrade) thresholdGrade.textContent = '(disabled - wait for all)';
        if (thresholdGrade) thresholdGrade.style.color = '#888';
      } else {
        const grade = getGradeForScore(value);
        thresholdValue.style.color = grade.color;
        if (thresholdGrade) {
          thresholdGrade.textContent = `(${grade.emoji} ${grade.label}+)`;
          thresholdGrade.style.color = grade.color;
        }
      }

      // Update preset button highlighting
      document.querySelectorAll('.threshold-preset').forEach(btn => {
        const btnValue = parseInt(btn.dataset.value, 10);
        if (btnValue === value) {
          btn.style.transform = 'scale(1.05)';
          btn.style.boxShadow = '0 0 8px currentColor';
        } else {
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = 'none';
        }
      });
    }

    function setThresholdPreset(value) {
      const slider = document.getElementById('ultraEarlyThreshold');
      if (slider) {
        slider.value = value;
        updateThresholdDisplay(value);
        // Trigger change event for any listeners
        slider.dispatchEvent(new Event('input'));
      }
    }

    // Liquid Mode Target Score Functions
    function updateLiquidTargetDisplay(value) {
      const targetValue = document.getElementById('liquidTargetValueGlobal');
      const targetGrade = document.getElementById('liquidTargetGradeGlobal');

      if (!targetValue) return;

      targetValue.textContent = value;

      // Update color and grade
      const grade = getGradeForScore(value);
      targetValue.style.color = grade.color;
      if (targetGrade) {
        // Special handling for 95+ as "PERFECT"
        if (value >= 95) {
          targetGrade.textContent = '(✨ PERFECT)';
          targetGrade.style.color = '#ff00ff';
        } else {
          targetGrade.textContent = `(${grade.emoji} ${grade.label})`;
          targetGrade.style.color = grade.color;
        }
      }

      // Update preset button highlighting
      document.querySelectorAll('.liquid-target-preset').forEach(btn => {
        const btnValue = parseInt(btn.dataset.value, 10);
        if (btnValue === value) {
          btn.style.transform = 'scale(1.05)';
          btn.style.boxShadow = '0 0 8px currentColor';
        } else {
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = 'none';
        }
      });
    }

    function setLiquidTargetPreset(value) {
      const slider = document.getElementById('liquidTargetScoreGlobal');
      if (slider) {
        slider.value = value;
        updateLiquidTargetDisplay(value);
        slider.dispatchEvent(new Event('input'));
      }
    }