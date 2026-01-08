let steps = [];
let currentStepIndex = 0;

function updateUI() {
    if(steps.length === 0) return;
    
    const step = steps[currentStepIndex];
    
    const desc = document.getElementById('descriptionBox');
    if(desc) desc.innerText = step.msg;
    
    const eq = document.getElementById('equationBox');
    if(eq) eq.innerText = step.eq || "";
    
    const count = document.getElementById('stepCounter');
    if(count) count.innerText = `${currentStepIndex + 1} / ${steps.length}`;
    
    renderMatrix(step.mat, step.h || [], step.label);
    
    if(step.line !== undefined) highlightCodeLine(step.line);

    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    if(prev) prev.disabled = currentStepIndex === 0;
    if(next) next.disabled = currentStepIndex === steps.length - 1;
}

function resetDemo() {
    const sel = document.getElementById('methodSelect');
    if(!sel) return;

    const method = sel.value;
    loadCode(method);
    
    if(method === 'gaussian') steps = generateGaussianSteps();
    else if(method === 'ero') steps = generateEROSteps();
    else steps = generateInverseSteps();

    currentStepIndex = 0;
    updateUI();
}

function nextStep() {
    if(currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        updateUI();
    }
}

function prevStep() {
    if(currentStepIndex > 0) {
        currentStepIndex--;
        updateUI();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('methodSelect')) {
        resetDemo();
    }
});