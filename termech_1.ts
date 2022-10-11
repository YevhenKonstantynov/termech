import fs from 'fs'
import { plot } from 'nodeplotlib'

const FILE_NAME = 'KonstantynovYP_113_K1_v1.2'

type Trajectory = {
    ti: number
    xi: number
    yi: number
}[]

class PointSystem {

    constructor(
        private a: number,
        private b: number,
        private c: number,
        private d: number,
        private output: fs.WriteStream
    ) {}

    private range(start: number, end: number) {
        return Array.from({ length: end - start + 1 }, (_, i) => i)
    }

    public getX(t: number) {
        return this.a * (t ** 2) + this.b
    }

    public getY(t: number) {
        return Math.sqrt(this.c * (t * t * t) + this.d)
    }

    public getTrajectory(t: number, scale = 1, n = 20) {
        const startPoint = 0.5 * t
        const endPoint = 1.5 * t
        const step = (endPoint - startPoint) / n

        const minX = Math.min(...this.range(0, n).map(i => this.getX(startPoint + i * step)))
        const minY = Math.min(...this.range(0, n).map(i => this.getY(startPoint + i * step)))
        const maxX = Math.max(...this.range(0, n).map(i => this.getX(startPoint + i * step)))
        const maxY = Math.max(...this.range(0, n).map(i => this.getY(startPoint + i * step)))

        const mash = scale / Math.min((maxX - minX), (maxY - minY))

        return this.range(0, n).map(i => ({
            ti: startPoint + i * step,
            xi: this.getX(startPoint + i * step) * mash,
            yi: this.getY(startPoint + i * step) * mash
        }))
    }

    public printTrajectory(list: Trajectory) {
        this.output.write(`Траекторія:\n`)
        list.forEach(({ ti, xi, yi }, i) => {
            this.output.write(`t${i} = ${ti.toFixed(3)}\t, x${i} =${xi.toFixed(5)}\t, y${i} =${yi.toFixed(5)}\n`)
        })
        this.output.write(`\n`)
    }

    public drawTrajectory(list: Trajectory, t1: number) {

        plot([
            {
                x: list.map(({ xi }) => xi),
                y: list.map(({ yi }) => yi),
                type: 'scatter'
            },
            {
                type: 'scatter',
                'line.color': 'red',
                x: list.filter(({ ti }) => Math.abs(ti - t1) < 0.01).map(({ xi }) => xi),
                y: list.filter(({ ti }) => Math.abs(ti - t1) < 0.01).map(({ yi }) => yi)
            }
        ])
    }

    public drawSpeed(
        vX: number,
        vY: number,
        t1: number,
        list: Trajectory
    ) {
        const offsetX = list.filter(({ ti }) => Math.abs(ti - t1) < 0.01).map(({ xi }) => xi)[ 0 ]
        const offsetY = list.filter(({ ti }) => Math.abs(ti - t1) < 0.01).map(({ yi }) => yi)[ 0 ]

        plot([
            {
                mode: 'lines',
                x: [ offsetX, offsetX ],
                y: [ offsetY, offsetY + vY ]
            },
            {
                mode: 'lines',
                x: [ offsetX, offsetX + vX ],
                y: [ offsetY, offsetY ]
            }, {
                mode: 'lines',
                x: [ offsetX, offsetX + vX ],
                y: [ offsetY, offsetY + vY ]
            }, {
                mode: 'lines',
                x: [ offsetX + vX, offsetX + vX ],
                y: [ offsetY, offsetY + vY ],
                line: {
                    dash: 'dashdot',
                    width: 2
                }
            }, {
                mode: 'lines',
                x: [ offsetX, offsetX + vX ],
                y: [ offsetY + vY, offsetY + vY ],
                line: {
                    dash: 'dashdot',
                    width: 2
                }
            },
            {
                x: list.map(({ xi }) => xi),
                y: list.map(({ yi }) => yi),
                type: 'scatter'
            },
            {
                type: 'scatter',
                'line.color': 'red',
                x: [ offsetX ],
                y: [ offsetY ]
            }
        ], {
            xaxis: {
                range: [ -10.5, -9.5 ]
            },
            yaxis: {
                range: [ 9, 10 ]
            }
        })
    }

    private rotate(cx: number, cy: number, x: number, y: number, angle: number) {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return [ (cos * (x - cx)) + (sin * (y - cy)) + cx, (cos * (y - cy)) - (sin * (x - cx)) + cy ]
    }

