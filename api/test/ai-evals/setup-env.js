const path = require('path');

try {
  // Optional — present via @nestjs/config → dotenv. Ignore if missing.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config({
    path: path.join(__dirname, '../../.env'),
  });
} catch {
  // no-op
}
