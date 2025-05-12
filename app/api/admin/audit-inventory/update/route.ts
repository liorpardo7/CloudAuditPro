import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UpdateRequest = {
  category: string;
  name: string;
  updates: {
    status?: string;
    notes?: string;
    reviewed?: boolean;
  };
};

export async function POST(request: Request) {
  try {
    const body: UpdateRequest = await request.json();
    const { category, name, updates } = body;

    // Find the category
    const categoryRecord = await prisma.auditCategory.findFirst({
      where: { name: category }
    });

    if (!categoryRecord) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Find and update the item
    const updatedItem = await prisma.auditItem.update({
      where: {
        categoryId_name: {
          categoryId: categoryRecord.id,
          name: name
        }
      },
      data: {
        status: updates.status ? mapStatus(updates.status) : undefined,
        lastRun: updates.reviewed ? new Date().toISOString() : undefined
      }
    });

    return NextResponse.json({
      message: 'Successfully updated audit item',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating audit item:', error);
    return NextResponse.json(
      { error: 'Failed to update audit item' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Map frontend status to database status
function mapStatus(frontendStatus: string): 'implemented' | 'not_implemented' | 'not_started' {
  switch (frontendStatus) {
    case 'Ready for Prod':
      return 'implemented';
    case 'Missing':
      return 'not_implemented';
    case 'Needs Work':
      return 'not_started';
    default:
      return 'not_started';
  }
} 