// --------------------------------------------------------------------------------
// --- Firebase SDK Imports & Universal Configuration ---
// --------------------------------------------------------------------------------
import { initializeApp, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import {
    getAuth, onAuthStateChanged, signOut, signInWithCustomToken, signInAnonymously,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider,
    signInWithPopup, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit,
    getDocs, serverTimestamp, updateDoc, arrayUnion, arrayRemove, where, Timestamp,
    writeBatch, runTransaction
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// Import Storage related functions IF they are not already in home.html's script tag
// For modularity, it's fine to have them here, but ensure no duplicate imports if home.html script becomes primary.
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyA4f4PSC3_9m8uDd8ZtAfg-Nke2iw2tWm8", // Esta é sua chave do Firebase, não a Gemini
    authDomain: "game-match-br.firebaseapp.com",
    projectId: "game-match-br",
    storageBucket: "game-match-br.appspot.com",
    messagingSenderId: "443417526500",
    appId: "1:443417526500:web:cbe5b9e4484ad07c3facf1",
    measurementId: "G-8LHC5GP12B"
};

let app;
let auth;
let db;
let analytics;
let storage; // Firebase Storage instance
// currentUser and currentUserProfile are now primarily managed by home.html's script tag
// This script (script.js) will mostly focus on index.html logic and auth redirection.
// window.currentUser and window.currentUserProfile can be used if home.html defines them globally.

const appIdFromHost = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.appId;
const initialAuthTokenFromHost = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app); // Initialize Storage here as well
    analytics = getAnalytics(app);
    setLogLevel('debug');
    console.log("Firebase initialized successfully from script.js");
} catch (error) {
    console.error("Erro ao inicializar Firebase (script.js): ", error);
    document.body.innerHTML = `<div style="color: red; text-align: center; padding: 20px; font-family: sans-serif;">
        <h2>Falha Crítica na Aplicação</h2>
        <p>Não foi possível conectar aos serviços essenciais. Por favor, verifique sua conexão com a internet e tente recarregar a página.</p>
        <p>Se o problema persistir, entre em contato com o suporte.</p>
        <small>Detalhe do erro (para desenvolvedores): ${error.message}</small>
    </div>`;
}

