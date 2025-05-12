const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Get all audit categories with their items
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.auditCategory.findMany({
      include: {
        items: true
      }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching audit categories:', error);
    res.status(500).json({ error: 'Failed to fetch audit categories' });
  }
});

// Get a specific audit category with its items
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await prisma.auditCategory.findUnique({
      where: { id: req.params.id },
      include: {
        items: true
      }
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching audit category:', error);
    res.status(500).json({ error: 'Failed to fetch audit category' });
  }
});

// Update audit item status
router.patch('/items/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['passing', 'failing', 'not_started', 'not_applicable'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const item = await prisma.auditItem.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating audit item status:', error);
    res.status(500).json({ error: 'Failed to update audit item status' });
  }
});

// Run audit for a specific category
router.post('/categories/:id/run', async (req, res) => {
  try {
    const category = await prisma.auditCategory.findUnique({
      where: { id: req.params.id },
      include: {
        items: true
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Here you would implement the actual audit logic
    // For now, we'll just update the lastRun timestamp
    const updatedItems = await Promise.all(
      category.items.map(item =>
        prisma.auditItem.update({
          where: { id: item.id },
          data: {
            lastRun: new Date(),
            lastResult: JSON.stringify({ message: 'Audit completed' })
          }
        })
      )
    );

    res.json({ message: 'Audit completed', items: updatedItems });
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({ error: 'Failed to run audit' });
  }
});

module.exports = router; 