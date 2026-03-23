import fs from 'fs';
const content = fs.readFileSync('dist/assets/index-CvBoQY4b.js', 'utf8');
const regex = /https:\/\/[a-z0-9]+\.supabase\.co/g;
const matches = content.match(regex);
console.log(matches);
