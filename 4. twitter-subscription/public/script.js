const API_BASE = '/api';

// DOM Elements
const modal = document.getElementById('composer-modal');
const btnOpenComposer = document.getElementById('btn-open-composer');
const btnCloseComposer = document.getElementById('btn-close-composer');

const stateRecordUpload = document.getElementById('state-record-upload');
const stateReview = document.getElementById('state-review');
const stateOtp = document.getElementById('state-otp');
const stateSuccess = document.getElementById('state-success');

const btnMic = document.getElementById('btn-mic');
const waveformCanvas = document.getElementById('waveform-canvas');
const recordTimer = document.getElementById('record-timer');
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const errorBanner = document.getElementById('error-banner');
const btnContinueVerify = document.getElementById('btn-continue-verify');

const btnReviewPlay = document.getElementById('btn-review-play');
const reviewProgress = document.getElementById('review-progress');
const reviewDuration = document.getElementById('review-duration');
const hiddenAudio = document.getElementById('hidden-audio');
const btnDiscard = document.getElementById('btn-discard');
const btnGotoOtp = document.getElementById('btn-goto-otp');
const tweetCaption = document.getElementById('tweet-caption');

const otpBoxes = document.querySelectorAll('.otp-box');
const btnVerifyPost = document.getElementById('btn-verify-post');
const otpErrorBanner = document.getElementById('otp-error-banner');
const otpExpiryText = document.getElementById('otp-expiry-text');
const otpProgressFill = document.getElementById('otp-progress-fill');
const btnResendOtp = document.getElementById('btn-resend-otp');

const windowStatusBanner = document.getElementById('window-status-banner');
const windowStatusText = document.getElementById('window-status-text');
const feedList = document.getElementById('feed-list');

// State
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let audioFile = null; // Used if uploaded
let audioContext;
let analyser;
let micStream;
let recordingStartTime = 0;
let recordingInterval;
let isRecording = false;
let maxDurationSec = 300;
let maxSizeBytes = 100 * 1024 * 1024;
let otpToken = null;
let currentEmail = null; // Mocked for this demo or prompted

// Canvas Contexts
const waveCtx = waveformCanvas.getContext('2d');

// Initialize
function init() {
    setupEventListeners();
    setupCanvasAnimation();
    loadFeed();
    
    // Auto-prompt email just to have one for the session since there's no real login screen
    if (!localStorage.getItem('userEmail')) {
        let email = prompt("Welcome to AudioStream. Please enter your email to 'log in':", "user@example.com");
        if(email) localStorage.setItem('userEmail', email);
        else localStorage.setItem('userEmail', "guest@example.com");
    }
    currentEmail = localStorage.getItem('userEmail');
}

function setupEventListeners() {
    btnOpenComposer.addEventListener('click', openComposer);
    btnCloseComposer.addEventListener('click', closeComposer);

    // Recording
    btnMic.addEventListener('click', toggleRecording);

    // Upload
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Review Actions
    btnContinueVerify.addEventListener('click', () => showState(stateReview));
    btnDiscard.addEventListener('click', discardAudio);
    btnGotoOtp.addEventListener('click', startOtpFlow);
    btnReviewPlay.addEventListener('click', toggleReviewPlay);
    hiddenAudio.addEventListener('timeupdate', updateReviewProgress);
    hiddenAudio.addEventListener('ended', () => {
        btnReviewPlay.querySelector('.play-icon').classList.remove('hidden');
        btnReviewPlay.querySelector('.pause-icon').classList.add('hidden');
        reviewProgress.style.width = '0%';
    });

    // OTP Actions
    setupOtpInputs();
    btnVerifyPost.addEventListener('click', verifyAndPost);
    btnResendOtp.addEventListener('click', requestOtp);
}

function openComposer() {
    modal.classList.remove('hidden');
    checkWindowStatus();
    showState(stateRecordUpload);
    discardAudio();
}

function closeComposer() {
    modal.classList.add('hidden');
    if (isRecording) toggleRecording();
    hiddenAudio.pause();
    discardAudio();
}

