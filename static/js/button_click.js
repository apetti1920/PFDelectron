function arm_button() {
    /**
     *  Summary: Onclick event for the arm/disarm button.
     *
     *  Description: If device is currently disarmed (Button text showing 'Arm Device') the input values will be collected
     *  from the bag inflation inputs and sent to the server sub-process along with an arm command.  If the device is
     *  currently armed (Button showing 'Disarm Device') a disarm command is sent to the server sub-process.
     */

    const elem = document.getElementById("arm_button");

    if (elem.innerHTML === 'Arm Device'){
        let b1 = document.getElementById("b1").value;
        let b2 = document.getElementById("b2").value;
        let b3 = document.getElementById("b3").value;
        let b4 = document.getElementById("b4").value;

        let data = {"command": {'Command': 'Arm', 'Times': {'B1': b1, 'B2': b2, 'B3': b3, 'B4': b4}}};
        forked.send(data);
        elem.innerHTML = 'Disarm Device';
    }
    else if (elem.innerHTML === 'Disarm Device'){
        let data = {"command": {'Command': 'Disarm'}};
        forked.send(data);
        elem.innerHTML = 'Arm Device';
    }
}

function menu_button() {
    //toggles the side menu when clicked

    $('#menu').sidebar('toggle')
}


function reports_button() {
    //on click event for the reports button.  Opens finder window to the 'sensor_data' folder

    const {shell} = require('electron');
    shell.openItem(__dirname + "/sensor_data")
}