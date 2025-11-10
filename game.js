const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar el tamaño del canvas
canvas.width = 800;
canvas.height = 600;

// Estado del juego
let isGameOver = false;
let animationId;
let spawnerId;
let scoreIntervalId;
let score = 0;

// Propiedades del jugador (fantasmita)
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height / 2 - 25,
    width: 50,
    height: 50,
    color: 'white',
    speed: 5
};

// Teclas presionadas
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Array para los obstáculos
let obstacles = [];
const obstacleTypes = ['potato', 'shovel', 'glove'];

// --- DIBUJO ---
function drawPlayer() {
    // Dibuja un fantasma simple
    ctx.fillStyle = player.color;
    // Cuerpo
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, Math.PI, 0);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Ojos
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 20, 5, 0, Math.PI * 2); // Ojo izquierdo
    ctx.arc(player.x + 35, player.y + 20, 5, 0, Math.PI * 2); // Ojo derecho
    ctx.fill();
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save();
        // Centrar la rotación en el obstáculo
        ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        ctx.rotate(obstacle.rotation);
        ctx.translate(-(obstacle.x + obstacle.width / 2), -(obstacle.y + obstacle.height / 2));

        if (obstacle.type === 'potato') {
            // Dibuja una papa (óvalo)
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, obstacle.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'shovel') {
            // Dibuja una pala (dos rectángulos)
            ctx.fillStyle = 'grey';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height * 0.8); // Cabeza
            ctx.fillRect(obstacle.x + obstacle.width * 0.4, obstacle.y + obstacle.height * 0.8, obstacle.width * 0.2, obstacle.height * 0.2); // Mango
        } else if (obstacle.type === 'glove') {
            // Dibuja un guante (rectángulo redondeado)
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.roundRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 10);
            ctx.fill();
        }
        ctx.restore();
    });
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Puntuación: ${score}`, 10, 30);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '30px sans-serif';
    ctx.fillText(`Puntuación Final: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.font = '20px sans-serif';
    ctx.fillText('Haz clic para reiniciar', canvas.width / 2, canvas.height / 2 + 50);
}

// --- ACTUALIZACIÓN DE POSICIONES ---
function updatePlayerPosition() {
    if (keys.w && player.y > 0) player.y -= player.speed;
    if (keys.s && player.y < canvas.height - player.height) player.y += player.speed;
    if (keys.a && player.x > 0) player.x -= player.speed;
    if (keys.d && player.x < canvas.width - player.width) player.x += player.speed;
}

function updateObstacles() {
    obstacles.forEach(obstacle => {
        // Movimiento basado en el tipo
        if (obstacle.type === 'shovel') {
            obstacle.x += obstacle.speedX;
            obstacle.rotation += 0.05; // Efecto de rotación
        } else {
            obstacle.x += obstacle.speedX;
            obstacle.y += obstacle.speedY;
        }
    });

    // Eliminar obstáculos que salen de la pantalla
    obstacles = obstacles.filter(o => o.x < canvas.width && o.x + o.width > 0 && o.y < canvas.height && o.y + o.height > 0);
}

// --- LÓGICA DEL JUEGO ---
function checkCollisions() {
    for (const obstacle of obstacles) {
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            isGameOver = true;
            break;
        }
    }
}

function spawnObstacle() {
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    let newObstacle = {
        type: type,
        x: 0, y: 0,
        width: 0, height: 0,
        speedX: 0, speedY: 0,
        rotation: 0
    };

    if (type === 'potato') {
        newObstacle.width = newObstacle.height = Math.random() * 30 + 20;
        newObstacle.x = Math.random() * (canvas.width - newObstacle.width);
        newObstacle.y = -newObstacle.height;
        newObstacle.speedY = Math.random() * 2 + 1;
    } else if (type === 'shovel') {
        newObstacle.width = 60; newObstacle.height = 60;
        newObstacle.x = -newObstacle.width;
        newObstacle.y = Math.random() * (canvas.height - newObstacle.height);
        newObstacle.speedX = Math.random() * 2 + 2;
    } else if (type === 'glove') {
        newObstacle.width = 50; newObstacle.height = 70;
        newObstacle.x = Math.random() > 0.5 ? -newObstacle.width : canvas.width;
        newObstacle.y = -newObstacle.height;
        newObstacle.speedX = newObstacle.x > 0 ? -(Math.random() * 2 + 1) : (Math.random() * 2 + 1);
        newObstacle.speedY = Math.random() * 2 + 1;
    }
    
    obstacles.push(newObstacle);
}

