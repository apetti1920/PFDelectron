const {fork} = require('child_process');
const forked = fork(__dirname + '/static/js/socket_init.js');


forked.on('message', (msg) => {
    // a message from the server child process is in JSON notation with one main key and a
    // nested JSON array of information

    let event = Object.keys(msg)[0];
    let data = msg[event];

    if (event === 'sensor data') {
        // if the event is sensor data set the depth of the depth canvas to the depth key from the data and the IMU keys
        Depth_Draw.setdepth(data['depth']);
        IMU_Draw.setIMU(data['IMUx'], data['IMUy'], data['IMUz']);
    }
    else if (event === 'connected') {
        // if the event is connected the connected light is turned on and the arm_button is enabled
        connected_toggle('on');
        $('#arm_button').removeClass('disabled');
    }
    else if (event === 'disconnected') {
        // if the event is disconnected the connected light is turned off and the arm_button is disabled
        connected_toggle('off');
        $('#arm_button').addClass('disabled')
    }
    else if (event === 'message'){
        $.uiAlert({
            textHead: 'Message',
            text: data['message'],
            bgcolor: '#295f2d',
            textcolor: '#ffe67c',
            position: 'top-center', // top And bottom ||  left / center / right
            icon: 'comments outline',
            time: 5
        });
    }
    else if (event === 'error') {
        if (data === 0) {
            error_toggle('off')
        }
        else {
            error_toggle('on');
            $.uiAlert({
                textHead: 'Error',
                text: data['message'],
                bgcolor: '#ec4d37',
                textcolor: '#1d1b1b',
                position: 'top-center', // top And bottom ||  left / center / right
                icon: 'exclamation triangle',
                time: 3
            });
        }
    }
});