function showState(stateEl) {
    [stateRecordUpload, stateReview, stateOtp, stateSuccess].forEach(el => el.classList.add('hidden'));
    stateEl.classList.remove('hidden');
}

function showError(msg, isOtp = false) {
    const banner = isOtp ? otpErrorBanner : errorBanner;
    banner.textContent = msg;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 5000);
}

// ==========================================
// Window Status
// ==========================================
async function checkWindowStatus() {
    try {
        const res = await fetch(`${API_BASE}/audio-tweets/window-status`);
        const data = await res.json();
        
        if (data.windowOpen) {
            windowStatusBanner.className = 'status-banner open';
            startWindowCountdown(data.closesInSeconds, true);
            enableComposer(true);
        } else {
            windowStatusBanner.className = 'status-banner closed';
            const opensAt = new Date(data.nextWindowOpensAt).getTime();
            const now = new Date().getTime();
            const opensInSec = Math.floor((opensAt - now) / 1000);
            startWindowCountdown(opensInSec, false);
            enableComposer(false);
        }
    } catch (e) {
        console.error(e);
        windowStatusBanner.className = 'status-banner closed';
        windowStatusText.textContent = "Unable to verify window status.";
        enableComposer(false);
    }
}

let windowTimer;
function startWindowCountdown(seconds, isOpen) {
    clearInterval(windowTimer);
    let s = seconds;
    const updateText = () => {
        if (s <= 0) {
            clearInterval(windowTimer);
            checkWindowStatus(); // refresh
            return;
        }
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        const fmt = `${hrs.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        
        if (isOpen) {
            windowStatusText.textContent = `Live now · closes in ${fmt}`;
        } else {
            windowStatusText.textContent = `Opens today at 2:00 PM IST · in ${fmt}`;
        }
        s--;
    };
    updateText();
    windowTimer = setInterval(updateText, 1000);
}

function enableComposer(enable) {
    btnMic.disabled = !enable;
    fileInput.disabled = !enable;
    if (!enable) {
        btnMic.style.opacity = '0.5';
        uploadZone.style.opacity = '0.5';
        uploadZone.style.pointerEvents = 'none';
    } else {
        btnMic.style.opacity = '1';
        uploadZone.style.opacity = '1';
        uploadZone.style.pointerEvents = 'auto';
    }
}

// ==========================================
// Recording Logic
// ==========================================
async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

async function startRecording() {
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup Audio Context for visualization
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(micStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        mediaRecorder = new MediaRecorder(micStream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
            audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: mediaRecorder.mimeType });
            prepareReview();
        };

        mediaRecorder.start();
        isRecording = true;
        btnMic.classList.add('recording');
        
        recordingStartTime = Date.now();
        recordTimer.textContent = "00:00";
        recordTimer.className = 'record-timer';
        
        recordingInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            if (elapsed >= maxDurationSec) {
                stopRecording(); // Hard stop at 5:00
            } else {
                updateRecordTimer(elapsed);
            }
        }, 1000);

        drawWaveform();

    } catch (err) {
        console.error(err);
        showError("Microphone permission denied or unavailable.");
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }
    clearInterval(recordingInterval);
    isRecording = false;
    btnMic.classList.remove('recording');
}

function updateRecordTimer(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    recordTimer.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    
    if (sec >= 290) { // 4:50
        recordTimer.className = 'record-timer danger';
    } else if (sec >= 270) { // 4:30
        recordTimer.className = 'record-timer warning';
    }
}

function drawWaveform() {
    if (!isRecording) {
        waveCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        return;
    }
    requestAnimationFrame(drawWaveform);
    
    // Adjust canvas resolution
    waveformCanvas.width = waveformCanvas.offsetWidth;
    waveformCanvas.height = waveformCanvas.offsetHeight;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Also push to global background amplitude if needed
    window.currentMicAmplitude = dataArray.reduce((a,b)=>a+b, 0) / bufferLength;

    waveCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
    
    const barWidth = (waveformCanvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for(let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * waveformCanvas.height;
        
        waveCtx.fillStyle = `rgba(34, 211, 238, ${dataArray[i]/255})`;
        waveCtx.fillRect(x, waveformCanvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
    }
}

// ==========================================
// Upload Logic
// ==========================================
function handleFileUpload(file) {
    if (!file.type.startsWith('audio/')) {
        showError("Please select a valid audio file.");
        return;
    }
    if (file.size > maxSizeBytes) {
        showError(`File too large. Maximum size is ${maxSizeBytes / (1024*1024)}MB.`);
        uploadZone.classList.add('error');
        setTimeout(() => uploadZone.classList.remove('error'), 1000);
        return;
    }
    
    audioFile = file;
    audioBlob = file; // For URL creation
    
    // Check duration client-side before review
    const tempUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(tempUrl);
    tempAudio.onloadedmetadata = () => {
        URL.revokeObjectURL(tempUrl);
        if (tempAudio.duration > maxDurationSec) {
            showError(`Audio too long. Maximum duration is 5:00.`);
            audioFile = null;
            audioBlob = null;
            uploadZone.classList.add('error');
            setTimeout(() => uploadZone.classList.remove('error'), 1000);
        } else {
            prepareReview();
        }
    };
}

function prepareReview() {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    hiddenAudio.src = url;
    
    hiddenAudio.onloadedmetadata = () => {
        const m = Math.floor(hiddenAudio.duration / 60);
        const s = Math.floor(hiddenAudio.duration % 60);
        reviewDuration.textContent = `${m}:${s.toString().padStart(2,'0')}`;
        btnContinueVerify.disabled = false;
        fileInfo.textContent = `${audioFile.name} (${(audioFile.size / (1024*1024)).toFixed(2)} MB)`;
        fileInfo.classList.remove('hidden');
    };
}

function discardAudio() {
    audioBlob = null;
    audioFile = null;
    hiddenAudio.src = '';
    btnContinueVerify.disabled = true;
    fileInfo.classList.add('hidden');
    fileInput.value = '';
    recordTimer.textContent = '00:00';
    recordTimer.className = 'record-timer';
    showState(stateRecordUpload);
}

// ==========================================
// Review Player Logic
// ==========================================
function toggleReviewPlay() {
    const playIcon = btnReviewPlay.querySelector('.play-icon');
    const pauseIcon = btnReviewPlay.querySelector('.pause-icon');
    
    if (hiddenAudio.paused) {
        hiddenAudio.play();
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    } else {
        hiddenAudio.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
}

function updateReviewProgress() {
    if (hiddenAudio.duration) {
        const pct = (hiddenAudio.currentTime / hiddenAudio.duration) * 100;
        reviewProgress.style.width = `${pct}%`;
    }
}

// ==========================================
// OTP Flow
// ==========================================
async function startOtpFlow() {
    hiddenAudio.pause();
    showState(stateOtp);
    await requestOtp();
}

async function requestOtp() {
    btnResendOtp.disabled = true;
    btnResendOtp.textContent = "Sending...";
    otpBoxes.forEach(b => b.value = '');
    otpBoxes[0].focus();
    
    try {
        const res = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail })
        });
        const data = await res.json();
        
        if (data.success) {
            startOtpCountdown(data.expiresInSeconds);
            startResendCountdown(30);
        } else {
            showError(data.message || "Failed to send OTP", true);
            startResendCountdown(10); // allow retry sooner if error
        }
    } catch (e) {
        console.error(e);
        showError("Network error sending OTP", true);
        startResendCountdown(10);
    }
}

let otpTimer;
function startOtpCountdown(seconds) {
    clearInterval(otpTimer);
    let s = seconds;
    const total = seconds;
    
    otpProgressFill.style.transition = 'none';
    otpProgressFill.style.transform = `scaleX(1)`;
    
    // Force reflow
    void otpProgressFill.offsetWidth;
    otpProgressFill.style.transition = `transform ${seconds}s linear`;
    otpProgressFill.style.transform = `scaleX(0)`;
    
    const updateText = () => {
        if (s <= 0) {
            clearInterval(otpTimer);
            otpExpiryText.textContent = "Code expired.";
            return;
        }
        const m = Math.floor(s / 60);
        const sec = s % 60;
        otpExpiryText.textContent = `Code expires in ${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
        s--;
    };
    updateText();
    otpTimer = setInterval(updateText, 1000);
}

let resendTimer;
function startResendCountdown(seconds) {
    clearInterval(resendTimer);
    let s = seconds;
    const updateText = () => {
        if (s <= 0) {
            clearInterval(resendTimer);
            btnResendOtp.textContent = "Resend OTP";
            btnResendOtp.disabled = false;
            return;
        }
        btnResendOtp.textContent = `Resend OTP (${s}s)`;
        s--;
    };
    updateText();
    resendTimer = setInterval(updateText, 1000);
}

function setupOtpInputs() {
    otpBoxes.forEach((box, i) => {
        box.addEventListener('input', (e) => {
            if (e.target.value && i < otpBoxes.length - 1) {
                otpBoxes[i+1].focus();
            }
            // Auto submit if all filled
            const allFilled = Array.from(otpBoxes).every(b => b.value.length === 1);
            if (allFilled) verifyAndPost();
        });
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && i > 0) {
                otpBoxes[i-1].focus();
            }
        });
        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6);
            for(let j=0; j<text.length; j++){
                if(otpBoxes[j]) {
                    otpBoxes[j].value = text[j];
                    if(j < 5) otpBoxes[j+1].focus();
                }
            }
        });
    });
}

