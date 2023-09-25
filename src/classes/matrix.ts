export class Matrix {
    static identity(): number[][] {
        return [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ];
    }

    static multiplyByScalar(mat: number[][], scalar: number): number[][] {
        return mat.map((row) => row.map((element) => element * scalar));
    }

    static multiply(matA: number[][], matB: number[][]): number[][] {
        if (matA.length !== matB[0].length) {
            throw new RangeError('Matrices are not compatible for multiplication.');
        }

        const columns = matB.length;
        const rows = matA.length;
        const sumTermsCount = matA[0].length;
        const outputMatrix: number[][] = Array.from(Array(rows), () => []);

        for (let i = 0; i < rows; i += 1) {
            for (let j = 0; j < columns; j += 1) {
                for (let k = 0; k < sumTermsCount; k += 1) {
                    outputMatrix[i][j] += matA[i][k] * matB[k][j];
                }
            }
        }
        return outputMatrix;
    }
}
