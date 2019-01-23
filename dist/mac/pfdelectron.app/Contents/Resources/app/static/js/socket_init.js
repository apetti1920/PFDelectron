const http = require('http').createServer();
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

let listening = false;

io.on('connection', function (socket) {
    //connection event to server

    console.log('a user connected');

    // sends connected message to main process
    process.send({'connected': 0});

    socket.on('sensor data', function (data) {
        // if the server recieves sensor data from the device the data will be forwarded to the main process

        process.send({'sensor data': data});
    });

    socket.on('file', function (data) {
        // if the server recieves a file from the device (the csv at the end of the disarm call) the server will write the
        // file to the sensor_data folder

        // current working directory back 2 folders
        const dirname = path.join(__dirname, '..', '..');

        fs.writeFile(dirname + '/sensor_data/' + data['name'] + '.csv', data['content'], function (err) {
            // the data will consist of the appropriate file name as well as the file data in JSON notation
            // on complete the process will send a complete or error message

            if (err) {
                console.log(err);
                process.send({'error': {'sig': err, 'message': 'Error Saving'}});
            }
            else {
                console.log('Saved!');
                process.send({'message': {'message': 'File Saved'}});
            }

        });
    });

    process.on("message", (msg) => {
        // message (JSON) from main process is forwarded to the device

        let event = Object.keys(msg)[0];
        if (event === 'command') {
            socket.emit(event, msg[event])
        }
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
        process.send({'disconnected': 0});

    });
});

start_server();

function start_server(){
    http.on('error', function (err) {
        // http error event (usually this process is already running on port 3000 from a previous use
        // and must be garbage collected)

        // send error message to main process
        process.send({'error': {'sig': err, 'message': 'Error Starting Server (Restarting)'}});
        listening = false;

        // spawn an other child process to find the id of the process running on port 3000
        const {spawn} = require('child_process');
        const child = spawn('lsof', ['-n', '-ti:3000']);

        child.stdout.on('data', (data) => {

            // spawn an other child to kill the running process
            let child2 = spawn('kill', ['-9', data]);
            child2.on('exit', function (code, sig) {
                // once the kill command returns try and start the server again
                start_server()
            });
        });
    });

    http.listen(3000, function () {
        // set the http server for the socket connection to listen on port 3000
        process.on('message', (msg) => {
            let event = Object.keys(msg)[0];
            if (event === 'quit') {
                process.exit(0)
            }
        });
        console.log('listening on port 3000');
        listening = true;

        // send error code to turn off error light
        process.send({'error': 0});
        process.send({'message': {'message': 'Listening on port 3000'}})
    });


}


