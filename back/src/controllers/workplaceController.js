const { prisma } = require('../config/database');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Criar localidade de trabalho
const createWorkplace = async (req, res) => {
  try {
    const { name, description, city, state } = req.body;

    if (!name || !city || !state) {
      return res.status(400).json({
        error: 'Nome, cidade e estado são obrigatórios'
      });
    }

    const workplace = await prisma.workplace.create({
      data: {
        name,
        description: description || null,
        city,
        state,
      }
    });

    res.status(201).json({
      message: 'Localidade criada com sucesso',
      workplace
    });
  } catch (error) {
    console.error('Erro ao criar localidade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar localidades
const getWorkplaces = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, city, state } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    if (city) {
      where.city = city;
    }
    if (state) {
      where.state = state;
    }

    const workplaces = await prisma.workplace.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { name: 'asc' }
    });

    const total = await prisma.workplace.count({ where });

    res.json({
      workplaces,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar localidades:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Obter localidade por ID
const getWorkplaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const workplace = await prisma.workplace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!workplace) {
      return res.status(404).json({
        error: 'Localidade não encontrada'
      });
    }

    res.json(workplace);
  } catch (error) {
    console.error('Erro ao obter localidade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Atualizar localidade
const updateWorkplace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, city, state } = req.body;

    const workplace = await prisma.workplace.findUnique({
      where: { id }
    });

    if (!workplace) {
      return res.status(404).json({
        error: 'Localidade não encontrada'
      });
    }

    const updatedWorkplace = await prisma.workplace.update({
      where: { id },
      data: {
        name: name || workplace.name,
        description: description !== undefined ? description : workplace.description,
        city: city || workplace.city,
        state: state || workplace.state,
      }
    });

    res.json({
      message: 'Localidade atualizada com sucesso',
      workplace: updatedWorkplace
    });
  } catch (error) {
    console.error('Erro ao atualizar localidade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Deletar localidade
const deleteWorkplace = async (req, res) => {
  try {
    const { id } = req.params;

    const workplace = await prisma.workplace.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!workplace) {
      return res.status(404).json({
        error: 'Localidade não encontrada'
      });
    }

    if (workplace._count.users > 0) {
      return res.status(400).json({
        error: `Não é possível deletar localidade com ${workplace._count.users} usuário(s) associado(s)`
      });
    }

    await prisma.workplace.delete({
      where: { id }
    });

    res.json({
      message: 'Localidade deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar localidade:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Importar localidades via CSV
const importWorkplacesFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo CSV é obrigatório'
      });
    }

    const results = [];
    const errors = [];

    // Ler o buffer do arquivo como stream
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv({
        separator: ',',
        headers: ['name', 'description', 'city', 'state']
      }))
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;
        let skipped = 0;

        for (const row of results) {
          // Validar dados obrigatórios
          if (!row.name || !row.city || !row.state) {
            skipped++;
            errors.push({
              row,
              error: 'Nome, cidade e estado são obrigatórios'
            });
            continue;
          }

          try {
            // Verificar se já existe
            const existing = await prisma.workplace.findFirst({
              where: {
                name: row.name,
                city: row.city,
                state: row.state
              }
            });

            if (existing) {
              skipped++;
              continue;
            }

            // Criar localidade
            await prisma.workplace.create({
              data: {
                name: row.name.trim(),
                description: row.description?.trim() || null,
                city: row.city.trim(),
                state: row.state.trim(),
              }
            });

            imported++;
          } catch (error) {
            skipped++;
            errors.push({
              row,
              error: error.message
            });
          }
        }

        res.json({
          message: 'Importação concluída',
          summary: {
            total: results.length,
            imported,
            skipped,
            errors: errors.length
          },
          errors: errors.length > 0 ? errors : undefined
        });
      })
      .on('error', (error) => {
        console.error('Erro ao processar CSV:', error);
        res.status(500).json({
          error: 'Erro ao processar arquivo CSV'
        });
      });

  } catch (error) {
    console.error('Erro ao importar localidades:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  createWorkplace,
  getWorkplaces,
  getWorkplaceById,
  updateWorkplace,
  deleteWorkplace,
  importWorkplacesFromCSV,
};
