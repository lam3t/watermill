/**
 * Watermill Express Vending Machine Simulator
 * Core Application Logic, Web Audio Synthesizers, Canvas Particle Physics, and Workflow State Machine.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATED DATA & VARIABLES ---
    const STATE = {
        currentScreen: 'screen-home',
        product: null,        // 'water' or 'ice'
        size: null,           // 1, 3, or 5 (gallons)
        spigot: false,        // boolean (5 gallon w/ spigot)
        pricePerGallon: 0.25, // default
        totalPrice: 0.00,
        amountPaid: 0.00,
        isHygieneNoticeRead: false,
        isVending: false,
        audioContext: null    // Lazy initialized
    };

    const PRICING = {
        water: 0.25, // per gallon
        ice: 0.35    // per gallon
    };

    // --- DOM ELEMENT REFERENCES ---
    const screens = {
        home: document.getElementById('screen-home'),
        container: document.getElementById('screen-container'),
        payment: document.getElementById('screen-payment'),
        vending: document.getElementById('screen-vending'),
        complete: document.getElementById('screen-complete')
    };

    // Buttons
    const btnSelectWater = document.getElementById('btn-select-water');
    const btnSelectIce = document.getElementById('btn-select-ice');
    const btnContainerBack = document.getElementById('btn-container-back');
    const btnCloseHygiene = document.getElementById('btn-close-hygiene');
    const btnPaymentBack = document.getElementById('btn-payment-back');
    const btnStartVending = document.getElementById('btn-start-vending');
    const btnCompleteRestart = document.getElementById('btn-complete-restart');

    // Hardware Simulation Buttons
    const btnInsertQuarter = document.getElementById('btn-insert-quarter');
    const btnInsertDollar1 = document.getElementById('btn-insert-dollar1');
    const btnInsertDollar5 = document.getElementById('btn-insert-dollar5');
    const btnSwipeCard = document.getElementById('btn-swipe-card');
    const btnRefund = document.getElementById('btn-refund');

    // UI Labels / Text
    const containerProductTag = document.getElementById('container-screen-product-tag');
    const receiptProductName = document.getElementById('receipt-product-name');
    const receiptCost = document.getElementById('receipt-cost');
    const valAmountPaid = document.getElementById('val-amount-paid');
    const valAmountDue = document.getElementById('val-amount-due');
    const paymentPromptMsg = document.getElementById('payment-prompt-msg');
    
    // Vending Dashboard Components
    const vendingProgressFill = document.getElementById('vending-progress-fill');
    const vendingProgressPercent = document.getElementById('vending-progress-percent');
    const dispenserStatusText = document.getElementById('dispenser-status-text');
    const ledMonitoring = document.getElementById('led-monitoring');
    const ledFailsafe = document.getElementById('led-failsafe');

    // Kiosk Bay Components
    const uvGlow = document.getElementById('uv-glow');
    const nozzleTip = document.getElementById('nozzle-tip');
    const sanitizeSpray = document.getElementById('sanitize-spray');
    const doorLock = document.getElementById('door-lock');
    const kioskContainerHolder = document.getElementById('kiosk-container-holder');
    const containerPlaceholderMsg = document.getElementById('container-placeholder-msg');

    // Completion components
    const completeProductType = document.getElementById('complete-product-type');
    const resetSecondsLabel = document.getElementById('reset-seconds');
    const hygienePopup = document.getElementById('hygiene-popup');

    // Canvases
    const canvasRo = document.getElementById('canvas-ro');
    const canvasVendFluid = document.getElementById('canvas-vend-fluid');

    let roAnimationId = null;
    let vendAnimationId = null;
    let autoResetTimeout = null;
    let autoResetInterval = null;

    // --- WEB AUDIO API SYNTHESIZER ---
    function initAudio() {
        if (!STATE.audioContext) {
            STATE.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (STATE.audioContext.state === 'suspended') {
            STATE.audioContext.resume();
        }
    }

    // Play synthesized metallic coin sound
    function playCoinSound() {
        try {
            initAudio();
            const ctx = STATE.audioContext;
            const now = ctx.currentTime;
            
            // Oscillator for base clink tone
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // high pitch metal
            osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(587, now);
            osc2.frequency.exponentialRampToValueAtTime(900, now + 0.08);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.3);
            osc2.stop(now + 0.3);
        } catch (e) {
            console.warn("Audio Context blocked or unsupported:", e);
        }
    }

    // Play sound of card swipe approval
    function playCardSwipeSound() {
        try {
            initAudio();
            const ctx = STATE.audioContext;
            const now = ctx.currentTime;

            // Short friction noise followed by double beep
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            // Beep tone
            osc.frequency.setValueAtTime(1046.5, now + 0.1); // C6 tone
            osc.frequency.setValueAtTime(1318.5, now + 0.22); // E6 tone
            
            gain.gain.setValueAtTime(0.15, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            gain.gain.setValueAtTime(0.15, now + 0.22);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {
            console.warn(e);
        }
    }

    // Play sanitizing mist hiss sound
    function playSanitizeSound() {
        try {
            initAudio();
            const ctx = STATE.audioContext;
            const now = ctx.currentTime;

            // Synthesize hiss using white noise buffer
            const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = buffer;

            // Bandpass filter to sound like spraying mist
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 4000;
            filter.Q.value = 1.0;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.1); // fade in
            gain.gain.linearRampToValueAtTime(0.2, now + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // fade out

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            noiseNode.start(now);
            noiseNode.stop(now + 1.5);
        } catch (e) {
            console.warn(e);
        }
    }

    // Play simulated vending pump/fluid/ice flow hum
    let vendingSourceNode = null;
    let vendingGainNode = null;

    function startVendingSound() {
        try {
            initAudio();
            const ctx = STATE.audioContext;
            const now = ctx.currentTime;

            // Low frequency pump hum (80Hz square + 120Hz triangle)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            vendingGainNode = ctx.createGain();

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(60, now);
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(120, now);

            // Water stream rush noise filter
            const bufferSize = ctx.sampleRate * 10;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            // Ice sounds are sharper (higher filter cutoff) than water (lower filter cutoff)
            filter.frequency.setValueAtTime(STATE.product === 'water' ? 600 : 1200, now);

            vendingGainNode.gain.setValueAtTime(0, now);
            vendingGainNode.gain.linearRampToValueAtTime(0.25, now + 0.5);

            osc1.connect(vendingGainNode);
            osc2.connect(vendingGainNode);
            noise.connect(filter);
            filter.connect(vendingGainNode);
            
            vendingGainNode.connect(ctx.destination);

            osc1.start(now);
            osc2.start(now);
            noise.start(now);

            // Store reference to stop later
            vendingSourceNode = { osc1, osc2, noise };
        } catch (e) {
            console.warn(e);
        }
    }

    function stopVendingSound() {
        try {
            if (vendingSourceNode && STATE.audioContext) {
                const now = STATE.audioContext.currentTime;
                vendingGainNode.gain.setValueAtTime(vendingGainNode.gain.value, now);
                vendingGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                setTimeout(() => {
                    vendingSourceNode.osc1.stop();
                    vendingSourceNode.osc2.stop();
                    vendingSourceNode.noise.stop();
                    vendingSourceNode = null;
                }, 550);
            }
        } catch (e) {
            console.warn(e);
        }
    }

    // Play synthesized transaction completion musical chime
    function playCompleteSound() {
        try {
            initAudio();
            const ctx = STATE.audioContext;
            const now = ctx.currentTime;

            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                
                gain.gain.setValueAtTime(0, now + idx * 0.12);
                gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.8);
            });
        } catch (e) {
            console.warn(e);
        }
    }


    // --- STATE NAVIGATION FUNCTIONS ---
    function navigateTo(screenId) {
        // Hide all screens
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });

        // Set screen state
        STATE.currentScreen = screenId;
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Handle enter/exit hooks for screens
        if (screenId === 'screen-home') {
            resetOrderState();
        } else if (screenId === 'screen-container') {
            containerProductTag.textContent = `Product: ${STATE.product.toUpperCase()}`;
            // Pre-calculate prices shown in catalog based on product type
            updateCatalogPriceLabels();
            
            // Show Hygiene Warning if not read in this session
            if (!STATE.isHygieneNoticeRead) {
                hygienePopup.classList.add('active');
            } else {
                hygienePopup.classList.remove('active');
            }
        } else if (screenId === 'screen-payment') {
            // Door should unlock when placing bottle
            doorLock.textContent = "UNLOCKED";
            doorLock.classList.add('unlocked');
            
            receiptProductName.textContent = `${STATE.product.toUpperCase()} (${STATE.size} Gallon${STATE.spigot ? ' w/ Spigot' : ''})`;
            receiptCost.textContent = `$${STATE.totalPrice.toFixed(2)}`;
            updatePaymentScreenBalance();
        } else if (screenId === 'screen-vending') {
            // Lock Door during vending!
            doorLock.textContent = "LOCKED";
            doorLock.classList.remove('unlocked');
            startVendingSequence();
        } else if (screenId === 'screen-complete') {
            doorLock.textContent = "UNLOCKED";
            doorLock.classList.add('unlocked');
            completeProductType.textContent = STATE.product;
            startCompleteTimeout();
        }
    }

    function resetOrderState() {
        STATE.product = null;
        STATE.size = null;
        STATE.spigot = false;
        STATE.totalPrice = 0;
        STATE.amountPaid = 0;
        STATE.isVending = false;

        // Clear kiosk cabinet graphics
        kioskContainerHolder.innerHTML = `
            <div class="no-container-msg" id="container-placeholder-msg">
                <span>No Container Placed</span>
            </div>
        `;
        doorLock.textContent = "LOCKED";
        doorLock.classList.remove('unlocked');

        // Clear timers
        clearTimeout(autoResetTimeout);
        clearInterval(autoResetInterval);

        // Cancel animations
        if (roAnimationId) cancelAnimationFrame(roAnimationId);
        if (vendAnimationId) cancelAnimationFrame(vendAnimationId);

        // Clear fluid canvas
        const ctxFluid = canvasVendFluid.getContext('2d');
        ctxFluid.clearRect(0, 0, canvasVendFluid.width, canvasVendFluid.height);
    }

    function updateCatalogPriceLabels() {
        const rate = PRICING[STATE.product];
        document.getElementById('price-1g').textContent = `$${(rate * 1).toFixed(2)}`;
        document.getElementById('price-3g').textContent = `$${(rate * 3).toFixed(2)}`;
        document.getElementById('price-5g').textContent = `$${(rate * 5).toFixed(2)}`;
        document.getElementById('price-5g-spigot').textContent = `$${(rate * 5).toFixed(2)}`;
    }

    function updatePaymentScreenBalance() {
        valAmountPaid.textContent = `$${STATE.amountPaid.toFixed(2)}`;
        const remaining = Math.max(0, STATE.totalPrice - STATE.amountPaid);
        valAmountDue.textContent = `$${remaining.toFixed(2)}`;

        const remainingValNode = document.getElementById('val-amount-due');
        if (remaining === 0) {
            remainingValNode.classList.add('paid-full');
            paymentPromptMsg.classList.add('ready');
            paymentPromptMsg.innerHTML = `<span class="alert-icon">✓</span><span>Required amount paid! Click <strong>START VENDING</strong> below to begin.</span>`;
            btnStartVending.disabled = false;
        } else {
            remainingValNode.classList.remove('paid-full');
            paymentPromptMsg.classList.remove('ready');
            paymentPromptMsg.innerHTML = `<span class="alert-icon">💳</span><span>Please insert cash or swipe card using the physical panel inputs.</span>`;
            btnStartVending.disabled = true;
        }
    }


    // --- KIOSK CONTAINER GRAPHICS UPDATES ---
    function placeContainerInKiosk(size, spigot) {
        // Renders the selected container SVG inside the Left Panel (dispensing bay)
        let containerMarkup = '';
        const spigotClass = spigot ? 'has-spigot' : '';

        if (size === 1) {
            containerMarkup = `
                <svg viewBox="0 0 100 120" class="bottle-kiosk-svg size-1g ${spigotClass}" style="height: 110px; width: auto;">
                    <path d="M44,45 L56,45 L56,52 L65,60 L65,100 Q65,105 60,105 L40,105 Q35,105 35,100 L35,60 L44,52 Z" fill="var(--color-bottle-blue)" stroke="#00d2ff" stroke-width="2" />
                    <rect x="46" y="37" width="8" height="8" fill="var(--color-primary-blue)" rx="1"/>
                    <path d="M57,65 L61,65 L61,85 L57,85 Z" fill="none" stroke="#00d2ff" stroke-width="2" rx="2" />
                </svg>
            `;
        } else if (size === 3) {
            containerMarkup = `
                <svg viewBox="0 0 100 120" class="bottle-kiosk-svg size-3g ${spigotClass}" style="height: 135px; width: auto;">
                    <path d="M42,30 L58,30 L58,38 L70,48 L70,100 Q70,106 64,106 L36,106 Q30,106 30,100 L30,48 L42,38 Z" fill="var(--color-bottle-blue)" stroke="#00d2ff" stroke-width="2" />
                    <rect x="45" y="20" width="10" height="10" fill="var(--color-primary-blue)" rx="2"/>
                    <line x1="35" y1="60" x2="65" y2="60" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />
                    <line x1="35" y1="78" x2="65" y2="78" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />
                </svg>
            `;
        } else if (size === 5) {
            containerMarkup = `
                <svg viewBox="0 0 100 120" class="bottle-kiosk-svg size-5g ${spigotClass}" style="height: 165px; width: auto;">
                    <path d="M40,20 L60,20 L60,30 L75,40 L75,100 Q75,108 67,108 L33,108 Q25,108 25,100 L25,40 L40,30 Z" fill="var(--color-bottle-blue)" stroke="#00d2ff" stroke-width="2" />
                    <rect x="44" y="10" width="12" height="10" fill="var(--color-primary-blue)" rx="2"/>
                    <line x1="30" y1="55" x2="70" y2="55" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />
                    <line x1="30" y1="70" x2="70" y2="70" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />
                    <line x1="30" y1="85" x2="70" y2="85" stroke="#ffffff" stroke-width="1.5" opacity="0.4" />
                    ${spigot ? `<path d="M25,95 L15,95 L15,90 L10,90 L10,100 L15,100 L15,97 L25,97 Z" fill="#cccccc" stroke="#666666" stroke-width="1"/>` : ''}
                </svg>
            `;
        }

        kioskContainerHolder.innerHTML = containerMarkup;
    }


    // --- CURRENCY INLET EVENT HANDLERS (HARDWARE MODELLER) ---
    function handleInsertMoney(amount) {
        if (STATE.isVending || STATE.currentScreen !== 'screen-payment') return;
        
        initAudio();
        playCoinSound();
        STATE.amountPaid += amount;
        updatePaymentScreenBalance();
    }

    btnInsertQuarter.addEventListener('click', () => handleInsertMoney(0.25));
    btnInsertDollar1.addEventListener('click', () => handleInsertMoney(1.00));
    btnInsertDollar5.addEventListener('click', () => handleInsertMoney(5.00));
    
    btnSwipeCard.addEventListener('click', () => {
        if (STATE.isVending || STATE.currentScreen !== 'screen-payment') return;
        
        initAudio();
        playCardSwipeSound();
        // Fully satisfy balance instantly
        STATE.amountPaid = STATE.totalPrice;
        updatePaymentScreenBalance();
    });

    btnRefund.addEventListener('click', () => {
        if (STATE.isVending || STATE.currentScreen !== 'screen-payment') return;
        if (STATE.amountPaid === 0) return;

        initAudio();
        playCoinSound(); // plays a metallic audio signal for drop
        setTimeout(playCoinSound, 80);
        setTimeout(playCoinSound, 160);

        STATE.amountPaid = 0.00;
        updatePaymentScreenBalance();
    });


    // --- TOUCH SCREEN CLICK ASSIGNMENTS ---

    // Select Product
    btnSelectWater.addEventListener('click', () => {
        initAudio();
        STATE.product = 'water';
        STATE.pricePerGallon = PRICING.water;
        navigateTo('screen-container');
    });

    btnSelectIce.addEventListener('click', () => {
        initAudio();
        STATE.product = 'ice';
        STATE.pricePerGallon = PRICING.ice;
        navigateTo('screen-container');
    });

    // Close Hygiene notice
    btnCloseHygiene.addEventListener('click', () => {
        STATE.isHygieneNoticeRead = true;
        hygienePopup.classList.remove('active');
    });

    // Select size cards
    document.querySelectorAll('.container-card').forEach(card => {
        card.addEventListener('click', () => {
            const size = parseInt(card.getAttribute('data-size'));
            const spigot = card.getAttribute('data-spigot') === 'true';

            STATE.size = size;
            STATE.spigot = spigot;
            STATE.totalPrice = size * STATE.pricePerGallon;

            // Instantly render bottle on left panel
            placeContainerInKiosk(size, spigot);

            navigateTo('screen-payment');
        });
    });

    // Back triggers
    btnContainerBack.addEventListener('click', () => navigateTo('screen-home'));
    btnPaymentBack.addEventListener('click', () => navigateTo('screen-container'));

    // Start Vending click event
    btnStartVending.addEventListener('click', () => {
        if (STATE.amountPaid >= STATE.totalPrice) {
            navigateTo('screen-vending');
        }
    });

    // Finished restart
    btnCompleteRestart.addEventListener('click', () => {
        navigateTo('screen-home');
    });


    // ================= ANIMATIONS & SIMULATION ENGINE =================

    // Reverse Osmosis Membrane Simulation (Canvas)
    let roParticles = [];
    const maxParticles = 65;

    function initRoSimulation() {
        const width = canvasRo.width = canvasRo.offsetWidth;
        const height = canvasRo.height = canvasRo.offsetHeight;
        roParticles = [];

        // Seed initial particle batch
        for (let i = 0; i < maxParticles; i++) {
            roParticles.push(createRoParticle(width, height, true));
        }
    }

    function createRoParticle(canvasWidth, canvasHeight, randomizeX = false) {
        const isPure = Math.random() > 0.4; // 60% pure water, 40% impurities
        
        return {
            x: randomizeX ? Math.random() * (canvasWidth * 0.4) + 10 : 10,
            y: Math.random() * (canvasHeight - 20) + 10,
            vx: Math.random() * 2.5 + 1.5,
            vy: (Math.random() * 1.5 - 0.75),
            radius: isPure ? Math.random() * 2.5 + 2 : Math.random() * 4 + 4,
            isPure: isPure,
            rejected: false,
            color: isPure ? '#38bdf8' : '#fb923c' // blue vs orange
        };
    }

    function animateRoMembrane() {
        const ctx = canvasRo.getContext('2d');
        const width = canvasRo.width;
        const height = canvasRo.height;

        ctx.clearRect(0, 0, width, height);

        // Draw semi-permeable membrane filter mesh line
        const membraneX = width * 0.55;
        ctx.beginPath();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 6]);
        ctx.moveTo(membraneX, 0);
        ctx.lineTo(membraneX, height);
        ctx.stroke();
        ctx.setLineDash([]); // reset

        // Draw labels/borders
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(membraneX - 2, 0, 4, height);

        roParticles.forEach((p, idx) => {
            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off top/bottom borders
            if (p.y - p.radius < 0 || p.y + p.radius > height) {
                p.vy = -p.vy;
            }

            // Interactive logic: hitting the membrane
            if (!p.rejected && p.x + p.radius >= membraneX && p.x - p.radius <= membraneX + 5) {
                if (p.isPure) {
                    // Pure water passes through with slight speed reduction
                    p.vx = Math.abs(p.vx) * 0.85;
                } else {
                    // Impurities are rejected! Bounce back and drop down to waste line
                    p.rejected = true;
                    p.vx = -Math.abs(p.vx) * 1.2; // bounce away left
                    p.vy = Math.random() * 2 + 1; // force downward
                }
            }

            // Remove particles out of bounds and replace them
            let resetParticle = false;
            if (p.x > width) {
                resetParticle = true;
            } else if (p.rejected && (p.y > height || p.x < 0)) {
                resetParticle = true;
            }

            if (resetParticle) {
                roParticles[idx] = createRoParticle(width, height, false);
            }

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.isPure ? 6 : 0;
            ctx.fill();
            ctx.shadowBlur = 0; // reset
        });

        roAnimationId = requestAnimationFrame(animateRoMembrane);
    }


    // --- LIQUID / ICE DISPENSING CHAMBER SIMULATOR ---
    let fluidLevel = 0; // 0 to 1
    let fluidBubbles = [];
    let iceCubes = [];

    function initDispenserSimulation() {
        canvasVendFluid.width = canvasVendFluid.offsetWidth;
        canvasVendFluid.height = canvasVendFluid.offsetHeight;
        fluidLevel = 0;
        fluidBubbles = [];
        iceCubes = [];
    }

    // Creates rising water splash or falling ice blocks
    function updateAndDrawVendingFluid(progress) {
        const ctx = canvasVendFluid.getContext('2d');
        const w = canvasVendFluid.width;
        const h = canvasVendFluid.height;

        ctx.clearRect(0, 0, w, h);

        // Calculate nozzle coordinates
        const nozzleX = w / 2;
        const nozzleY = 35; // approximate tip in CSS alignment

        // Determine container bounding box in canvas coordinate
        // This box centers roughly inside the lower half
        const containerH = STATE.size === 5 ? 120 : (STATE.size === 3 ? 100 : 80);
        const containerW = STATE.size === 5 ? 75 : (STATE.size === 3 ? 65 : 55);
        const containerX = (w - containerW) / 2;
        const containerY = h - containerH - 12; // bottom margin

        // Vending has progress phases
        if (progress > 30) { // Dispensing phase triggers stream
            const dispenseProgress = (progress - 30) / 70; // 0 to 1 scaling
            fluidLevel = dispenseProgress;

            if (STATE.product === 'water') {
                // 1. Draw Stream of Water from nozzle
                if (progress < 99) {
                    ctx.beginPath();
                    const gradientStream = ctx.createLinearGradient(nozzleX - 4, nozzleY, nozzleX + 4, containerY + containerH * (1 - fluidLevel));
                    gradientStream.addColorStop(0, 'rgba(0, 210, 255, 0.9)');
                    gradientStream.addColorStop(0.5, 'rgba(56, 189, 248, 0.7)');
                    gradientStream.addColorStop(1, 'rgba(0, 210, 255, 0.9)');
                    ctx.fillStyle = gradientStream;
                    // Slightly wavy water fall stream
                    ctx.moveTo(nozzleX - 3 + Math.sin(Date.now()*0.05)*1, nozzleY);
                    ctx.lineTo(nozzleX + 3 + Math.sin(Date.now()*0.05)*1, nozzleY);
                    ctx.lineTo(nozzleX + 4, containerY + containerH * (1 - fluidLevel));
                    ctx.lineTo(nozzleX - 4, containerY + containerH * (1 - fluidLevel));
                    ctx.fill();
                }

                // 2. Draw rising fluid inside container boundaries
                const currentFluidY = containerY + containerH * (1 - fluidLevel);
                const currentFluidHeight = containerH * fluidLevel;

                ctx.save();
                // Clip canvas to the shape of the bottle base to simulate clean inside-filling
                ctx.beginPath();
                if (STATE.size === 5) {
                    ctx.roundRect(containerX, containerY + 20, containerW, containerH - 20, 8);
                } else if (STATE.size === 3) {
                    ctx.roundRect(containerX, containerY + 15, containerW, containerH - 15, 6);
                } else {
                    ctx.roundRect(containerX, containerY + 10, containerW, containerH - 10, 5);
                }
                ctx.clip();

                // Draw Water body
                ctx.beginPath();
                ctx.fillStyle = 'rgba(0, 168, 255, 0.45)';
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
                ctx.lineWidth = 2;

                // Create wave effect at water surface
                ctx.moveTo(containerX, currentFluidY);
                const waveFreq = 0.05;
                const waveAmp = progress < 98 ? 3 : 0.5; // calm down at the end
                for (let x = containerX; x <= containerX + containerW; x++) {
                    const y = currentFluidY + Math.sin((x + Date.now()*0.15) * waveFreq) * waveAmp;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(containerX + containerW, containerY + containerH);
                ctx.lineTo(containerX, containerY + containerH);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Bubbles rising inside container
                if (progress < 99 && Math.random() > 0.4) {
                    fluidBubbles.push({
                        x: containerX + Math.random() * containerW,
                        y: containerY + containerH,
                        vy: Math.random() * 2 + 1,
                        r: Math.random() * 2 + 1
                    });
                }

                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                fluidBubbles.forEach((b, idx) => {
                    b.y -= b.vy;
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
                    ctx.fill();

                    // remove bubble if above water surface
                    if (b.y < currentFluidY) {
                        fluidBubbles.splice(idx, 1);
                    }
                });

                ctx.restore();

                // Splashing droplets at surface level
                if (progress < 99 && Math.random() > 0.3) {
                    for(let i=0; i<3; i++) {
                        fluidBubbles.push({
                            x: nozzleX + (Math.random() * 12 - 6),
                            y: currentFluidY,
                            vy: -(Math.random() * 3 + 1), // upward splash
                            vx: Math.random() * 4 - 2,
                            r: Math.random() * 1.5 + 0.5,
                            isSplash: true
                        });
                    }
                }

                // Render splashes
                ctx.fillStyle = '#00d2ff';
                fluidBubbles.forEach((b, idx) => {
                    if (b.isSplash) {
                        b.y += b.vy;
                        b.x += b.vx;
                        b.vy += 0.2; // gravity
                        ctx.beginPath();
                        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
                        ctx.fill();

                        if (b.y > containerY + containerH) {
                            fluidBubbles.splice(idx, 1);
                        }
                    }
                });

            } else if (STATE.product === 'ice') {
                // Ice Dispensing Mode: Drop 3D cubes into cabinet container
                const currentFluidY = containerY + containerH * (1 - fluidLevel);

                // Drop a cube periodically during dispensing phase
                if (progress < 98 && progress % 4 === 0) {
                    iceCubes.push({
                        x: nozzleX + (Math.random() * 10 - 5),
                        y: nozzleY + 5,
                        vy: 4,
                        vx: Math.random() * 2 - 1,
                        size: Math.random() * 6 + 6,
                        angle: Math.random() * Math.PI,
                        spin: Math.random() * 0.1 - 0.05,
                        settled: false
                    });
                }

                ctx.save();
                // Clip boundary so ice cubes stack neatly inside bottle
                ctx.beginPath();
                if (STATE.size === 5) {
                    ctx.roundRect(containerX, containerY + 20, containerW, containerH - 20, 8);
                } else if (STATE.size === 3) {
                    ctx.roundRect(containerX, containerY + 15, containerW, containerH - 15, 6);
                } else {
                    ctx.roundRect(containerX, containerY + 10, containerW, containerH - 10, 5);
                }
                ctx.clip();

                // Draw falling and piling ice blocks
                iceCubes.forEach(c => {
                    if (!c.settled) {
                        c.y += c.vy;
                        c.x += c.vx;
                        c.angle += c.spin;

                        // Check collision with the bottle bottom pile
                        const bottomLimit = containerY + containerH - (c.size / 2);
                        // Make height of stack rise as level rises
                        const stackY = containerY + containerH - (containerH * fluidLevel) + (Math.random() * 10 - 5);

                        if (c.y >= stackY || c.y >= bottomLimit) {
                            c.y = Math.min(stackY, bottomLimit);
                            c.vy = 0;
                            c.vx = 0;
                            c.spin = 0;
                            c.settled = true;
                        }
                    }

                    // Draw Ice Cube shape (Glassy white/cyan square)
                    ctx.save();
                    ctx.translate(c.x, c.y);
                    ctx.rotate(c.angle);
                    
                    ctx.fillStyle = 'rgba(188, 252, 255, 0.75)';
                    ctx.strokeStyle = '#00d2ff';
                    ctx.lineWidth = 1;
                    
                    ctx.beginPath();
                    ctx.roundRect(-c.size/2, -c.size/2, c.size, c.size, 1.5);
                    ctx.fill();
                    ctx.stroke();

                    // Reflection line
                    ctx.beginPath();
                    ctx.strokeStyle = '#ffffff';
                    ctx.moveTo(-c.size/4, -c.size/4);
                    ctx.lineTo(c.size/4, -c.size/4);
                    ctx.stroke();

                    ctx.restore();
                });

                ctx.restore();
            }
        }

        vendAnimationId = requestAnimationFrame(() => updateAndDrawVendingFluid(progress));
    }

    // --- SEQUENCER LOOP FOR STEP 4 ACTIVE STATE ---
    function startVendingSequence() {
        let progress = 0;
        vendingProgressFill.style.width = '0%';
        vendingProgressPercent.textContent = '0%';

        // Pulse computer monitoring LED
        ledMonitoring.className = 'led-light led-green flashing';
        ledFailsafe.className = 'led-light led-green flashing';

        initRoSimulation();
        animateRoMembrane();

        initDispenserSimulation();
        updateAndDrawVendingFluid(progress);

        // Sequence timers
        const duration = 10000; // 10 seconds total vending process
        const intervalTime = 100;
        const increments = duration / intervalTime;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            progress = (step / increments) * 100;
            
            // Limit progress bounds
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }

            vendingProgressFill.style.width = `${progress}%`;
            vendingProgressPercent.textContent = `${Math.round(progress)}%`;

            // State changes during progress bar
            if (progress <= 30) {
                // PHASE 1: Self-Cleaning Kiosk Dispenser (UV-Sanitization)
                dispenserStatusText.textContent = "Self-Cleaning Dispenser Active";
                dispenserStatusText.parentElement.style.backgroundColor = "rgba(138, 43, 226, 0.15)";
                dispenserStatusText.parentElement.style.borderColor = "rgba(138, 43, 226, 0.5)";
                dispenserStatusText.style.color = "#c084fc";
                
                // Activate UV lights inside cabin
                uvGlow.classList.add('active');
                sanitizeSpray.classList.add('active');

                // Trigger spray sound once
                if (step === 1) {
                    playSanitizeSound();
                }
            } else {
                // PHASE 2: Dispensing Water or Ice
                dispenserStatusText.textContent = "Dispensing Kiosk Quality Approved";
                dispenserStatusText.parentElement.style.backgroundColor = "rgba(0, 168, 89, 0.15)";
                dispenserStatusText.parentElement.style.borderColor = "rgba(0, 168, 89, 0.5)";
                dispenserStatusText.style.color = "#86efac";

                // Turn off UV light sanitizers
                uvGlow.classList.remove('active');
                sanitizeSpray.classList.remove('active');

                // Trigger vending sounds
                if (step === Math.ceil(increments * 0.3) + 1) {
                    startVendingSound();
                }
            }

            if (progress >= 100) {
                // Vending ended
                stopVendingSound();
                playCompleteSound();
                
                // Stop monitoring flashings
                ledMonitoring.className = 'led-light led-green';
                ledFailsafe.className = 'led-light led-green';

                setTimeout(() => {
                    navigateTo('screen-complete');
                }, 800);
            }
        }, intervalTime);
    }

    // Completion timeout loop
    function startCompleteTimeout() {
        let count = 15;
        resetSecondsLabel.textContent = count;

        autoResetInterval = setInterval(() => {
            count--;
            resetSecondsLabel.textContent = count;
            if (count <= 0) {
                clearInterval(autoResetInterval);
                navigateTo('screen-home');
            }
        }, 1000);
    }

    // --- INITIALIZATION ---
    resetOrderState();
});
