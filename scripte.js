// العناصر الرئيسية
const gameContainer = document.getElementById('game-container');
const dino = document.getElementById('dino');
const obstaclesContainer = document.getElementById('obstacles');
const particles = document.getElementById('particles');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const jumpBtn = document.getElementById('jump-btn');
const duckBtn = document.getElementById('duck-btn');
const jumpSound = document.getElementById('jump-sound');
const hitSound = document.getElementById('hit-sound');
const pointSound = document.getElementById('point-sound');

// متغيرات اللعبة
let isGameStarted = false;
let isGameOver = false;
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let animationFrameId;
let obstacleGenerationInterval;
let scoreInterval;
let isJumping = false;
let isDucking = false;
let gameSpeed = 5;
let obstacles = [];
let lastTime = 0;
let spawnTime = 0;
let particleTime = 0;

// البدء الفوري للعبة
window.addEventListener('load', function() {
    // عرض أعلى نتيجة
    highScoreDisplay.textContent = `أعلى نتيجة: ${highScore}`;
    gameContainer.classList.add('intro-animation');
    
    // بدء اللعبة فورًا
    setTimeout(() => {
        startGame();
    }, 500);
});

// إضافة التحكم بلوحة المفاتيح
document.addEventListener('keydown', function(event) {
    // القفز بمفتاح المسافة أو السهم للأعلى
    if ((event.code === 'Space' || event.code === 'ArrowUp') && !isJumping && !isDucking) {
        jump();
    }
    
    // الانحناء بالسهم للأسفل
    if (event.code === 'ArrowDown' && !isJumping) {
        duck();
    }
    
    // إعادة تشغيل اللعبة بالمسافة عند انتهاء اللعبة
    if (event.code === 'Space' && isGameOver) {
        startGame();
    }
});

document.addEventListener('keyup', function(event) {
    // إنهاء الانحناء عند ترك زر السهم للأسفل
    if (event.code === 'ArrowDown') {
        endDuck();
    }
});

// إضافة أحداث للأزرار اللمسية
jumpBtn.addEventListener('touchstart', jump);
jumpBtn.addEventListener('mousedown', jump);

duckBtn.addEventListener('touchstart', duck);
duckBtn.addEventListener('mousedown', duck);
duckBtn.addEventListener('touchend', endDuck);
duckBtn.addEventListener('mouseup', endDuck);

// زر إعادة اللعب
restartBtn.addEventListener('click', startGame);

