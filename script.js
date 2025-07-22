let participantes = [];
let mensagensDaily = [];
let mensagensFlamengo = [];
let naturaProdutos = [];
let avonProdutos = [];

let participantesRestantes = [];
let participantesSorteados = [];
let isSorteando = false;
let marianeAnimationInterval;
let marianeClones = [];
let confetti = [];

const confettiColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

const btnSortear = document.getElementById('btn-sortear');
const btnReset = document.getElementById('btn-reset');
const winnerContainer = document.getElementById('winner-container');
const loadingOverlay = document.getElementById('loading-overlay');
const sorteadosList = document.getElementById('sorteados-list');
const restantesList = document.getElementById('restantes-list');
const sorteadosCount = document.getElementById('sorteados-count');
const restantesCount = document.getElementById('restantes-count');
const totalParticipants = document.getElementById('total-participants');
const remainingParticipants = document.getElementById('remaining-participants');
const confettiCanvas = document.getElementById('confetti-canvas');
const marianePhoto = document.getElementById('mariane-photo');
const marianeContainer = document.getElementById('mariane-container');

async function loadMessages() {
    try {
        const response = await fetch('messages.json');
        const data = await response.json();
        mensagensDaily = data.daily;
        mensagensFlamengo = data.flamengo;
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        mensagensDaily = [{ mensagem: "{nome}, você foi sorteado!", emoji: "🎉" }];
        mensagensFlamengo = [{ mensagem: "Thiago Almeida sorteado!", emoji: "🔴⚫" }];
    }
}

async function loadParticipants() {
    try {
        const response = await fetch('participants.json');
        const data = await response.json();
        participantes = data.participantes;
        participantesRestantes = [...participantes];
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
        participantes = ["Participante 1", "Participante 2", "Participante 3"];
        participantesRestantes = [...participantes];
    }
}

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        naturaProdutos = data.natura;
        avonProdutos = data.avon;
    } catch (error) {
        console.log('Erro ao carregar produtos:', error);
    }
}

function getInitials(nome) {
    const nomes = nome.split(' ');
    return nomes.length >= 2 
        ? (nomes[0].charAt(0) + nomes[1].charAt(0)).toUpperCase()
        : nomes[0].charAt(0).toUpperCase();
}

function generateImagePath(nome) {
    const formatacoes = [
        nome.toLowerCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        nome,
        nome.split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        nome.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    ];
    
    const paths = [];
    formatacoes.forEach(formato => {
        paths.push(`images/${formato}.jpg`);
        paths.push(`images/${formato}.png`);
    });
    
    return paths;
}

async function checkImageExists(imagePath) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = imagePath;
    });
}

async function getParticipantImage(nome) {
    const paths = generateImagePath(nome);
    
    for (const path of paths) {
        const exists = await checkImageExists(path);
        if (exists) {
            return path;
        }
    }
    
    return null;
}

function createAvatarWithInitials(nome, isFlamengo = false) {
    const initials = getInitials(nome);
    const colors = isFlamengo 
        ? ['#DC143C', '#000000', '#8B0000'] 
        : ['#4A90E2', '#50C878', '#FF6B6B', '#9B59B6', '#F39C12', '#1ABC9C'];
    
    const colorIndex = nome.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return `
        <div class="participant-avatar initials-avatar" style="background-color: ${backgroundColor};">
            <span class="avatar-initials">${initials}</span>
        </div>
    `;
}

async function createParticipantImage(nome, isFlamengo = false) {
    const imagePath = await getParticipantImage(nome);
    
    if (imagePath) {
        return `
            <div class="participant-avatar">
                <img src="${imagePath}" alt="${nome}" class="avatar-image" />
            </div>
        `;
    } else {
        return createAvatarWithInitials(nome, isFlamengo);
    }
}

async function initializeApp() {
    try {
        await Promise.all([
            loadParticipants(),
            loadMessages(),
            loadProducts()
        ]);
        updateUI();
        renderParticipantsList();
        setupConfetti();
    } catch (error) {
        console.log('Erro ao inicializar aplicativo:', error);
    }
}

function setupEventListeners() {
    btnSortear.addEventListener('click', sortearParticipante);
    btnReset.addEventListener('click', resetSorteio);
}

