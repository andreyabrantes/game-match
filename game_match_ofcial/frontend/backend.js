// backend.js (Example for a Node.js environment with Firebase Admin SDK)

// 1. Initialize Firebase Admin SDK
//    Ensure you have downloaded your service account key JSON file
//    from your Firebase project settings (Project settings > Service accounts).
const admin = require('firebase-admin');

// Replace with the path to your service account key file
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://game-match-br.firebaseio.com" // Replace with your actual database URL
});

const db = admin.firestore();
const auth = admin.auth(); // For user management if needed
const storage = admin.storage(); // If backend handles storage operations

// --- Helper function for consistent artifact path ---
const APP_ID = '1:443417526500:web:cbe5b9e4484ad07c3facf1'; // Matches your script.js
const getArtifactPath = (collectionName) => `artifacts/${APP_ID}/public/data/${collectionName}`;

// --- 2. Example: User Profile Management Endpoint (e.g., via Cloud Function HTTP trigger) ---
// This could be an HTTP-triggered Cloud Function or an Express.js route.
// It demonstrates creating/updating a user profile from the backend,
// ensuring data consistency or adding server-side generated fields.

/**
 * Creates or updates a user profile on the backend.
 * This is an example of a server-side function. In a real scenario,
 * it would be triggered by an API call (e.g., from your frontend
 * if a user updates their profile, or internally after a new user registers).
 *
 * @param {string} uid User ID.
 * @param {object} profileData Data to update/set for the profile.
 * @returns {Promise<object>} The updated profile data.
 */