async function verifyAndPost() {
    const code = Array.from(otpBoxes).map(b => b.value).join('');
    if (code.length < 6) {
        showError("Please enter the 6-digit code.", true);
        return;
    }
    
    btnVerifyPost.disabled = true;
    btnVerifyPost.textContent = "Verifying...";
    
    try {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, otp: code })
        });
        const data = await res.json();
        
        if (data.success) {
            otpToken = data.otpToken;
            await executeUpload();
        } else {
            showError(data.message || "Invalid OTP", true);
            document.querySelector('.otp-input-group').classList.add('error');
            setTimeout(()=> document.querySelector('.otp-input-group').classList.remove('error'), 500);
            otpBoxes.forEach(b => b.value = '');
            otpBoxes[0].focus();
        }
    } catch (e) {
        console.error(e);
        showError("Network error during verification", true);
    } finally {
        btnVerifyPost.disabled = false;
        btnVerifyPost.textContent = "Verify & Post";
    }
}

// ==========================================
// Upload Execution
// ==========================================
async function executeUpload() {
    if (!audioFile || !otpToken) return;
    
    btnVerifyPost.textContent = "Uploading...";
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('caption', tweetCaption.value);
    
    try {
        const res = await fetch(`${API_BASE}/audio-tweets/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${otpToken}`
            },
            body: formData
        });
        const data = await res.json();
        
        if (data.success) {
            showState(stateSuccess);
            prependTweetToFeed(data.tweet);
            setTimeout(() => {
                closeComposer();
            }, 2000);
        } else {
            showError(data.message || "Upload failed", true);
            if (data.reason === 'INVALID_OTP_TOKEN') {
                // Force re-auth
                otpToken = null;
                otpExpiryText.textContent = "Token expired, requesting new OTP...";
                setTimeout(requestOtp, 2000);
            } else if (data.reason === 'OUTSIDE_UPLOAD_WINDOW') {
                closeComposer();
                checkWindowStatus(); // updates feed banner
            }
        }
    } catch (e) {
        console.error(e);
        showError("Network error during upload. You can try again if code hasn't expired.", true);
    }
}