function setupMarianeAnimations() {
    marianePhoto.addEventListener('click', function() {
        this.classList.add('clicked');
        
        createMarianeExplosion();
        createMarianeBubbles();
        createMarianeSpiral();
        createMarianePulse();
        
        setTimeout(() => {
            this.classList.remove('clicked');
        }, 1000);
    });
    
}

function startMarianeAnimation() {
    marianePhoto.classList.add('sorting');
    marianeContainer.classList.add('sorting');
    
    marianeAnimationInterval = setInterval(() => {
        const animations = ['createMarianeBubbles', 'createMarianeSpiral', 'createMarianePulse'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        window[randomAnimation]();
    }, 1000);
}

function stopMarianeAnimation() {
    marianePhoto.classList.remove('sorting');
    marianeContainer.classList.remove('sorting');
    
    if (marianeAnimationInterval) {
        clearInterval(marianeAnimationInterval);
        marianeAnimationInterval = null;
    }
    
    marianeClones.forEach(clone => {
        if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
        }
    });
    marianeClones = [];
}

function createMarianeClone() {
    const clone = document.createElement('img');
    clone.src = marianePhoto.src;
    clone.className = 'mariane-clone';
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    clone.style.left = `calc(50% + ${x}px)`;
    clone.style.top = `calc(50% + ${y}px)`;
    clone.style.transform = 'translate(-50%, -50%)';
    
    marianeContainer.appendChild(clone);
    marianeClones.push(clone);
    
    return clone;
}

function createMarianeBubbles() {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const clone = createMarianeClone();
            clone.classList.add('bubble');
            
            setTimeout(() => {
                if (clone.parentNode) {
                    clone.parentNode.removeChild(clone);
                    const index = marianeClones.indexOf(clone);
                    if (index > -1) marianeClones.splice(index, 1);
                }
            }, 3000);
        }, i * 200);
    }
}

function createMarianeSpiral() {
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            const clone = createMarianeClone();
            clone.classList.add('spiral');
            
            setTimeout(() => {
                if (clone.parentNode) {
                    clone.parentNode.removeChild(clone);
                    const index = marianeClones.indexOf(clone);
                    if (index > -1) marianeClones.splice(index, 1);
                }
            }, 2000);
        }, i * 150);
    }
}

function createMarianePulse() {
    for (let i = 0; i < 5; i++) {
        const clone = createMarianeClone();
        clone.classList.add('pulse');
        clone.style.animationDelay = `${i * 0.2}s`;
        
        setTimeout(() => {
            if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
                const index = marianeClones.indexOf(clone);
                if (index > -1) marianeClones.splice(index, 1);
            }
        }, 3000);
    }
}

function createMarianeExplosion() {
    for (let i = 0; i < 8; i++) {
        const clone = createMarianeClone();
        const angle = (Math.PI * 2 / 8) * i;
        const distance = 100;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        clone.style.animation = `marianeExplosion 1s ease-out forwards`;
        clone.style.setProperty('--end-x', `${endX}px`);
        clone.style.setProperty('--end-y', `${endY}px`);
        
        setTimeout(() => {
            if (clone.parentNode) {
                clone.parentNode.removeChild(clone);
                const index = marianeClones.indexOf(clone);
                if (index > -1) marianeClones.splice(index, 1);
            }
        }, 1000);
    }
}

async function sortearParticipante() {
    if (isSorteando || participantesRestantes.length === 0) return;
    
    isSorteando = true;
    btnSortear.disabled = true;
    
    startMarianeAnimation();
    showLoading();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const randomIndex = Math.floor(Math.random() * participantesRestantes.length);
    const participanteSorteado = participantesRestantes[randomIndex];
    
    participantesRestantes.splice(randomIndex, 1);
    participantesSorteados.push({
        nome: participanteSorteado,
        posicao: participantesSorteados.length + 1,
        timestamp: new Date().toLocaleTimeString()
    });
    
    stopMarianeAnimation();
    hideLoading();
    
    let famosoConfig;
    if (participanteSorteado === "Thiago Almeida") {
        famosoConfig = mensagensFlamengo[Math.floor(Math.random() * mensagensFlamengo.length)];
    } else {
        famosoConfig = mensagensDaily[Math.floor(Math.random() * mensagensDaily.length)];
    }
    
    await showWinner(participanteSorteado, famosoConfig);
    updateUI();
    renderParticipantsList();
    
    if (participanteSorteado === "Thiago Almeida") {
        launchFlamengoBombaca();
    } else {
        launchConfetti();
    }
    
    playVictorySound();
    
    isSorteando = false;
    
    if (participantesRestantes.length > 0) {
        btnSortear.disabled = false;
    }
    
    if (participantesRestantes.length === 0) {
        setTimeout(() => {
            showFinalMessage();
        }, 3000);
    }
}

