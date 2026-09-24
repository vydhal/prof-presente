const { prisma } = require("../config/database");
const { validationResult } = require("express-validator");

// Criar categoria
const createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: "Dados inválidos", details: errors.array() });
        }

        const { name, color } = req.body;

        const existing = await prisma.category.findUnique({ where: { name } });
        if (existing) {
            return res.status(400).json({ error: "Categoria com este nome já existe" });
        }

        const category = await prisma.category.create({
            data: { name, color: color || "#137fec" },
        });

        res.status(201).json(category);
    } catch (error) {
        console.error("Erro ao criar categoria:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Listar todas as categorias
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        res.json(categories);
    } catch (error) {
        console.error("Erro ao listar categorias:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Buscar categoria por ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { events: true }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada" });
        }

        res.json(category);
    } catch (error) {
        console.error("Erro ao buscar categoria:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Atualizar categoria
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada" });
        }

        if (name && name !== category.name) {
            const existing = await prisma.category.findUnique({ where: { name } });
            if (existing) {
                return res.status(400).json({ error: "Categoria com este nome já existe" });
            }
        }

        const updated = await prisma.category.update({
            where: { id },
            data: {
                name: name || category.name,
                color: color || category.color,
            },
        });

        res.json(updated);
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

// Deletar categoria
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { events: true } }
            }
        });

        if (!category) {
            return res.status(404).json({ error: "Categoria não encontrada" });
        }

        if (category._count.events > 0) {
            return res.status(400).json({ error: "Não é possível deletar uma categoria que possui eventos vinculados" });
        }

        await prisma.category.delete({ where: { id } });

        res.json({ message: "Categoria deletada com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar categoria:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