exports.updateUserProfile = async (uid, profileData) => {
    if (!uid || !profileData) {
        throw new Error('UID and profile data are required.');
    }

    const userProfileRef = db.collection('users').doc(uid);
    try {
        // You can fetch the existing profile to merge data or perform validation
        const docSnap = await userProfileRef.get();
        let currentProfile = {};
        if (docSnap.exists) {
            currentProfile = docSnap.data();
        }

        // Example: Server-side validation or data enrichment
        if (profileData.nickname) {
            profileData.usernameGameMatch = `@${profileData.nickname.replace(/\s+/g, '_').toLowerCase()}`;
        }
        profileData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await userProfileRef.set({ ...currentProfile, ...profileData }, { merge: true });
        console.log(`User profile ${uid} updated successfully.`);
        return { success: true, profile: { ...currentProfile, ...profileData } };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
};

// --- 3. Example: Matchmaking Logic (Server-side processing) ---
// This function could be called by a client-side request to find a match,
// or as a scheduled job, or triggered by a new `match_request` document.

/**
 * Finds a simulated match based on game preferences.
 * This is a simplified example. Real matchmaking is complex.
 *
 * @param {string} requestingUserId The ID of the user requesting a match.
 * @param {string} gameId The ID of the game to find a match for.
 * @returns {Promise<object>} Details of the found match or an error.
 */
exports.findRandomPlayerMatch = async (requestingUserId, gameId) => {
    if (!requestingUserId || !gameId) {
        throw new Error('Requesting User ID and Game ID are required for matchmaking.');
    }

    // In a real scenario, you'd query a 'playersOnline' or 'matchmakingQueue'
    // collection, filter by game, skill, region, etc.
    // For this example, we'll simulate a Gemini-like response from the backend.
    const gamesDataFull = [ // Keep a consistent list with frontend
        { id: 'apex-legends', name: 'Apex Legends', category: 'FPS' },
        { id: 'fortnite', name: 'Fortnite', category: 'Battle Royale' },
        { id: 'cod-warzone', name: 'COD Warzone', category: 'Battle Royale' },
        { id: 'valorant', name: 'Valorant', category: 'FPS' },
        { id: 'cs2', name: 'Counter-Strike 2', category: 'FPS' },
        { id: 'overwatch2', name: 'Overwatch 2', category: 'FPS' },
        { id: 'rainbow-six-siege', name: 'Rainbow Six Siege', category: 'FPS' },
        { id: 'genshin-impact', name: 'Genshin Impact', category: 'Action RPG' },
        { id: 'ffxiv', name: 'Final Fantasy XIV', category: 'MMORPG' },
        { id: 'diablo-iv', name: 'Diablo IV', category: 'Action RPG' },
        { id: 'elden-ring', name: 'Elden Ring', category: 'Action RPG' },
        { id: 'monster-hunter-wilds', name: 'Monster Hunter Wilds', category: 'Action RPG' },
        { id: 'zenless-zone-zero', name: 'Zenless Zone Zero', category: 'Action RPG' },
        { id: 'lol', name: 'League of Legends', category: 'MOBA' },
        { id: 'dota2', name: 'Dota 2', category: 'MOBA' },
        { id: 'marvel-rivals', name: 'Marvel Rivals', category: 'Hero Shooter' },
        { id: 'rocket-league', name: 'Rocket League', category: 'Sports' },
        { id: 'fc25', name: 'EA Sports FC 25', category: 'Sports' },
        { id: 'nba2k25', name: 'NBA 2K25', category: 'Sports' },
        { id: 'forza-horizon-5', name: 'Forza Horizon 5', category: 'Racing' },
        { id: 'minecraft', name: 'Minecraft', category: 'Sandbox' },
        { id: 'roblox', name: 'Roblox', category: 'Sandbox' },
        { id: 'terraria', name: 'Terraria', category: 'Sandbox' },
        { id: 'dead-by-daylight', name: 'Dead by Daylight', category: 'Horror' },
        { id: 'phasmophobia', name: 'Phasmophobia', category: 'Horror' },
        { id: 'resident-evil-village', name: 'Resident Evil Village', category: 'Horror' },
        { id: 'mecha-break', name: 'Mecha Break', category: 'Action' },
        { id: 'warframe', name: 'Warframe', category: 'Action RPG' },
        { id: 'helldivers-2', name: 'Helldivers 2', category: 'Shooter Co-op' },
        { id: 'wow-shadowlands', name: 'WoW: Shadowlands', category: 'MMORPG' },
        { id: 'baldurs-gate-3', name: "Baldur's Gate 3", category: 'RPG' },
        { id: 'new-world', name: 'New World', category: 'MMORPG' },
        { id: 'the-witcher-3', name: 'The Witcher 3: Wild Hunt', category: 'Action RPG' },
        { id: 'starcraft-2', name: 'StarCraft 2', category: 'Strategy (RTS)' },
    ];

    const selectedGame = gamesDataFull.find(g => g.id === gameId);
    if (!selectedGame) {
        throw new Error('Game not found.');
    }

    // Simulate finding an opponent (e.g., from a pool, or generating one)
    const opponentUsernames = ["GamerPro", "PixelHunter", "NeonBlade", "CodeNinja", "StratMaster"];
    const randomOpponent = opponentUsernames[Math.floor(Math.random() * opponentUsernames.length)];
    const firstMessage = `E aí! Pronto para uma partida de ${selectedGame.name}?`;

    // Store the match request in Firestore for the frontend to potentially poll or receive updates
    const matchRequestsColRef = db.collection(getArtifactPath('match_requests'));
    const newMatchRequestRef = await matchRequestsColRef.add({
        senderId: requestingUserId,
        senderNickname: 'Backend System', // Or fetch actual user's nickname
        receiverUsername: randomOpponent, // This is the simulated opponent
        game: selectedGame.name,
        games: [selectedGame.name], // Consistent with frontend's `games` array property
        status: 'matched', // Or 'pending' if you want a real user to accept
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        matchType: 'random_player_search'
    });

    return {
        opponentUsername: randomOpponent,
        firstMessage: firstMessage,
        matchRequestId: newMatchRequestRef.id // Return ID for client to track
    };
};

// --- 4. Example: Cloud Function for handling new user sign-ups (onUserCreate trigger) ---
// This function would run automatically when a new user signs up via Firebase Authentication.

/**
 * Cloud Function triggered on new user creation to create a Firestore profile.
 * To deploy this, you would use Firebase CLI: `firebase deploy --only functions`
 */
exports.createProfileOnSignUp = functions.auth.user().onCreate(async (user) => {
    const userProfileRef = db.collection('users').doc(user.uid);

    // Check if a profile already exists to prevent overwrites if function retries
    const docSnap = await userProfileRef.get();
    if (docSnap.exists) {
        console.log(`Profile for user ${user.uid} already exists. Skipping creation.`);
        return null;
    }

    const nickname = user.displayName || user.email?.split('@')[0] || `Jogador_${user.uid.substring(0, 5)}`;
    const defaultProfile = {
        uid: user.uid,
        nickname: nickname,
        usernameGameMatch: `@${nickname.replace(/\s+/g, '_').toLowerCase()}`,
        email: user.email,
        platform: "Não especificado",
        favoriteGames: [],
        bio: "Novo por aqui no GameMatch!",
        avatarUrl: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random&color=fff&font-size=0.5&bold=true`,
        socialLinks: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        playStyle: "Não definido",
        objectives: "Diversão"
    };

    try {
        await userProfileRef.set(defaultProfile);
        console.log(`Profile created for new user: ${user.uid}`);
        return { success: true };
    } catch (error) {
        console.error(`Error creating profile for new user ${user.uid}:`, error);
        return { success: false, error: error.message };
    }
});

// --- 5. Example: Cloud Function for handling post image uploads (onFinalize trigger) ---
// This function could process images after they are uploaded, e.g., create thumbnails,
// scan for inappropriate content, or update Firestore with image metadata.

/**
 * Cloud Function triggered when a new file is uploaded to the 'post_images' storage bucket.
 * This is a placeholder for image processing.
 */
exports.processPostImage = functions.storage.object().onFinalize(async (object) => {
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name;     // File path in the bucket.
    const contentType = object.contentType; // File content type.

    // Exit if this is a deletion or not an image.
    if (!filePath || !contentType || !contentType.startsWith('image/')) {
        return null;
    }

    // Ensure it's in the expected path (e.g., artifacts/appId/post_images/...)
    if (!filePath.startsWith(`artifacts/${APP_ID}/post_images/`)) {
        console.log('Not a post image, skipping processing.');
        return null;
    }

    console.log(`Processing new image: ${filePath}`);

    // TODO: Implement image processing logic here, e.g.:
    // 1. Download the file to a temporary location.
    // 2. Use a library like sharp to create thumbnails.
    // 3. Upload thumbnails back to Storage.
    // 4. Update the corresponding Firestore post document with thumbnail URLs.
    // 5. Delete the temporary file.

    console.log('Image processing logic would go here.');
    return null;
});


// --- Exporting for Cloud Functions (if used as such) ---
// If you are deploying this as Firebase Cloud Functions, you would typically
// uncomment the following lines and wrap the above examples into Cloud Function
// triggers (e.g., `functions.https.onCall`, `functions.firestore.document().onCreate`).
// Make sure to `npm install firebase-functions` and `npm install firebase-admin`
// in your functions directory.

// const functions = require('firebase-functions');
// exports.someCallableFunction = functions.https.onCall(async (data, context) => {
//   // Example: call a backend function from your frontend using `firebase.functions().httpsCallable`
//   if (!context.auth) {
//     throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
//   }
//   // return exports.findRandomPlayerMatch(context.auth.uid, data.gameId);
// });
// exports.updateUserViaBackend = functions.https.onCall(async (data, context) => {
//   if (!context.auth) {
//     throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
//   }
//   return exports.updateUserProfile(context.auth.uid, data.profileData);
// });