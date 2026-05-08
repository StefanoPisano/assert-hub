window.AssertHub = window.AssertHub || {};

window.AssertHub.parseTests = function (md) {
  const state = window.AssertHub.state;
  const MANDATORY_METADATA = window.AssertHub.MANDATORY_METADATA;
  const lines = md.split('\n');
  const result = { metadata: {}, preconditions: [], tests: [], errors: [] };
  let currentTest = null;
  let currentStep = null;
  let inPreconditions = false;

  const metadataRegex = /^--(name|author|description|version|date|tags)\s+(.*)/i;
  const testHeaderRegex = /^(?:#+\s*)?\[Test\s*[^\]]+\]/i;
  const preconditionRegex = /^(?:#+\s*)?\[Preconditions\]/i;
  const preconditionLegacyRegex = /^\*\*Preconditions\*\*/i;
  const stepRegex = /-\s*\[Step\]\s*(.*)/i;
  const checkRegex = /-\s*\[Check\]\s*(?:\[(Pass|Fail|Feedback)\]\s*)?(.*)/i;
  const bulletRegex = /^\s*-\s*(.*)/;

  for (let raw of lines) {
    const line = raw.trim();

    // Parse Metadata
    const metaMatch = line.match(metadataRegex);
    if (metaMatch) {
      result.metadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
      continue;
    }

    if (preconditionRegex.test(line) || preconditionLegacyRegex.test(line)) {
      inPreconditions = true;
      continue;
    }

    if (testHeaderRegex.test(line)) {
      inPreconditions = false;
      if (currentTest) result.tests.push(currentTest);
      currentTest = { title: line.replace(/^#+\s*/, ''), steps: [] };
      currentStep = null;
      continue;
    }

    if (inPreconditions) {
      const bulletMatch = line.match(bulletRegex);
      if (bulletMatch) {
        result.preconditions.push(bulletMatch[1].trim());
      }
      continue;
    }

    if (!currentTest) continue;

    const stepMatch = raw.match(stepRegex);
    if (stepMatch) {
      currentStep = { text: stepMatch[1].trim(), checks: [] };
      currentTest.steps.push(currentStep);
      continue;
    }

    const checkMatch = raw.match(checkRegex);
    if (checkMatch && currentStep) {
      const status = checkMatch[1] ? checkMatch[1].charAt(0).toUpperCase() + checkMatch[1].slice(1).toLowerCase() : null;
      const text = checkMatch[2].trim();
      currentStep.checks.push({ text, status });
      continue;
    }
  }
  if (currentTest) result.tests.push(currentTest);

  // Validation
  MANDATORY_METADATA.forEach(field => {
    if (!result.metadata[field.key]) {
      result.errors.push(`Missing mandatory metadata tag: <strong>${field.label}</strong>`);
    }
  });

  return result;
}


window.AssertHub.generateMarkdown = function (metadata, tests, preconditions, incrementVersion = false) {
  let md = '';

  // Export Metadata
  for (const [key, value] of Object.entries(metadata)) {
    let val = value;
    if (key === 'version' && incrementVersion) {
      const oldVersion = parseFloat(value) || 0;
      val = (oldVersion + 0.1).toFixed(1);
    }
    md += `--${key} ${val}\n`;
  }
  if (Object.keys(metadata).length > 0) md += '\n';

  if (preconditions.length > 0) {
    md += `### [Preconditions]\n`;
    preconditions.forEach(p => {
      md += `- ${p}\n`;
    });
    md += '\n';
  }

  tests.forEach(test => {
    md += `### ${test.title}\n`;
    test.steps.forEach(step => {
      md += `- [Step] ${step.text}\n`;
      step.checks.forEach(check => {
        const statusPart = check.status ? `[${check.status}] ` : '';
        md += `  - [Check] ${statusPart}${check.text}\n`;
      });
    });
    md += '\n';
  });

  return md;
}
