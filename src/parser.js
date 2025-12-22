// parser.js

/**
 * Parses a Terraform configuration file (HCL) and extracts relevant information.
 */
const hcl = require('hcl-to-json');
const fs = require('fs');
const path = require('path');

/**
 * Parses a HCL file and returns a JSON representation.
 *
 * @param {string} filePath The path to the HCL file.
 * @returns {Promise<object>} A promise that resolves with the JSON representation of the HCL file.
 * @throws {Error} If the file does not exist or if parsing fails.
 */
async function parseHclFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const hclContent = fs.readFileSync(filePath, 'utf8');
    return await hcl(hclContent);
  } catch (error) {
    console.error(`Error parsing HCL file: ${filePath}`, error);
    throw error; // Re-throw the error to be handled upstream
  }
}


/**
 * Extracts resource definitions from a parsed Terraform configuration.
 *
 * @param {object} parsedConfig The parsed Terraform configuration (JSON).
 * @returns {object[]} An array of resource objects.
 */
function extractResources(parsedConfig) {
  if (!parsedConfig || typeof parsedConfig !== 'object') {
    return [];
  }

  const resources = [];

  for (const key in parsedConfig) {
    if (key === 'resource' && typeof parsedConfig[key] === 'object') {
      for (const resourceType in parsedConfig[key]) {
        if (typeof parsedConfig[key][resourceType] === 'object') {
          for (const resourceName in parsedConfig[key][resourceType]) {
            if (typeof parsedConfig[key][resourceType][resourceName] === 'object') {
              resources.push({
                resourceType: resourceType,
                resourceName: resourceName,
                attributes: parsedConfig[key][resourceType][resourceName],
              });
            }
          }
        }
      }
    }
  }

  return resources;
}

/**
 * Extracts variable definitions from a parsed Terraform configuration.
 *
 * @param {object} parsedConfig The parsed Terraform configuration (JSON).
 * @returns {object[]} An array of variable objects.
 */
function extractVariables(parsedConfig) {
  if (!parsedConfig || typeof parsedConfig !== 'object') {
    return [];
  }

  const variables = [];

  for (const key in parsedConfig) {
    if (key === 'variable' && typeof parsedConfig[key] === 'object') {
      for (const variableName in parsedConfig[key]) {
        if (typeof parsedConfig[key][variableName] === 'object') {
          variables.push({
            variableName: variableName,
            attributes: parsedConfig[key][variableName],
          });
        }
      }
    }
  }

  return variables;
}

/**
 * Parses a directory containing Terraform files and extracts resources and variables.
 *
 * @param {string} directoryPath The path to the directory containing Terraform files.
 * @returns {Promise<{resources: object[], variables: object[]}>} A promise that resolves with an object containing arrays of resources and variables.
 */
async function parseDirectory(directoryPath) {
  let resources = [];
  let variables = [];

  const files = fs.readdirSync(directoryPath); // Synchronous for simplicity. Could be made async if needed.

  for (const file of files) {
    if (file.endsWith('.tf')) {
      const filePath = path.join(directoryPath, file);
      try {
        const parsedConfig = await parseHclFile(filePath);
        resources = resources.concat(extractResources(parsedConfig));
        variables = variables.concat(extractVariables(parsedConfig));

      } catch (error) {
        console.error(`Error processing file: ${filePath}`, error);
        // Continue processing other files even if one fails.
      }
    }
  }

  return { resources, variables };
}


module.exports = {
  parseHclFile,
  extractResources,
  extractVariables,
  parseDirectory,
};