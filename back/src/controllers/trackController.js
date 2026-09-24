const { prisma } = require("../config/database");

// Listar todas as trilhas
const getAllTracks = async (req, res) => {
    try {
        const { search } = req.query;

        const where = search ? {
            OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        } : {};

        const tracks = await prisma.learningTrack.findMany({
            where,
            include: {
                events: {
                    include: {
                        event: true
                    },
                    orderBy: { order: "asc" }
                },
                _count: {
                    select: {
                        events: true,
                        enrollments: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(tracks);
    } catch (error) {
        console.error("Erro ao listar trilhas:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Obter detalhes de uma trilha
const getTrackById = async (req, res) => {
    try {
        const { id } = req.params;
        const track = await prisma.learningTrack.findUnique({
            where: { id },
            include: {
                events: {
                    include: {
                        event: true
                    },
                    orderBy: { order: "asc" }
                },
                _count: {
                    select: {
                        enrollments: true,
                        events: true
                    }
                }
            }
        });

        if (!track) {
            return res.status(404).json({ error: "Trilha não encontrada" });
        }

        res.json(track);
    } catch (error) {
        console.error("Erro ao buscar trilha:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Criar nova trilha (Admin)
const createTrack = async (req, res) => {
    try {
        let { title, description, imageUrl, eventIds } = req.body;

        if (req.file) {
            imageUrl = `/uploads/tracks/${req.file.filename}`;
        }

        if (!title || !description) {
            return res.status(400).json({ error: "Título e descrição são obrigatórios" });
        }

        // Parsear eventIds se vier do FormData como string
        if (typeof eventIds === "string") {
            try {
                eventIds = JSON.parse(eventIds);
            } catch (e) {
                console.error("Erro ao parsear eventIds:", e.message);
            }
        }

        const track = await prisma.learningTrack.create({
            data: {
                title,
                description,
                imageUrl,
                events: {
                    create: Array.isArray(eventIds) ? eventIds.map((eventId, index) => ({
                        eventId: String(eventId),
                        order: index
                    })) : []
                }
            },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        res.status(201).json(track);
    } catch (error) {
        console.error("Erro ao criar trilha:", error);
        res.status(500).json({
            error: "Erro interno do servidor",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Atualizar trilha (Admin)
const updateTrack = async (req, res) => {
    try {
        const { id } = req.params;
        let { title, description, imageUrl, eventIds } = req.body;

        if (req.file) {
            imageUrl = `/uploads/tracks/${req.file.filename}`;
        }

        // Se eventIds vier como string, parsemos
        if (typeof eventIds === "string") {
            try {
                eventIds = JSON.parse(eventIds);
            } catch (e) {
                console.warn("Falha ao parsear eventIds como JSON.");
            }
        }

        // Se eventIds for enviado, substitui os eventos atuais
        if (eventIds) {
            await prisma.trackEvent.deleteMany({ where: { trackId: id } });
        }

        const track = await prisma.learningTrack.update({
            where: { id },
            data: {
                title,
                description,
                imageUrl,
                ...(eventIds && {
                    events: {
                        create: eventIds.map((eventId, index) => ({
                            eventId,
                            order: index
                        }))
                    }
                })
            }
        });

        res.json(track);
    } catch (error) {
        console.error("Erro ao atualizar trilha:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Deletar trilha (Admin)
const deleteTrack = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.learningTrack.delete({ where: { id } });
        res.json({ message: "Trilha removida com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar trilha:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Inscrever-se em uma trilha
const enrollInTrack = async (req, res) => {
    try {
        const { trackId } = req.params;
        const userId = req.user.id;

        const existing = await prisma.trackEnrollment.findUnique({
            where: { trackId_userId: { trackId, userId } }
        });

        if (existing) {
            return res.status(400).json({ error: "Você já está inscrito nesta trilha" });
        }

        const trackEnrollment = await prisma.trackEnrollment.create({
            data: { trackId, userId }
        });

        // --- Lógica de inscrição automática nos eventos da trilha ---
        // 1. Buscar todos os eventos associados a esta trilha
        const trackEvents = await prisma.trackEvent.findMany({
            where: { trackId },
            include: {
                event: {
                    include: {
                        _count: {
                            select: { enrollments: { where: { status: "APPROVED" } } }
                        }
                    }
                }
            }
        });

        // 2. Buscar inscrições existentes do usuário nesses eventos
        const eventIds = trackEvents.map(te => te.eventId);
        const existingEnrollments = await prisma.enrollment.findMany({
            where: {
                userId,
                eventId: { in: eventIds },
            }
        });
        const enrolledEventIds = new Set(existingEnrollments.map(e => e.eventId));

        const enrolledEvents = [];
        const fullEvents = [];
        const enrollmentsToCreate = [];
        const enrollmentsToUpdate = [];

        for (const te of trackEvents) {
            const event = te.event;

            // Verifica lotação
            const isFull = event.maxAttendees && event._count.enrollments >= event.maxAttendees;

            // Pula se o evento já terminou
            if (new Date() > new Date(event.endDate)) {
                continue;
            }

            const existingUserEnrollment = existingEnrollments.find(e => e.eventId === event.id);

            if (existingUserEnrollment) {
                // Se o usuário tem inscrição cancelada ou rejeitada e há vaga, podemos reativar
                if (["CANCELLED", "REJECTED"].includes(existingUserEnrollment.status)) {
                    if (isFull) {
                        fullEvents.push({ id: event.id, title: event.title });
                    } else {
                        enrollmentsToUpdate.push(existingUserEnrollment.id);
                        enrolledEvents.push({ id: event.id, title: event.title });
                    }
                }
                // Se já for APPROVED, ele já está inscrito
                continue;
            }

            // O usuário não tem inscrição
            if (isFull) {
                fullEvents.push({ id: event.id, title: event.title });
            } else {
                enrollmentsToCreate.push({
                    userId,
                    eventId: event.id,
                    status: "APPROVED"
                });
                enrolledEvents.push({ id: event.id, title: event.title });
            }
        }

        // 3. Realiza as inscrições em lote
        if (enrollmentsToCreate.length > 0) {
            await prisma.enrollment.createMany({
                data: enrollmentsToCreate,
                skipDuplicates: true
            });
        }

        // 4. Reativa inscrições em lote
        if (enrollmentsToUpdate.length > 0) {
            await prisma.enrollment.updateMany({
                where: { id: { in: enrollmentsToUpdate } },
                data: { status: "APPROVED", enrollmentDate: new Date() }
            });
        }

        // Calcular progresso inicial (pode ser que ele já tenha feito check-in em eventos da trilha)
        await calculateAndSaveProgress(userId, trackId);

        res.status(201).json({
            message: "Inscrição na trilha realizada.",
            trackEnrollment,
            enrolledEvents,
            fullEvents
        });
    } catch (error) {
        console.error("Erro ao se inscrever na trilha:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Obter trilhas do usuário logado
const getMyTracks = async (req, res) => {
    try {
        const userId = req.user.id;
        const enrollments = await prisma.trackEnrollment.findMany({
            where: { userId },
            include: {
                track: {
                    include: {
                        events: {
                            include: {
                                event: {
                                    select: {
                                        id: true,
                                        title: true,
                                        startDate: true,
                                        endDate: true,
                                        location: true,
                                        userCheckins: {
                                            where: { userBadge: { userId } },
                                            take: 1
                                        }
                                    }
                                }
                            },
                            orderBy: { order: "asc" }
                        },
                        _count: {
                            select: { events: true }
                        }
                    }
                }
            },
            orderBy: { updatedAt: "desc" }
        });
        res.json(enrollments);
    } catch (error) {
        console.error("Erro ao listar minhas trilhas:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Função auxiliar para calcular e salvar progresso
const calculateAndSaveProgress = async (userId, trackId) => {
    try {
        // 1. Pegar todos os eventos da trilha
        const trackEvents = await prisma.trackEvent.findMany({
            where: { trackId },
            select: { eventId: true }
        });

        if (trackEvents.length === 0) return 0;

        const eventIds = trackEvents.map(te => te.eventId);

        // 2. Contar em quantos desses o usuário fez check-in
        const checkinCount = await prisma.userCheckin.count({
            where: {
                userBadge: { userId },
                eventId: { in: eventIds }
            }
        });

        const progress = (checkinCount / trackEvents.length) * 100;
        const isCompleted = progress >= 100;

        await prisma.trackEnrollment.update({
            where: { trackId_userId: { trackId, userId } },
            data: {
                progress,
                isCompleted,
                ...(isCompleted && { completedAt: new Date() })
            }
        });

        return progress;
    } catch (error) {
        console.error("Erro ao calcular progresso:", error);
        return 0;
    }
};

// Obter inscritos em uma trilha (Admin)
const getTrackEnrollments = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, search = "" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 1. Buscar a trilha e seus eventos primeiro para ter a base de calculo
        const track = await prisma.learningTrack.findUnique({
            where: { id },
            include: {
                events: {
                    select: { eventId: true, event: { select: { title: true } } },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!track) {
            return res.status(404).json({ error: "Trilha não encontrada" });
        }

        const trackEventIds = track.events.map(te => te.eventId);

        const where = {
            trackId: id,
            ...(search && {
                user: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }
            })
        };

        const [enrollments, total] = await Promise.all([
            prisma.trackEnrollment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profession: { select: { name: true } },
                            userBadge: { select: { id: true } }
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip: parseInt(skip),
                take: parseInt(limit)
            }),
            prisma.trackEnrollment.count({ where })
        ]);

        // 2. Para cada inscrito, calcular o status detalhado dos eventos
        const enrichedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
            const userBadgeId = enrollment.user.userBadge?.id;

            let checkins = [];
            if (userBadgeId && trackEventIds.length > 0) {
                checkins = await prisma.userCheckin.findMany({
                    where: {
                        userBadgeId,
                        eventId: { in: trackEventIds }
                    },
                    select: { eventId: true }
                });
            }

            const checkedInEventIds = new Set(checkins.map(c => c.eventId));

            const eventStatuses = track.events.map(te => ({
                eventId: te.eventId,
                title: te.event.title,
                checkedIn: checkedInEventIds.has(te.eventId)
            }));

            const checkinCount = checkins.length;
            const progress = trackEventIds.length > 0 ? (checkinCount / trackEventIds.length) * 100 : 0;

            return {
                ...enrollment,
                progress,
                eventStatuses,
                checkinCount,
                totalEvents: trackEventIds.length
            };
        }));

        res.json({
            enrollments: enrichedEnrollments,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            },
            trackInfo: {
                title: track.title,
                totalEvents: trackEventIds.length
            }
        });
    } catch (error) {
        console.error("Erro ao listar inscritos na trilha:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Exportar inscritos na trilha para CSV (Admin)
const exportTrackEnrollmentsToCSV = async (req, res) => {
    try {
        const { id } = req.params;
        const { search = "" } = req.query;

        const track = await prisma.learningTrack.findUnique({
            where: { id },
            include: {
                events: { select: { eventId: true } }
            }
        });

        if (!track) {
            return res.status(404).json({ error: "Trilha não encontrada" });
        }

        const trackEventIds = track.events.map(te => te.eventId);

        const where = {
            trackId: id,
            ...(search && {
                user: {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }
            })
        };

        const enrollments = await prisma.trackEnrollment.findMany({
            where,
            include: {
                user: {
                    include: {
                        userBadge: { select: { id: true } }
                    }
                }
            },
            orderBy: { user: { name: "asc" } }
        });

        let csv = "\uFEFF"; // BOM para Excel
        csv += "Nome;Email;Instituicao;Check-ins;Total Eventos;Progresso;Concluido;Data de Inscricao\n";

        for (const e of enrollments) {
            const userBadgeId = e.user.userBadge?.id;
            let checkinCount = 0;

            if (userBadgeId && trackEventIds.length > 0) {
                checkinCount = await prisma.userCheckin.count({
                    where: {
                        userBadgeId,
                        eventId: { in: trackEventIds }
                    }
                });
            }

            const totalEvents = trackEventIds.length;
            const progressValue = totalEvents > 0 ? (checkinCount / totalEvents) * 100 : 0;
            const progress = Math.round(progressValue) + "%";
            const completed = progressValue >= 100 ? "Sim" : "Não";
            const date = new Date(e.createdAt).toLocaleDateString("pt-BR");

            csv += `${e.user.name};${e.user.email};${e.user.workplace || ""};${checkinCount};${totalEvents};${progress};${completed};${date}\n`;
        }

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=inscritos_trilha_${id}.csv`);
        res.send(csv);
    } catch (error) {
        console.error("Erro ao exportar inscritos na trilha:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Exportar funções
module.exports = {
    getAllTracks,
    getTrackById,
    createTrack,
    updateTrack,
    deleteTrack,
    enrollInTrack,
    getMyTracks,
    calculateAndSaveProgress,
    getTrackEnrollments,
    exportTrackEnrollmentsToCSV
};