// --------------------------------------------------------------------------------
// --- Global Authentication State Change Handler (Mainly for redirection) ---
// --------------------------------------------------------------------------------
if (auth) {
    onAuthStateChanged(auth, async (user) => {
        // This script (script.js) is primarily for index.html.
        // home.html has its own onAuthStateChanged for its specific UI updates.

        const isLoginPage = !!document.getElementById('login-form'); // index.html
        // const isHomePage = !!document.getElementById('feed-posts-container'); // home.html

        if (isLoginPage) {
            if (user) {
                console.log("User is logged in (detected by script.js). Redirecting to home.html");
                // Before redirecting, ensure profile exists or create a basic one.
                // This helps home.html load faster if the profile is already there.
                const userProfilePath = `users/${user.uid}`;
                const userDocRef = doc(db, userProfilePath);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    console.log("User profile doesn't exist (script.js). Creating basic profile before redirect.");
                    const nickname = user.displayName || user.email?.split('@')[0] || `Jogador_${user.uid.substring(0, 5)}`;
                    const basicProfile = {
                        uid: user.uid,
                        nickname: nickname,
                        usernameGameMatch: `@${nickname.replace(/\s+/g, '_').toLowerCase()}`,
                        email: user.email,
                        platform: "Não especificado",
                        favoriteGames: [],
                        bio: "Novo por aqui no GameMatch!",
                        avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random&color=fff&font-size=0.5&bold=true`,
                        createdAt: serverTimestamp()
                    };
                    try {
                        await setDoc(userDocRef, basicProfile);
                        console.log("Basic profile created from script.js.");
                    } catch (profileError) {
                        console.error("Error creating basic profile from script.js:", profileError);
                    }
                }
                window.location.href = 'home.html';
            } else {
                console.log("User is not logged in (detected by script.js). Staying on login page.");
            }
        }
        // No need to handle home.html logic here as home.html has its own auth listener.
    });
}

// Make loadUserProfile globally accessible if home.html needs it from here
// However, home.html should ideally have its own copy or this function needs to be robust.
// For now, the home.html has an internal fallback.
window.loadUserProfile = async function (userId) {
    if (!db || !userId) {
        console.warn("Global loadUserProfile: Firestore db or userId not available.");
        // Return a structure that home.html can handle even on error
        return { errorLoading: true, bio: "Erro ao carregar perfil.", nickname: "Usuário", email: auth?.currentUser?.email || "N/A" };
    }
    const userProfilePath = `users/${userId}`;
    const userDocRef = doc(db, userProfilePath);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            window.currentUserProfile = { id: docSnap.id, ...docSnap.data() }; // Set on window
            console.log("Global User profile loaded from users/", userId, ":", window.currentUserProfile);
        } else {
            // This case should ideally be handled by the initial profile creation on signup/login
            console.log("Global: No user profile found at users/", userId, ". A basic profile should have been created on login.");
            const nickname = auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || `Jogador_${userId.substring(0, 5)}`;
            window.currentUserProfile = {
                uid: userId, nickname: nickname,
                avatarUrl: auth?.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random&color=fff&font-size=0.5&bold=true`,
                bio: "Novo por aqui!", favoriteGames: [], platform: "PC",
                playStyle: "Casual", objectives: "Diversão", email: auth?.currentUser?.email,
                createdAt: serverTimestamp(),
                usernameGameMatch: `@${nickname.replace(/\s+/g, '_').toLowerCase()}`
            };
            // Avoid writing from here if home.html also does it to prevent races.
            // await setDoc(userDocRef, window.currentUserProfile);
        }
    } catch (error) {
        console.error("Global: Erro ao carregar perfil do usuário:", error);
        const nickname = auth?.currentUser?.displayName || auth?.currentUser?.email?.split('@')[0] || `Jogador_${userId.substring(0, 5)}`;
        window.currentUserProfile = {
            uid: userId, nickname: nickname,
            avatarUrl: auth?.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random&color=fff&font-size=0.5&bold=true`,
            bio: "Perfil temporário devido a erro.", email: auth?.currentUser?.email || "N/A", errorLoading: true
        };
    }
    return window.currentUserProfile; // Return the profile
}


// --------------------------------------------------------------------------------
// --- Page-Specific Logic (Primarily for index.html) ---
// --------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = !!document.getElementById('login-form');

    if (isLoginPage && auth && db) {
        console.log("Executing Login/Register page logic from script.js.");

        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');
        const loginErrorMessage = document.getElementById('login-error-message');
        const loginSubmitButton = document.getElementById('login-submit-button');
        const registerSubmitButton = document.getElementById('register-submit-button');
        const registerEmailInput = document.getElementById('register-email');
        const registerPasswordInput = document.getElementById('register-password');
        const registerConfirmPasswordInput = document.getElementById('register-confirm-password');
        const registerUsernameInput = document.getElementById('register-username');
        const registerPlatformSelect = document.getElementById('register-platform');
        const favoriteGamesSelectContainer = document.getElementById('favorite-games-select');
        const registerErrorMessage = document.getElementById('register-error-message');
        const googleLoginBtn = document.getElementById('google-login-btn');
        const discordLoginBtn = document.getElementById('discord-login-btn');
        const passwordToggleLogin = document.getElementById('password-toggle-login');
        const passwordToggleRegister = document.getElementById('password-toggle-register');
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        const strengthBar = document.getElementById('password-strength-bar');
        const strengthText = document.getElementById('password-strength-text');

        // This list should ideally be consistent with home.html's game list if used for profile creation here.
        const allGamesList = ['Apex Legends', 'Fortnite', 'COD Warzone', 'Valorant', 'Counter-Strike 2', 'Overwatch 2', 'Rainbow Six Siege', 'Genshin Impact', 'Final Fantasy XIV', 'Diablo IV', 'Elden Ring', 'League of Legends', 'Dota 2', 'Marvel Rivals', 'Rocket League', 'EA Sports FC 25', 'Minecraft'].sort();

        function showTab(tabId) {
            const isLogin = tabId === 'login';
            loginTab.classList.toggle('active', isLogin);
            registerTab.classList.toggle('active', !isLogin);
            loginForm.classList.toggle('hidden', !isLogin);
            registerForm.classList.toggle('hidden', isLogin);
            loginForm.classList.toggle('form-visible', isLogin);
            registerForm.classList.toggle('form-visible', !isLogin);
            if (loginErrorMessage) clearError(loginErrorMessage);
            if (registerErrorMessage) clearError(registerErrorMessage);
        }

        function displayError(element, message) {
            if (!element) return;
            element.textContent = message;
            element.classList.remove('hidden');
        }

        function clearError(element) {
            if (!element) return;
            element.classList.add('hidden');
            element.textContent = '';
        }

        function setButtonLoading(button, isLoading, originalText) {
            if (!button) return;
            if (isLoading) {
                button.disabled = true;
                button.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
                button.classList.add('loading');
            } else {
                button.disabled = false;
                button.innerHTML = originalText;
                button.classList.remove('loading');
            }
        }

        if (loginTab) loginTab.addEventListener('click', () => showTab('login'));
        if (registerTab) registerTab.addEventListener('click', () => {
            showTab('register');
            if (favoriteGamesSelectContainer && favoriteGamesSelectContainer.innerHTML === '') {
                populateFavoriteGamesSelect();
            }
        });

        if (loginForm) loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError(loginErrorMessage);
            setButtonLoading(loginSubmitButton, true, 'Entrar');
            try {
                await signInWithEmailAndPassword(auth, loginEmailInput.value, loginPasswordInput.value);
                // Auth listener will handle redirect
            } catch (error) {
                let msg = "Erro ao fazer login. Verifique suas credenciais.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    msg = "E-mail ou senha inválidos.";
                } else {
                    console.error("Login error:", error);
                }
                displayError(loginErrorMessage, msg);
            } finally {
                setButtonLoading(loginSubmitButton, false, 'Entrar');
            }
        });

        if (registerForm) registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError(registerErrorMessage);
            const password = registerPasswordInput.value;
            if (password !== registerConfirmPasswordInput.value) {
                displayError(registerErrorMessage, "As senhas não coincidem.");
                return;
            }
            if (!registerUsernameInput.value.trim() || !registerPlatformSelect.value) {
                displayError(registerErrorMessage, "Todos os campos são obrigatórios.");
                return;
            }
            if (checkPasswordStrength(password) < 2) { // Corresponds to 'Fraca' or 'Muito Fraca'
                displayError(registerErrorMessage, "Sua senha é muito fraca. Tente uma combinação mais forte (pelo menos 8 caracteres, com números, letras maiúsculas e minúsculas).");
                return;
            }
            setButtonLoading(registerSubmitButton, true, 'Cadastrar');
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, registerEmailInput.value, password);
                const user = userCredential.user;
                const username = registerUsernameInput.value.trim();
                const userProfileData = {
                    uid: user.uid,
                    nickname: username,
                    usernameGameMatch: `@${username.replace(/\s+/g, '_').toLowerCase()}`, // Example unique username
                    email: user.email,
                    platform: registerPlatformSelect.value,
                    favoriteGames: Array.from(favoriteGamesSelectContainer.querySelectorAll('.selected')).map(el => {
                        // Find game ID from name - this assumes home.html's gamesDataFull is the source of truth for IDs
                        // For simplicity here, we'll just store names, but ideally, IDs are better.
                        // This part might need adjustment if strict ID mapping is required at registration.
                        // For now, let's assume gamesDataFull from home.html would be used to map names to IDs later if needed.
                        const gameName = el.dataset.game;
                        const gameFromFullList = window.gamesDataFull?.find(g => g.name === gameName); // gamesDataFull might not be on window
                        return gameFromFullList ? gameFromFullList.id : gameName; // Fallback to name if ID not found
                    }),
                    bio: `Olá! Sou novo(a) por aqui no Game Match! Acabei de me cadastrar.`,
                    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&font-size=0.5&bold=true`,
                    socialLinks: {}, // Placeholder
                    createdAt: serverTimestamp(),
                    playStyle: "Não definido", // Default
                    objectives: "Diversão" // Default
                };
                const userProfilePath = `users/${user.uid}`; // Firestore path
                await setDoc(doc(db, userProfilePath), userProfileData);
                // Auth listener will handle redirect to home.html
                // alert("Cadastro realizado com sucesso! Você será redirecionado."); // Redirection is now handled by onAuthStateChanged
            } catch (error) {
                let msg = "Erro ao cadastrar. Tente novamente.";
                if (error.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
                else if (error.code === 'auth/invalid-email') msg = "Formato de e-mail inválido.";
                else if (error.code === 'auth/weak-password') msg = "A senha é muito fraca.";
                else { console.error("Register error:", error); }
                displayError(registerErrorMessage, msg);
            } finally {
                setButtonLoading(registerSubmitButton, false, 'Cadastrar');
            }
        });

        if (googleLoginBtn) googleLoginBtn.addEventListener('click', async () => {
            clearError(loginErrorMessage);
            const provider = new GoogleAuthProvider();
            try {
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                // Profile creation/check is now handled by onAuthStateChanged before redirect
                // So, no need to duplicate that logic here. Auth listener will take over.
            } catch (error) {
                let msg = "Erro ao fazer login com Google.";
                if (error.code === 'auth/popup-closed-by-user') {
                    msg = "Login com Google cancelado.";
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    msg = "Conta já existe com credencial diferente. Tente o login por e-mail/senha.";
                } else {
                    console.error("Google login error:", error);
                }
                displayError(loginErrorMessage, msg);
            }
        });

        if (discordLoginBtn) discordLoginBtn.addEventListener('click', () => {
            alert("Login com Discord ainda não está implementado. Use Google ou E-mail/Senha.");
        });

        function togglePasswordVisibility(input, toggle) {
            if (!input || !toggle) return;
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggle.classList.toggle('fa-eye', !isPassword);
            toggle.classList.toggle('fa-eye-slash', isPassword);
        }

        if (passwordToggleLogin) passwordToggleLogin.addEventListener('click', () => togglePasswordVisibility(loginPasswordInput, passwordToggleLogin));
        if (passwordToggleRegister) passwordToggleRegister.addEventListener('click', () => togglePasswordVisibility(registerPasswordInput, passwordToggleRegister));

        if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt("Por favor, digite seu e-mail para receber o link de redefinição de senha:");
            if (!email) {
                displayError(loginErrorMessage, "E-mail não fornecido para redefinição de senha.");
                return;
            }
            clearError(loginErrorMessage);
            try {
                await sendPasswordResetEmail(auth, email);
                alert(`Um e-mail de redefinição de senha foi enviado para ${email}, caso uma conta exista.`);
            } catch (error) {
                console.error("Password Reset Error:", error);
                let msg = "Não foi possível enviar o e-mail de redefinição.";
                if (error.code === 'auth/user-not-found') {
                    // Don't reveal if user exists or not for security.
                    // msg = "Nenhum usuário encontrado com este e-mail.";
                    // Instead, provide a generic success message.
                } else if (error.code === 'auth/invalid-email') {
                    msg = "O formato do e-mail é inválido.";
                    displayError(loginErrorMessage, msg); // Show specific error for invalid format
                    alert("Falha ao enviar e-mail de redefinição. Verifique o e-mail digitado.");
                    return;
                }
                // Generic success/error for other cases
                // displayError(loginErrorMessage, msg); // Avoid displaying if it reveals user existence
                alert("Se uma conta existir para " + email + ", um e-mail de redefinição foi enviado. Verifique sua caixa de entrada e spam.");
            }
        });

        if (registerPasswordInput) registerPasswordInput.addEventListener('input', () => {
            const password = registerPasswordInput.value;
            const strength = checkPasswordStrength(password);
            const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-500']; // Strength 0-4
            const texts = ['', 'Muito Fraca', 'Fraca', 'Média', 'Forte']; // Strength 0-4
            const widths = ['0%', '25%', '50%', '75%', '100%']; // Strength 0-4

            if (strengthBar) {
                strengthBar.style.width = widths[strength]; // Use strength directly as index
                strengthBar.className = `h-2.5 rounded-full transition-all duration-300 ${colors[strength] || 'bg-gray-300'}`;
            }
            if (strengthText) {
                strengthText.textContent = password ? texts[strength] : '';
            }
        });

        function checkPasswordStrength(password) {
            let score = 0;
            if (!password) return 0;

            // Award points for length
            if (password.length >= 12) score += 2;
            else if (password.length >= 8) score += 1;

            // Award points for character types
            if (/\d/.test(password)) score++;          // Numbers
            if (/[a-z]/.test(password)) score++;       // Lowercase
            if (/[A-Z]/.test(password)) score++;       // Uppercase
            if (/[^A-Za-z0-9]/.test(password)) score++; // Symbols

            // Map score to strength level (0-4)
            if (score >= 5) return 4; // Forte
            if (score >= 4) return 3; // Média
            if (score >= 3) return 2; // Fraca
            if (score > 0) return 1;  // Muito Fraca
            return 0; // No password
        }


        function populateFavoriteGamesSelect() {
            if (!favoriteGamesSelectContainer) return;
            favoriteGamesSelectContainer.innerHTML = ''; // Clear existing
            allGamesList.forEach(gameName => {
                const gameOptionDiv = document.createElement('div');
                gameOptionDiv.className = 'p-2 rounded-md cursor-pointer hover:bg-button-hover-bg text-text-light-gray';
                gameOptionDiv.textContent = gameName;
                gameOptionDiv.dataset.game = gameName; // Store game name
                gameOptionDiv.addEventListener('click', () => {
                    const selectedCount = favoriteGamesSelectContainer.querySelectorAll('.selected').length;
                    if (gameOptionDiv.classList.contains('selected')) {
                        gameOptionDiv.classList.remove('selected');
                        gameOptionDiv.style.backgroundColor = ''; // Revert style
                        gameOptionDiv.style.color = 'var(--text-light-gray)';
                    } else if (selectedCount < 5) {
                        gameOptionDiv.classList.add('selected');
                        gameOptionDiv.style.backgroundColor = 'var(--neon-green)'; // Highlight
                        gameOptionDiv.style.color = 'var(--dark-bg)';
                    } else {
                        alert("Você pode selecionar no máximo 5 jogos favoritos.");
                    }
                });
                favoriteGamesSelectContainer.appendChild(gameOptionDiv);
            });
        }
        // If register form is visible by default (e.g., no JS to switch tabs initially, or if it's the default tab)
        if (registerForm && !registerForm.classList.contains('hidden')) {
            populateFavoriteGamesSelect();
        }


    } else if (!auth || !db) {
        console.error("Firebase Auth or Firestore is not initialized. Page-specific logic in script.js cannot run.");
        // Minimal error display if body exists
        if (document.body && !document.querySelector('#critical-error-message-scriptjs')) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'critical-error-message-scriptjs';
            errorDiv.innerHTML = `<p style="color: orange; text-align: center; padding: 5px; background: #222; border-radius: 3px; font-size:0.8em;">
                Atenção: Problema de inicialização (script.js). Alguns recursos podem não funcionar.
            </p>`;
            // Prepend to body if possible, otherwise append
            if (document.body.firstChild) {
                document.body.insertBefore(errorDiv, document.body.firstChild);
            } else {
                document.body.appendChild(errorDiv);
            }
        }
    }
}); // End of DOMContentLoaded