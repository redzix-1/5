// ==================== ??????? ???? ====================
const gameContainer = document.getElementById('game-container');
const gameWorld = document.getElementById('game-world');
const hero = document.getElementById('hero');
const startScreen = document.getElementById('start-screen');
const levelCompleteScreen = document.getElementById('level-complete');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const nextLevelButton = document.getElementById('next-level-button');
const retryButton = document.getElementById('retry-button');
const healthFill = document.getElementById('health-fill');
const crystalCounter = document.getElementById('crystal-counter');
const levelIndicator = document.getElementById('level-indicator');
const crystalsCollectedStat = document.getElementById('crystals-collected');
const enemiesDefeatedStat = document.getElementById('enemies-defeated');
const timeSpentStat = document.getElementById('time-spent');

// ????? ??????
const upButton = document.getElementById('up-button');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const jumpButton = document.getElementById('jump-button');
const attackButton = document.getElementById('attack-button');

// ??????? ??????
const gravity = 0.6;
const friction = 0.8;
const heroSpeed = 5;
const jumpStrength = 15;
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;

// ???? ??????
let gameActive = false;
let currentLevel = 1;
let crystalsCollected = 0;
let enemiesDefeated = 0;
let gameStartTime = 0;
let levelData = {};
let platforms = [];
let enemies = [];
let crystals = [];
let artifacts = [];
let decorations = [];
let boss = null;

// ???? ?????
let heroState = {
    x: 100,
    y: 300,
    width: 60,
    height: 80,
    velX: 0,
    velY: 0,
    jumping: false,
    grounded: false,
    facingRight: true,
    attacking: false,
    health: 100,
    maxHealth: 100,
    attackDamage: 25,
    attackCooldown: false,
    hitCooldown: false,
    dead: false
};

// ==================== ????? ??????? ====================
function init() {
    // ????? ?????? ????? ???????
    startButton.addEventListener('click', startGame);
    nextLevelButton.addEventListener('click', loadNextLevel);
    retryButton.addEventListener('click', restartGame);
    
    // ????? ????? ?????? ????
    setupTouchControls();
    
    // ????? ?????? ????? ????????
    setupKeyboardControls();
    
    // ????? ??????? ??????
    initLevelData();
    
    // ??? ???? ??????
    requestAnimationFrame(gameLoop);
}

function setupTouchControls() {
    // ????? ??? ???????
    jumpButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (!heroState.jumping && heroState.grounded) {
            heroState.velY = -jumpStrength;
            heroState.jumping = true;
            heroState.grounded = false;
            playSound('jump');
            addClass(hero, 'jump');
            setTimeout(() => removeClass(hero, 'jump'), 600);
        }
    });
    
    attackButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (!heroState.attackCooldown) {
            attack();
        }
    });
    
    // ??? ?????? ??????? ??? ?????
    leftButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        heroState.velX = -heroSpeed;
        heroState.facingRight = false;
        addClass(hero, 'flip');
    });
    
    rightButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        heroState.velX = heroSpeed;
        heroState.facingRight = true;
        removeClass(hero, 'flip');
    });
    
    // ????? ?????? ??????? ??? ???????
    leftButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (heroState.velX < 0) {
            heroState.velX = 0;
        }
    });
    
    rightButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (heroState.velX > 0) {
            heroState.velX = 0;
        }
    });
}

function setupKeyboardControls() {
    // ????? ?????? ????????
    window.addEventListener('keydown', function(e) {
        if (!gameActive) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case ' ':
                if (!heroState.jumping && heroState.grounded) {
                    heroState.velY = -jumpStrength;
                    heroState.jumping = true;
                    heroState.grounded = false;
                    playSound('jump');
                    addClass(hero, 'jump');
                    setTimeout(() => removeClass(hero, 'jump'), 600);
                }
                break;
            case 'ArrowLeft':
            case 'a':
                heroState.velX = -heroSpeed;
                heroState.facingRight = false;
                addClass(hero, 'flip');
                break;
            case 'ArrowRight':
            case 'd':
                heroState.velX = heroSpeed;
                heroState.facingRight = true;
                removeClass(hero, 'flip');
                break;
            case 'f':
            case 'z':
            case 'Control':
                if (!heroState.attackCooldown) {
                    attack();
                }
                break;
        }
    });
    
    // ????? ?????? ????????
    window.addEventListener('keyup', function(e) {
        if (!gameActive) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
                if (heroState.velX < 0) {
                    heroState.velX = 0;
                }
                break;
            case 'ArrowRight':
            case 'd':
                if (heroState.velX > 0) {
                    heroState.velX = 0;
                }
                break;
        }
    });
}

function initLevelData() {
    // ????? ??????? ??????
    level