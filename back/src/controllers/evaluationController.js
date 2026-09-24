const { body, validationResult } = require('express-validator');
const { prisma } = require('../config/database');

// Validações para avaliação
const evaluationValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Avaliação deve ser entre 1 e 5 estrelas'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comentário deve ter no máximo 1000 caracteres'),
];

// Criar avaliação de curso
const createEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    // Suporta tanto POST /evaluations (com eventId no body) quanto POST /enrollments/:id
    let enrollmentId = req.params.enrollmentId || req.body.enrollmentId;
    const { eventId, rating, comment } = req.body;

    // Se foi passado eventId, buscar a inscrição do usuário
    if (eventId && !enrollmentId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          eventId,
          userId: req.user.id,
        },
      });

      if (!enrollment) {
        return res.status(404).json({
          error: 'Inscrição não encontrada para este evento'
        });
      }

      enrollmentId = enrollment.id;
    }

    if (!enrollmentId) {
      return res.status(400).json({
        error: 'enrollmentId ou eventId é obrigatório'
      });
    }

    // Verificar se a inscrição existe
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        event: true,
        user: true,
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        error: 'Inscrição não encontrada'
      });
    }

    // Verificar se o usuário pode avaliar (próprio usuário)
    if (enrollment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você só pode avaliar seus próprios cursos'
      });
    }

    // Verificar se a inscrição está aprovada
    if (enrollment.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Só é possível avaliar cursos com inscrição aprovada'
      });
    }

    // Verificar se o evento já terminou
    if (new Date() < enrollment.event.endDate) {
      return res.status(400).json({
        error: 'Só é possível avaliar após o término do evento'
      });
    }

    // Verificar se já existe avaliação
    const existingEvaluation = await prisma.courseEvaluation.findUnique({
      where: { enrollmentId }
    });

    if (existingEvaluation) {
      return res.status(409).json({
        error: 'Curso já foi avaliado'
      });
    }

    // Criar avaliação
    const evaluation = await prisma.courseEvaluation.create({
      data: {
        enrollmentId,
        rating,
        comment: comment || null,
      },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            },
            event: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Avaliação criada com sucesso',
      evaluation
    });

  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar avaliações de um evento
const getEventEvaluations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const evaluations = await prisma.courseEvaluation.findMany({
      where: {
        enrollment: {
          eventId
        }
      },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                photoUrl: true,
              }
            }
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { evaluatedAt: 'desc' }
    });

    const total = await prisma.courseEvaluation.count({
      where: {
        enrollment: {
          eventId
        }
      }
    });

    res.json({
      evaluations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar avaliações do evento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Obter estatísticas de avaliação de um evento
const getEventEvaluationStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verificar se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    // Estatísticas das avaliações
    const evaluationStats = await prisma.courseEvaluation.aggregate({
      where: {
        enrollment: {
          eventId
        }
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    });

    // Distribuição das avaliações por estrelas
    const ratingDistribution = await prisma.courseEvaluation.groupBy({
      by: ['rating'],
      where: {
        enrollment: {
          eventId
        }
      },
      _count: {
        rating: true
      },
      orderBy: {
        rating: 'asc'
      }
    });

    // Total de inscrições aprovadas para calcular taxa de avaliação
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        eventId,
        status: 'APPROVED'
      }
    });

    const stats = {
      event: {
        id: event.id,
        title: event.title,
      },
      totalEvaluations: evaluationStats._count.rating || 0,
      averageRating: evaluationStats._avg.rating ? parseFloat(evaluationStats._avg.rating.toFixed(2)) : 0,
      totalEnrollments,
      evaluationRate: totalEnrollments > 0 ? ((evaluationStats._count.rating || 0) / totalEnrollments * 100).toFixed(2) : 0,
      ratingDistribution: ratingDistribution.map(item => ({
        stars: item.rating,
        count: item._count.rating
      }))
    };

    res.json(stats);

  } catch (error) {
    console.error('Erro ao obter estatísticas de avaliação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar avaliações de um usuário
const getUserEvaluations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const evaluations = await prisma.courseEvaluation.findMany({
      where: {
        enrollment: {
          userId
        }
      },
      include: {
        enrollment: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                location: true,
                imageUrl: true,
              }
            }
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { evaluatedAt: 'desc' }
    });

    const total = await prisma.courseEvaluation.count({
      where: {
        enrollment: {
          userId
        }
      }
    });

    res.json({
      evaluations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar avaliações do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Atualizar avaliação
const updateEvaluation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { evaluationId } = req.params;
    const { rating, comment } = req.body;

    // Buscar avaliação
    const evaluation = await prisma.courseEvaluation.findUnique({
      where: { id: evaluationId },
      include: {
        enrollment: {
          include: {
            user: true,
            event: true,
          }
        }
      }
    });

    if (!evaluation) {
      return res.status(404).json({
        error: 'Avaliação não encontrada'
      });
    }

    // Verificar se o usuário pode atualizar (próprio usuário)
    if (evaluation.enrollment.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Você só pode atualizar suas próprias avaliações'
      });
    }

    // Atualizar avaliação
    const updatedEvaluation = await prisma.courseEvaluation.update({
      where: { id: evaluationId },
      data: {
        rating,
        comment: comment || null,
      },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            },
            event: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Avaliação atualizada com sucesso',
      evaluation: updatedEvaluation
    });

  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  createEvaluation,
  getEventEvaluations,
  getEventEvaluationStats,
  getUserEvaluations,
  updateEvaluation,
  evaluationValidation,
};

