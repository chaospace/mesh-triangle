import { calculateImageColorData } from "@/utils/canvasHelper"
import { getScaleRatio } from "@/utils/getRatioSize";
import mapValue from "@/utils/mapValue";




const createParticle = (w: number, h: number) => {

    let x = (Math.random() * w);
    let y = (Math.random() * h);
    return {
        x,
        y,
        radius: 1,
        vRadius: 1,
        wt: 0,
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0
    }

}


const initialize = (ctx: CanvasRenderingContext2D, imageData: ImageData) => {
    // 컬러 정보 추출 (x, y)
    const cachedColor = calculateImageColorData(imageData, true);
    const total = imageData.width * imageData.height;
    const { width, height } = imageData;
    const maxPoints = 3600;
    const medArea = (total / maxPoints);
    const medRadius = Math.sqrt(medArea / Math.PI * 2);
    const minRadius = medRadius;
    const maxRadius = medRadius ** 2;
    const particles: any[] = [];
    const minDistFactor = 3.1;
    const damping = 0.4;

    const kSpeed = 3.0;

    for (let i = 0; i < maxPoints; i++) {
        particles.push(createParticle(imageData.width, imageData.height));
    }

    // ctx.scale(scale, scale);
    //https://openprocessing.org/sketch/1739548
    const boundArea = (p: any) => {
        let dx, dy, distance, scale, diff;
        let maxDist = p.radius;

        distance = dx = p.x - 0;
        dy = 0;
        diff = maxDist - distance!;
        if (diff > 0) {
            scale = diff / maxDist;
            scale = scale * scale;
            p.wt += scale;
            scale = scale * kSpeed / distance!;
            p.fx += dx! * scale;
            p.fy += dy! * scale;
        }

        distance = dy = p.y - 0;
        dx = 0;
        diff = maxDist - distance!;
        if (diff > 0) {
            scale = diff / maxDist;
            scale = scale * scale;
            p.wt += scale;
            scale = scale * kSpeed / distance!;
            p.fx += dx! * scale;
            p.fy += dy! * scale;
        }

        dx = p.x - width;
        dy = 0;
        distance = -dx;
        diff = maxDist - distance!;
        if (diff > 0) {
            scale = diff / maxDist;
            scale = scale * scale;
            p.wt += scale;
            scale = scale * kSpeed / distance!;
            p.fx += dx! * scale;
            p.fy += dy! * scale;
        }

        dy = p.y - height;
        dx = 0;
        distance = -dy;
        diff = maxDist - distance!;
        if (diff > 0) {
            scale = diff / maxDist;
            scale = scale * scale;
            p.wt += scale;
            scale = scale * kSpeed / distance!;
            p.fx += dx! * scale;
            p.fy += dy! * scale;
        }



    }


    const render = () => {

        for (let p of particles) {
            const px = ~~p.x;
            const py = ~~p.y;
            if (px >= 0 && px < width && py >= 0 && py < height) {
                const idx = (py * width + px);
                const average = cachedColor[idx];
                p.radius = mapValue(average, 0, 1, minRadius, maxRadius);
                p.vRadius = .1 + 5 * (1 - average);
            }
        }

        for (let i = 0; i < maxPoints; ++i) {
            let p = particles[i];
            p.fx = p.fy = p.wt = 0;
            p.vx *= damping;
            p.vy *= damping;
        }

        // particle intersection
        for (let i = 0; i < maxPoints - 1; i++) {
            const current = particles[i];
            for (let j = i + 1; j < maxPoints; j++) {
                const neighbor = particles[j];
                const dy = current.y - neighbor.y;
                const dx = current.x - neighbor.x;
                const r = Math.hypot(dx, dy);
                const neighborArea = current.radius * minDistFactor;
                // 주변 파티클과의 체크 기준보다 멀리 있는 점은 제외
                if (i === j || r > neighborArea) {
                    continue;
                }

                const maxDist = current.radius + neighbor.radius;
                const diff = maxDist - r;
                if (diff > 0) {
                    let scale = diff / maxDist;
                    scale = scale * scale;
                    current.wt += scale;
                    neighbor.wt += scale;
                    scale = scale * kSpeed / r;
                    current.fx += dx * scale;
                    current.fy += dy * scale;
                    neighbor.fx -= dx * scale;
                    neighbor.fy -= dy * scale;
                }
            }
        }



        // 영역제어 처리
        for (let p of particles) {

            boundArea(p);
            if (p.wt > 0) {
                p.vx += p.fx / p.wt;
                p.vy += p.fy / p.wt;
            }
            p.x += p.vx;
            p.y += p.vy;
        }


        // 드로우 처리
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.clearRect(0, 0, width, height);
        ctx.fill();
        ctx.closePath();

        for (let p of particles) {
            ctx.beginPath();
            ctx.fillStyle = 'black';
            ctx.arc(p.x, p.y, p.vRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
        }

        requestAnimationFrame(render);
    }

    render();


    return render;
}


export { initialize };