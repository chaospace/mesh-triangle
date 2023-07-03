

describe('두점의 직선 방정식 테스트', () => {
    it.skip('기본테스트', () => {
        // Function to find the line given two points
        function lineFromPoints(P: number[], Q: number[]) {
            var a = Q[1] - P[1]
            var b = P[0] - Q[0]
            var c = a * (P[0]) + b * (P[1])

            if (b < 0)
                console.log("The line passing through " +
                    "points P and Q is:  " + a +
                    "x - " + b + "y = " + c)
            else
                console.log("The line passing through " +
                    "points P and Q is:  " + a +
                    "x + " + b + "y = " + c)
        }

        // Driver code
        var P = [3, 2]
        var Q = [2, 6]

        lineFromPoints(P, Q)
    });
})