function resetModelParams() {
      const defaults = { temp: 0.7, topP: 1.0, maxTokens: 4096, freq: 0, pres: 0 };
      setModelParamValues(defaults);
    }

    function setModelPreset(preset) {
      const presets = {
        precise:   { temp: 0.2, topP: 0.9, maxTokens: 4096, freq: 0.1, pres: 0 },
        balanced:  { temp: 0.7, topP: 1.0, maxTokens: 4096, freq: 0, pres: 0 },
        creative:  { temp: 1.0, topP: 0.95, maxTokens: 4096, freq: 0.2, pres: 0.1 },
        wild:      { temp: 1.5, topP: 1.0, maxTokens: 4096, freq: 0.5, pres: 0.3 },
        longform:  { temp: 0.8, topP: 1.0, maxTokens: 16384, freq: 0.3, pres: 0.2 }
      };
      if (presets[preset]) {
        setModelParamValues(presets[preset]);
      }
    }

    function setModelParamValues(vals) {
      document.getElementById('modelTemperature').value = vals.temp;
      document.getElementById('tempValue').textContent = vals.temp;
      document.getElementById('modelTopP').value = vals.topP;
      document.getElementById('topPValue').textContent = vals.topP;
      document.getElementById('modelMaxTokens').value = vals.maxTokens;
      document.getElementById('maxTokensValue').textContent = vals.maxTokens;
      document.getElementById('modelFreqPenalty').value = vals.freq;
      document.getElementById('freqPenaltyValue').textContent = vals.freq;
      document.getElementById('modelPresPenalty').value = vals.pres;
      document.getElementById('presPenaltyValue').textContent = vals.pres;
    }