
let canvas = null, ctx = null;

const EPS = 1e-2;
let diagonal = null;

let secondsPassed = 0;
let oldTimeStamp = 0;

const CIRCLE_CNT = 2000;
let circles =  null;
let circlesLastIndex = 0;

const CLEAR_COLOR = "#191919"

let index = 1;
let messages = ['', 'Hi', 'I\'m Stefan', 'a student', 'a dreamer',
  'a problem solver', 'can you', 'challenge me?', 'Stef.']; 

class Vector2d {//{{{
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static add(v1, v2) {
    return new Vector2d(v1.x + v2.x, v1.y + v2.y);
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
  }

  static sub(fst, sec) {
    return new Vector2d(fst.x - sec.x, fst.y - sec.y);
  }

  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
  }

  static mul(vec, val) {
    return new Vector2d(vec.x * val, vec.y * val);
  }

  mul(val) {
    this.x *= val;
    this.y *= val;
  }

  get mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  set mag(newMag) {
    let prevMag = this.mag;
    let newX = this.x * newMag / prevMag;
    let newY = this.y * newMag / prevMag;
    this.x = newX;
    this.y = newY;
  }

  static dist(v1, v2) {
    return Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
  }
}

//}}}

class Circle {//{{{

  static MAX_MAG = 270;
  static ERR_MAG = 5;

  constructor(target = Vector2d(0, 0)) {
    this.target = target;
    this.position = new Vector2d(Math.random() * canvas.width, Math.random() * canvas.height);
    this.velocity = new Vector2d((Math.random() - 0.5) * 27, (Math.random() - 0.5) * 27);
    this.acceleration = new Vector2d(0, 0);
    this.radius = randInt(5) + 3;
    this.targetColor = [25, 25, 25];
    this.color = [25, 25, 25];
  }

  display() {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = colorFromPixel(this.color);
    ctx.fill();
  }

  seekTarget() {
    let desired = Vector2d.sub(this.target, this.position);
    let err = Vector2d.sub(desired, this.velocity);
    err.mag = Circle.ERR_MAG;
    this.acceleration.add(err);
  }

  isDone() {
    return arraysEqual(this.color, this.targetColor) && Vector2d.dist(this.position, this.target) < EPS;
  }

  updateColor() {
    for (let i = 0; i < 3; ++ i) {
      if (this.targetColor[i] > this.color[i]) {
        this.color[i] += Math.min(5, this.targetColor[i] - this.color[i]);
      }
      else if (this.targetColor[i] < this.color[i]) {
        this.color[i] -= Math.min(5, this.color[i] - this.targetColor[i]);
      }
    }
  }

  update(delta) {

    this.seekTarget();
    this.updateColor();

    this.velocity.add(this.acceleration);

    let d = Math.min(Vector2d.dist(this.position, this.target), diagonal);
    this.velocity.mag = Math.min(Circle.MAX_MAG, Math.pow((Circle.MAX_MAG / diagonal) * d, 0.7));

    this.position.add(this.velocity);
    this.acceleration.mul(0);

    this.position.add(Vector2d.mul(this.velocity, delta));

    return true;
  }
}

//}}}

// UTILS {{{

function fixDpi() {
  let dpi = window.devicePixelRatio;
  let style_height = getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
  let style_width = getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

  canvas.height = style_height * dpi;
  canvas.width = style_width * dpi;
  diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);

  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function intToHex(val) {

  let ret = "";
  for (let bit = 4; bit >= 0; bit -= 4) {
    let aux = (val >> bit) & 15;
    if (aux < 10) ret += aux.toString();
    else {
      ret += String.fromCharCode(97 + aux - 10);
    }
  }

  return ret;
}

function brightness(pixel) {
  return (pixel[0] + pixel[1] + pixel[2]) / 3;
}

function colorFromPixel(pixel) {
  return '#' +
         `${intToHex(pixel[0])}` + 
         `${intToHex(pixel[1])}` + 
         `${intToHex(pixel[2])}` + 
         `${intToHex(188)}`; 
}

function timestamp() {
  return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

function randInt(x) {
  return Math.floor(Math.random() * x);
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; ++ i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}//}}}

async function animationLoop() {

  let timeStamp = timestamp();
  let delta = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;

  if (circlesLastIndex) {

    ctx.fillStyle = CLEAR_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let i = 0;

    while (i <= circlesLastIndex) {

      circles[i].update(delta);

      if (circles[i].isDone()) {
        [circles[i], circles[circlesLastIndex]] = [circles[circlesLastIndex], circles[i]];
        -- circlesLastIndex;
        continue;
      }

      ++ i;
    }

    for (circle of circles) {
      circle.display();
    }
  }

  if (circlesLastIndex <= 0) {
    await new Promise(r => setTimeout(r, 700));
    await update();
    index = (index + 1) % messages.length;
  }

  window.requestAnimationFrame(animationLoop);
}

function displayMessage() {

  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";

  if (window.matchMedia("(min-width: 1000px)").matches) {
    ctx.font = "9vw Courier";
  }
  else if (window.matchMedia("(min-width: 800px)").matches) {
    ctx.font = "16vw Courier";
  }
  else if (window.matchMedia("(min-width: 600px)").matches) {
    ctx.font = "18vw Courier";
  }
  else {
    ctx.font = "20vw Courier";
  }

  ctx.textAlign = "center";
  ctx.fillText(messages[index], canvas.width / 2, canvas.height / 2);
}

async function init() {

  canvas = document.getElementById("home-canvas");
  ctx = canvas.getContext("2d");

  fixDpi();

  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  window.addEventListener("resize", async () => {
    fixDpi();
    await update();
  }, true);

  initPoints();
}

function initPoints() {
  circles = [];
  let target = null;
  for (let i = 0; i < CIRCLE_CNT; ++ i) {
    target = new Vector2d(randInt(canvas.width * 5) - canvas.width * 2, randInt(canvas.height * 5) - canvas.height * 2);
    let c = new Circle(target);
    c.position = target;
    circles.push(c);
  }
  circlesLastIndex = circles.length - 1;
}

function randomize() {

  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (circle of circles) {
    let pos = new Vector2d(randInt(canvas.width * 5) - canvas.width * 2, randInt(canvas.height * 5) - canvas.height  * 2);
    let pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    circle.target = pos;
    circle.targetColor = pixel.slice(0, 3);
  }

  circlesLastIndex = circles.length - 1;
}

async function update() {

  if (index == 0) {
    randomize();
    return;
  }

  displayMessage();

  for (circle of circles) {
    let pos = new Vector2d(randInt(canvas.width), randInt(canvas.height));
    let pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    while (brightness(pixel) < 27) {
      pos = new Vector2d(randInt(canvas.width), randInt(canvas.height));
      pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    }
    circle.target = pos;
    circle.targetColor = pixel.slice(0, 3);
  }

  circlesLastIndex = circles.length - 1;

  ctx.fillStyle = CLEAR_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.onload = function () {
  init();
  window.requestAnimationFrame(animationLoop);
}
