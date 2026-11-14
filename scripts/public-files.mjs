import {tables} from './data.mjs';
export const webAssets=['app.js','core.js','interpretations.js','readings.js','views.js','urls.js','research.js','search.js','labels.js','styles.css','mark.svg','social-preview.png'];
export const databaseFiles=[...tables.map(t=>'database/'+t+'.json'),'database/schema.json'];
export const sourceFiles=['README.md','PUBLISHING.md','Start-Hub.cmd','package.json','site.config.json','.gitignore','.github/workflows/pages.yml','scripts/build.mjs','scripts/site.mjs','scripts/public-files.mjs','scripts/audit.mjs','scripts/serve.mjs','scripts/data.mjs','scripts/review.mjs','test/hub.test.mjs','test/seo.test.mjs','test/v05.test.mjs','web/index.html',...webAssets.map(f=>'web/'+f)];
