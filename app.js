var http = require('http'),
    fs = require('fs'),
    index = fs.readFileSync(__dirname + '/index.html'),
    five = require ("johnny-five"),
    Particle = require("particle-io"),
    CronJob = require('cron').CronJob;


// Set up the access credentials for Particle
var token = process.env.PARTICLE_KEY || 'f2d4ea74c99d6c1706ce78808af4be4cdd5317d9'; 
var deviceId = process.env.PHOTON_ID || '300023000247343339373536';

// Send index.html to all requests
var app = http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(index);
});

// Socket.io server listens to our app
var io = require('socket.io').listen(app);

// Create a Johnny Five board instance to represent your Particle Photon.
// Board is simply an abstraction of the physical hardware, whether it is 
// a Photon, Arduino, Raspberry Pi or other boards. 
var board = new five.Board({ 
  io: new Particle({ 
    token: token, 
    deviceId: deviceId 
  }) 
});

function makeCronString(input){
  var accum = '0';
  var increment = parseInt(input, 10);
  while( increment < 24 ){
    accum = accum + ',' + increment
    increment = increment + parseInt(input, 10);
  }
  return '0 0 ' + accum + ' * * *';
}

var currentJob;

board.on("ready", function() {

  var servo = new five.Servo({
    pin: 'd0', 
    type: "continuous"
  });

  io.sockets.on('connection', function (socket) {

    console.log('sockets on connection');

    socket.on('click', function () {
      console.log('socket is clicked');
      servo.sweep([45, 135]);
    });

     socket.on('feeding', function(timeValue){
      if (currentJob) {
        currentJob.stop();
      }

      var feedingInterval = makeCronString(timeValue);

      currentJob = new CronJob(feedingInterval, function() {
        console.log('You will see this message cron job');
      }, null, true, 'America/New_York');

      console.log(timeValue);

    });
  }); 
});

app.listen(3000);