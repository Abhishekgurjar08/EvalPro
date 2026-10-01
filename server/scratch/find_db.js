const fs = require('fs');
const path = require('path');

const candidates = [
  'C:\\data\\db',
  'C:\\Users\\DELL\\data\\db',
  'C:\\Users\\DELL\\.mongodb',
  'C:\\Users\\DELL\\AppData\\Local\\MongoDB',
  'C:\\Users\\DELL\\AppData\\Local\\Programs\\MongoDB'
];

candidates.forEach(p => {
  if (fs.existsSync(p)) {
    console.log('Exists:', p, fs.readdirSync(p));
  } else {
    console.log('Does not exist:', p);
  }
});
