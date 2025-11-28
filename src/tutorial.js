// Tutorial page JavaScript
document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.tutorial-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  
  // Navigation buttons
  document.querySelectorAll('.nav-btn[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextStep = btn.dataset.next;
      goToStep(parseInt(nextStep));
    });
  });

  document.querySelectorAll('.nav-btn[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prevStep = btn.dataset.prev;
      goToStep(parseInt(prevStep));
    });
  });

  // Progress bar clicks
  progressSteps.forEach(step => {
    step.addEventListener('click', () => {
      const stepNum = parseInt(step.dataset.step);
      goToStep(stepNum);
    });
  });

  function goToStep(stepNum) {
    // Update content
    steps.forEach(step => step.classList.remove('active'));
    const targetStep = document.getElementById(`step-${stepNum}`);
    if (targetStep) {
      targetStep.classList.add('active');
    }

    // Update progress bar
    progressSteps.forEach(ps => {
      const psNum = parseInt(ps.dataset.step);
      ps.classList.remove('active', 'completed');
      if (psNum === stepNum) {
        ps.classList.add('active');
      } else if (psNum < stepNum) {
        ps.classList.add('completed');
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Open shortcuts page
  document.getElementById('open-shortcuts')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SHORTCUTS' });
  });

  // Open options page
  document.getElementById('open-options')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  });

  document.getElementById('open-settings-final')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  });

  // Finish tutorial
  document.getElementById('finish-tutorial')?.addEventListener('click', async () => {
    await chrome.storage.local.set({ tutorialCompleted: true });
    window.close();
  });

  // Skip tutorial
  document.getElementById('skip-tutorial')?.addEventListener('click', async () => {
    await chrome.storage.local.set({ tutorialCompleted: true });
    window.close();
  });

  // Mark tutorial as viewed (but not completed)
  chrome.storage.local.set({ tutorialViewed: true });
});
