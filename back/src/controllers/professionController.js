const { prisma } = require('../config/database');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Criar uma nova profissão
const createProfession = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'O nome da profissão é obrigatório'
      });
    }

    const profession = await prisma.profession.create({
      data: {
        name,
        description: description || null,
      }
    });

    res.status(201).json({
      message: 'Profissão criada com sucesso',
      profession
    });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(409).json({ error: 'Uma profissão com este nome já existe.' });
    }
    console.error('Erro ao criar profissão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Listar todas as profissões com paginação e busca
const getProfessions = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    } : {};

    const professions = await prisma.profession.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { name: 'asc' }
    });

    const total = await prisma.profession.count({ where });

    res.json({
      professions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar profissões:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Obter uma profissão por ID
const getProfessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const profession = await prisma.profession.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!profession) {
      return res.status(404).json({
        error: 'Profissão não encontrada'
      });
    }

    res.json(profession);
  } catch (error) {
    console.error('Erro ao obter profissão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Atualizar uma profissão
const updateProfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedProfession = await prisma.profession.update({
      where: { id },
      data: { name, description }
    });

    res.json({
      message: 'Profissão atualizada com sucesso',
      profession: updatedProfession
    });
  } catch (error) {
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Profissão não encontrada.' });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        return res.status(409).json({ error: 'Uma profissão com este nome já existe.' });
    }
    console.error('Erro ao atualizar profissão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Deletar uma profissão
const deleteProfession = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a profissão está vinculada a algum usuário
    const profession = await prisma.profession.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    });

    if (!profession) {
      return res.status(404).json({ error: 'Profissão não encontrada' });
    }

    if (profession._count.users > 0) {
      return res.status(400).json({
        error: `Não é possível deletar. Esta profissão está associada a ${profession._count.users} usuário(s).`
      });
    }

    await prisma.profession.delete({
      where: { id }
    });

    res.json({
      message: 'Profissão deletada com sucesso'
    });
  } catch (error) {
     if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Profissão não encontrada.' });
    }
    console.error('Erro ao deletar profissão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
};

// Importar profissões via arquivo CSV
const importProfessionsFromCSV = async (req, res) => {
    // Esta função é um bônus, similar à de Localidades.
    // Lembre-se de que o CSV deve ter as colunas "name" e "description".
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo CSV é obrigatório' });
        }

        const results = [];
        const stream = Readable.from(req.file.buffer.toString());

        stream
            .pipe(csv({ headers: ['name', 'description'], separator: ',' }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let imported = 0, skipped = 0, errors = [];

                for (const row of results) {
                    if (!row.name) {
                        skipped++;
                        errors.push({ row, error: 'O nome é obrigatório' });
                        continue;
                    }

                    try {
                        await prisma.profession.create({
                            data: {
                                name: row.name.trim(),
                                description: row.description?.trim() || null,
                            },
                        });
                        imported++;
                    } catch (e) {
                        if (e.code === 'P2002') { // Ignora duplicados
                            skipped++;
                        } else {
                            skipped++;
                            errors.push({ row, error: e.message });
                        }
                    }
                }
                res.json({ message: 'Importação concluída', summary: { total: results.length, imported, skipped }, errors });
            });
    } catch (error) {
        console.error('Erro na importação de profissões:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};


module.exports = {
  createProfession,
  getProfessions,
  getProfessionById,
  updateProfession,
  deleteProfession,
  importProfessionsFromCSV
};