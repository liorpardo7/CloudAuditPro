import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type AuditItem = {
  id: string;
  category: string;
  name: string;
  page: string;
  script: string;
  endpoint: string;
  description: string;
  formula: string;
  status: 'Reviewed' | 'Needs Work' | 'Missing' | 'Ready for Prod' | 'Needs Review';
  notes: string;
  reviewed: boolean;
  lastRun: string;
  results: any;
};

type CategoryWithItems = {
  name: string;
  items: Array<{
    id: string;
    name: string;
    description: string;
    scriptFile: string;
    apiEndpoint: string;
    status: string;
    lastRun: string | null;
  }>;
};

export async function GET() {
  try {
    const categories = await prisma.auditCategory.findMany({
      include: {
        items: true
      }
    }) as any;

    // Helper to get results from file
    function getResultsForScript(scriptFile: string) {
      if (!scriptFile) return {};
      const resultFile = scriptFile.replace('.js', '-results.json');
      const resultPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit', resultFile);
      if (fs.existsSync(resultPath)) {
        try {
          const data = fs.readFileSync(resultPath, 'utf-8');
          return JSON.parse(data);
        } catch (e) {
          return { error: 'Failed to parse results file' };
        }
      }
      return {};
    }

    // Transform the data to match the frontend's expected format
    const items: AuditItem[] = categories.flatMap((category: CategoryWithItems) => 
      category.items.map((item) => {
        const results = getResultsForScript(item.scriptFile);
        return {
          id: item.id,
          category: category.name,
          name: item.name,
          page: `/${category.name.toLowerCase().replace(/\s+/g, '-')}`,
          script: item.scriptFile,
          endpoint: `/api/audits/${category.name.toLowerCase().replace(/\s+/g, '-')}/${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          description: item.description,
          formula: item.apiEndpoint,
          status: mapStatus(item.status),
          notes: '',
          reviewed: item.status === 'implemented',
          lastRun: item.lastRun || new Date().toISOString(),
          results
        };
      })
    );

    return NextResponse.json({
      items,
      needsAudit: false,
      message: 'Successfully fetched audit items'
    });
  } catch (error) {
    console.error('Error fetching audit items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit items' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Map database status to frontend status
function mapStatus(dbStatus: string): 'Reviewed' | 'Needs Work' | 'Missing' | 'Ready for Prod' | 'Needs Review' {
  switch (dbStatus) {
    case 'implemented':
      return 'Ready for Prod';
    case 'not_implemented':
      return 'Missing';
    case 'not_started':
      return 'Needs Work';
    default:
      return 'Needs Review';
  }
} 