// ==========================================
// Feed
// ==========================================
async function loadFeed() {
    try {
        const res = await fetch(`${API_BASE}/audio-tweets/feed`);
        const data = await res.json();
        feedList.innerHTML = '';
        if (data.success && data.tweets.length > 0) {
            data.tweets.forEach(t => prependTweetToFeed(t, false));
        } else {
            feedList.innerHTML = '<p style="color:var(--color-text-muted); text-align:center;">No audio tweets yet. Be the first!</p>';
        }
    } catch (e) {
        console.error(e);
        feedList.innerHTML = '<p style="color:var(--color-danger); text-align:center;">Failed to load feed.</p>';
    }
}

function prependTweetToFeed(tweet, animate = true) {
    // Remove empty message if exists
    if(feedList.querySelector('p')) feedList.innerHTML = '';
    
    const card = document.createElement('div');
    card.className = 'tweet-card';
    if(animate) {
        card.style.animation = 'fadeIn 0.5s forwards';
    }
    
    const date = new Date(tweet.createdAt).toLocaleString();
    const min = Math.floor(tweet.durationSeconds / 60);
    const sec = tweet.durationSeconds % 60;
    const dur = `${min}:${sec.toString().padStart(2,'0')}`;
    
    card.innerHTML = `
        <div class="tweet-header">
            <span class="tweet-author">${tweet.author.split('@')[0]} <span style="color:var(--color-accent); font-size:12px;">🎙 Audio Tweet</span></span>
            <span>${date}</span>
        </div>
        ${tweet.caption ? `<div class="tweet-caption">${tweet.caption}</div>` : ''}
        <div class="feed-player">
            <button class="feed-play-btn" data-url="${tweet.audioUrl}">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <div class="feed-waveform-bars">
                ${Array(20).fill(0).map(()=>`<div class="feed-bar"></div>`).join('')}
            </div>
            <div class="feed-duration">${dur}</div>
        </div>
    `;
    
    feedList.prepend(card);
    
    // Setup player interaction
    const btn = card.querySelector('.feed-play-btn');
    const bars = card.querySelectorAll('.feed-bar');
    const audio = new Audio(tweet.audioUrl);
    
    btn.addEventListener('click', () => {
        // Pause all other audios (simple approach)
        document.querySelectorAll('audio').forEach(a => { if(a !== audio) a.pause(); });
        
        if (audio.paused) {
            audio.play();
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            btn.classList.add('playing');
        } else {
            audio.pause();
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
            btn.classList.remove('playing');
        }
    });
    
    audio.addEventListener('timeupdate', () => {
        const pct = audio.currentTime / audio.duration;
        const fillIndex = Math.floor(pct * bars.length);
        bars.forEach((b, i) => {
            if (i <= fillIndex) b.classList.add('filled');
            else b.classList.remove('filled');
        });
    });
    
    audio.addEventListener('ended', () => {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
        btn.classList.remove('playing');
        bars.forEach(b => b.classList.remove('filled'));
    });
}

