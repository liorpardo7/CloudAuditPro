const { google } = require('googleapis');
const { writeAuditResults } = require('./writeAuditResults');
const fs = require('fs');
const path = require('path');

async function run(projectId, tokens) {
  const findings = [];
  const errors = [];
  const summary = {
    totalChecks: 0,
    passed: 0,
    failed: 0,
    notApplicable: 0
  };
  const metrics = {
    potentialCostSavings: 0,
    idleResources: 0,
    optimizedResources: 0
  };
  try {
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials(tokens);
    // Initialize APIs
    const compute = google.compute({ version: 'v1', auth: authClient });
    const monitoring = google.monitoring({ version: 'v3', auth: authClient });
    const recommender = google.recommender({ version: 'v1', auth: authClient });
    // 1. Check for VM instance recommendations
    try {
      const zonesResp = await compute.zones.list({ project: projectId });
      const zones = zonesResp.data.items || [];
      const vmRecommendations = [];
      for (const zone of zones) {
        const recommendationsResp = await recommender.projects.locations.recommenders.recommendations.list({
          parent: `projects/${projectId}/locations/${zone.name}/recommenders/google.compute.instance.MachineTypeRecommender`
        });
        const recommendations = recommendationsResp.data.recommendations || [];
        for (const recommendation of recommendations) {
          vmRecommendations.push({
            resourceName: recommendation.content.operationGroups[0].operations[0].resource,
            currentMachineType: recommendation.content.operationGroups[0].operations[0].resource.split('/').pop(),
            recommendedMachineType: recommendation.content.operationGroups[0].operations[0].value,
            estimatedSavings: recommendation.primaryImpact.costProjection.cost.currencyCode + ' ' + 
                            recommendation.primaryImpact.costProjection.cost.units + '.' +
                            recommendation.primaryImpact.costProjection.cost.nanos
          });
        }
      }
      findings.push({
        check: 'VM Instance Recommendations',
        result: `${vmRecommendations.length} VM optimization recommendations found`,
        passed: vmRecommendations.length === 0,
        details: vmRecommendations
      });
      summary.totalChecks++;
      summary.passed += vmRecommendations.length === 0 ? 1 : 0;
      summary.failed += vmRecommendations.length === 0 ? 0 : 1;
      summary.costSavingsPotential += vmRecommendations.reduce((sum, rec) => {
        const savings = parseFloat(rec.estimatedSavings.split(' ')[1]);
        return sum + (isNaN(savings) ? 0 : savings);
      }, 0);
      metrics.potentialCostSavings += summary.costSavingsPotential;
    } catch (err) {
      errors.push({ check: 'VM Instance Recommendations', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 2. Check for disk recommendations
    try {
      const zonesResp = await compute.zones.list({ project: projectId });
      const zones = zonesResp.data.items || [];
      const diskRecommendations = [];
      for (const zone of zones) {
        const recommendationsResp = await recommender.projects.locations.recommenders.recommendations.list({
          parent: `projects/${projectId}/locations/${zone.name}/recommenders/google.compute.disk.IdleResourceRecommender`
        });
        const recommendations = recommendationsResp.data.recommendations || [];
        for (const recommendation of recommendations) {
          diskRecommendations.push({
            resourceName: recommendation.content.operationGroups[0].operations[0].resource,
            recommendation: recommendation.description,
            estimatedSavings: recommendation.primaryImpact.costProjection.cost.currencyCode + ' ' + 
                            recommendation.primaryImpact.costProjection.cost.units + '.' +
                            recommendation.primaryImpact.costProjection.cost.nanos
          });
        }
      }
      findings.push({
        check: 'Disk Recommendations',
        result: `${diskRecommendations.length} disk optimization recommendations found`,
        passed: diskRecommendations.length === 0,
        details: diskRecommendations
      });
      summary.totalChecks++;
      summary.passed += diskRecommendations.length === 0 ? 1 : 0;
      summary.failed += diskRecommendations.length === 0 ? 0 : 1;
      summary.costSavingsPotential += diskRecommendations.reduce((sum, rec) => {
        const savings = parseFloat(rec.estimatedSavings.split(' ')[1]);
        return sum + (isNaN(savings) ? 0 : savings);
      }, 0);
      metrics.potentialCostSavings += summary.costSavingsPotential;
    } catch (err) {
      errors.push({ check: 'Disk Recommendations', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 3. Check for committed use discounts
    try {
      const commitmentsResp = await compute.regionCommitments.list({
        project: projectId
      });
      const commitments = commitmentsResp.data.items || [];
      const commitmentRecommendations = [];
      for (const commitment of commitments) {
        if (commitment.status === 'ACTIVE') {
          const recommendationsResp = await recommender.projects.locations.recommenders.recommendations.list({
            parent: `projects/${projectId}/locations/${commitment.region}/recommenders/google.compute.commitment.UsageCommitmentRecommender`
          });
          const recommendations = recommendationsResp.data.recommendations || [];
          for (const recommendation of recommendations) {
            commitmentRecommendations.push({
              resourceName: recommendation.content.operationGroups[0].operations[0].resource,
              recommendation: recommendation.description,
              estimatedSavings: recommendation.primaryImpact.costProjection.cost.currencyCode + ' ' + 
                              recommendation.primaryImpact.costProjection.cost.units + '.' +
                              recommendation.primaryImpact.costProjection.cost.nanos
            });
          }
        }
      }
      findings.push({
        check: 'Committed Use Discount Recommendations',
        result: `${commitmentRecommendations.length} commitment optimization recommendations found`,
        passed: commitmentRecommendations.length === 0,
        details: commitmentRecommendations
      });
      summary.totalChecks++;
      summary.passed += commitmentRecommendations.length === 0 ? 1 : 0;
      summary.failed += commitmentRecommendations.length === 0 ? 0 : 1;
      summary.costSavingsPotential += commitmentRecommendations.reduce((sum, rec) => {
        const savings = parseFloat(rec.estimatedSavings.split(' ')[1]);
        return sum + (isNaN(savings) ? 0 : savings);
      }, 0);
      metrics.potentialCostSavings += summary.costSavingsPotential;
    } catch (err) {
      errors.push({ check: 'Committed Use Discount Recommendations', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 4. Check for IAM recommendations
    try {
      const recommendationsResp = await recommender.projects.locations.recommenders.recommendations.list({
        parent: `projects/${projectId}/locations/global/recommenders/google.iam.policy.Recommender`
      });
      const recommendations = recommendationsResp.data.recommendations || [];
      const iamRecommendations = recommendations.map(recommendation => ({
        resourceName: recommendation.content.operationGroups[0].operations[0].resource,
        recommendation: recommendation.description,
        impact: recommendation.primaryImpact.category
      }));
      findings.push({
        check: 'IAM Recommendations',
        result: `${iamRecommendations.length} IAM optimization recommendations found`,
        passed: iamRecommendations.length === 0,
        details: iamRecommendations
      });
      summary.totalChecks++;
      summary.passed += iamRecommendations.length === 0 ? 1 : 0;
      summary.failed += iamRecommendations.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'IAM Recommendations', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // 5. Check for service account recommendations
    try {
      const recommendationsResp = await recommender.projects.locations.recommenders.recommendations.list({
        parent: `projects/${projectId}/locations/global/recommenders/google.iam.serviceAccount.KeyRecommender`
      });
      const recommendations = recommendationsResp.data.recommendations || [];
      const serviceAccountRecommendations = recommendations.map(recommendation => ({
        resourceName: recommendation.content.operationGroups[0].operations[0].resource,
        recommendation: recommendation.description,
        impact: recommendation.primaryImpact.category
      }));
      findings.push({
        check: 'Service Account Recommendations',
        result: `${serviceAccountRecommendations.length} service account optimization recommendations found`,
        passed: serviceAccountRecommendations.length === 0,
        details: serviceAccountRecommendations
      });
      summary.totalChecks++;
      summary.passed += serviceAccountRecommendations.length === 0 ? 1 : 0;
      summary.failed += serviceAccountRecommendations.length === 0 ? 0 : 1;
    } catch (err) {
      errors.push({ check: 'Service Account Recommendations', error: err.message });
      summary.failed++;
      summary.totalChecks++;
    }
    // Write results
    await writeAuditResults('resource-optimization-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  } catch (error) {
    errors.push({ error: error.message });
    await writeAuditResults('resource-optimization-audit', findings, summary, errors, projectId);
    return { findings, summary, errors };
  }
}

module.exports = { run }; 