// وظيفة بدء اللعبة
function startGame() {
    if (isGameStarted) return;
    
    isGameStarted = true;
    isGameOver = false;
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    
    // إزالة جميع العوائق الموجودة
    while (obstaclesContainer.firstChild) {
        obstaclesContainer.removeChild(obstaclesContainer.firstChild);
    }
    
    // إخفاء شاشة انتهاء اللعبة إذا كانت ظاهرة
    gameOverScreen.classList.remove('visible');
    
    // إعادة تعيين حالة الديناصور
    dino.classList.remove('hit', 'jumping', 'ducking');
    
    // تحديث النتيجة كل 100 مللي ثانية
    scoreInterval = setInterval(() => {
        score++;
        scoreDisplay.textContent = score;
        
        // زيادة سرعة اللعبة تدريجيًا
        if (score % 100 === 0) {
            gameSpeed += 0.5;
            createScoreParticles();
            playSound(pointSound);
        }
    }, 100);
    
    // إضافة فئة الجري للديناصور
    dino.classList.add('running');
    
    // إنشاء العوائق
    obstacleGenerationInterval = setInterval(createObstacle, getRandomTime(1500, 3000));
    
    // بدء حلقة الرسوم المتحركة الرئيسية
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// الحصول على وقت عشوائي
function getRandomTime(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// حلقة اللعبة الرئيسية
function gameLoop(currentTime) {
    if (isGameOver) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // تحديث العوائق
    updateObstacles(deltaTime);
    
    // إنشاء جزيئات
    particleTime += deltaTime;
    if (particleTime > 100) {
        createParticles();
        particleTime = 0;
    }
    
    // كشف الاصطدام
    detectCollision();
    
    // استمرار الحلقة
    animationFrameId = requestAnimationFrame(gameLoop);
}

// إنشاء عائق
function createObstacle() {
    // منع توليد العوائق عند انتهاء اللعبة
    if (isGameOver) return;
    
    // تحديد نوع العائق: صبار أو طائر أو حاجز
    const randomValue = Math.random();
    let type;
    
    if (randomValue < 0.3) {
        type = 'bird';
    } else if (randomValue < 0.7) {
        type = 'cactus';
    } else {
        type = 'barrier';
    }
    
    const obstacle = document.createElement('div');
    
    if (type === 'cactus') {
        obstacle.className = 'cactus';
        // حجم عشوائي للصبار
        const height = 40 + Math.random() * 30;
        obstacle.style.height = height + 'px';
        obstacle.style.bottom = '70px';
    } else if (type === 'bird') {
        obstacle.className = 'bird';
        // ارتفاع عشوائي للطائر
        const height = 90 + Math.random() * 60;
        obstacle.style.bottom = height + 'px';
    } else if (type === 'barrier') {
        obstacle.className = 'barrier';
        obstacle.style.height = '40px';
        obstacle.style.bottom = '70px';
    }
    
    // وضع العائق خارج الشاشة
    obstacle.style.left = gameContainer.offsetWidth + 'px';
    
    // إضافة العائق إلى DOM
    obstaclesContainer.appendChild(obstacle);
    
    // إضافة العائق إلى مصفوفة العوائق
    obstacles.push({
        element: obstacle,
        type: type,
        x: gameContainer.offsetWidth,
        width: type === 'bird' ? 40 : (type === 'barrier' ? 30 : 25)
    });
    
    // جدولة العائق التالي بوقت عشوائي
    if (obstacleGenerationInterval) {
        clearInterval(obstacleGenerationInterval);
    }
    obstacleGenerationInterval = setTimeout(createObstacle, getRandomTime(1200, 3000 - (gameSpeed * 100)));
}

// تحديث مواقع العوائق
function updateObstacles(deltaTime) {
    for (let i = 0; i < obstacles.length; i++) {
        // تحريك العائق
        obstacles[i].x -= gameSpeed * (deltaTime / 16);
        obstacles[i].element.style.left = obstacles[i].x + 'px';
        
        // إزالة العوائق خارج الشاشة
        if (obstacles[i].x < -obstacles[i].width) {
            obstacles[i].element.remove();
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// كشف الاصطدام
function detectCollision() {
    const dinoRect = dino.getBoundingClientRect();
    
    for (let i = 0; i < obstacles.length; i++) {
        const obstacleRect = obstacles[i].element.getBoundingClientRect();
        
        // تعديل مناطق الاصطدام بناءً على وضع الديناصور
        let dinoHitboxTop = dinoRect.top;
        let dinoHitboxBottom = dinoRect.bottom;
        let dinoHitboxLeft = dinoRect.left + 10;
        let dinoHitboxRight = dinoRect.right - 10;
        
        // تعديل منطقة الاصطدام عند الانحناء
        if (isDucking) {
            dinoHitboxTop = dinoRect.top + 20; // تعديل منطقة الاصطدام للأعلى عند الانحناء
        }
        
        // التحقق من التصادم مع تعديل المناطق
        if (
            dinoHitboxRight > obstacleRect.left + 10 && 
            dinoHitboxLeft < obstacleRect.right - 10 && 
            dinoHitboxBottom > obstacleRect.top + 5 && 
            dinoHitboxTop < obstacleRect.bottom - 5
        ) {
            // للطيور، تجاهل الاصطدام إذا كان الديناصور منحنيًا والطائر منخفض
            if (obstacles[i].type === 'bird' && isDucking && obstacleRect.bottom < dinoRect.top + 30) {
                continue;
            }
            
            gameOver();
            break;
        }
    }
}

// انتهاء اللعبة
function gameOver() {
    isGameOver = true;
    isGameStarted = false;
    
    // إيقاف الفواصل الزمنية
    clearInterval(scoreInterval);
    clearInterval(obstacleGenerationInterval);
    cancelAnimationFrame(animationFrameId);
    
    // إيقاف الديناصور
    dino.classList.remove('running', 'jumping', 'ducking');
    dino.classList.add('hit');
    
    // تشغيل صوت الاصطدام
    playSound(hitSound);
    
    // تحديث أعلى نتيجة
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        highScoreDisplay.textContent = `أعلى نتيجة: ${highScore}`;
    }
    
    // عرض شاشة انتهاء اللعبة
    finalScoreDisplay.textContent = score;
    setTimeout(() => {
        gameOverScreen.classList.add('visible');
    }, 1000);
}

// وظيفة القفز
function jump() {
    if (isGameOver || isJumping || isDucking) return;
    
    isJumping = true;
    dino.classList.remove('running');
    dino.classList.add('jumping');
    
    // تشغيل صوت القفز
    playSound(jumpSound);
    
    // إنشاء جزيئات القفز
    createJumpParticles();
    
    // إعادة تعيين الديناصور بعد القفز
    setTimeout(() => {
        dino.classList.remove('jumping');
        if (!isGameOver && !isDucking) {
            dino.classList.add('running');
        }
        isJumping = false;
    }, 500);
}

// وظيفة الانحناء
function duck() {
    if (isGameOver || isJumping) return;
    
    if (!isDucking) {
        isDucking = true;
        dino.classList.remove('running');
        dino.classList.add('ducking');
    }
}

// إنهاء الانحناء
function endDuck() {
    if (isDucking) {
        isDucking = false;
        dino.classList.remove('ducking');
        if (!isGameOver && !isJumping) {
            dino.classList.add('running');
        }
    }
}

// تشغيل الصوت
function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(err => {
        // تجاهل أخطاء تشغيل الصوت (قد تحدث في المتصفحات بسبب سياسات التفاعل)
        console.log('Could not play sound:', err);
    });
}

// إنشاء جزيئات الديناصور
function createParticles() {
    if (isGameOver) return;
    
    // جزيئات عشوائية على الأرض
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // موقع عشوائي
    const posX = Math.random() * gameContainer.offsetWidth;
    
    particle.style.left = posX + 'px';
    particle.style.bottom = '70px';
    
    // إضافة الجزيء إلى DOM
    particles.appendChild(particle);
    
    // حركة الجزيء
    let opacity = 0.7;
    let posY = 0;
    let speed = Math.random() * 2 + 1;
    
    const animateParticle = () => {
        opacity -= 0.01;
        posY += speed;
        
        particle.style.opacity = opacity;
        particle.style.bottom = (70 + posY) + 'px';
        
        if (opacity > 0) {
            requestAnimationFrame(animateParticle);
        } else {
            particle.remove();
        }
    };
    
    requestAnimationFrame(animateParticle);
}

// إنشاء جزيئات القفز
function createJumpParticles() {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const dinoRect = dino.getBoundingClientRect();
        const containerRect = gameContainer.getBoundingClientRect();
        
        // موقع الجزيء تحت الديناصور
        const posX = dinoRect.left - containerRect.left + Math.random() * dinoRect.width;
        
        particle.style.left = posX + 'px';
        particle.style.bottom = '70px';
        
        // إضافة الجزيء إلى DOM
        particles.appendChild(particle);
        
        // حركة الجزيء
        let opacity = 0.7;
        let posY = 0;
        let speedX = (Math.random() - 0.5) * 5;
        let speedY = Math.random() * 3 + 2;
        
        const animateParticle = () => {
            opacity -= 0.02;
            posY += speedY;
            speedY -= 0.1;
            
            particle.style.opacity = opacity;
            particle.style.bottom = (70 + posY) + 'px';
            particle.style.left = (parseFloat(particle.style.left) + speedX) + 'px';
            
            if (opacity > 0 && posY > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animateParticle);
    }
}

// إنشاء جزيئات النتيجة
function createScoreParticles() {
    const scoreRect = scoreDisplay.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // موقع الجزيء حول النتيجة
        const posX = scoreRect.left - containerRect.left + scoreRect.width / 2 + (Math.random() - 0.5) * 50;
        const posY = scoreRect.top - containerRect.top + scoreRect.height / 2 + (Math.random() - 0.5) * 30;
        
        particle.style.left = posX + 'px';
        particle.style.top = posY + 'px';
        particle.style.background = `hsl(${Math.random() * 360}, 100%, 70%)`;
        
        // إضافة الجزيء إلى DOM
        particles.appendChild(particle);
        
        // حركة الجزيء
        let opacity = 1;
        let scale = 1;
        let speedX = (Math.random() - 0.5) * 6;
        let speedY = (Math.random() - 0.5) * 6;
        
        const animateParticle = () => {
            opacity -= 0.02;
            scale += 0.02;
            
            particle.style.opacity = opacity;
            particle.style.transform = `scale(${scale})`;
            particle.style.left = (parseFloat(particle.style.left) + speedX) + 'px';
            particle.style.top = (parseFloat(particle.style.top) + speedY) + 'px';
            
            if (opacity > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                particle.remove();
            }
        };
        
        requestAnimationFrame(animateParticle);
    }
}    
