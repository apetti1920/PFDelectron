function connected_toggle(command) {
    /**
     *  Summary: Toggles the Connected indicator light.
     *
     *  Description: if the command is set to 'on' the inner html of the connected div changes to a green light, if the
     *  command is set to 'off' a gray light.
     *
     *  @param  {String}    command - 'on' or 'off'
     */


    let circ = document.getElementById('connected');

    if (command === 'on') {
        circ.innerHTML = '<i class="green circle icon"></i>Connected'
    }
    else if (command === 'off') {
        circ.innerHTML = '<i class="gray circle icon"></i>Connected'
    }
}

function calibrating_toggle(command) {
    /**
     *  Summary: Toggles the Calibrating indicator light.
     *
     *  Description: if the command is set to 'on' the inner html of the connected div changes to a yellow light, if the
     *  command is set to 'off' a gray light.
     *
     *  @param  {String}    command - 'on' or 'off'
     */

    let circ = document.getElementById('calibrating');

    if (command === 'on') {
        circ.innerHTML = '<i class="yellow circle icon"></i>Calibrating'
    }
    else if (command === 'off') {
        circ.innerHTML = '<i class="gray circle icon"></i>Calibrating'
    }
}

function error_toggle(command) {
    /**
     *  Summary: Toggles the Error indicator light.
     *
     *  Description: if the command is set to 'on' the inner html of the connected div changes to a red light, if the
     *  command is set to 'off' a gray light.
     *
     *  @param  {String}    command - 'on' or 'off'
     */

    let circ = document.getElementById('error');
    if (command === 'on') {
        circ.innerHTML = '<i class="red circle icon"></i>Error'
    }
    else if (command === 'off') {
        circ.innerHTML = '<i class="gray circle icon"></i>Error'
    }
}