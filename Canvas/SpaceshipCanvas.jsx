import React, { Component, useEffect, useRef } from 'react';
import p5 from 'p5'
import './SpaceshipCanvas.css'
class SpaceshipCanvas extends Component {
    constructor(props) {
      super(props);
      this.myRef = React.createRef();
    }
  
    Sketch = (p) => {
        class Particle {
            constructor(p, position) {
              this.position = position.copy();
              this.velocity = p5.Vector.random2D().mult(p.random(1, 2));
              this.lifespan = 255; 
            }
            update() {
              this.position.add(this.velocity);
              this.lifespan -= 10; 
            }
            show(p) {
              p.noStroke();
              p.fill(0, this.lifespan);
              p.ellipse(this.position.x, this.position.y, 3, 3);
            }
            isDone() {
              return this.lifespan <= 0;
            }
          }
        let position, velocity, noiseOffset = 0;
        let trail = [], obstacles = [], bullets = [], particles = []; 
        let obstacleRate = 100, shootRate = 30;
        let lastShot = 0;

        //define action functions 
        const explode = (position) => {
            for (let i = 0; i < 10; i++) { 
              particles.push(new Particle(p, position));
            }
          };
        const shoot = (targetDirection) => {
            bullets.push({ position: position.copy(), velocity: p5.Vector.fromAngle(targetDirection).setMag(5) });
            lastShot = p.frameCount;
          };
          const checkCollision = (bullet, obstacle) => {
            let d = p.dist(bullet.position.x, bullet.position.y, obstacle.position.x, obstacle.position.y);
            return d < (obstacle.size / 2 + 2.5);
          };
        const spawnObstacle = () => {
          const edge = p.floor(p.random(4));
          let x, y;
          switch (edge) {
            case 0:
              x = p.random(p.width);
              y = -10;
              break;
            case 1:
              x = p.width + 10;
              y = p.random(p.height);
              break;
            case 2:
              x = p.random(p.width);
              y = p.height + 10;
              break;
            case 3:
              x = -10;
              y = p.random(p.height);
              break;
          }
          const obstacle = {
            position: p.createVector(x, y),
            size: p.random(10, 15),
            numVertices: 6 + Math.floor(p.random(5))
          };
          obstacles.push(obstacle);
        };
  
  
      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        position = p.createVector(p.width / 2, p.height / 2);
        velocity = p.createVector(0, 0);
        p.background(256, 99);
      };
  
      p.draw = () => {
        p.fill(256, 99);
        p.noStroke();
        p.rect(0, 0, p.width, p.height); 

        //obstacle logic
        //obstacles will spawn on random locations on the sketch and move slowly to the AI
        if (p.frameCount % obstacleRate === 0) {
            spawnObstacle();
        }
        obstacles.forEach(obstacle => {
            const dir = p5.Vector.sub(position, obstacle.position); 
            dir.normalize(); 
            dir.mult(2);
            obstacle.position.add(dir);     
            p.fill(0, 0, 0);
            p.beginShape();
            const numVertices = obstacle.numVertices;
            for (let i = 0; i < numVertices; i++) {
                const angle = p.TWO_PI / numVertices * i;
                const x = obstacle.position.x + p.cos(angle) * obstacle.size;
                const y = obstacle.position.y + p.sin(angle) * obstacle.size;
                p.vertex(x, y);
            }
            p.endShape(p.CLOSE);
        });
        //hit logic for obstacles with shots
        obstacles = obstacles.filter(obstacle => {
            let isHit = false;
            bullets = bullets.filter(bullet => {
              if (checkCollision(bullet, obstacle)) {
                explode(obstacle.position);
                isHit = true;
                return false;
              }
              return true;
            });
            return !isHit;
        });
        //particle logic
        particles.forEach(particle => {
            particle.update();
            particle.show(p);
        });
        particles = particles.filter(particle => !particle.isDone());
        bullets.forEach(bullet => {
            let prevPosition = p.createVector(bullet.position.x - bullet.velocity.x, bullet.position.y - bullet.velocity.y);
            bullet.position.add(bullet.velocity);
            p.stroke(0, 0, 0);
            p.strokeWeight(2);
            p.line(prevPosition.x, prevPosition.y, bullet.position.x, bullet.position.y);
            p.noStroke();
        });
        //AI logic
        //the AI will move randomly on the screen using perlin noise to pretend and natural fluid motion while it tracks near obstacles and shoots on them
        bullets = bullets.filter(bullet => bullet.position.x > 0 && bullet.position.x < p.width && bullet.position.y > 0 && bullet.position.y < p.height);
        obstacles = obstacles.filter(obstacle => {
            const dirToObstacle = p5.Vector.sub(obstacle.position, position);
            if (dirToObstacle.mag() < 500) {
              if (p.frameCount - lastShot > shootRate) {
                shoot(dirToObstacle.heading());
              }
            }
            return true;
        });
        const angle = p.noise(noiseOffset) * p.TWO_PI * 2;
        const force = p5.Vector.fromAngle(angle);
        force.setMag(0.2); 
        velocity.add(force);
        position.add(velocity);
        trail.push({ x: position.x, y: position.y });
        if (trail.length > 10) {
          trail.shift();
        }
        trail.forEach((pos, index) => {
          const alpha = p.map(index, 0, trail.length, 0, 255);
          p.fill(0, 0, 0, alpha);
          p.noStroke();
          p.ellipse(pos.x, pos.y, 10, 10);
          p.fill(256, 256, 256, alpha);
          p.ellipse(pos.x, pos.y, 5, 5);
        });
        p.push();
        p.fill(0, 0, 0);
        p.noStroke();
        p.translate(position.x, position.y);
        p.rotate(velocity.heading());
        p.triangle(-15, -15 / 2, -15, 15 / 2, 15, 0);
        p.triangle(-15 / 2, -15, -15 / 2, 15, 15 / 4, 0);
        p.pop();
        noiseOffset += 0.01;
        velocity.mult(0.95);
        if (position.x > p.width) position.x = 0;
        if (position.x < 0) position.x = p.width;
        if (position.y > p.height) position.y = 0;
        if (position.y < 0) position.y = p.height;
      };
    };
    componentDidMount() {
      this.myP5 = new p5(this.Sketch, this.myRef.current);
    }
    componentWillUnmount() {
        if (this.myP5) {
            this.myP5.remove();
          }
      }
    render() {
      return <div ref={this.myRef} className="spaceshipCanvas"></div>;
    }
  }
  
  export default SpaceshipCanvas;