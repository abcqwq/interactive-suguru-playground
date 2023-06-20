from pysat.solvers import Glucose3
from pysat.formula import CNF

def g(i, j, v):
    return (i*n + j)*s_max + v

# Rule 1: All cell must be filled with exactly a single value in range 1 to s[region[i][j]].
def phi_1():
    phi_1 = CNF()
    for i in range(m):
        for j in range(n):
            for v in range(1, s[region[i][j]]):
                for v_ in range(v+1, s[region[i][j]]+1):
                    phi_1.append([-g(i, j, v), -g(i, j, v_)])
    return phi_1

# Rule 2: For each region k, all numbers in the set {1, 2, ..., s[k]} must exist in any cell of region k.
def phi_2():
    phi_2 = CNF()
    for k in range(len(s)):
        for v in range(1, s[k]+1):
            clause = []
            for i in range(m):
                for j in range(n):
                    if region[i][j] == k:
                        clause.append(g(i, j, v))
            phi_2.append(clause)
    return phi_2

def inside_grid(i, j):
    return i >= 0 and i < m and j >= 0 and j < n

# Rule 3: No two adjacent cells, either orthogonally or diagonally, can share a value.
def phi_3():
    dir = [[0, 1], [1, -1], [1, 0], [1, 1]]
    phi_3 = CNF()
    
    for i in range(m):
        for j in range(n):
            for [dx, dy] in dir:
                if inside_grid(i + dx, j + dy):
                    for v in range(1, min(s[region[i][j]], s[region[i+dx][j+dy]]) + 1):
                        phi_3.append([-g(i, j, v), -g(i + dx, j + dy, v)])
    return phi_3

def hint_constraint():
    constraint = CNF()
    for i in range(m):
        for j in range(n):
            if hint[i][j] > 0:
                constraint.append([g(i, j, hint[i][j])])
    return constraint

def clean_region():
    queue = []
    is_visited = [[False for c in range(n)] for r in range(m)]
    region_counter = 1

    def bfs(reg):
        while len(queue) > 0:
            [i, j] = queue.pop()
            is_visited[i][j] = True
            region[i][j] = region_counter
            for [dx, dy] in [[1, 0], [-1, 0], [0, 1], [0, -1]]:
                if inside_grid(i+dx, j+dy) and region[i+dx][j+dy] == reg and not is_visited[i+dx][j+dy]:
                    queue.append([i+dx, j+dy])

    for i in range(m):
        for j in range(n):
            if not is_visited[i][j]:
                queue.append([i, j])
                bfs(region[i][j])
                region_counter += 1

def retrieve_data(config):
    global m, n, hint, region, s, s_max, R
    m = config.get('m')
    n = config.get('n')
    hint = config.get('hint')
    region = config.get('region')
    clean_region()
    s = [0 for _ in range(max(max(row) for row in region) + 1)]
    for row in region:
        for col in row:
            s[col] += 1
    s_max = max(s)
    R = len(s)-1

def solve(config):
    retrieve_data(config)
    if m*n > 105:
        return {'solve_status': 'timeout', 'message': 'currently, the solver can only handle up to 121 cells (wip)'}
    solver = Glucose3()
    solver.append_formula(phi_1().clauses)
    solver.append_formula(phi_2().clauses)
    solver.append_formula(phi_3().clauses)
    solver.append_formula(hint_constraint().clauses)

    hint = [[-1 for j in range(n)] for i in range(m)]
    solve_status = 'unsolvable'
    message = 'this puzzle has no solution...'

    if solver.solve():
        solve_status = 'solved'
        message = 'success'
        solution = solver.get_model()
        for i in range(m):
            for j in range(n):
                for v in range(1, s[region[i][j]] + 1):
                    if g(i, j, v) in solution:
                        hint[i][j] = v
    return {'hint': hint, 'solve_status': solve_status, 'message': message}

def validate(config):
    retrieve_data(config)

    messages = []
    adjacent_error_message = lambda i, j: f'cell ({i+1}, {j+1}) shares a number with its adjacent cell(s).'
    region_error_message = lambda i, j: f'cell ({i+1}, {j+1}) shares a number with cell(s) in within the same region.'
    range_error_message = lambda i, j, sk: f'cell ({i+1}, {j+1}) has a number exceeding {sk}.'
    
    cv = [[0 for _ in range(s[k]+1)] for k in range(len(s))]
    for i in range(m):
        for j in range(n):
            if hint[i][j] <= s[region[i][j]]:
                cv[region[i][j]][hint[i][j]] += 1


    def validate_cell(i, j):
        dxdy = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]
        if hint[i][j] < 1 or hint[i][j] > s[region[i][j]]:
            messages.append(range_error_message(i, j, s[region[i][j]]))

        has_adjacent_cell = False
        for [dx, dy] in dxdy:
            if inside_grid(i+dx, j+dy):
                has_adjacent_cell = has_adjacent_cell or hint[i][j] == hint[i+dx][j+dy]
        if has_adjacent_cell:
            messages.append(adjacent_error_message(i, j))
        
        if hint[i][j] <= s[region[i][j]] and cv[region[i][j]][hint[i][j]] > 1:
            messages.append(region_error_message(i, j))

    for i in range(m):
        for j in range(n):
            validate_cell(i, j)

    return {'hint': hint, 'solve_status': 'validation_success' if len(messages) == 0 else 'unsolved', 'message': f'there are {len(messages)} constraint(s) not met' if len(messages) > 0 else 'your configuration is correct, well done.'}
