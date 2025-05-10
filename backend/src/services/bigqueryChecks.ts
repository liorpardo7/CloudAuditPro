import { BigQuery, Table, Dataset } from '@google-cloud/bigquery';

const bigquery = new BigQuery();

export async function checkStalePartitioning() {
  const stalePartitions: { table: string; partition: string; lastModified: string }[] = [];
  const [datasets] = await bigquery.getDatasets();
  for (const dataset of datasets) {
    const [tables] = await dataset.getTables();
    for (const table of tables) {
      const [metadata] = await table.getMetadata();
      if (metadata.timePartitioning) {
        // Example: check for last modified partition
        const lastModified = metadata.lastModifiedTime ? new Date(Number(metadata.lastModifiedTime)).toISOString() : '';
        // Here you would add logic to check for stale partitions, e.g., older than 30 days
        // For demonstration, we push all partitioned tables
        stalePartitions.push({
          table: table.id || '',
          partition: metadata.timePartitioning.field || '',
          lastModified,
        });
      }
    }
  }
  return stalePartitions;
}

export async function checkDeprecatedUDFs() {
  const deprecatedUDFs: { dataset: string; table: string }[] = [];
  const [datasets] = await bigquery.getDatasets();
  for (const dataset of datasets) {
    const [tables] = await dataset.getTables();
    for (const table of tables) {
      const [metadata] = await table.getMetadata();
      // Example: check for a 'deprecated' label or description
      if (metadata.labels && metadata.labels.deprecated === 'true') {
        deprecatedUDFs.push({
          dataset: dataset.id || '',
          table: table.id || '',
        });
      }
    }
  }
  return deprecatedUDFs;
} 