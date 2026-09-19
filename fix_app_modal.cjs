const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<CreateDocumentModal\s+isOpen={isCreateDocOpen}/g,
  '<CreateDocumentModal\n        allDocuments={documents}\n        isOpen={isCreateDocOpen}'
);

fs.writeFileSync('src/App.tsx', content);
