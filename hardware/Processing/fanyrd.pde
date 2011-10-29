/* this is the code for the Processing part of Fanyrd.com

Circuit consists of a servo plugged into the following connections:

Servo connectors:
power pin (red) = +5v
data pin (white) = pin 9 on Arduino (~ PWM output)
ground pin (black) = GND

*/


 import processing.serial.*; 
 
 float boxX;
 float boxY;
 int boxSize = 20;
 String[] data=loadStrings("http://192.168.1.134:8080/rating/TALK3");
 int webval = parseInt(data[0]);

 
 Serial port; 
 
 void setup()  {
 size(200, 200);
 boxX = width/2.0;
 boxY = height/2.0;
 rectMode(RADIUS); 
 
 // List all the available serial ports in the output pane. 
 // You will need to choose the port that the Arduino board is 
 // connected to from this list. The first port in the list is 
 // port #0 and the third port in the list is port #2. 
 println(Serial.list()); 
 
 // Open the port that the Arduino board is connected to (in this case #0) 
 // Make sure to open the port at the same speed Arduino is using (9600bps) 
 port = new Serial(this, Serial.list()[0], 9600); 
 
 }
 
 void draw() 
 { 
 background(0);
 
 String[] data=loadStrings("http://192.168.1.134:8080/rating/TALK5"); 
 

 if (webval != parseInt(data[0])) {
   webval = parseInt(data[0]); 
   port.write(webval+"*\0");
 }
 
 
//port.write("0");         // send min value to servo
 // println(mouseX); 
 println(webval);   // print value from web page
 
 delay(100);
// port.write("100");      // send max value to servo  
// delay(1000);
 }

 
 
