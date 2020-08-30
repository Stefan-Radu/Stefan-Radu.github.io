let canvas = null;
let ctx = null;
let oldTimeStamp = null;
let player = null;
let fish = null;
let bomb = null;
let lastAddedTimestamp = null;
let score = 0;
let badClick = false;
let mouse = {};
let endgame = false;
let timeOffset = 2.0;

let items = [];

const EPS = 0.2;

function fixDpi() {
  let dpi = window.devicePixelRatio;
  let style_height = getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
  let style_width = getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

  canvas.height = style_height * dpi;
  canvas.width = style_width * dpi;

  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function timestamp() {
  return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
}

function dist(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

function addItem(ts) {

  lastAddedTimestamp = ts;

  let newItem = {};
  newItem.type = Math.random() < 0.5 ? 'fish' : 'bomb';
  newItem.pos = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height
  };
  newItem.timestamp = ts;

  items.push(newItem);
}

function update(delta) {

  let ts = timestamp();
  if ((ts - lastAddedTimestamp) / 1000 >= timeOffset) {
    addItem(ts);
  }

  if (items.length && (ts - items[0].timestamp) / 1000 >= 5.0) {
    items.splice(0, 1);
  }

  let d = dist(player.pos, player.target);
  if (d > EPS) {
    step = Math.min(d, player.vel);
    player.pos.x += (step * (player.target.x - player.pos.x) / d) * delta; 
    player.pos.y += (step * (player.target.y - player.pos.y) / d) * delta; 
  }

  let found = null;

  for (item of items) {
    if (dist(item.pos, player.pos) < 40.0) {
      if (item.type == 'bomb') {
        endgame = true;
        return;
      }
      else {
        score += 1;
        found = item;
      }
    }
  }

  if (found) {
    items.splice(items.indexOf(found), 1);
  }
}

function display() {
  ctx.fillStyle = '#272727';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(player.img, player.pos.x - player.width / 2,
    player.pos.y - player.height / 2, player.width, player.height);

  for (item of items) {
    let root = item.type == 'fish' ? fish : bomb;
    ctx.drawImage(root.img, item.pos.x - root.width / 2,
      item.pos.y - root.height / 2, root.width, root.height);
  }

  if (badClick) {
    ctx.font = "30px Courier";
    ctx.fillStyle = 'red';
    ctx.fillText("Nu se poate!", mouse.x, mouse.y);
  }
}

function loop() {

  timeOffset = Math.max(0.5, timeOffset - 0.0002);
  console.log(timeOffset);

  let timeStamp = timestamp();
  let delta = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;

  update(delta);

  if (endgame) {
    canvas.remove();
    let el = document.createElement("h1");
    el.innerHTML = `GAME OVER! You scored ${score}`;
    el.setAttribute("id", "game-over");
    document.body.append(el);
    el = document.createElement("button");
    el.innerHTML = `Play Again`;
    el.classList.add("button");
    el.addEventListener("click", () => {
      window.location.reload(false);
    });
    document.body.append(el);
    return;
  }

  display();

  window.requestAnimationFrame(loop);
}

window.onload = function() {

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  oldTimeStamp = timestamp(); 

  fixDpi();

  player = {
    pos: {
      x: canvas.width / 2,
      y: canvas.height / 2
    },
    width: 50,
    height: 50,
    img: new Image(),
    target: {
      x: canvas.width / 2,
      y: canvas.height / 2
    },
    vel: 270.0
  };

  player.img.src = './images/penguin.png';

  fish = {
    width: 50,
    height: 50,
    img: new Image()
  };

  fish.img.src = './images/fish.png';

  bomb = {
    width: 50,
    height: 50,
    img: new Image()
  };

  bomb.img.src = './images/bomb.png';

  lastAddedTimestamp = timestamp() - 20;

  canvas.addEventListener("click", (e) => {

    goodClick = true;
    for (item of items) {
      if (dist(item.pos, {x: e.offsetX, y: e.offsetY}) <= 25.0) {
        if (score > 0) {
          items.splice(items.indexOf(item), 1);
        }
        goodClick = false;
      }
    }

    if (goodClick) {
      player.target = {
        x: e.offsetX,
        y: e.offsetY
      };
    }
    else if (score > 0) {
      score -= 1;
    }
    else {
      badClick = true;
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
    badClick = false;
  });

  window.addEventListener("resize", () => {
    fixDpi();
  });

  display();

  window.requestAnimationFrame(loop);
}
