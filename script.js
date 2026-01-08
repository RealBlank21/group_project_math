/* Matrix Algorithms Interactive Logic 
    Handles state management, algorithm step generation, and DOM rendering.
*/

const INITIAL_MATRIX = [
    [2, 1, -1, 8],
    [-3, -1, 2, -11],
    [-2, 1, 2, -3]
];

const INITIAL_COEFFS = [
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2]
];

let steps = [];
let currentStepIndex = 0;

// Code strings mapped to methods
const CODE_SNIPPETS = {
    gaussian: `def forward_elimination(matrix):
    n = len(matrix)
    for i in range(n):
        pivot = matrix[i][i]
        
        # Normalize Pivot
        if abs(pivot) > 1e-9 and (pivot != 1):
            for k in range(n + 1):
                matrix[i][k] = matrix[i][k] / pivot
            pivot = 1 

        # Eliminate rows below
        for j in range(i + 1, n):
            val_below = matrix[j][i]
            if abs(val_below) < 1e-9: continue
            
            for k in range(n + 1):
                matrix[j][k] = matrix[j][k] - (val_below * matrix[i][k])
    return matrix

def back_substitution(matrix):
    n = len(matrix)
    solution = [0] * n
    for i in range(n - 1, -1, -1):
        sum_ax = 0
        for j in range(i + 1, n):
            sum_ax += matrix[i][j] * solution[j]
        solution[i] = (matrix[i][n] - sum_ax) / matrix[i][i]
    return solution`,

    ero: `def ero(matrix):
    n = len(matrix)
    for i in range(n):
        pivot = matrix[i][i]
        
        # Normalize
        if abs(pivot) > 1e-9 and (pivot != 1):
            for k in range(n + 1):
                matrix[i][k] = matrix[i][k] / pivot
        
        # Eliminate all other rows
        for j in range(n):
            if i == j: continue
            val_in_col = matrix[j][i]
            if abs(val_in_col) < 1e-9: continue

            for k in range(n + 1):
                matrix[j][k] = matrix[j][k] - (val_in_col * matrix[i][k])
                
    return [row[n] for row in matrix]`,

    inverse: `def get_determinant(matrix):
    extended = []
    # 1. Extend Matrix (Rule of Sarrus)
    for row in matrix:
        extended.append(row + [row[0], row[1]])

    pos_sum = 0
    neg_sum = 0

    # 2. Calculate Diagonals
    for i in range(3):
        # Positive Diagonals (Top-left to Bottom-right)
        pos_sum += extended[0][i] * extended[1][i+1] * extended[2][i+2]
        
        # Negative Diagonals (Bottom-left to Top-right)
        neg_sum += extended[2][i] * extended[1][i+1] * extended[0][i+2]

    return pos_sum - neg_sum

def get_minor(matrix, r_skip, c_skip):
    # Extract 2x2 submatrix
    sub = []
    for i in range(3):
        if i == r_skip: continue
        row = []
        for j in range(3):
            if j == c_skip: continue
            row.append(matrix[i][j])
        sub.append(row)
    
    # ad - bc
    return (sub[0][0]*sub[1][1]) - (sub[0][1]*sub[1][0])

def get_inverse_matrix(matrix):
    det = get_determinant(matrix)
    
    # 3. Calculate Matrix of Minors
    minors = []
    for i in range(3):
        row = []
        for j in range(3):
            row.append(get_minor(matrix, i, j))
        minors.append(row)

    # 4. Cofactors (+ - +)
    cofactors = []
    for i in range(3):
        row = []
        for j in range(3):
            val = minors[i][j]
            if (i+j) % 2 != 0: val *= -1
            row.append(val)
        cofactors.append(row)

    # 5. Adjoint (Transpose)
    adjoint = []
    for i in range(3):
        row = []
        for j in range(3):
            row.append(cofactors[j][i])
        adjoint.append(row)
        
    # 6. Inverse (1/Det)
    inverse = []
    for i in range(3):
        row = []
        for j in range(3):
            row.append(adjoint[i][j] * (1/det))
        inverse.append(row)
        
    return inverse`
};

/* --- DOM RENDERERS --- */

