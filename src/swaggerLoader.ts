import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';

// Helper function to load and merge all YAML files in the docs directory
export const loadSwaggerDocs = (docsDir: string) => {
  const swaggerDocs: any = {
    openapi: '3.0.1',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
    },
    paths: {},
    components: {},
  };

  // Read all YAML files in the docs directory
  const files = fs.readdirSync(docsDir);

  files.forEach(file => {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      const filePath = path.join(docsDir, file);
      const doc = YAML.load(filePath);

      // Ensure the loaded YAML contains the necessary fields
      if (doc && doc.paths) {
        swaggerDocs.paths = { ...swaggerDocs.paths, ...doc.paths };
      }
      if (doc && doc.components) {
        swaggerDocs.components = { ...swaggerDocs.components, ...doc.components };
      }
    }
  });

  return swaggerDocs;
};