async function showWinner(nome, famosoConfig) {
    const mensagemPersonalizada = famosoConfig.mensagem.replace('{nome}', nome);
    
    const iconesAleatorios = [
        'fas fa-trophy', 'fas fa-star', 'fas fa-crown', 'fas fa-medal', 
        'fas fa-gem', 'fas fa-fire', 'fas fa-rocket', 'fas fa-magic', 'fas fa-sparkles'
    ];
    
    const iconeAleatorio = iconesAleatorios[Math.floor(Math.random() * iconesAleatorios.length)];
    const isThiago = nome === "Thiago Almeida";
    const winnerClass = isThiago ? "winner-name flamengo" : "winner-name";
    const celebrationClass = isThiago ? "winner-celebration flamengo" : "winner-celebration";
    const participantAvatar = await createParticipantImage(nome, isThiago);
    
    const flamengoFlags = isThiago ? `
        <div class="flamengo-flags">
            <div class="flamengo-flag">🔴⚫</div>
            <div class="flamengo-flag">⚫🔴</div>
            <div class="flamengo-flag">🔴⚫</div>
            <div class="flamengo-flag">⚫🔴</div>
            <div class="flamengo-flag">🔴⚫</div>
            <div class="flamengo-flag">⚫🔴</div>
            <div class="flamengo-flag">🔴⚫</div>
            <div class="flamengo-flag">⚫🔴</div>
            <div class="flamengo-flag">🔴⚫</div>
            <div class="flamengo-flag">⚫🔴</div>
        </div>
    ` : '';
    
    winnerContainer.innerHTML = `
        ${participantAvatar}
        <div class="${winnerClass}">${nome}</div>
        <div class="${celebrationClass}">
            <i class="${iconeAleatorio}"></i>
            ${mensagemPersonalizada}
        </div>
        ${flamengoFlags}
    `;
}

function showFinalMessage() {
    winnerContainer.innerHTML = `
        <div class="final-message">
            <i class="fas fa-flag-checkered" style="font-size: 3rem; color: var(--success-color); margin-bottom: 20px;"></i>
            <h2 style="color: var(--success-color); margin-bottom: 10px;">Sorteio Finalizado!</h2>
            <p style="color: var(--text-secondary);">Todos os participantes foram sorteados.</p>
        </div>
    `;
    btnSortear.style.display = 'none';
}

function resetSorteio() {
    if (participantesSorteados.length > 0) {
        const confirmReset = confirm('Tem certeza que deseja reiniciar o sorteio? Todos os resultados serão perdidos.');
        if (!confirmReset) return;
    }
    
    participantesRestantes = [...participantes];
    participantesSorteados = [];
    isSorteando = false;
    
    winnerContainer.innerHTML = `
        <div class="winner-placeholder">
            <i class="fas fa-gift"></i>
            <p>Clique em "Sortear" para começar!</p>
        </div>
    `;
    
    btnSortear.disabled = false;
    btnSortear.style.display = 'flex';
    
    updateUI();
    renderParticipantsList();
    
    winnerContainer.style.animation = 'fadeInUp 0.5s ease-out';
}

function updateUI() {
    sorteadosCount.textContent = participantesSorteados.length;
    restantesCount.textContent = participantesRestantes.length;
    totalParticipants.textContent = participantes.length;
    remainingParticipants.textContent = participantesRestantes.length;
    
    if (participantesRestantes.length === 0) {
        btnSortear.disabled = true;
        btnSortear.innerHTML = `
            <i class="fas fa-check"></i>
            <span>Sorteio Finalizado</span>
        `;
    } else {
        btnSortear.innerHTML = `
            <i class="fas fa-dice"></i>
            <span>Sortear (${participantesRestantes.length} restantes)</span>
        `;
    }
}