// ==========================================
// Custom Background Animation
// ==========================================
function setupCanvasAnimation() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        ctx.fillStyle = '#0B0F1A';
        ctx.fillRect(0,0,width,height);
        return; // static frame
    }
    
    window.currentMicAmplitude = 0; // Set by waveform analyser
    
    const particles = Array.from({length: 50}, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.1,
        depth: Math.random() * 0.8 + 0.2
    }));
    
    let time = 0;
    
    function draw() {
        requestAnimationFrame(draw);
        time += 0.005;
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#0B0F1A';
        ctx.fillRect(0, 0, width, height);
        
        // Layer 1: Aurora Blobs
        ctx.globalCompositeOperation = 'lighter';
        
        const drawBlob = (cx, cy, r, color) => {
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
        };
        
        const x1 = width/2 + Math.sin(time)*width*0.3;
        const y1 = height/2 + Math.cos(time*0.8)*height*0.3;
        drawBlob(x1, y1, width*0.6, 'rgba(124, 77, 255, 0.15)');
        
        const x2 = width/2 + Math.cos(time*1.2)*width*0.3;
        const y2 = height/2 + Math.sin(time)*height*0.3;
        drawBlob(x2, y2, width*0.5, 'rgba(34, 211, 238, 0.1)');
        
        // Layer 2: Audio-reactive ambient flash
        if (window.currentMicAmplitude > 5) {
            const flashColor = `rgba(34, 211, 238, ${window.currentMicAmplitude / 255 * 0.1})`;
            ctx.fillStyle = flashColor;
            ctx.fillRect(0,0,width,height);
        }
        
        // Layer 3: Particles
        ctx.globalCompositeOperation = 'screen';
        particles.forEach(p => {
            p.x += p.vx * p.depth;
            p.y += p.vy * p.depth;
            
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255,255,255,${p.depth * 0.5})`;
            ctx.fill();
        });
    }
    
    draw();
}

// Start app
init();
