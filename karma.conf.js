// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const fs = require('fs');
const path = require('path');

// Auto-detect Chrome binary if CHROME_BIN is not explicitly set
if (!process.env.CHROME_BIN) {
  const possiblePaths = [
    path.join(process.env.HOME || '', '.local/bin/google-chrome'),
    path.join(process.env.HOME || '', '.local/bin/chrome'),
    path.join(process.env.HOME || '', '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      process.env.CHROME_BIN = candidate;
      break;
    }
  }
}

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
    },
    jasmineHtmlReporter: {
      suppressAll: true // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/truck-quote-planner'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox', '--disable-gpu'] },
    },
    restartOnFileChange: true
  });
};
