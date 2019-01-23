var p5 = require('p5');
let Depth_Draw;
let IMU_Draw;

//gets the size of the depth canvas (same as IMU canvas) and multiples it by .6 (arbitrary)
const divsize = .6*window.document.getElementById('depth_canvas').offsetWidth;

class depth_draw {
    /**
     *  Summary: Class to draw and update the depth graphic.
     *
     *  Description: takes depth canvas as an input and draws a rectangle to represent the current depth of the device.
     *
     *  @param {p5}  p - p5 sketch area for the depth canvas
     */

    constructor(p) {
        this.p = p;
        this.depth = 0;
    }

    display() {
        // sets background color to white
        this.p.background('#fff');

        // Creates a rectangle centered at the center of the canvas with a height of the current depth
        this.p.rect(this.p.width / 2 - 50, this.p.height - this.depth, 100, this.depth);

        // maps the depth  between 0 and the heigh between 0 and 255 to dynamically change the color of the rectangle
        var x = this.p.map(this.depth, 0, this.p.height, 0, 255);
        this.p.fill(x, 255 - x, 0);
    }

    setdepth(depth) {
        /**
         * Summary: sets depth parameter as class depth then redraws the canvas
         *
         * @param {number}  depth - current depth of device
         */

        this.depth = depth;
        this.p.redraw()
    }
}

class imu_draw {
    /**
     *  Summary: Class to draw and update the IMU graphic.
     *
     *  Description: takes IMU canvas as an input and draws a 3 dimensional triangular pyramid to represent the
     *  current orientation of the device.
     *
     *  @param {p5}  p - p5 sketch area for the IMU canvas
     */

    constructor(p) {
        this.p = p;
        this.IMUx = 0;
        this.IMUy = 0;
        this.IMUz = 0;
    }

    setIMU(IMUx, IMUy, IMUz) {
        /**
         * Summary: sets IMU parameters as class depth then redraws the canvas
         *
         * @param {number}  IMUx - current x orientation
         * @param {number}  IMUy - current y orientation
         * @param {number}  IMUz - current z orientation
         */

        this.IMUx = IMUx;
        this.IMUy = IMUy;
        this.IMUz = IMUz;

        this.p.redraw()
    }

    display() {
        // sets background color to white
        this.p.background('#fff');

        this.rotateCanvas();
        this.drawPyrimid();

    }

    drawPyrimid() {
        // Draw side 1 of pyramid
        this.p.beginShape();
        this.p.vertex(-100, -100, -100);
        this.p.vertex(100, -100, -100);
        this.p.vertex(0, 0, 100);
        this.p.fill('#fae');
        this.p.endShape();

        // Draw side 2 of pyramid
        this.p.beginShape();
        this.p.vertex(100, -100, -100);
        this.p.vertex(100, 100, -100);
        this.p.vertex(0, 0, 100);
        this.p.fill('#222222');
        this.p.endShape();

        // Draw side 3 of pyramid
        this.p.beginShape();
        this.p.vertex(100, 100, -100);
        this.p.vertex(-100, 100, -100);
        this.p.vertex(0, 0, 100);
        this.p.fill('#ff0000');
        this.p.endShape();

        // Draw side 4 of pyramid
        this.p.beginShape();
        this.p.vertex(-100, 100, -100);
        this.p.vertex(-100, -100, -100);
        this.p.vertex(0, 0, 100);
        this.p.fill('#00ff00');
        this.p.endShape();

        // Draw side 5 of pyramid
        this.p.beginShape();
        this.p.vertex(-100, 100, -100);
        this.p.vertex(-100, -100, -100);
        this.p.vertex(100, 100, -100);
        this.p.vertex(100, -100, -100);
        this.p.fill('#0000ff');
        this.p.endShape();
    }

    rotateCanvas() {
        // translate the canvas back to get the graphic in view
        this.p.translate(0, 0, -100);

        this.p.rotateX(this.IMUx);
        this.p.rotateY(this.IMUy);
        this.p.rotateZ(this.IMUz);

        this.p.stroke('#fff');
    }
}


var sketch = function (p) {
    // draw the sketch in the depth canvas div

    p.setup = function () {
        p.createCanvas(divsize, divsize);

        // loops only when redraw is called
        p.noLoop();

        // initialize the depth_draw class as global variable
        Depth_Draw = new depth_draw(p);
    };

    p.draw = function () {
        // displays the canvas
        Depth_Draw.display();
    };
};
// inserts the sketch into the depth draw div
new p5(sketch, window.document.getElementById('depth_canvas'));


var sketch2 = function (p) {
    // draw the sketch in the depth canvas div

    p.setup = function () {
        // creates 3d canvas
        p.createCanvas(divsize, divsize, p.WEBGL);

        // loops only when redraw is called
        p.noLoop();

        //initializes imu_draw as global variable
        IMU_Draw = new imu_draw(p);
    };

    p.draw = function () {
        IMU_Draw.display();
    };
};
// inserts the sketch into the IMU draw div
new p5(sketch2, window.document.getElementById('imu_canvas'));