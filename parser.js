var fs = require('fs');

var inputFile = process.argv[2];

if (!inputFile) {
  console.error('Usage: node parser.js <path to ublue_setup.gen.out.txt>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error('Input file "%s" doesn\'t exits!', inputFile);
  process.exit(1);
}

// console.info('Input file = %s', inputFile);

var input = fs.readFileSync(inputFile).toString();

input = input.replace(/\n|\r/g, '');
input = input.replace(/.+ \[Setup Data\] /, '');
input = input.replace(/-/g, '');

// console.log('Input = %s', input);

var inputBuffer = new Buffer(input, 'hex');
var setupMessages = [];

var i = 0;

// seperate the setup messages
while (i < inputBuffer.length) {
  var length = inputBuffer.readUInt8(i);

  setupMessages.push(inputBuffer.slice(i, i + length + 1));

  i += (length + 1);
}

// group setup messages by type
var setupMessagesByType = {};

for (var i = 0; i < setupMessages.length; i++) {
  var setupMessage = setupMessages[i];

  var length = setupMessage.readUInt8(0);
  var type = setupMessage.readUInt8(2);
  var data = setupMessage.slice(4);

  if (setupMessagesByType[type] === undefined) {
    setupMessagesByType[type] = [];
  }

  setupMessagesByType[type].push(data);
}

// combine setup messages by type
var setupMessageDataByType = {};

for (var i in setupMessagesByType) {
  setupMessageDataByType[i] = Buffer.concat(setupMessagesByType[i]);
}

console.log(setupMessageDataByType);
