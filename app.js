/**
 * Watermill Express Vending Machine Simulator
 * Core Application Logic, Web Audio Synthesizers, Canvas Particle Physics, and Workflow State Machine.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATED DATA & VARIABLES ---
    const STATE = {
        currentScreen: 'screen-home',
        product: null,        // 'water' or 'ice'
        size: null,           // size label (e.g. "5 Gallon" or "20 lb Bag")
        sizeVal: null,        // numerical size value for math (1, 3, 5)
        spigot: false,        // boolean (5 gallon w/ spigot)
        totalPrice: 0.00,
        amountPaid: 0.00,
        isHygieneNoticeRead: false,
        isVending: false,
        audioContext: null    // Lazy initialized
    };

    const WATER_CATALOG = [
        { id: 'water-5g', name: '5 Gallon Bottle', sizeVal: 5, price: 1.25, spigot: false, 
          svg: `<svg viewBox="0 0 100 120" class="bottle-svg size-5g"><path d="M40,20 L60,20 L60,30 L75,40 L75,100 Q75,108 67,108 L33,108 Q25,108 25,100 L25,40 L40,30 Z" fill="var(--color-bottle-blue)" stroke="#00a8ff" stroke-width="2" /><rect x="44" y="10" width="12" height="10" fill="var(--color-primary-blue)" rx="2"/><line x1="30" y1="55" x2="70" y2="55" stroke="#ffffff" stroke-width="2" opacity="0.4" /><line x1="30" y1="70" x2="70" y2="70" stroke="#ffffff" stroke-width="2" opacity="0.4" /><line x1="30" y1="85" x2="70" y2="85" stroke="#ffffff" stroke-width="2" opacity="0.4" /></svg>` },
        { id: 'water-5gs', name: '5 Gallon w/ Spigot', sizeVal: 5, price: 1.25, spigot: true, 
          svg: `<svg viewBox="0 0 100 120" class="bottle-svg size-5gs"><path d="M40,20 L60,20 L60,30 L75,40 L75,100 Q75,108 67,108 L33,108 Q25,108 25,100 L25,40 L40,30 Z" fill="var(--color-bottle-blue)" stroke="#00a8ff" stroke-width="2" /><rect x="44" y="10" width="12" height="10" fill="var(--color-primary-blue)" rx="2"/><line x1="30" y1="55" x2="70" y2="55" stroke="#ffffff" stroke-width="2" opacity="0.4" /><line x1="30" y1="70" x2="70" y2="70" stroke="#ffffff" stroke-width="2" opacity="0.4" /><line x1="30" y1="85" x2="70" y2="85" stroke="#ffffff" stroke-width="2" opacity="0.4" /><path d="M25,95 L15,95 L15,90 L10,90 L10,100 L15,100 L15,97 L25,97 Z" fill="#cccccc" stroke="#666666" stroke-width="1"/></svg>` },
        { id: 'water-3g', name: '3 Gallon Bottle', sizeVal: 3, price: 0.75, spigot: false, 
          svg: `<svg viewBox="0 0 100 120" class="bottle-svg size-3g"><path d="M42,30 L58,30 L58,38 L70,48 L70,100 Q70,106 64,106 L36,106 Q30,106 30,100 L30,48 L42,38 Z" fill="var(--color-bottle-blue)" stroke="#00a8ff" stroke-width="2" /><rect x="45" y="20" width="10" height="10" fill="var(--color-primary-blue)" rx="2"/><line x1="35" y1="60" x2="65" y2="60" stroke="#ffffff" stroke-width="2" opacity="0.4" /><line x1="35" y1="78" x2="65" y2="78" stroke="#ffffff" stroke-width="2" opacity="0.4" /></svg>` },
        { id: 'water-1g', name: '1 Gallon Jug', sizeVal: 1, price: 0.25, spigot: false, 
          svg: `<svg viewBox="0 0 100 120" class="bottle-svg size-1g"><path d="M44,45 L56,45 L56,52 L65,60 L65,100 Q65,105 60,105 L40,105 Q35,105 35,100 L35,60 L44,52 Z" fill="var(--color-bottle-blue)" stroke="#00a8ff" stroke-width="2" /><rect x="46" y="37" width="8" height="8" fill="var(--color-primary-blue)" rx="1"/><path d="M57,65 L61,65 L61,85 L57,85 Z" fill="none" stroke="#00a8ff" stroke-width="2" rx="2" /></svg>` }
    ];

    const ICE_CATALOG = [
        { id: 'ice-bag', name: 'Ice Bag (20 lbs)', sizeVal: 5, price: 1.75, spigot: false,
          svg: `<svg viewBox="0 0 100 120" class="bottle-svg size-5g"><path d="M25,30 Q25,20 35,22 Q50,25 65,22 Q75,20 75,30 L80,105 Q80,110 70,110 L30,110 Q20,110 20,105 Z" fill="rgba(240, 253, 255, 0.4)" stroke="#00d2ff" stroke-width="2" /><ellipse cx="50" cy="25" rx="23" ry="5" fill="none" stroke="#00d2ff" stroke-width="2" /><rect x="35" y="45" width="12" height="12" rx="2" fill="rgba(188, 252, 255, 0.8)" stroke="#00c0f0" stroke-width="1" transform="rotate(15 41 51)"/><rect x="52" y="40" width="14" height="14" rx="2" fill="rgba(188, 252, 255, 0.8)" stroke="#00c0f0" stroke-width="1" transform="rotate(-10 59 47)"/><rect x="30" y="65" width="15" height="15" rx="2" fill="rgba(188, 252, 255, 0.8)" stroke="#00c0f0" stroke-width="1" transform="rotate(5 37 72)"/><rect x="48" y="60" width="13" height="13" rx="2" fill="rgba(188, 252, 255, 0.8)" stroke="#00c0f0" stroke-width="1" transform="rotate(25 54 66)"/><rect x="65" y="55" width="12" height="12" rx="2" fill="rgba(188, 252, 255, 0.8)" stroke="#00c0f0" stroke-width="1" transform="rotate(-15 71 61)"/><rect x="40" y="80" width="15" height="15" rx="2" fill="rgba(188, 252, 255, 0.8)" stroke="#00c0f0" stroke-width="1" transform="rotate(-5 47 87)"/><rect x="58" y="78" width="14" height="14" rx="2" fill="rgba(188, 252, 255, 0.8)" stroke="#00c0f0" stroke-width="1" transform="rotate(18 65 85)"/></svg>` },
        { id: 'ice-cooler', name: 'Personal Cooler', sizeVal: 5, price: 1.75, spigot: false,
          svg: `<svg viewBox="0 0 120 120" class="bottle-svg size-5g"><rect x="15" y="25" width="90" height="12" rx="3" fill="#ffffff" stroke="#cccccc" stroke-width="1.5" /><rect x="25" y="37" width="70" height="65" rx="5" fill="#ef4444" stroke="#b91c1c" stroke-width="2" /><path d="M15,55 L8,55 L8,65 L15,65" fill="none" stroke="#cccccc" stroke-width="2" stroke-linecap="round" /><path d="M105,55 L112,55 L112,65 L105,65" fill="none" stroke="#cccccc" stroke-width="2" stroke-linecap="round" /><rect x="45" y="37" width="30" height="25" fill="#ffffff" /><rect x="55" y="47" width="10" height="8" rx="1" fill="#334155" /></svg>` },
        { id: 'ice-bucket', name: '5 Gallon Bucket', sizeVal: 5, price: 1.75, spigot: false,
          svg: `<svg viewBox="0 0 100 120" class="bottle-svg size-5g"><path d="M22,30 L78,30 L70,105 Q70,110 62,110 L38,110 Q30,110 30,105 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" /><ellipse cx="50" cy="30" rx="28" ry="6" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.5" /><path d="M20,32 C20,10 80,10 80,32" fill="none" stroke="#475569" stroke-width="1.5" /></svg>` },
        { id: 'ice-smallcooler', name: 'Small Cooler', sizeVal: 1, price: 0.35, spigot: false,
          svg: `<svg viewBox="0 0 120 120" class="bottle-svg size-3g"><rect x="25" y="35" width="70" height="10" rx="2" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" /><rect x="32" y="45" width="56" height="55" rx="4" fill="#0284c7" stroke="#0369a1" stroke-width="2" /><path d="M60,35 L60,15 L70,15" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" /><path d="M60,15 L35,15" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" /><rect x="55" y="52" width="10" height="8" rx="1" fill="#ffffff" /></svg>` }
    ];

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

        // Update Brand Poster Cards in Payment/Vending dynamically
        const paymentPoster = document.getElementById('payment-brand-poster');
        const vendingPoster = document.getElementById('vending-brand-poster');
        if (paymentPoster && vendingPoster) {
            if (STATE.product === 'ice') {
                paymentPoster.className = 'brand-poster-card poster-ice';
                vendingPoster.className = 'brand-poster-card poster-ice';
            } else {
                paymentPoster.className = 'brand-poster-card poster-water';
                vendingPoster.className = 'brand-poster-card poster-water';
            }
        }

        // Handle enter/exit hooks for screens
        if (screenId === 'screen-home') {
            resetOrderState();
        } else if (screenId === 'screen-container') {
            containerProductTag.textContent = `Product: ${STATE.product.toUpperCase()}`;
            // Render the catalog items dynamically
            renderCatalogContainerMenu();
            
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
            
            receiptProductName.textContent = `${STATE.product.toUpperCase()} (${STATE.size})`;
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
        STATE.sizeVal = null;
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

    function renderCatalogContainerMenu() {
        const catalogGrid = document.getElementById('container-catalog-grid');
        const list = STATE.product === 'water' ? WATER_CATALOG : ICE_CATALOG;
        
        catalogGrid.innerHTML = '';
        list.forEach(item => {
            const card = document.createElement('button');
            card.className = 'container-card';
            card.setAttribute('data-id', item.id);
            card.setAttribute('data-size', item.name);
            card.setAttribute('data-sizeval', item.sizeVal);
            card.setAttribute('data-price', item.price);
            card.setAttribute('data-spigot', item.spigot ? 'true' : 'false');
            
            card.innerHTML = `
                <div class="container-visual-wrapper">
                    ${item.svg}
                </div>
                <div class="container-info">
                    <h4>${item.name}</h4>
                    <span class="price-badge">$${item.price.toFixed(2)}</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                STATE.size = item.name;
                STATE.sizeVal = item.sizeVal;
                STATE.spigot = item.spigot;
                STATE.totalPrice = item.price;
                
                placeContainerInKiosk(item.id);
                navigateTo('screen-payment');
            });
            
            catalogGrid.appendChild(card);
        });
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
    function placeContainerInKiosk(itemId) {
        // Find matching item details from catalogs
        const item = WATER_CATALOG.find(i => i.id === itemId) || ICE_CATALOG.find(i => i.id === itemId);
        if (item) {
            // Display item markup in chamber dispensing bay
            kioskContainerHolder.innerHTML = item.svg;
            // Adjust kiosk sizes for better presentation scaling
            const svgEl = kioskContainerHolder.querySelector('svg');
            if (svgEl) {
                if (item.sizeVal === 1) {
                    svgEl.style.height = '110px';
                } else if (item.sizeVal === 3) {
                    svgEl.style.height = '130px';
                } else {
                    svgEl.style.height = '165px';
                }
                svgEl.classList.add('bottle-kiosk-svg');
            }
        }
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
        navigateTo('screen-container');
    });

    btnSelectIce.addEventListener('click', () => {
        initAudio();
        STATE.product = 'ice';
        navigateTo('screen-container');
    });

    // Close Hygiene notice
    btnCloseHygiene.addEventListener('click', () => {
        STATE.isHygieneNoticeRead = true;
        hygienePopup.classList.remove('active');
    });

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

    // Reverse Osmosis Membrane & Freezer Module Simulation (Canvas)
    let roParticles = [];
    const maxParticles = 65;
    let freezeProgress = 0; // 0 to 1 for freezing grid animation

    function initRoSimulation() {
        const width = canvasRo.width = canvasRo.offsetWidth;
        const height = canvasRo.height = canvasRo.offsetHeight;
        roParticles = [];
        freezeProgress = 0;

        // Seed initial particle batch
        for (let i = 0; i < maxParticles; i++) {
            roParticles.push(createRoParticle(width, height, true));
        }
    }

    function createRoParticle(canvasWidth, canvasHeight, randomizeX = false) {
        const isPure = Math.random() > 0.4; // 60% pure, 40% impurities
        
        return {
            x: randomizeX ? Math.random() * (canvasWidth * 0.4) + 10 : 10,
            y: Math.random() * (canvasHeight - 20) + 10,
            vx: Math.random() * 2.5 + 1.5,
            vy: (Math.random() * 1.5 - 0.75),
            radius: isPure ? Math.random() * 2.5 + 2 : Math.random() * 4 + 4,
            isPure: isPure,
            rejected: false,
            color: isPure ? '#38bdf8' : '#fb923c'
        };
    }

    // Main Canvas animation for Step 5 / Freezer
    function animateRoOrFreezer(vendingProgress) {
        const ctx = canvasRo.getContext('2d');
        const width = canvasRo.width;
        const height = canvasRo.height;

        ctx.clearRect(0, 0, width, height);

        // Timeline branches: Water vs Ice
        if (STATE.product === 'water' || (STATE.product === 'ice' && vendingProgress <= 45)) {
            // STANDARD REVERSE OSMOSIS SCREEN
            document.getElementById('vending-step-tag').textContent = "Step 5";
            document.getElementById('vending-step-title').textContent = "Reverse Osmosis Filtration (RO)";
            
            // Draw semi-permeable membrane
            const membraneX = width * 0.55;
            ctx.beginPath();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.setLineDash([4, 6]);
            ctx.moveTo(membraneX, 0);
            ctx.lineTo(membraneX, height);
            ctx.stroke();
            ctx.setLineDash([]); // reset

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(membraneX - 2, 0, 4, height);

            roParticles.forEach((p, idx) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.y - p.radius < 0 || p.y + p.radius > height) p.vy = -p.vy;

                // Hit membrane
                if (!p.rejected && p.x + p.radius >= membraneX && p.x - p.radius <= membraneX + 5) {
                    if (p.isPure) {
                        p.vx = Math.abs(p.vx) * 0.85; // pass
                    } else {
                        p.rejected = true;
                        p.vx = -Math.abs(p.vx) * 1.2; // reject
                        p.vy = Math.random() * 2 + 1;
                    }
                }

                let reset = false;
                if (p.x > width || (p.rejected && (p.y > height || p.x < 0))) reset = true;

                if (reset) {
                    roParticles[idx] = createRoParticle(width, height, false);
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.isPure ? 6 : 0;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

        } else if (STATE.product === 'ice' && vendingProgress > 45) {
            // STANDALONE FREEZER MODULE SCREEN
            document.getElementById('vending-step-tag').textContent = "Freezer";
            document.getElementById('vending-step-title').textContent = "Sub-Zero Ice Block Maker Active";

            // Draw a neat freezer grid containing ice mold cells
            const rows = 3;
            const cols = 8;
            const cellSize = 30;
            const startX = (width - cols * (cellSize + 8)) / 2;
            const startY = (height - rows * (cellSize + 8)) / 2;

            ctx.fillStyle = '#075985';
            ctx.font = 'bold 9px var(--font-primary)';
            ctx.fillText("FREEZER CELL MATRIX - LIQUID SOLIDIFICATION ACTIVE", startX, startY - 10);

            // Increment freeze state
            freezeProgress = Math.min(1.0, (vendingProgress - 45) / 35); // solidifies up to 80% progress

            // Draw mold grids
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = startX + c * (cellSize + 8);
                    const y = startY + r * (cellSize + 8);

                    // Grid mold border
                    ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x, y, cellSize, cellSize);

                    // Draw water level freezing inside cell
                    if (freezeProgress > 0) {
                        ctx.fillStyle = `rgba(188, 252, 255, ${freezeProgress * 0.8})`;
                        const fillH = cellSize * freezeProgress;
                        ctx.fillRect(x + 2, y + cellSize - fillH - 2, cellSize - 4, fillH);

                        if (freezeProgress >= 1.0) {
                            // Mold highlight glows when frozen solid
                            ctx.strokeStyle = '#00d2ff';
                            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                        }
                    }
                }
            }

            // Animate ice crystals floating/shaking inside
            if (vendingProgress > 80) {
                ctx.fillStyle = 'rgba(0, 210, 255, 0.2)';
                ctx.fillText("ICE EXTRACTION BLOCK RELEASED", startX, startY + rows * (cellSize + 8) + 12);
            }
        }

        roAnimationId = requestAnimationFrame(() => animateRoOrFreezer(vendingProgress));
    }


    // --- LIQUID / ICE DISPENSING CHAMBER SIMULATOR ---
    let fluidLevel = 0;
    let fluidBubbles = [];
    let iceCubes = [];

    function initDispenserSimulation() {
        canvasVendFluid.width = canvasVendFluid.offsetWidth;
        canvasVendFluid.height = canvasVendFluid.offsetHeight;
        fluidLevel = 0;
        fluidBubbles = [];
        iceCubes = [];
    }

    // Creates rising water splash or falling ice blocks inside kiosk bay
    function updateAndDrawVendingFluid(vendingProgress) {
        const ctx = canvasVendFluid.getContext('2d');
        const w = canvasVendFluid.width;
        const h = canvasVendFluid.height;

        ctx.clearRect(0, 0, w, h);

        const nozzleX = w / 2;
        const nozzleY = 35;

        // Container sizing parameters
        let containerH = 120;
        let containerW = 75;
        if (STATE.sizeVal === 3) {
            containerH = 100;
            containerW = 65;
        } else if (STATE.sizeVal === 1) {
            containerH = 80;
            containerW = 55;
        }

        const containerX = (w - containerW) / 2;
        const containerY = h - containerH - 12;

        if (vendingProgress > 30) {
            const dispenseProgress = (vendingProgress - 30) / 70;
            fluidLevel = dispenseProgress;

            if (STATE.product === 'water') {
                // WATER POUR STREAM
                if (vendingProgress < 99) {
                    ctx.beginPath();
                    const gradientStream = ctx.createLinearGradient(nozzleX - 4, nozzleY, nozzleX + 4, containerY + containerH * (1 - fluidLevel));
                    gradientStream.addColorStop(0, 'rgba(0, 210, 255, 0.9)');
                    gradientStream.addColorStop(0.5, 'rgba(56, 189, 248, 0.7)');
                    gradientStream.addColorStop(1, 'rgba(0, 210, 255, 0.9)');
                    ctx.fillStyle = gradientStream;
                    
                    ctx.moveTo(nozzleX - 3 + Math.sin(Date.now()*0.05)*1, nozzleY);
                    ctx.lineTo(nozzleX + 3 + Math.sin(Date.now()*0.05)*1, nozzleY);
                    ctx.lineTo(nozzleX + 4, containerY + containerH * (1 - fluidLevel));
                    ctx.lineTo(nozzleX - 4, containerY + containerH * (1 - fluidLevel));
                    ctx.fill();
                }

                // RISING WATER LIQUID
                const currentFluidY = containerY + containerH * (1 - fluidLevel);

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(containerX, containerY + 15, containerW, containerH - 15, 6);
                ctx.clip();

                ctx.beginPath();
                ctx.fillStyle = 'rgba(0, 168, 255, 0.45)';
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
                ctx.lineWidth = 2;

                ctx.moveTo(containerX, currentFluidY);
                const waveFreq = 0.05;
                const waveAmp = vendingProgress < 98 ? 3 : 0.5;
                for (let x = containerX; x <= containerX + containerW; x++) {
                    const y = currentFluidY + Math.sin((x + Date.now()*0.15) * waveFreq) * waveAmp;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(containerX + containerW, containerY + containerH);
                ctx.lineTo(containerX, containerY + containerH);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Rising air bubbles
                if (vendingProgress < 99 && Math.random() > 0.4) {
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

                    if (b.y < currentFluidY) fluidBubbles.splice(idx, 1);
                });

                ctx.restore();

                // Surface splash particles
                if (vendingProgress < 99 && Math.random() > 0.3) {
                    for(let i=0; i<3; i++) {
                        fluidBubbles.push({
                            x: nozzleX + (Math.random() * 12 - 6),
                            y: currentFluidY,
                            vy: -(Math.random() * 3 + 1),
                            vx: Math.random() * 4 - 2,
                            r: Math.random() * 1.5 + 0.5,
                            isSplash: true
                        });
                    }
                }

                ctx.fillStyle = '#00d2ff';
                fluidBubbles.forEach((b, idx) => {
                    if (b.isSplash) {
                        b.y += b.vy;
                        b.x += b.vx;
                        b.vy += 0.2;
                        ctx.beginPath();
                        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
                        ctx.fill();

                        if (b.y > containerY + containerH) fluidBubbles.splice(idx, 1);
                    }
                });

            } else if (STATE.product === 'ice') {
                // ICE TUMBLING CUBES (Start falling only after freeze phase begins > 45%)
                if (vendingProgress > 45 && vendingProgress < 98 && vendingProgress % 3 === 0) {
                    iceCubes.push({
                        x: nozzleX + (Math.random() * 8 - 4),
                        y: nozzleY + 5,
                        vy: 5.5,
                        vx: Math.random() * 2.4 - 1.2,
                        size: Math.random() * 7 + 7,
                        angle: Math.random() * Math.PI,
                        spin: Math.random() * 0.15 - 0.075,
                        settled: false
                    });
                }

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(containerX, containerY + 15, containerW, containerH - 15, 6);
                ctx.clip();

                // Animate and draw falling and stacking ice cubes
                iceCubes.forEach(c => {
                    if (!c.settled) {
                        c.y += c.vy;
                        c.x += c.vx;
                        c.angle += c.spin;

                        const bottomLimit = containerY + containerH - (c.size / 2);
                        // Scale ice pile height base directly off vending timeline
                        const icePileLevel = (vendingProgress - 45) / 55;
                        const stackY = containerY + containerH - (containerH * icePileLevel) + (Math.random() * 12 - 6);

                        if (c.y >= stackY || c.y >= bottomLimit) {
                            c.y = Math.min(stackY, bottomLimit);
                            c.vy = 0;
                            c.vx = 0;
                            c.spin = 0;
                            c.settled = true;
                        }
                    }

                    ctx.save();
                    ctx.translate(c.x, c.y);
                    ctx.rotate(c.angle);
                    
                    ctx.fillStyle = 'rgba(215, 252, 255, 0.85)';
                    ctx.strokeStyle = '#00d2ff';
                    ctx.lineWidth = 1.2;
                    
                    ctx.beginPath();
                    ctx.roundRect(-c.size/2, -c.size/2, c.size, c.size, 2);
                    ctx.fill();
                    ctx.stroke();

                    // Icy sheen line
                    ctx.beginPath();
                    ctx.strokeStyle = '#ffffff';
                    ctx.moveTo(-c.size/3, -c.size/3);
                    ctx.lineTo(c.size/3, -c.size/3);
                    ctx.stroke();

                    ctx.restore();
                });

                ctx.restore();
            }
        }

        vendAnimationId = requestAnimationFrame(() => updateAndDrawVendingFluid(vendingProgress));
    }

    // --- SEQUENCER LOOP FOR STEP 4 ACTIVE STATE ---
    function startVendingSequence() {
        let progress = 0;
        vendingProgressFill.style.width = '0%';
        vendingProgressPercent.textContent = '0%';

        ledMonitoring.className = 'led-light led-green flashing';
        ledFailsafe.className = 'led-light led-green flashing';

        initRoSimulation();
        animateRoOrFreezer(progress);

        initDispenserSimulation();
        updateAndDrawVendingFluid(progress);

        const duration = 10000;
        const intervalTime = 100;
        const increments = duration / intervalTime;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            progress = (step / increments) * 100;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }

            vendingProgressFill.style.width = `${progress}%`;
            vendingProgressPercent.textContent = `${Math.round(progress)}%`;

            // Sequential actions based on timeline progress
            if (progress <= 30) {
                // PHASE 1: Dispenser UV self-clean cycles
                dispenserStatusText.textContent = "Self-Cleaning Dispenser Active";
                dispenserStatusText.parentElement.style.backgroundColor = "rgba(138, 43, 226, 0.15)";
                dispenserStatusText.parentElement.style.borderColor = "rgba(138, 43, 226, 0.5)";
                dispenserStatusText.style.color = "#c084fc";
                
                uvGlow.classList.add('active');
                sanitizeSpray.classList.add('active');

                if (step === 1) playSanitizeSound();
            } else {
                // PHASE 2: Main vending flow
                dispenserStatusText.textContent = "Dispensing Kiosk Quality Approved";
                dispenserStatusText.parentElement.style.backgroundColor = "rgba(0, 168, 89, 0.15)";
                dispenserStatusText.parentElement.style.borderColor = "rgba(0, 168, 89, 0.5)";
                dispenserStatusText.style.color = "#86efac";

                uvGlow.classList.remove('active');
                sanitizeSpray.classList.remove('active');

                // Trigger sounds
                if (step === Math.ceil(increments * 0.3) + 1) {
                    startVendingSound();
                }
            }

            if (progress >= 100) {
                stopVendingSound();
                playCompleteSound();
                
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