    public drawAcceleration(
        wX: number,
        wY: number,
        wT: number,
        wN: number,
        w: number,
        t1: number,
        list: Trajectory
    ) {
        const offsetX = list.filter(({ ti }) => Math.abs(ti - t1) < 0.01).map(({ xi }) => xi)[ 0 ]
        const offsetY = list.filter(({ ti }) => Math.abs(ti - t1) < 0.01).map(({ yi }) => yi)[ 0 ]

        const wNangle = Math.atan(wN / w)
        const [ wNx, wNy ] = this.rotate(offsetX, offsetY, offsetX + wN, offsetY, wNangle)

        const wTangle = Math.atan(wT / w)
        const [ wTx, wTy ] = this.rotate(offsetX, offsetY, offsetX + wT, offsetY, wTangle - wNangle - Math.PI / 2)

        plot([
            {
                mode: 'lines',
                x: [ offsetX, offsetX ],
                y: [ offsetY, offsetY + wY ],
                line: {
                    color: 'blue'
                }
            },
            {
                mode: 'lines',
                x: [ offsetX, offsetX + wX ],
                y: [ offsetY, offsetY ],
                line: {
                    color: 'blue'
                }
            },
            {
                mode: 'lines',
                x: [ offsetX, offsetX + wX ],
                y: [ offsetY, offsetY + wY ],
                line: {
                    color: 'black'
                }
            },
            {
                mode: 'lines',
                x: [ offsetX + wX, offsetX + wX ],
                y: [ offsetY, offsetY + wY ],
                line: {
                    dash: 'dashdot',
                    width: 2,
                    color: 'blue'
                }
            },
            {
                mode: 'lines',
                x: [ offsetX, offsetX + wX ],
                y: [ offsetY + wY, offsetY + wY ],
                line: {
                    dash: 'dashdot',
                    width: 2,
                    color: 'blue'
                }
            },
            {
                x: list.map(({ xi }) => xi),
                y: list.map(({ yi }) => yi),
                type: 'scatter'
            },
            {
                type: 'scatter',
                line: {
                    color: 'red'
                },
                x: [ offsetX ],
                y: [ offsetY ]
            },
            {
                type: 'scatter',
                line: {
                    color: 'pink'
                },
                x: [ offsetX, wNx ],
                y: [ offsetY, wNy ]
            },
            {
                type: 'scatter',
                line: {
                    color: 'pink'
                },
                x: [ offsetX, wTx ],
                y: [ offsetY, wTy ]
            },
            {
                mode: 'lines',
                x: [ wTx, offsetX + wX ],
                y: [ wTy, offsetY + wY ],
                line: {
                    dash: 'dashdot',
                    width: 2,
                    color: 'pink'
                }
            },
            {
                mode: 'lines',
                x: [ wNx, offsetX + wX ],
                y: [ wNy, offsetY + wY ],
                line: {
                    dash: 'dashdot',
                    width: 2,
                    color: 'pink'
                }
            },
        ], {
            xaxis: {
                range: [ -11, -9 ]
            },
            yaxis: {
                range: [ 9, 11 ]
            }
        })
    }

    public getVx(t: number) {
        return 2 * this.a * t
    }

    public getVy(t: number) {
        return (3 * this.c * t * t) / (2 * Math.sqrt(this.d + this.c * (t * t * t)))
    }

    public getV(t: number) {
        return Math.sqrt(this.getVx(t) * this.getVx(t) + this.getVy(t) * this.getVy(t))
    }

    public getWx(t: number) {
        return 2 * this.a
    }

    public getWy(t: number) {
        const numerator = (3 * this.c * t) * (this.c * (t * t * t) + 4 * this.d)
        const denominator = 4 * ((this.c * (t * t * t) + this.d) ** (3 / 2))
        return numerator / denominator
    }

    public getW(t: number) {
        return Math.sqrt(this.getWx(t) * this.getWx(t) + this.getWy(t) * this.getWy(t))
    }

    public getWt(t: number) {
        return (this.getVx(t) * this.getWx(t) + this.getVy(t) * this.getWy(t)) / this.getV(t)
    }

    public getWn(t: number) {
        return Math.sqrt(this.getW(t) * this.getW(t) - this.getWt(t) * this.getWt(t))
    }

    public getRo(t: number) {
        return (this.getV(t) * this.getV(t)) / this.getWn(t)
    }

}

const output = fs.createWriteStream(`./${FILE_NAME}.txt`)

const system = new PointSystem(0.43, -1.26, 0.72, 0.75, output)

const t1 = 0.65

const trajectory = system.getTrajectory(t1, 3)
const x = system.getX(t1)
const y = system.getY(t1)
const vX = system.getVx(t1)
const vY = system.getVy(t1)
const v = system.getV(t1)
const wX = system.getWx(t1)
const wY = system.getWy(t1)
const w = system.getW(t1)
const wT = system.getWt(t1)
const wN = system.getWn(t1)
const ro = system.getRo(t1)

system.printTrajectory(trajectory)

output.write(`Координата\t x1 = ${x.toFixed(5)}\n`)
output.write(`Координата\t y1 = ${y.toFixed(5)}\n`)

output.write(`Складова\t Vx = ${vX.toFixed(5)}\n`)
output.write(`Складова\t Vy = ${vY.toFixed(5)}\n`)
output.write(`Швидкість\t V = ${v.toFixed(5)}\n`)

output.write(`Складова\t Wx = ${wX.toFixed(5)}\n`)
output.write(`Складова\t Wy = ${wY.toFixed(5)}\n`)
output.write(`Прискорення\t W = ${w.toFixed(5)}\n`)

output.write(`Складова\t Wt = ${wT.toFixed(5)}\n`)
output.write(`Складова\t Wn = ${wN.toFixed(5)}\n`)
output.write(`Р. кривини\t Ro = ${ro.toFixed(5)}\n`)

output.end()


system.drawTrajectory(trajectory, t1)
system.drawSpeed(vX, vY, t1, trajectory)
system.drawAcceleration(wX, wY, wT, wN, w, t1, trajectory)