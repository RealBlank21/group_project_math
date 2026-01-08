function deepCopy(m) { return JSON.parse(JSON.stringify(m)); }

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
    
    let solution = new Array(n).fill(0);
    s.push({ msg: "Forward Elimination Complete. Starting Back Substitution.", eq: "Solving variables from bottom up.", mat: deepCopy(m), line: 17 });

    for (let i = n - 1; i >= 0; i--) {
        let sum = 0;
        let sumParts = [];
        
        for(let j = i + 1; j < n; j++) {
            let val = m[i][j] * solution[j];
            sum += val;
            sumParts.push(`(${m[i][j].toFixed(2)} * ${solution[j].toFixed(2)})`);
        }
        
        let rhs = m[i][n];
        let coeff = m[i][i];
        let val = (rhs - sum) / coeff;
        solution[i] = val;
        
        let eqStr = `x${i+1} = (${rhs.toFixed(2)} - [${sumParts.join('+') || '0'}]) / ${coeff.toFixed(2)}`;

        s.push({ 
            msg: `Solving for x${i+1}`, 
            eq: eqStr, 
            mat: deepCopy(m), 
            h:[[i,0],[i,1],[i,2],[i,3,'highlight']],
            line: 24 
        });
    }

    s.push({ msg: "Gaussian Elimination Complete", eq: `Solution: [${solution.map(x=>x.toFixed(2)).join(', ')}]`, mat: [solution], line: 26 });
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
    
    s.push({ msg: "Step 1: Determinant. Prepare Extended Matrix.", eq: "Append Col 0 & 1 to the end.", mat: deepCopy(m), line: 1 });

    let extended = [];
    for(let r of m) extended.push([...r, r[0], r[1]]);
    
    s.push({ msg: "Extended Matrix Created", eq: "Rule of Sarrus setup", mat: deepCopy(extended), line: 4 });

    let posSum = 0;
    let negSum = 0;

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

    s.push({ msg: "Step 2: Matrix of Minors", eq: "For each cell, calculate det of remaining 2x2 matrix.", mat: deepCopy(m), line: 26 });
    
    let minors = [[null,null,null],[null,null,null],[null,null,null]];
    
    for(let i=0; i<3; i++) {
        for(let j=0; j<3; j++) {
            let h = [];
            let subVals = [];
            
            for(let c=0; c<3; c++) h.push([i, c, 'dimmed']);
            for(let r=0; r<3; r++) h.push([r, j, 'dimmed']);
            
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

    s.push({ msg: "Step 6: Solve X = A^(-1) * B", eq: "Multiply Inverse Matrix with Constants Vector B", mat: deepCopy(inverse), line: 62 });

    let B = INITIAL_MATRIX.map(r => r[3]);
    let finalSol = [];

    for(let i=0; i<3; i++) {
        let row = inverse[i];
        let val = 0;
        let sumParts = [];
        let h = [];

        for(let j=0; j<3; j++) {
            val += row[j] * B[j];
            sumParts.push(`(${row[j].toFixed(2)} * ${B[j]})`);
            h.push([i, j, 'highlight']);
        }
        finalSol.push(val);

        s.push({
            msg: `Calculating x${i+1} (Row ${i+1} dot B)`,
            eq: `x${i+1} = ${sumParts.join(' + ')}\n = ${val.toFixed(2)}`,
            mat: deepCopy(inverse),
            h: h,
            line: 65 
        });
    }

    s.push({ msg: "Solution Found", eq: `X = [${finalSol.map(x=>x.toFixed(2)).join(', ')}]`, mat: [finalSol], line: 67 });

    return s;
}