// --- BUCLE PRINCIPAL DEL JUEGO ---
function gameLoop() {
    updatePlayerPosition();
    updateObstacles();
    checkCollisions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawObstacles();
    drawScore();

    if (isGameOver) {
        cancelAnimationFrame(animationId);
        clearInterval(spawnerId);
        clearInterval(scoreIntervalId); // Detener el contador de puntos
        drawGameOver();
                const restartListener = (e) => {
            e.preventDefault();
            location.reload();
        };
        canvas.addEventListener('click', restartListener, { once: true });
        canvas.addEventListener('touchstart', restartListener, { once: true });
    } else {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// --- EVENT LISTENERS ---
function handleKeyDown(e) {
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            keys.w = true;
            break;
        case 'a':
        case 'ArrowLeft':
            keys.a = true;
            break;
        case 's':
        case 'ArrowDown':
            keys.s = true;
            break;
        case 'd':
        case 'ArrowRight':
            keys.d = true;
            break;
    }
}

function handleKeyUp(e) {
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            keys.w = false;
            break;
        case 'a':
        case 'ArrowLeft':
            keys.a = false;
            break;
        case 's':
        case 'ArrowDown':
            keys.s = false;
            break;
        case 'd':
        case 'ArrowRight':
            keys.d = false;
            break;
    }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// --- LÓGICA PARA CONTROLES TÁCTILES ---
function setupTouchControls() {
    const up = document.getElementById('touch-up');
    const left = document.getElementById('touch-left');
    const down = document.getElementById('touch-down');
    const right = document.getElementById('touch-right');

    const handleTouch = (e, key, isPressed) => {
        e.preventDefault(); // Prevenir comportamiento por defecto (scroll, zoom)
        keys[key] = isPressed;
    };

    // Eventos para el botón de ARRIBA
    up.addEventListener('touchstart', (e) => handleTouch(e, 'w', true));
    up.addEventListener('touchend', (e) => handleTouch(e, 'w', false));
    up.addEventListener('touchcancel', (e) => handleTouch(e, 'w', false));

    // Eventos para el botón de IZQUIERDA
    left.addEventListener('touchstart', (e) => handleTouch(e, 'a', true));
    left.addEventListener('touchend', (e) => handleTouch(e, 'a', false));
    left.addEventListener('touchcancel', (e) => handleTouch(e, 'a', false));

    // Eventos para el botón de ABAJO
    down.addEventListener('touchstart', (e) => handleTouch(e, 's', true));
    down.addEventListener('touchend', (e) => handleTouch(e, 's', false));
    down.addEventListener('touchcancel', (e) => handleTouch(e, 's', false));

    // Eventos para el botón de DERECHA
    right.addEventListener('touchstart', (e) => handleTouch(e, 'd', true));
    right.addEventListener('touchend', (e) => handleTouch(e, 'd', false));
    right.addEventListener('touchcancel', (e) => handleTouch(e, 'd', false));
}


// --- INICIO Y PANTALLA DE INICIO ---

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Toca para Empezar', canvas.width / 2, canvas.height / 2);
}

function startGame() {
    console.log("Iniciando el juego...");
    setupTouchControls(); // Configurar controles táctiles
    score = 0;
    isGameOver = false;
    
    clearInterval(scoreIntervalId);
    clearInterval(spawnerId);

    scoreIntervalId = setInterval(() => { score += 10; }, 100);
    spawnerId = setInterval(spawnObstacle, 1500);
    
    gameLoop();
}

function init() {
    drawPlayer();
    drawStartScreen();

    const startListener = (e) => {
        e.preventDefault();
        startGame();
    };

    canvas.addEventListener('click', startListener, { once: true });
    canvas.addEventListener('touchstart', startListener, { once: true });
}

// Empezar el proceso de inicialización
init();