function renderMatrix(matrix, highlightCoords = [], label = "") {
    const container = document.getElementById('matrixContainer');
    if(!container) return;
    container.innerHTML = '';
    
    let is1D = !Array.isArray(matrix[0]);
    let displayData = is1D ? [matrix] : matrix;

    if(label) {
        let l = document.createElement('div');
        l.innerText = label;
        l.style.marginBottom = "5px";
        l.style.fontWeight = "bold";
        container.appendChild(l);
    }

    displayData.forEach((row, rIdx) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'matrix-row';
        row.forEach((val, cIdx) => {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            
            // Number formatting
            let txt = val;
            if(typeof val === 'number') {
                    txt = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
            } else if (val === null) {
                txt = "";
            }
            cell.innerText = txt;
            
            // Highlight logic
            const hData = highlightCoords.find(h => h[0] === rIdx && h[1] === cIdx);
            if (hData) {
                cell.classList.add('highlight'); 
                if (hData.length > 2) {
                    cell.classList.add(hData[2]); 
                    if(hData[2] === 'dimmed') {
                        cell.classList.remove('highlight');
                    }
                }
            }
            
            // Variable labels for 1D arrays
            if (is1D) {
                const lbl = document.createElement('div');
                lbl.className = 'tiny-label';
                lbl.innerText = rIdx === 0 ? 'x' : rIdx === 1 ? 'y' : 'z';
                cell.appendChild(lbl);
            }

            rowDiv.appendChild(cell);
        });
        container.appendChild(rowDiv);
    });
}

function loadCode(method) {
    const container = document.getElementById('codeBlock');
    if(!container) return;
    container.innerHTML = '';
    
    const lines = CODE_SNIPPETS[method].split('\n');
    lines.forEach((line, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'code-line';
        lineDiv.id = `line-${index}`;
        
        // Use Prism to highlight the string content
        const highlightedHtml = Prism.highlight(line, Prism.languages.python, 'python');
        lineDiv.innerHTML = (line.trim() === '') ? '&nbsp;' : highlightedHtml;
        
        container.appendChild(lineDiv);
    });
}

