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
        
    return inverse

def solve_with_inverse(inverse_matrix, constants):
    results = []
    for row in inverse_matrix:
        row_sum = 0
        for i in range(len(row)):
            row_sum += row[i] * constants[i]
        results.append(row_sum)
    return results`
};