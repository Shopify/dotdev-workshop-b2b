// Wires each extension's schema.graphql to its .graphql documents so the GraphQL
// editor extension (graphql.vscode-graphql) gives autocomplete + validation while
// you edit the Function's *_run.graphql. Auto-detects any extension with a schema.
const fs = require("node:fs");

function getConfig() {
  const config = { projects: {} };

  let extensions = [];
  try {
    extensions = fs.readdirSync("./extensions");
  } catch {
    // no extensions yet
  }

  for (const entry of extensions) {
    const extensionPath = `./extensions/${entry}`;
    const schema = `${extensionPath}/schema.graphql`;
    if (!fs.existsSync(schema)) continue;
    config.projects[entry] = {
      schema,
      documents: [`${extensionPath}/**/*.graphql`],
    };
  }

  return config;
}

module.exports = getConfig();
