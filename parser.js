var fs = require('fs');

var crc = require('crc');

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
input = input.replace(/.+\[Setup Data\] /, '');
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

  setupMessageDataByType[i] = setupMessageDataByType[i].slice(0, setupMessageDataByType[i].length - 1);
}

console.log('GATT');

var gattData = setupMessageDataByType[32];

i = 0;
while (i < gattData.length) {
  var properties = gattData[i];
  i++;

  var permissions = gattData[i];
  i++;

  var length = gattData[i];
  i++;

  var valueLength = gattData[i];
  i++;

  var handle = gattData.readUInt16BE(i);
  i += 2;

  var uuid = gattData.readUInt16BE(i);
  i += 2;

  var spacer = gattData[i];
  i++;

  var dataLength = (properties === 6) ? valueLength : length;
  var data = gattData.slice(i, i + dataLength);
  i += dataLength;

  console.log('\tproperties = %d', properties);
  console.log('\tpermissions = %d', permissions);
  console.log('\tlength = %d', length);
  console.log('\tvalue length = %d', valueLength);
  console.log('\thandle = 0x%s', handle.toString(16));
  console.log('\tuuid = 0x%s', uuid.toString(16));
  console.log('\tdata = %s', data.toString('hex'));

  if (uuid === 0x2800) {
    // service
    console.log('\t\tservice: 0x%s', data.toString('hex').match(/.{1,2}/g).reverse().join(''));
  } else if (uuid === 0x2803) {
    // characteristic
    console.log('\t\tcharacteristic: 0x%s', data.slice(3).toString('hex').match(/.{1,2}/g).reverse().join(''));
    console.log('\t\tvalue handle: 0x%s', data.readUInt16LE(1).toString(16));
  } else {
    // value
    console.log('\t\tvalue = %s', data.toString('hex'));
  }

  console.log();
}


// crc
var crc = crc.crc16ccitt(inputBuffer.slice(0, inputBuffer.length - 2));
var expectedCrc = inputBuffer.slice(inputBuffer.length - 2).toString('hex');

console.log('crc = %s %s', crc.toString(16), expectedCrc);