function renderParticipantsList() {
    if (participantesSorteados.length === 0) {
        sorteadosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <p>Nenhum participante sorteado ainda</p>
            </div>
        `;
    } else {
        sorteadosList.innerHTML = participantesSorteados
            .map(p => `
                <div class="participant-item sorteado">
                    <div class="participant-info">
                        <div class="participant-name">${p.nome}</div>
                        <div class="participant-time" style="font-size: 0.8rem; color: var(--text-muted);">
                            ${p.timestamp}
                        </div>
                    </div>
                    <div class="participant-position">${p.posicao}º</div>
                </div>
            `).join('');
    }
    
    if (participantesRestantes.length === 0) {
        restantesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Todos foram sorteados!</p>
            </div>
        `;
    } else {
        restantesList.innerHTML = participantesRestantes
            .slice()
            .sort((a, b) => a.localeCompare(b))
            .map(nome => `
                <div class="participant-item aguardando">
                    <div class="participant-name">${nome}</div>
                    <i class="fas fa-clock" style="color: var(--warning-color);"></i>
                </div>
            `).join('');
    }
}

function showLoading() {
    if (!naturaProdutos.length || !avonProdutos.length) {
        loadingOverlay.classList.add('active');
        return;
    }
    
    const naturaProductIndex = Math.floor(Math.random() * naturaProdutos.length);
    const avonProductIndex = Math.floor(Math.random() * avonProdutos.length);
    
    const naturaProduct = naturaProdutos[naturaProductIndex];
    const avonProduct = avonProdutos[avonProductIndex];
    
    const naturaImg = document.getElementById('natura-product');
    const avonImg = document.getElementById('avon-product');
    
    if (naturaImg) naturaImg.src = naturaProduct.image;
    if (avonImg) avonImg.src = avonProduct.image;
    
    const naturaName = document.getElementById('natura-name');
    const avonName = document.getElementById('avon-name');
    
    if (naturaName) naturaName.textContent = naturaProduct.name;
    if (avonName) avonName.textContent = avonProduct.name;
    
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

function playVictorySound() {
    if (window.AudioContext || window.webkitAudioContext) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

function setupConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    });
}

function createConfettiPiece() {
    return {
        x: Math.random() * confettiCanvas.width,
        y: -10,
        width: Math.random() * 10 + 5,
        height: Math.random() * 10 + 5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        speed: Math.random() * 3 + 2,
        drift: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5
    };
}

function updateConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    for (let i = confetti.length - 1; i >= 0; i--) {
        const piece = confetti[i];
        
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.rotation += piece.rotationSpeed;
        
        ctx.save();
        ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        ctx.restore();
        
        if (piece.y > confettiCanvas.height) {
            confetti.splice(i, 1);
        }
    }
    
    if (confetti.length > 0) {
        requestAnimationFrame(updateConfetti);
    }
}

function launchConfetti() {
    for (let i = 0; i < 50; i++) {
        confetti.push(createConfettiPiece());
    }
    
    updateConfetti();
    
    const confettiInterval = setInterval(() => {
        for (let i = 0; i < 10; i++) {
            confetti.push(createConfettiPiece());
        }
    }, 100);
    
    setTimeout(() => {
        clearInterval(confettiInterval);
    }, 2000);
}

function launchFlamengoBombaca() {
    const flamengoColors = ['#FF0000', '#000000', '#FFFFFF', '#DC143C', '#8B0000'];
    
    for (let i = 0; i < 80; i++) {
        const piece = createConfettiPiece();
        piece.color = flamengoColors[Math.floor(Math.random() * flamengoColors.length)];
        confetti.push(piece);
    }
    
    updateConfetti();
    
    const confettiInterval = setInterval(() => {
        for (let i = 0; i < 15; i++) {
            const piece = createConfettiPiece();
            piece.color = flamengoColors[Math.floor(Math.random() * flamengoColors.length)];
            confetti.push(piece);
        }
    }, 80);
    
    setTimeout(() => {
        clearInterval(confettiInterval);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async function() {
    await initializeApp();
    setupEventListeners();
    setupMarianeAnimations();
});
