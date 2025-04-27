type MatrixData = number[][];
export class Matrix {
    readonly data: MatrixData;

    static zero(rows = 4, columns = rows): Matrix {
        return new Matrix(Array.from(Array(rows), () => Array.from(Array(columns), () => 0)));
    }

    static identity(size = 4): Matrix {
        return new Matrix(
            Array.from(Array(size), (_, row) => Array.from(Array(size), (_, column) => (row === column ? 1 : 0))),
        );
    }

    static translation(xOffset: number, yOffset: number, zOffset: number): Matrix {
        const mat = Matrix.identity(4);
        mat.data[0][3] = xOffset;
        mat.data[1][3] = yOffset;
        mat.data[2][3] = zOffset;
        return mat;
    }

    static scaling(xFactor: number, yFactor = xFactor, zFactor = yFactor): Matrix {
        return new Matrix([
            [xFactor, 0, 0],
            [0, yFactor, 0],
            [0, 0, zFactor],
        ]).toHomogenous();
    }

    static rotationAroundZ(angle: number): Matrix {
        const { cos, sin } = Math;
        return new Matrix([
            [cos(angle), -sin(angle), 0],
            [sin(angle), cos(angle), 0],
            [0, 0, 1],
        ]).toHomogenous();
    }

    static multiplyArray(matArray: Matrix[]): Matrix {
        const firstMat = matArray[0];
        return matArray
            .slice(1)
            .reduce((multipliedMatrix, currentMatrix) => multipliedMatrix.multiply(currentMatrix), firstMat);
    }

    constructor(data: MatrixData) {
        this.data = data;
    }

    transpose() {
        const rows = this.data.length;
        const columns = this.data[0].length;
        const outputMatrix = Matrix.zero(columns, rows);

        for (let i = 0; i < rows; i += 1) {
            for (let j = 0; j < columns; j += 1) {
                outputMatrix.data[j][i] = this.data[i][j];
            }
        }
        return outputMatrix;
    }

    toHomogenous() {
        if (this.data.length !== 3) {
            throw new RangeError(`Only 3 dimensional matrices can be converted to homogenous coordinates.`);
        }

        return new Matrix([...this.data.map((row) => [...row, 0]), [0, 0, 0, 1]]);
    }

    add(mat: Matrix) {
        return new Matrix(
            this.data.map((row, rowIndex) =>
                row.map((column, columnIndex) => column + mat.data[rowIndex][columnIndex]),
            ),
        );
    }

    subtract(mat: Matrix) {
        return this.add(mat.multiplyByScalar(-1));
    }

    multiplyByScalar(scalar: number): Matrix {
        return new Matrix(this.data.map((row) => row.map((element) => element * scalar)));
    }

    multiply(mat: Matrix): Matrix {
        const matARows = this.data.length;
        const matAColumns = this.data[0].length;

        const matBRows = mat.data.length;
        const matBColumns = mat.data[0].length;

        if (matAColumns !== matBRows) {
            throw new RangeError(
                `Matrices of sizes '${matARows}x${matAColumns}' and '${matBRows}x${matBColumns}' are not compatible for multiplication.`,
            );
        }

        const outputMatrix = Matrix.zero(matARows, matBColumns);

        for (let i = 0; i < matARows; i += 1) {
            for (let j = 0; j < matBColumns; j += 1) {
                for (let k = 0; k < matAColumns; k += 1) {
                    outputMatrix.data[i][j] += this.data[i][k] * mat.data[k][j];
                }
            }
        }
        return outputMatrix;
    }
}