function highlightCodeLine(lineIdx) {
    document.querySelectorAll('.active-line').forEach(el => el.classList.remove('active-line'));
    const el = document.getElementById(`line-${lineIdx}`);
    if(el) {
        el.classList.add('active-line');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function deepCopy(m) { return JSON.parse(JSON.stringify(m)); }

/* --- ALGORITHM STEP GENERATORS --- */

function generateGaussianSteps() {
    let s = [];
    let m = deepCopy(INITIAL_MATRIX);
    let n = m.length;

    s.push({ msg: "Start: Augmented Matrix [A|B]", eq: "Initial System", mat: deepCopy(m), line: 0 });

    for (let i = 0; i < n; i++) {
        let pivot = m[i][i];
        s.push({ msg: `Processing Column ${i+1}. Pivot is ${pivot.toFixed(2)}`, eq: `Pivot = Matrix[${i}][${i}]`, mat: deepCopy(m), line: 4, h:[[i,i]] });

        if (Math.abs(pivot) > 1e-9 && pivot !== 1) {
            for (let k = 0; k < n + 1; k++) m[i][k] /= pivot;
            s.push({ msg: `Normalizing Row ${i+1}`, eq: `R${i+1} = R${i+1} / ${pivot.toFixed(2)}`, mat: deepCopy(m), line: 8, h:[[i,0],[i,1],[i,2],[i,3]] });
        }

        for (let j = i + 1; j < n; j++) {
            let val_below = m[j][i];
            if (Math.abs(val_below) < 1e-9) continue;
            
            s.push({ msg: `Targeting Row ${j+1}`, eq: `Value below pivot is ${val_below.toFixed(2)}`, mat: deepCopy(m), line: 13, h:[[j,i]] });
            
            for (let k = 0; k < n + 1; k++) {
                m[j][k] = m[j][k] - (val_below * m[i][k]);
            }
            s.push({ msg: `Eliminating value below pivot`, eq: `R${j+1} = R${j+1} - (${val_below.toFixed(2)} × R${i+1})`, mat: deepCopy(m), line: 17, h:[[j,0],[j,1],[j,2],[j,3]] });
        }
    }
    
    // Back Sub
    let solution = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        for(let j = i + 1; j < n; j++) sum += m[i][j] * solution[j];
        solution[i] = (m[i][n] - sum) / m[i][i];
    }
    s.push({ msg: "After Back Substitution", eq: `Solution: [${solution.map(x=>x.toFixed(2)).join(', ')}]`, mat: [solution], line: 26 });
    return s;
}

function generateEROSteps() {
    let s = [];
    let m = deepCopy(INITIAL_MATRIX);
    let n = m.length;

    s.push({ msg: "Start: Gauss-Jordan (ERO)", eq: "Goal: Identity Matrix", mat: deepCopy(m), line: 0 });

    for(let i=0; i<n; i++) {
        let pivot = m[i][i];
        s.push({ msg: `Pivot at [${i},${i}]`, eq: `Pivot = ${pivot.toFixed(2)}`, mat: deepCopy(m), line: 3, h:[[i,i]] });

        if (Math.abs(pivot) > 1e-9 && pivot !== 1) {
            for (let k = 0; k < n + 1; k++) m[i][k] /= pivot;
            s.push({ msg: `Normalize Row ${i+1}`, eq: `R${i+1} = R${i+1} / ${pivot.toFixed(2)}`, mat: deepCopy(m), line: 8, h:[[i,0],[i,1],[i,2],[i,3]] });
        }

        for(let j=0; j<n; j++) {
            if(i === j) continue;
            let val = m[j][i];
            if(Math.abs(val) < 1e-9) continue;
            
            s.push({ msg: `Eliminating [${j},${i}]`, eq: `Target = ${val.toFixed(2)}`, mat: deepCopy(m), line: 13, h:[[j,i]] });
            for (let k = 0; k < n + 1; k++) m[j][k] -= val * m[i][k];
            s.push({ msg: `Row Operation`, eq: `R${j+1} = R${j+1} - (${val.toFixed(2)} × R${i+1})`, mat: deepCopy(m), line: 17, h:[[j,0],[j,1],[j,2],[j,3]] });
        }
    }
    let res = m.map(r => r[n]);
    s.push({ msg: "Diagonal Matrix achieved. Solution column extracted.", eq: `Solution = [${res.map(x=>x.toFixed(2)).join(', ')}]`, mat: [res], line: 20 });
    return s;
}

function generateInverseSteps() {
    let s = [];
    let m = deepCopy(INITIAL_COEFFS);
    
    // --- PHASE 1: DETERMINANT (EXTENDED) ---
    s.push({ msg: "Step 1: Determinant. Prepare Extended Matrix.", eq: "Append Col 0 & 1 to the end.", mat: deepCopy(m), line: 1 });

    let extended = [];
    for(let r of m) extended.push([...r, r[0], r[1]]);
    
    s.push({ msg: "Extended Matrix Created", eq: "Rule of Sarrus setup", mat: deepCopy(extended), line: 4 });

    let posSum = 0;
    let negSum = 0;

    // Positive Diagonals
    for(let i=0; i<3; i++) {
        let val = extended[0][i] * extended[1][i+1] * extended[2][i+2];
        posSum += val;
        s.push({
            msg: `Positive Diagonal ${i+1}`,
            eq: `(${extended[0][i]} × ${extended[1][i+1]} × ${extended[2][i+2]}) = ${val}`,
            mat: deepCopy(extended),
            h: [[0,i,'highlight-pos'], [1,i+1,'highlight-pos'], [2,i+2,'highlight-pos']],
            line: 13
        });
    }
    s.push({ msg: "Sum of Positive Diagonals", eq: `Pos_Sum = ${posSum}`, mat: deepCopy(extended), line: 13 });

    // Negative Diagonals
    for(let i=0; i<3; i++) {
        let val = extended[2][i] * extended[1][i+1] * extended[0][i+2];
        negSum += val;
        s.push({
            msg: `Negative Diagonal ${i+1}`,
            eq: `(${extended[2][i]} × ${extended[1][i+1]} × ${extended[0][i+2]}) = ${val}`,
            mat: deepCopy(extended),
            h: [[2,i,'highlight-neg'], [1,i+1,'highlight-neg'], [0,i+2,'highlight-neg']],
            line: 16
        });
    }
    
    let det = posSum - negSum;
    s.push({ msg: "Final Determinant Calculation", eq: `Det = Pos_Sum - Neg_Sum\n    = ${posSum} - ${negSum} = ${det}`, mat: deepCopy(m), line: 18 });

    // --- PHASE 2: MATRIX OF MINORS ---
    s.push({ msg: "Step 2: Matrix of Minors", eq: "For each cell, calculate det of remaining 2x2 matrix.", mat: deepCopy(m), line: 26 });
    
    let minors = [[null,null,null],[null,null,null],[null,null,null]];
    
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            let h = [];
            let subVals = [];
            
            // Dim logic
            for(let c=0; c<3; c++) h.push([i, c, 'dimmed']);
            for(let r=0; r<3; r++) h.push([r, j, 'dimmed']);
            
            // Submatrix logic
            for(let r=0; r<3; r++) {
                if(r===i) continue;
                for(let c=0; c<3; c++) {
                    if(c===j) continue;
                    h.push([r, c, 'submatrix']);
                    subVals.push(m[r][c]);
                }
            }

            let val = subVals[0]*subVals[3] - subVals[1]*subVals[2];
            minors[i][j] = val; 
            
            s.push({
                msg: `Calculate Minor for Row ${i} Col ${j}`,
                eq: `| ${subVals[0]}  ${subVals[1]} |\n| ${subVals[2]}  ${subVals[3]} | = (${subVals[0]}×${subVals[3]}) - (${subVals[1]}×${subVals[2]}) = ${val}`,
                mat: deepCopy(m),
                h: h,
                line: 31
            });
        }
    }
    
    // --- PHASE 3: COFACTORS ---
    s.push({ msg: "Step 3: Cofactor Matrix", eq: "Apply Checkerboard Signs:\n+ - +\n- + -\n+ - +", mat: deepCopy(minors), line: 36 });
    
    let cofactors = deepCopy(minors);
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            if((i+j)%2 !== 0) {
                let old = cofactors[i][j];
                cofactors[i][j] *= -1;
                s.push({
                    msg: `Apply Sign Change at [${i},${j}]`,
                    eq: `Position (${i},${j}) is odd sum -> Sign (-)\n${old} × -1 = ${cofactors[i][j]}`,
                    mat: deepCopy(cofactors),
                    h: [[i,j,'highlight-neg']],
                    line: 40
                });
            }
        }
    }

    // --- PHASE 4: ADJOINT ---
    s.push({ msg: "Step 4: Adjoint Matrix (Transpose)", eq: "Swap Rows with Columns.", mat: deepCopy(cofactors), line: 45 });
    
    let adjoint = deepCopy(cofactors);
    let swaps = [[0,1], [0,2], [1,2]]; 
    
    for(let pair of swaps) {
        let r = pair[0]; 
        let c = pair[1];
        let val1 = adjoint[r][c];
        let val2 = adjoint[c][r];
        
        adjoint[r][c] = val2;
        adjoint[c][r] = val1;
        
        s.push({
            msg: `Swapping [${r},${c}] with [${c},${r}]`,
            eq: `${val1} <---> ${val2}`,
            mat: deepCopy(adjoint),
            h: [[r,c,'highlight'], [c,r,'highlight']],
            line: 49
        });
    }
    s.push({ msg: "Adjoint Matrix Complete", eq: "Adj(A)", mat: deepCopy(adjoint), line: 51 });

    // --- PHASE 5: INVERSE ---
    s.push({ msg: "Step 5: Inverse Matrix", eq: `Multiply by 1/Det (1/${det})`, mat: deepCopy(adjoint), line: 54 });
    
    let inverse = [[0,0,0],[0,0,0],[0,0,0]];
    
    for(let i=0; i<3; i++) {
        let h = [];
        for(let j=0; j<3; j++) {
            inverse[i][j] = adjoint[i][j] * (1/det);
            h.push([i,j,'highlight-pos']);
        }
        s.push({
            msg: `Calculating Row ${i}`,
            eq: `Row ${i} values divided by ${det}`,
            mat: deepCopy(inverse),
            h: h,
            line: 57
        });
    }
    
    s.push({ msg: "Matrix Inverse Complete", eq: "A^(-1)", mat: deepCopy(inverse), line: 59 });
    return s;
}

/* --- CONTROL LOGIC --- */

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

// Initialization on load
document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on the demo page
    if(document.getElementById('methodSelect')) {
        resetDemo();
    }
});