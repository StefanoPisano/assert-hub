window.AssertHub = window.AssertHub || {};

window.AssertHub.state = {
  currentTests: [],
  currentPreconditions: [],
  currentMetadata: {},
  metadataErrors: [],
  allTestsPassedPreviously: false
};

window.AssertHub.MANDATORY_METADATA = [
  { key: 'name', label: '--name' },
  { key: 'author', label: '--author' },
  { key: 'version', label: '--version' }
];
