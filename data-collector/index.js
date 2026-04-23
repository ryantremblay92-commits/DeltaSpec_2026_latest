const express = require('express');
const { PythonShell } = require('python-shell');

const app = express();
const port = 3002;

let pyshell;

app.get('/start', (req, res) => {
  if (pyshell) {
    return res.send('Data collector is already running.');
  }

  pyshell = new PythonShell('redis_data_collector.py');

  pyshell.on('message', function (message) {
    console.log(message);
  });

  pyshell.end(function (err) {
    if (err){
      console.error(err);
    }
    console.log('finished');
  });

  res.send('Data collector started.');
});

app.get('/stop', (req, res) => {
  if (!pyshell) {
    return res.send('Data collector is not running.');
  }

  pyshell.terminate();
  pyshell = null;
  res.send('Data collector stopped.');
});

app.listen(port, () => {
  console.log(`Data collector server listening at http://localhost:${port}`);
});
