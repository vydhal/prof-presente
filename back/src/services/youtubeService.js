const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getOAuth2Client = () => {
    const isProd = process.env.NODE_ENV === 'production';

    // Usa PUBLIC_API_URL se disponível, senão usa fallback baseado no ambiente
    const publicApiUrl = process.env.PUBLIC_API_URL || (isProd
        ? 'https://eduagenda.simplisoft.com.br/api'
        : 'http://localhost:3000/api');

    const redirectUrl = `${publicApiUrl}/live-streams/youtube/callback`;

    console.log(`[YouTube Service] Using redirectUrl: ${redirectUrl}`);

    return new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        redirectUrl
    );
};

const getAuthUrl = () => {
    // Validação explícita para evitar erros crípticos no Google
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
        throw new Error('Configuração incompleta: YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET são obrigatórios nas variáveis de ambiente do Backend.');
    }

    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial to get a refresh token
        scope: ['https://www.googleapis.com/auth/youtube'],
        prompt: 'consent' // Forces consent screen to ensure refresh token is always returned
    });
};

const handleCallback = async (code) => {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Save tokens securely to the database
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        settings = await prisma.systemSettings.create({ data: {} });
    }

    await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
            youtubeAccessToken: tokens.access_token,
            // Only update refresh token if present (Google sometimes omits it if already consented)
            youtubeRefreshToken: tokens.refresh_token || settings.youtubeRefreshToken
        }
    });

    return tokens;
};

const createLiveBroadcast = async (title, description, startTime) => {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings || !settings.youtubeRefreshToken) {
        throw new Error('Conta do YouTube não conectada. Configure nas Integrações primeiro.');
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        refresh_token: settings.youtubeRefreshToken,
        access_token: settings.youtubeAccessToken
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Ensure the event start time is in the future
    const broadcastStartTime = new Date(startTime).getTime() <= Date.now()
        ? new Date(Date.now() + 5 * 60000) // If past or exact now, schedule 5 minutes from now
        : new Date(startTime);

    // 1. Create the Broadcast
    const broadcastResponse = await youtube.liveBroadcasts.insert({
        part: 'snippet,status,contentDetails',
        requestBody: {
            snippet: {
                title: title,
                description: description || 'Evento online SEDUC, gerado automaticamente pela plataforma.',
                scheduledStartTime: broadcastStartTime.toISOString()
            },
            status: {
                privacyStatus: 'unlisted', // Private but accessible via embed
                selfDeclaredMadeForKids: false
            },
            contentDetails: {
                enableAutoStart: true,
                enableAutoStop: true,
                enableClosedCaptions: false,
                enableDvr: true, // Allow users to scrub back
                recordFromStart: true
            }
        }
    });

    const broadcast = broadcastResponse.data;

    // 2. We don't necessarily need to create a `liveStream` key/ingester automatically unless they stream from OBS.
    // However, YouTube API requires a stream to be bound to a broadcast before it can go live.
    // If they stream with a webcam directly on YouTube studio, they still need to do it there.
    // Let's create a stream ingest just in case they use OBS.
    const streamResponse = await youtube.liveStreams.insert({
        part: 'snippet,cdn',
        requestBody: {
            snippet: {
                title: `${title} - Ingestor Automático`
            },
            cdn: {
                frameRate: '30fps',
                ingestionType: 'rtmp',
                resolution: '1080p'
            }
        }
    });

    const stream = streamResponse.data;

    // 3. Bind the stream to the broadcast
    await youtube.liveBroadcasts.bind({
        id: broadcast.id,
        part: 'id,contentDetails',
        streamId: stream.id
    });

    return broadcast.id; // This is the YouTube Video ID
};

module.exports = {
    getAuthUrl,
    handleCallback,
    createLiveBroadcast
};
