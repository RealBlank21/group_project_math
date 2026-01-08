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
            
            let txt = val;
            if(typeof val === 'number') {
                    txt = Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
            } else if (val === null) {
                txt = "";
            }
            cell.innerText = txt;
            
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